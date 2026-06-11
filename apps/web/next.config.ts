import path from "path";
import type { NextConfig } from "next";

const API_URL = process.env.INTERNAL_API_URL ?? "http://api:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  // Tell Next.js the monorepo root so standalone output places server.js
  // at apps/web/server.js (matching the Docker CMD) rather than at root.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: [
    "@eudr-guardian/ap2",
    "@eudr-guardian/acp",
    "@eudr-guardian/mpp",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
