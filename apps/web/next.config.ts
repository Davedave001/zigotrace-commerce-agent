import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@eudr-guardian/ap2",
    "@eudr-guardian/acp",
    "@eudr-guardian/mpp",
  ],
};

export default nextConfig;
