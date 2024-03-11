/** @type {import('next').NextConfig} */
require("dotenv").config({ path: ".env" });
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
  basePath: process.env.NEXT_PUBLIC_DEPLOY_WITH_NGINX === "1" ? "/spaces" : "",
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
