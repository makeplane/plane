/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import("next").NextConfig} */
require("dotenv").config({ path: ".env" });
const { withSentryConfig } = require("@sentry/nextjs");

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
  async redirects() {
    return [
      {
        source: "/accounts/sign-up",
        destination: "/sign-up",
        permanent: true
      },
      {
        source: "/sign-in",
        destination: "/",
        permanent: true
      },
      {
        source: "/register",
        destination: "/sign-up",
        permanent: true
      },
      {
        source: "/login",
        destination: "/",
        permanent: true
      }
    ]
  },
  async rewrites() {
    const rewrites = [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
    if (process.env.NEXT_PUBLIC_ADMIN_BASE_URL || process.env.NEXT_PUBLIC_ADMIN_BASE_PATH) {
      const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || ""
      const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || ""
      const GOD_MODE_BASE_URL = ADMIN_BASE_URL + ADMIN_BASE_PATH
      rewrites.push({
        source: "/god-mode/:path*",
        destination: `${GOD_MODE_BASE_URL}/:path*`,
      })
    }
    return rewrites;
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
