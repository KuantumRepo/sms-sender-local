import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Optional: Change links `/me` -> `/me/` and wait for trailing slash
  trailingSlash: true,
  // Optional: Prevent automatic image optimization which requires a server
  images: { unoptimized: true }
};

export default nextConfig;
