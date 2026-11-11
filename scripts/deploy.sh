#!/usr/bin/env bash
# Build-and-swap deploy for the CNDL standalone server (VPS, PM2).
#
#   bash scripts/deploy.sh               check, build, publish a release, reload, health-check
#   bash scripts/deploy.sh --no-reload   same, but leave PM2 alone (one-time switch-over)
#   bash scripts/deploy.sh --rollback    point releases/current at the previous release
#
# The live server runs releases/current/server.js (a symlink to a finished
# build). Building writes only to .next/, so the site keeps serving the old
# release until PM2 restarts it on the new one. If the new release fails its
# health check, the script switches back automatically.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

APP="cndl-global-app"
PORT="${PORT:-3003}"
KEEP=3 # finished releases kept on disk (current is always kept)
RELEASES="$APP_ROOT/releases"
mkdir -p "$RELEASES"

log() { printf '[deploy] %s\n' "$*"; }

current_id() {
  if [ -L "$RELEASES/current" ]; then basename "$(readlink "$RELEASES/current")"; else echo none; fi
}

release_ids() { ls -1 "$RELEASES" | grep -E '^[0-9]{8}-[0-9]{6}$' | sort || true; }

# Atomic: build the new link beside the old one, then rename over it.
switch_to() {
  ln -sfn "$1" "$RELEASES/current.next"
  mv -Tf "$RELEASES/current.next" "$RELEASES/current"
}

reload() { pm2 reload "$APP_ROOT/ecosystem.config.cjs" --update-env >/dev/null; }

healthy() {
  local i
  for i in $(seq 1 20); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/" &&
      curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/services"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if [ "${1:-}" = "--rollback" ]; then
  cur="$(current_id)"
  prev="$(release_ids | awk -v c="$cur" '$0 < c' | tail -1)"
  [ -n "$prev" ] || { log "no release older than $cur to roll back to"; exit 1; }
  log "rolling back: $cur -> $prev"
  switch_to "$prev"
  reload
  if healthy; then log "serving $prev"; else log "WARNING: $prev is not answering either"; exit 1; fi
  exit 0
fi

NO_RELOAD=0
[ "${1:-}" = "--no-reload" ] && NO_RELOAD=1

ID="$(date +%Y%m%d-%H%M%S)"
PREV="$(current_id)"

log "type check and lint"
npm run check

log "production build"
npm run build

log "publishing release $ID"
cp -a .next/standalone "$RELEASES/$ID"
git rev-parse --short HEAD > "$RELEASES/$ID/REVISION" 2>/dev/null || true
[ -f "$RELEASES/$ID/server.js" ] || { log "release is missing server.js — aborting"; exit 1; }
switch_to "$ID"

if [ "$NO_RELOAD" = 1 ]; then
  log "releases/current -> $ID (PM2 not reloaded)"
  exit 0
fi

log "reloading PM2"
reload
if healthy; then
  log "serving $ID ($(cat "$RELEASES/$ID/REVISION" 2>/dev/null || echo unknown))"
else
  log "release $ID is not answering"
  if [ "$PREV" != none ]; then
    log "switching back to $PREV"
    switch_to "$PREV"
    reload
  fi
  exit 1
fi

# Prune: keep the newest $KEEP releases plus whatever current points at.
cur="$(current_id)"
release_ids | head -n -"$KEEP" | while read -r old; do
  [ "$old" = "$cur" ] && continue
  rm -rf "${RELEASES:?}/$old"
  log "removed old release $old"
done
