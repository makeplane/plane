/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  getFileMetaDataForUpload,
  validateAndDetectFileType,
  validateFilename,
} from "./helper";

describe("validateFilename", () => {
  it("rejects empty or whitespace-only filename", () => {
    expect(validateFilename("")).toBe("Filename cannot be empty");
    expect(validateFilename("   ")).toBe("Filename cannot be empty");
  });

  it("rejects hidden files starting with a dot", () => {
    expect(validateFilename(".env")).toBe("Hidden files (starting with dot) are not allowed");
    expect(validateFilename(".htaccess")).toBe("Hidden files (starting with dot) are not allowed");
  });

  it("rejects filenames with path separators", () => {
    expect(validateFilename("dir/file.txt")).toBe("Filename cannot contain path separators");
    expect(validateFilename("dir\\file.txt")).toBe("Filename cannot contain path separators");
  });

  it("rejects dangerous file extensions", () => {
    expect(validateFilename("script.exe")).toBe("File extension 'exe' is not allowed");
    expect(validateFilename("script.sh")).toBe("File extension 'sh' is not allowed");
    expect(validateFilename("payload.bat")).toBe("File extension 'bat' is not allowed");
  });

  it("rejects suspicious double extensions", () => {
    expect(validateFilename("report.exe.png")).toBe("File has suspicious double extension");
    expect(validateFilename("doc.sh.pdf")).toBe("File has suspicious double extension");
  });

  it("accepts safe filenames", () => {
    expect(validateFilename("document.txt")).toBeNull();
    expect(validateFilename("notes.md")).toBeNull();
    expect(validateFilename("data.csv")).toBeNull();
    expect(validateFilename("photo.png")).toBeNull();
  });
});

describe("validateAndDetectFileType", () => {
  it("detects MIME type from file signature when magic bytes are present", async () => {
    // Valid 1x1 PNG file binary buffer
    const pngBytes = Uint8Array.from(
      Buffer.from(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
        "hex"
      )
    );
    const file = new File([pngBytes], "image.png", { type: "" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("image/png");
  });

  it("falls back to file.type for signature-less text files when present", async () => {
    const textContent = new TextEncoder().encode("Hello world");
    const file = new File([textContent], "notes.custom", { type: "text/plain" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("text/plain");
  });

  it("falls back to extension map for .txt files when file.type is empty", async () => {
    const textContent = new TextEncoder().encode("Sample plain text content");
    const file = new File([textContent], "sample.txt", { type: "" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("text/plain");
  });

  it("falls back to extension map for .md files when file.type is empty", async () => {
    const mdContent = new TextEncoder().encode("# Title\n\nSome markdown text");
    const file = new File([mdContent], "README.md", { type: "" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("text/markdown");
  });

  it("falls back to extension map for .csv files when file.type is empty", async () => {
    const csvContent = new TextEncoder().encode("col1,col2\nval1,val2");
    const file = new File([csvContent], "export.csv", { type: "" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("text/csv");
  });

  it("falls back to extension map for .json files when file.type is empty", async () => {
    const jsonContent = new TextEncoder().encode('{"key": "value"}');
    const file = new File([jsonContent], "data.json", { type: "" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("application/json");
  });

  it("falls back to extension map for .log files when file.type is empty", async () => {
    const logContent = new TextEncoder().encode("[2026-10-28] Error log output");
    const file = new File([logContent], "debug.log", { type: "" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("text/plain");
  });

  it("falls back to extension map when browser provides generic application/octet-stream", async () => {
    const textContent = new TextEncoder().encode("Plain text with generic octet stream");
    const file = new File([textContent], "document.txt", { type: "application/octet-stream" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("text/plain");
  });

  it("returns empty string for dangerous file extensions", async () => {
    const content = new TextEncoder().encode("echo malicious");
    const file = new File([content], "script.sh", { type: "text/x-sh" });

    const result = await validateAndDetectFileType(file);
    expect(result).toBe("");
  });
});

describe("getFileMetaDataForUpload", () => {
  it("returns file metadata with detected MIME type for plain text file", async () => {
    const textContent = new TextEncoder().encode("This is an issue attachment");
    const file = new File([textContent], "stacktrace.txt", { type: "text/plain" });

    const metadata = await getFileMetaDataForUpload(file);
    expect(metadata).toEqual({
      name: "stacktrace.txt",
      size: textContent.length,
      type: "text/plain",
    });
  });

  it("returns file metadata with resolved MIME type for signature-less file with empty file.type", async () => {
    const mdContent = new TextEncoder().encode("## Bug Reproduction");
    const file = new File([mdContent], "repro.md", { type: "" });

    const metadata = await getFileMetaDataForUpload(file);
    expect(metadata).toEqual({
      name: "repro.md",
      size: mdContent.length,
      type: "text/markdown",
    });
  });
});
