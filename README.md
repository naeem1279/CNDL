# CNDL Frontend

Public website and admin ERP console (`/admin-cndl`) for CN Dental Lab, Dhaka.
Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma 6 on SQLite.

## Local development

```bash
npm ci
cp .env.example .env.local      # fill in ADMIN_SECRET (32+ chars)
cp .env.example .env            # Prisma CLI reads DATABASE_URL from .env
# for local work, point DATABASE_URL at a local file, e.g. file:./local.db
npx prisma db push              # create the local SQLite schema
npm run dev                     # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build, then copies `.next/static` and `public/` into `.next/standalone` |
| `npm start` | Runs the standalone server with `.env.local` loaded (Node 20.6+) |
| `npm run typecheck` | Generates Next route types, then `tsc --noEmit` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm run check` | Type check and lint together; run before every push |

## Runtime data (never in git, never in the build)

| Path | Contents |
|---|---|
| `prisma/dev.db` | Production database (`DATABASE_URL` must be an absolute path) |
| `public/images/uploads/` | Admin-uploaded images, served by `app/images/uploads/[file]/route.ts` |
| `uploads/orders/<caseId>/` | Private clinical files (patient scans); not web-served |
| `backups/` | Database snapshots from `scripts/backup-db.sh` |

The standalone server changes its working directory to `.next/standalone`.
`lib/paths.ts` resolves runtime data against `CNDL_APP_ROOT` (set by PM2), so
uploads and case files always land in the project folder and survive rebuilds.

## Production deploy (VPS, PM2)

```bash
cd /var/www/cndl-frontend
git pull
npm ci
npm run check
npm run build
pm2 reload ecosystem.config.cjs
```

First switch from the old `npm start` process (one time only):

```bash
pm2 delete cndl-global-app
pm2 start ecosystem.config.cjs
pm2 save
```

`.env.local` must contain `DATABASE_URL` (absolute) and `ADMIN_SECRET`; see
`.env.example` for every variable.
