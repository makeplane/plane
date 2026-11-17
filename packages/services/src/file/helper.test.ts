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

  // the key is placed in an API path, so it must always be a single, plain path segment
  it.each([
    ["https://cdn.plane.so/ws-id/..", ""],
    ["https://cdn.plane.so/ws-id/%2e%2e/", ""],
    ["https://cdn.plane.so/ws-id/a%2Fb", ""],
    ["https://cdn.plane.so/ws-id/a%5cb", ""],
    ["https://cdn.plane.so/ws-id/a\\b", "b"],
    ["https://cdn.plane.so/ws-id/a\tb.png", "ab.png"],
    ["custom://cdn.plane.so/ws-id/a\\b", ""],
    ["https://", ""],
  ])("keeps the key of %j to a single path segment", (input, expected) => {
    expect(getAssetIdFromUrl(input)).toBe(expected);
  });
});
