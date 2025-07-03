/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: true,
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_SPACE_BASE_PATH || "",
  reactStrictMode: false,
  swcMinify: true,
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }], // clickjacking protection
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
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
