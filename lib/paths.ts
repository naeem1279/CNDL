import path from 'path';

/**
 * Absolute project root for runtime data (uploads, private case files).
 *
 * The standalone server (`.next/standalone/server.js`) chdirs into its own
 * folder, so `process.cwd()` there points INSIDE the build — which is wiped on
 * every rebuild. CNDL_APP_ROOT (set in ecosystem.config.cjs) pins data to the
 * real project folder. Without it: inside .next/standalone or a deploy
 * release (releases/<id>) we step back up to the project folder; otherwise
 * (`next dev`) the working directory is used.
 */
function resolveAppRoot(): string {
  if (process.env.CNDL_APP_ROOT) return path.resolve(process.env.CNDL_APP_ROOT);
  const cwd = process.cwd();
  const parts = cwd.split(path.sep);
  const n = parts.length;
  if (n >= 2 && parts[n - 2] === '.next' && parts[n - 1] === 'standalone') {
    return path.resolve(cwd, '..', '..');
  }
  if (n >= 2 && parts[n - 2] === 'releases') {
    return path.resolve(cwd, '..', '..');
  }
  return cwd;
}

export const APP_ROOT = resolveAppRoot();

/** Admin-uploaded public images, served by app/images/uploads/[file]/route.ts. */
export const PUBLIC_UPLOADS_DIR = path.join(APP_ROOT, 'public', 'images', 'uploads');

/** Private clinical files (patient scans). Never under public/. */
export const ORDER_FILES_DIR = path.join(APP_ROOT, 'uploads', 'orders');
