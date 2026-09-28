import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @vercel/blob is loaded with node's own resolver instead of being bundled.
  // It is a Node-only SDK, and the server runtime has to be able to read its
  // credentials from the environment at request time.
  serverExternalPackages: ["@vercel/blob"],
};

export default nextConfig;
