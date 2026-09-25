/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { isEraserUrl } from "./url";

describe("isEraserUrl", () => {
  it.each([
    "https://app.eraser.io/workspace/file123",
    "https://app.eraser.io/workspace/file123?diagram=diag1",
    "https://app.eraser.io/workspace/file123?figure=fig1&layout=canvas",
  ])("accepts Eraser file and diagram links: %s", (url) => {
    expect(isEraserUrl(url)).toBe(true);
  });

  it.each([
    "http://app.eraser.io/workspace/file123",
    "https://app.eraser.io.evil.test/workspace/file123",
    "https://app.eraser.io:444/workspace/file123",
    "https://app.eraser.io/workspace/file123?diagram=",
    "https://app.eraser.io/workspace/file123?diagram=one&diagram=two",
    "https://app.eraser.io/workspace/file123?diagram=one&figure=two",
    "https://app.eraser.io/workspace/file123?unknown=value",
  ])("rejects unsupported or unsafe links: %s", (url) => {
    expect(isEraserUrl(url)).toBe(false);
  });
});
