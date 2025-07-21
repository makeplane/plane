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
  experimental: {
    optimizePackageImports: [
      "@plane/constants",
      "@plane/editor",
      "@plane/hooks",
      "@plane/i18n",
      "@plane/logger",
      "@plane/propel",
      "@plane/services",
      "@plane/shared-state",
      "@plane/types",
      "@plane/ui",
      "@plane/utils",
    ],
  },
};

module.exports = nextConfig;
