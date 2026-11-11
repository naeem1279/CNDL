// PM2 process definition for production.
//   First switch-over:  pm2 delete cndl-global-app && pm2 start ecosystem.config.cjs && pm2 save
//   Deploys after that: npm ci && npm run build && pm2 reload ecosystem.config.cjs
const path = require('path');

const APP_ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: 'cndl-global-app',
      cwd: APP_ROOT,
      script: path.join(APP_ROOT, '.next', 'standalone', 'server.js'),
      // Secrets stay in .env.local (never committed); Node >= 20.6 loads it.
      node_args: `--env-file=${path.join(APP_ROOT, '.env.local')}`,
      exec_mode: 'fork', // single process: rate limits and the leads lock are in-memory
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
        HOSTNAME: '127.0.0.1',
        CNDL_APP_ROOT: APP_ROOT,
      },
      max_memory_restart: '600M',
      kill_timeout: 8000,
    },
  ],
};
