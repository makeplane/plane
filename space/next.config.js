/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */
require("dotenv").config({ path: ".env" });
const { withSentryConfig } = require("@sentry/nextjs");

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
};

if (parseInt(process.env.NEXT_PUBLIC_ENABLE_SENTRY || "0", 10)) {
  module.exports = withSentryConfig(
    nextConfig,
    { silent: true, authToken: process.env.SENTRY_AUTH_TOKEN },
    { hideSourceMaps: true }
  );
} else {
  module.exports = nextConfig;
}
