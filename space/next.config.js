/** @type {import('next').NextConfig} */
const path = require("path");
const withImages = require("next-images")

const nextConfig = withImages({
  basePath: "/spaces",
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../"),
  },
  output: "standalone",
});

module.exports = nextConfig;
