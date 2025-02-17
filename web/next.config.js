/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import("next").NextConfig} */
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
  transpilePackages: ["@plane/i18n", "@plane/propel"],
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

  experimental: {
    optimizePackageImports: [
      // Components
      "@/components/account",
      "@/components/analytics",
      "@/components/api-token",
      "@/components/archives",
      "@/components/auth-screens",
      "@/components/automation",
      "@/components/command-palette",
      "@/components/common",
      "@/components/core",
      "@/components/cycles",
      "@/components/dashboard",
      "@/components/dropdowns",
      "@/components/editor",
      "@/components/empty-state",
      "@/components/estimates",
      "@/components/exporter",
      "@/components/gantt-chart",
      "@/components/gantt-chart/contexts",
      "@/components/global",
      "@/components/graphs",
      "@/components/icons",
      "@/components/inbox",
      "@/components/instance",
      "@/components/integration",
      "@/components/issues",
      "@/components/issues/issue-layouts",
      "@/components/labels",
      "@/components/modules",
      "@/components/onboarding",
      "@/components/page-views",
      "@/components/pages",
      "@/components/profile",
      "@/components/project",
      "@/components/project-states",
      "@/components/sidebar",
      "@/components/ui",
      "@/components/user",
      "@/components/views",
      "@/components/web-hooks",
      "@/components/workspace",
      "@/components/workspace-notifications",

      // lib
      "@/lib/store-context",
      "@/lib/wrappers",
      "@/lib/n-progress",
      "@/lib/local-storage",

      // Services
      "@/plane-web/services",

      //
      "@headlessui/react",
      "axios",

      "@/hooks/store",
    ],
  },
};

module.exports = nextConfig;
