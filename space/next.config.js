/** @type {import('next').NextConfig} */
const path = require("path");
const withImages = require("next-images");

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../"),
  },
  output: "standalone",
};

if (parseInt(process.env.NEXT_PUBLIC_DEPLOY_WITH_NGINX || "0")) {
  const nextConfigWithNginx = withImages({ basePath: "/spaces", ...nextConfig });
  module.exports = nextConfigWithNginx;
} else {
  module.exports = nextConfig;
}
