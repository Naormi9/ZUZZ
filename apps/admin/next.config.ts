import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@zuzz/ui', '@zuzz/types', '@zuzz/shared-utils'],
};

export default nextConfig;
