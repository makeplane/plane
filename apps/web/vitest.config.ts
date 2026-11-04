/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["{app,components,helpers,hooks,layouts,lib,services,store}/**/*.{ts,tsx}"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          environment: "node",
        },
      },
      {
        // Component tests that need a DOM but not a real browser, so `pnpm test` stays runnable
        // without browsers.
        extends: true,
        test: {
          name: "dom",
          include: ["**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.dom.ts"],
        },
      },
    ],
  },
});
