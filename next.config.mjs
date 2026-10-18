/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  serverExternalPackages: ["falkordb"],
  devIndicators: false,
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
