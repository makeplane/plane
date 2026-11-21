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
      "@plane/constants": fileURLToPath(new URL("../../packages/constants/src/index.ts", import.meta.url)),
      "@plane/types": fileURLToPath(new URL("../../packages/types/src/index.ts", import.meta.url)),
      "@plane/utils": fileURLToPath(new URL("../../packages/utils/src/datetime.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["store/issue/helpers/base-issues-utils.test.ts"],
  },
});
