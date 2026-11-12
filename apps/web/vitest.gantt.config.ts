/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@plane/utils": fileURLToPath(new URL("../../packages/utils/src/datetime.ts", import.meta.url)),
    },
  },
  test: {
    include: ["components/gantt-chart/views/helpers.test.ts"],
    env: { TZ: "America/New_York" },
  },
});
