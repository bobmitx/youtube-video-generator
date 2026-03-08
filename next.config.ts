import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  bundlePagesRouterDependencies: true,
  experimental: {
    // Force webpack bundler — Prisma 6 has known Turbopack incompatibility
    turbo: undefined,
  },
};

export default nextConfig;
