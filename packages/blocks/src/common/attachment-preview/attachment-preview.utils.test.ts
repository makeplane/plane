/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { describe, expect, it } from "vitest";
import { getAssetIdFromUrl, getWorkspaceAssetInlineSrc, getWorkspaceAssetDownloadSrc } from "@plane/utils";
import {
  getAttachmentPreviewKind,
  isInlinePreviewSupported,
  canPreviewTextFile,
  MAX_TEXT_PREVIEW_BYTES,
} from "./attachment-preview.utils";

describe("getAssetIdFromUrl", () => {
  it("extracts asset id from a path with trailing slash", () => {
    expect(getAssetIdFromUrl("/api/assets/v2/workspaces/plane/projects/project-1/asset-1/")).toBe("asset-1");
  });

  it("extracts asset id from a path without trailing slash", () => {
    expect(getAssetIdFromUrl("/api/assets/v2/workspaces/plane/asset-1")).toBe("asset-1");
  });
});

describe("getWorkspaceAssetInlineSrc", () => {
  it("generates project-scoped inline URL", () => {
    const result = getWorkspaceAssetInlineSrc({
      workspaceSlug: "plane",
      projectId: "project-1",
      assetId: "asset-1",
    });
    expect(result).toBe("/api/assets/v2/workspaces/plane/projects/project-1/asset-1/?disposition=inline");
  });

  it("generates workspace-scoped inline URL when projectId is omitted", () => {
    const result = getWorkspaceAssetInlineSrc({
      workspaceSlug: "plane",
      assetId: "asset-1",
    });
    expect(result).toBe("/api/assets/v2/workspaces/plane/asset-1/?disposition=inline");
  });
});

describe("getWorkspaceAssetDownloadSrc", () => {
  it("generates project-scoped download URL", () => {
    const result = getWorkspaceAssetDownloadSrc({
      workspaceSlug: "plane",
      projectId: "project-1",
      assetId: "asset-1",
    });
    expect(result).toBe("/api/assets/v2/workspaces/plane/projects/project-1/download/asset-1/");
  });

  it("generates workspace-scoped download URL when projectId is omitted", () => {
    const result = getWorkspaceAssetDownloadSrc({
      workspaceSlug: "plane",
      assetId: "asset-1",
    });
    expect(result).toBe("/api/assets/v2/workspaces/plane/download/asset-1/");
  });
});

// --- Preview classification utilities ---

describe("getAttachmentPreviewKind", () => {
  it.each([
    ["png", "image"],
    ["jpg", "image"],
    ["jpeg", "image"],
    ["gif", "image"],
    ["webp", "image"],
    ["svg", "image"],
    ["bmp", "image"],
    ["ico", "image"],
  ])("classifies .%s as image", (ext, expected) => {
    expect(getAttachmentPreviewKind(ext)).toBe(expected);
  });

  it.each([
    ["mp4", "video"],
    ["webm", "video"],
    ["ogg", "video"],
    ["mov", "video"],
  ])("classifies .%s as video", (ext, expected) => {
    expect(getAttachmentPreviewKind(ext)).toBe(expected);
  });

  it.each([
    ["mp3", "audio"],
    ["wav", "audio"],
    ["flac", "audio"],
    ["aac", "audio"],
    ["m4a", "audio"],
  ])("classifies .%s as audio", (ext, expected) => {
    expect(getAttachmentPreviewKind(ext)).toBe(expected);
  });

  it("classifies pdf", () => {
    expect(getAttachmentPreviewKind("pdf")).toBe("pdf");
  });

  it.each([
    ["txt", "text"],
    ["md", "text"],
    ["json", "text"],
    ["xml", "text"],
    ["csv", "text"],
    ["log", "text"],
    ["sql", "text"],
    ["js", "text"],
    ["ts", "text"],
    ["jsx", "text"],
    ["tsx", "text"],
    ["css", "text"],
    ["html", "text"],
  ])("classifies .%s as text", (ext, expected) => {
    expect(getAttachmentPreviewKind(ext)).toBe(expected);
  });

  it("classifies unknown extension as unsupported", () => {
    expect(getAttachmentPreviewKind("docx")).toBe("unsupported");
    expect(getAttachmentPreviewKind("xlsx")).toBe("unsupported");
    expect(getAttachmentPreviewKind("zip")).toBe("unsupported");
  });

  it("classifies empty extension as unsupported", () => {
    expect(getAttachmentPreviewKind("")).toBe("unsupported");
  });

  it("handles uppercase extensions", () => {
    expect(getAttachmentPreviewKind("PNG")).toBe("image");
    expect(getAttachmentPreviewKind("PDF")).toBe("pdf");
  });
});

describe("isInlinePreviewSupported", () => {
  it("returns true for previewable kinds", () => {
    expect(isInlinePreviewSupported("image")).toBe(true);
    expect(isInlinePreviewSupported("video")).toBe(true);
    expect(isInlinePreviewSupported("audio")).toBe(true);
    expect(isInlinePreviewSupported("pdf")).toBe(true);
    expect(isInlinePreviewSupported("text")).toBe(true);
  });

  it("returns false for unsupported kind", () => {
    expect(isInlinePreviewSupported("unsupported")).toBe(false);
  });
});

describe("canPreviewTextFile", () => {
  it("returns true for text extension under size cap", () => {
    expect(canPreviewTextFile("txt", 1000)).toBe(true);
  });

  it("returns false for text extension over size cap", () => {
    expect(canPreviewTextFile("txt", MAX_TEXT_PREVIEW_BYTES + 1)).toBe(false);
  });

  it("returns true at exactly the size cap", () => {
    expect(canPreviewTextFile("md", MAX_TEXT_PREVIEW_BYTES)).toBe(true);
  });

  it("returns false for non-text extension regardless of size", () => {
    expect(canPreviewTextFile("docx", 100)).toBe(false);
  });
});

describe("MAX_TEXT_PREVIEW_BYTES", () => {
  it("is 5 MiB", () => {
    expect(MAX_TEXT_PREVIEW_BYTES).toBe(5 * 1024 * 1024);
  });
});
