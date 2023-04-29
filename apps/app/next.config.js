require("dotenv").config({ path: ".env" });

const { withSentryConfig } = require("@sentry/nextjs");
const path = require("path");
const extraImageDomains = (process.env.NEXT_PUBLIC_EXTRA_IMAGE_DOMAINS ?? "")
  .split(",")
  .filter((domain) => domain.length > 0);

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: [
      "vinci-web.s3.amazonaws.com",
      "planefs-staging.s3.ap-south-1.amazonaws.com",
      "planefs.s3.amazonaws.com",
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      ...extraImageDomains,
    ],
  },
  output: "standalone",
  experimental: {
    // this includes files from the monorepo base two directories up
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

if (parseInt(process.env.NEXT_PUBLIC_ENABLE_SENTRY || "0")) {
  module.exports = withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true });
} else {
  module.exports = nextConfig;
}
