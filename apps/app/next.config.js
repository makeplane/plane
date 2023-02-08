const { withSentryConfig } = require("@sentry/nextjs");
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
};

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  module.exports = withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true });
} else {
  module.exports = nextConfig;
}
