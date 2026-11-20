import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingRoot: __dirname,
  experimental: { proxyTimeout: 240_000, proxyClientMaxBodySize: "21mb" },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://backend:8000/api/:path*" },
    ];
  },
};
export default nextConfig;
