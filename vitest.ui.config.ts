/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    maxWorkers: 2,
    projects: [
      ...["web", "admin", "space"].map((app) => ({
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "apps", app),
            "next/link": path.resolve(__dirname, "apps", app, "app/compat/next/link.tsx"),
            "next/navigation": path.resolve(__dirname, "apps", app, "app/compat/next/navigation.ts"),
          },
        },
        test: {
          name: app,
          environment: "jsdom",
          include: [`apps/${app}/**/*.test.{ts,tsx}`],
          setupFiles: [path.resolve(__dirname, "tests/ui/setup.ts")],
        },
      })),
      {
        resolve: { alias: { "@": path.resolve(__dirname, "packages/editor/src") } },
        test: {
          name: "editor",
          environment: "jsdom",
          include: ["packages/editor/tests/**/*.test.{ts,tsx}"],
          setupFiles: [path.resolve(__dirname, "tests/ui/setup.ts")],
        },
      },
      {
        test: {
          name: "utils",
          environment: "node",
          include: ["packages/utils/tests/**/*.test.ts"],
        },
      },
    ],
  },
});
