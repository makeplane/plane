/** @type {import("next").NextConfig} */
require("dotenv").config({ path: ".env" });

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  swcMinify: true,
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle opentelemetry for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@opentelemetry/api": false,
        "@opentelemetry/sdk-node": false,
        "@opentelemetry/sdk-trace-node": false,
        "@opentelemetry/sdk-trace-base": false,
        "@opentelemetry/core": false,
        "@opentelemetry/semantic-conventions": false,
        "@opentelemetry/resources": false,
        "@opentelemetry/exporter-trace-otlp-http": false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)?",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/accounts/sign-up",
        destination: "/sign-up",
        permanent: true,
      },
      {
        source: "/sign-in",
        destination: "/",
        permanent: true,
      },
      {
        source: "/signin",
        destination: "/",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/sign-up",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
    const rewrites = [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogHost}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
    if (process.env.NEXT_PUBLIC_ADMIN_BASE_URL || process.env.NEXT_PUBLIC_ADMIN_BASE_PATH) {
      const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || "";
      const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || "";
      const GOD_MODE_BASE_URL = ADMIN_BASE_URL + ADMIN_BASE_PATH;
      rewrites.push({
        source: "/god-mode",
        destination: `${GOD_MODE_BASE_URL}/`,
      });
      rewrites.push({
        source: "/god-mode/:path*",
        destination: `${GOD_MODE_BASE_URL}/:path*`,
      });
    }
    return rewrites;
  },
};

module.exports = nextConfig;
