/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { getFileMetaDataForUpload } from "./helper";

const createFile = (name: string, contents: BlobPart[] = ["# Markdown"]): File =>
  new File(contents, name, { type: "" });

describe("getFileMetaDataForUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["notes.md", "notes.markdown", "notes.mdx", "NOTES.MD", "NOTES.MDX"])(
    "detects %s as Markdown from its extension",
    async (filename) => {
      const metadata = await getFileMetaDataForUpload(createFile(filename));

      expect(metadata.type).toBe("text/markdown");
    }
  );

  it.each([
    "",
    ".notes.md",
    "folder/notes.md",
    "folder\\notes.mdx",
    "notes.exe",
    "notes.exe.md",
    "notes.EXE.mdx",
    "notes.exe.safe.md",
  ])("rejects unsafe filename %s", async (filename) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const metadata = await getFileMetaDataForUpload(createFile(filename));

    expect(metadata.type).toBe("");
  });

  it("returns an empty type for an unsupported extension without a detectable signature", async () => {
    const metadata = await getFileMetaDataForUpload(createFile("notes.bin"));

    expect(metadata.type).toBe("");
  });

  it("prefers a detected signature over the filename extension", async () => {
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    ]);
    const metadata = await getFileMetaDataForUpload(createFile("image.md", [pngHeader]));

    expect(metadata.type).toBe("image/png");
  });
});
