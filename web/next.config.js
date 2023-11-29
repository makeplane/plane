require("dotenv").config({ path: ".env" });
const { withSentryConfig } = require("@sentry/nextjs");
const path = require("path");

const nextConfig = {
  transpilePackages: ["@plane/ui", "@plane/lite-text-editor", "@plane/rich-text-editor", "@plane/document-editor"],
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  output: "standalone",
};

if (parseInt(process.env.NEXT_PUBLIC_ENABLE_SENTRY || "0")) {
  module.exports = withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true });
} else {
  module.exports = nextConfig;
}
