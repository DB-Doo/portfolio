import type { NextConfig } from "next";

const LEVEL_UPSTREAM = "https://bid-tracker-repo-eight.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/level",
        destination: `${LEVEL_UPSTREAM}/level`,
      },
      {
        source: "/level/:path*",
        destination: `${LEVEL_UPSTREAM}/level/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/bid-tracker-demo",
        destination: "/level",
        permanent: true,
      },
      {
        source: "/bid-tracker-demo/:path*",
        destination: "/level/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
