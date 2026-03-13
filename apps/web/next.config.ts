import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@zuzz/ui', '@zuzz/types', '@zuzz/validation', '@zuzz/shared-utils', '@zuzz/config'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  experimental: {
    // Future experimental features can go here
  },
};

export default nextConfig;
