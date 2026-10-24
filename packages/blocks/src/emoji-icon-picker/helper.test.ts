/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { sanitizeLogoImageUrl } from "./helper";

describe("sanitizeLogoImageUrl", () => {
  it.each([
    ["https://cdn.example.com/acme.png", "https://cdn.example.com/acme.png"],
    ["http://intranet.example.com/logo.svg", "http://intranet.example.com/logo.svg"],
    ["  https://cdn.example.com/acme.png  ", "https://cdn.example.com/acme.png"],
    ["/api/assets/v2/static/0e5a/", "/api/assets/v2/static/0e5a/"],
  ])("accepts %s", (input, expected) => {
    expect(sanitizeLogoImageUrl(input)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    "",
    "   ",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:image/png;base64,iVBORw0KGgo=",
    "blob:https://app.plane.so/1234",
    "ftp://example.com/logo.png",
    "//evil.example.com/logo.png",
    "/static/logo.png",
    "logo.png",
  ])("rejects %s", (input) => {
    expect(sanitizeLogoImageUrl(input)).toBeUndefined();
  });
});
