import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@zuzz/ui', '@zuzz/types', '@zuzz/validation', '@zuzz/shared-utils', '@zuzz/config'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.zuzz.co.il' },
    ],
  },
  experimental: {
    // Future experimental features can go here
  },
};

export default nextConfig;
