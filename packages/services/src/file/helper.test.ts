/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getFileMetaDataForUpload } from "./helper";

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

describe("getFileMetaDataForUpload", () => {
  it.each([
    ["notes.txt", "text/plain"],
    ["server.LOG", "text/plain"],
    ["README.md", "text/markdown"],
    ["guide.markdown", "text/markdown"],
    ["data.csv", "text/csv"],
    ["config.json", "application/json"],
  ])("detects %j as %j when the file has no signature", async (name, expected) => {
    const file = new File(["plain text content"], name, { type: "" });
    expect((await getFileMetaDataForUpload(file)).type).toBe(expected);
  });

  it.each(["page.html", "icon.svg", "script.js", "feed.xml", "archive.unknown", "noextension"])(
    "returns an empty type for signature-less %j",
    async (name) => {
      const file = new File(["<script>alert(1)</script>"], name, { type: "text/html" });
      expect((await getFileMetaDataForUpload(file)).type).toBe("");
    }
  );

  it("prefers the file signature over the extension", async () => {
    const file = new File([PNG_SIGNATURE], "image.txt", { type: "text/plain" });
    expect((await getFileMetaDataForUpload(file)).type).toBe("image/png");
  });
});
