/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    server: { deps: { inline: ["i18next-icu"] } },
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "build/**"],
    setupFiles: ["../../packages/blocks/vitest.setup.dom.ts"],
  },
});
