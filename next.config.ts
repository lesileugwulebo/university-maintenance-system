import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // the project has type errors (useful for locked network systems).
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
