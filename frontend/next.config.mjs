/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["ergo-lib-wasm-nodejs"],
  },
};

export default nextConfig;
