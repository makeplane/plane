/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import("next").NextConfig} */
require("dotenv").config({ path: ".env" });
const { withSentryConfig } = require("@sentry/nextjs");

const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || ""
const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ""
const GOD_MODE_BASE_URL = ADMIN_BASE_URL + ADMIN_BASE_PATH

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)?",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
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
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/god-mode/:path*",
        destination: `${GOD_MODE_BASE_URL}/:path*`,
      },
    ];
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
