/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import("next").NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env" });

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  swcMinify: true,
  output: "standalone",
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
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@headlessui/react",
      "react-color",
      "react-day-picker",
      "react-dropzone",
      "react-hook-form",
      "lodash",
      "clsx",
      "tailwind-merge",
      "@plane/constants",
      "@plane/editor",
      "@plane/hooks",
      "@plane/i18n",
      "@plane/logger",
      "@plane/propel",
      "@plane/services",
      "@plane/shared-state",
      "@plane/types",
      "@plane/ui",
      "@plane/utils",
    ],
  },
  async redirects() {
    return [
      {
        source: "/:workspaceSlug/projects/:projectId/settings/:path*",
        destination: "/:workspaceSlug/settings/projects/:projectId/:path*",
        permanent: true,
      },
      {
        source: "/:workspaceSlug/analytics",
        destination: "/:workspaceSlug/analytics/overview",
        permanent: true,
      },
      {
        source: "/:workspaceSlug/settings/api-tokens",
        destination: "/:workspaceSlug/settings/account/api-tokens",
        permanent: true,
      },
      {
        source: "/:workspaceSlug/projects/:projectId/inbox",
        destination: "/:workspaceSlug/projects/:projectId/intake",
        permanent: true,
      },
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
