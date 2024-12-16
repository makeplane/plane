// eslint-disable-next-line @typescript-eslint/no-var-requires
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

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG_ID || "plane-hq",
  project: process.env.SENTRY_PROJECT_ID || "plane-space",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Only print logs for uploading source maps in CI
  silent: true,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

if (parseInt(process.env.SENTRY_MONITORING_ENABLED || "0", 10)) {
  module.exports = withSentryConfig(nextConfig, sentryConfig);
} else {
  module.exports = nextConfig;
}
