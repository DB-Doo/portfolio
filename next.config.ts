import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/bid-tracker-demo",
        destination: "https://bid-tracker-repo-eight.vercel.app/bid-tracker-demo",
      },
      {
        source: "/bid-tracker-demo/:path*",
        destination: "https://bid-tracker-repo-eight.vercel.app/bid-tracker-demo/:path*",
      },
    ];
  },
};

export default nextConfig;
