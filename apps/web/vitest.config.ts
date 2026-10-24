/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "@plane/utils": fileURLToPath(new URL("../../packages/utils/src/index.ts", import.meta.url)),
      "next/link": fileURLToPath(new URL("./app/compat/next/link.tsx", import.meta.url)),
      "next/navigation": fileURLToPath(new URL("./app/compat/next/navigation.ts", import.meta.url)),
    },
  },
  test: { environment: "jsdom" },
});
