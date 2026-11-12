import type { NextConfig } from "next";

/** Always the live API — local and Vercel both proxy here. */
const laravelOrigin = process.env.LARAVEL_API_ORIGIN ?? "https://bhuribhoj-api.liwaas.com";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${laravelOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
