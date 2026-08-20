/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";

import { getFileMetaDataForUpload } from "./helper";

const metadata = (name: string, type = "", contents: BlobPart[] = ["key: value"]) =>
  getFileMetaDataForUpload(new File(contents, name, { type }));

describe("getFileMetaDataForUpload", () => {
  it.each([
    ["program.txt", "text/plain"],
    ["program.yaml", "application/yaml"],
    ["program.yml", "application/yaml"],
  ])("detects %s without browser MIME", async (name, expected) => {
    expect((await metadata(name)).type).toBe(expected);
  });

  it("falls back to browser MIME", async () => {
    expect((await metadata("program.log", "text/plain")).type).toBe("text/plain");
  });

  it("prefers signature detection", async () => {
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    ]);

    expect((await metadata("image.yaml", "application/yaml", [pngHeader])).type).toBe("image/png");
  });

  it("does not apply fallback to an unsafe filename", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect((await metadata("payload.exe.yaml")).type).toBe("");
  });
});
