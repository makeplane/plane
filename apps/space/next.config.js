/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  assetPrefix: '/spaces/',
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
    appDir: true,
  },
  output: "standalone",
};

module.exports = nextConfig;
