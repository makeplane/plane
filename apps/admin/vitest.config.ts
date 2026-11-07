/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import path from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Same layout as packages/blocks: unit tests run in node, component tests in jsdom.
export default defineConfig({
  plugins: [tsconfigPaths({ projects: [path.resolve(import.meta.dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      "next/link": path.resolve(import.meta.dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(import.meta.dirname, "app/compat/next/navigation.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: ["node_modules/**", "build/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          include: ["**/*.test.tsx"],
          exclude: ["node_modules/**", "build/**"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.dom.ts"],
        },
      },
    ],
  },
});
