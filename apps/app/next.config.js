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
  experimental: {
    // this includes files from the monorepo base two directories up
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

if (process.env.NEXT_PUBLIC_ENABLE_SENTRY) {
  module.exports = withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true });
} else {
  module.exports = nextConfig;
}
