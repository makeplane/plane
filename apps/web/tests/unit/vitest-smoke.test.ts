/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";

import { generateYAxisTickValues } from "@/helpers/graph.helper";

describe("vitest unit project smoke test", () => {
  it("resolves the @ alias and runs app code under the node environment", () => {
    expect(generateYAxisTickValues([0, 5, 12])).toEqual([0, 2, 4, 6, 8, 10, 12]);
  });
});
