import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "cdn.aimlapi.com",
    }, {
      protocol: "https",
      hostname: "preview.redd.it",
    }]
  }
};

export default nextConfig;
