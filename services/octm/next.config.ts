import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'ergo-lib-wasm-nodejs': 'ergo-lib-wasm-browser',
    },
  },
};

export default nextConfig;
