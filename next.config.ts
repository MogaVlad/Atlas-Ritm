import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // `npm run dev` opened from another address than localhost (e.g. a phone on the same network):
  // without this, Next blocks its dev scripts there and the page never becomes interactive.
  allowedDevOrigins: ["192.168.56.1"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
