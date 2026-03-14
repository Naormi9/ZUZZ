import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@zuzz/ui',
    '@zuzz/types',
    '@zuzz/validation',
    '@zuzz/shared-utils',
    '@zuzz/config',
  ],
  images: {
    remotePatterns: [
      ...(process.env.NODE_ENV !== 'production'
        ? [{ protocol: 'http' as const, hostname: 'localhost' }]
        : []),
      { protocol: 'https', hostname: '*.zuzz.co.il' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
    ],
  },
  experimental: {
    // Future experimental features can go here
  },
};

export default nextConfig;
