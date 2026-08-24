/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { hasCustomBrandLogo } from "@plane/utils";

describe("BrandMark logo resolution", () => {
  it("uses a custom image when a logo URL is set", () => {
    expect(hasCustomBrandLogo("https://cdn.example.com/logo.svg")).toBe(true);
  });

  it("falls back to PlaneLogo when logo URL is empty", () => {
    expect(hasCustomBrandLogo("")).toBe(false);
    expect(hasCustomBrandLogo("   ")).toBe(false);
    expect(hasCustomBrandLogo(undefined)).toBe(false);
    expect(hasCustomBrandLogo(null)).toBe(false);
  });
});
