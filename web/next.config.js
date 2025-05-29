/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import("next").NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env" });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

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
      "@nivo/core",
      "@nivo/bar",
      "@nivo/line",
      "@nivo/pie",
      "@nivo/calendar",
      "@nivo/scatterplot",
      "react-color",
      "react-day-picker",
      "react-dropzone",
      "react-hook-form",
      "lodash",
      "clsx",
      "tailwind-merge",
      "recharts",
      "axios",
      "mobx",
      "mobx-react",
    ],
    // Enable modern bundling features
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Enhanced tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.providedExports = true;
      config.optimization.concatenateModules = true;

      // More aggressive chunk splitting
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 200000, // Reduced from 244000
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        cacheGroups: {
          // Framework chunks
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            chunks: "all",
            priority: 40,
          },
          // Large UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](@headlessui|@radix-ui|@blueprintjs)[\\/]/,
            name: "ui-libs",
            chunks: "all",
            priority: 35,
          },
          // Chart libraries (lazy loaded)
          charts: {
            test: /[\\/]node_modules[\\/](@nivo|recharts)[\\/]/,
            name: "charts",
            chunks: "async", // Only load when needed
            priority: 30,
          },
          // Editor libraries (lazy loaded)
          editor: {
            test: /[\\/]node_modules[\\/](@tiptap|prosemirror|@plane\/editor)[\\/]/,
            name: "editor",
            chunks: "async", // Only load when needed
            priority: 30,
          },
          // Date/time libraries
          date: {
            test: /[\\/]node_modules[\\/](date-fns|react-day-picker)[\\/]/,
            name: "date-libs",
            chunks: "all",
            priority: 25,
          },
          // Utility libraries
          utils: {
            test: /[\\/]node_modules[\\/](lodash|clsx|tailwind-merge|uuid)[\\/]/,
            name: "utils",
            chunks: "all",
            priority: 20,
          },
          // Vendor chunks for other libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
            minChunks: 2,
          },
          // Common application code
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Additional optimizations
      config.optimization.moduleIds = "deterministic";
      config.optimization.chunkIds = "deterministic";
    }

    // Resolve optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      // Reduce bundle size by aliasing to smaller alternatives where possible
      "react/jsx-runtime": require.resolve("react/jsx-runtime"),
    };

    return config;
  },
  transpilePackages: [
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
  async redirects() {
    return [
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

module.exports = withBundleAnalyzer(nextConfig);
