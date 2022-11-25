/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["vinci-web.s3.amazonaws.com"],
  },
};

module.exports = nextConfig;
