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
    outputFileTracingRoot: path.join(__dirname, "../../"),
    transpilePackages: ["components/ui", "ui"],
  },
};

module.exports = nextConfig;

module.exports = withSentryConfig(module.exports, { silent: true }, { hideSourcemaps: true });
