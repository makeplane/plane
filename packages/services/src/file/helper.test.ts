/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getAssetIdFromUrl } from "./helper";

describe("getAssetIdFromUrl", () => {
  it.each([
    ["https://cdn.plane.so/ws-id/abc-image.png", "abc-image.png"],
    ["https://cdn.plane.so/ws-id/image.png?id=5614&token=xyz", "image.png"],
    ["https://cdn.plane.so/ws-id/10315?size=medium", "10315"],
    ["https://cdn.plane.so/ws-id/thumb.png#frag", "thumb.png"],
    ["https://cdn.plane.so/ws-id/image.png/?id=5614", "image.png"],
    ["asset-uuid", "asset-uuid"],
  ])("extracts asset id from %j", (input, expected) => {
    expect(getAssetIdFromUrl(input)).toBe(expected);
  });
});
