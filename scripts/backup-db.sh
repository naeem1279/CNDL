#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/cndl-frontend"
DB_FILE="$APP_DIR/prisma/dev.db"
BACKUP_DIR="$APP_DIR/backups/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/dev_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_FILE" ]; then
    echo "Error: Database file $DB_FILE not found." >&2
    exit 1
fi

# Use sqlite3 .backup for atomic safe snapshot
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
else
    cp "$DB_FILE" "$BACKUP_FILE"
fi

# Retain the last 15 backups to conserve disk space
ls -t "$BACKUP_DIR"/dev_*.db 2>/dev/null | tail -n +16 | xargs -r rm -f

echo "✅ Backup successfully created: $BACKUP_FILE"
ls -lh "$BACKUP_FILE"
