import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server at .next/standalone/server.js (run by PM2, see
  // ecosystem.config.cjs). Tracing is rooted at the project itself, so the
  // output is flat: .next/standalone/{server.js,.next,public,node_modules}.
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  // Runtime data lives outside the build and must never be copied into it.
  outputFileTracingExcludes: {
    '*': ['backups/**', 'uploads/**', 'public/images/uploads/**', '**/*.db', '**/*.db-journal', '**/*.bak*', '.env*'],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
