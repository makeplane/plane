// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: [
      "vinci-web.s3.amazonaws.com",
      "planefs-staging.s3.ap-south-1.amazonaws.com",
      "planefs.s3.amazonaws.com",
    ],
  },
  output: "standalone",
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
    transpilePackages: ["components/ui"],
  },
};

module.exports = nextConfig;

// const withPWA = require("next-pwa")({
//   dest: "public",
// });

// module.exports = withPWA({
//   pwa: {
//     dest: "public",
//     register: true,
//     skipWaiting: true,
//   },
//   reactStrictMode: false,
//   swcMinify: true,
//   images: {
//     domains: ["vinci-web.s3.amazonaws.com"],
//   },
//   output: "standalone",
//   experimental: {
//     outputFileTracingRoot: path.join(__dirname, "../../"),
//     transpilePackages: ["components/ui"],
//   },
// });

module.exports = withSentryConfig(module.exports, { silent: true }, { hideSourcemaps: true });
