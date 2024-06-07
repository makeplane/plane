/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  swcMinify: true,
  output: "standalone",
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || "",
};

module.exports = nextConfig;
