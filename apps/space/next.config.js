/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
    appDir: true,
  },
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        destination: "https://plane.so",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
