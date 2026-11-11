// Copies the assets `next build` leaves out of the standalone bundle:
// .next/static (JS/CSS chunks) and public/ (images, icons). Cross-platform,
// no shell tools needed. Runtime uploads are skipped: they are served from the
// project folder by app/images/uploads/[file]/route.ts, never from the build.
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

if (!existsSync(path.join(standalone, 'server.js'))) {
  console.error('postbuild: .next/standalone/server.js not found — is output: "standalone" set?');
  process.exit(1);
}

const skip = (src) => {
  const rel = path.relative(root, src).split(path.sep).join('/');
  return !(rel === 'public/images/uploads' || rel.startsWith('public/images/uploads/'));
};

for (const [from, to] of [
  [path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static')],
  [path.join(root, 'public'), path.join(standalone, 'public')],
]) {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true, filter: skip });
}

console.log('postbuild: copied .next/static and public/ into .next/standalone');
