import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    proxyTimeout: 240_000,
    proxyClientMaxBodySize: "21mb",
    agentUpgrade: "security",
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://backend:8000/api/:path*" },
    ];
  },
};
export default nextConfig;
