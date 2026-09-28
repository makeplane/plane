import { describe, expect, it } from "vitest";
import { isValidNextPath } from "../url";

describe("isValidNextPath", () => {
  it("allows safe relative paths", () => {
    expect(isValidNextPath("/dashboard")).toBe(true);
    expect(isValidNextPath("/workspace/123/projects")).toBe(true);
    expect(isValidNextPath("/settings?tab=general")).toBe(true);
    expect(isValidNextPath("/search?discount=100%25")).toBe(true);
    expect(isValidNextPath("  /dashboard  ")).toBe(true);
  });

  it("rejects non-relative URLs and absolute URLs", () => {
    expect(isValidNextPath("https://evil.com")).toBe(false);
    expect(isValidNextPath("http://evil.com")).toBe(false);
    expect(isValidNextPath("//evil.com")).toBe(false);
    expect(isValidNextPath("javascript:alert(1)")).toBe(false);
    expect(isValidNextPath("dashboard")).toBe(false);
    expect(isValidNextPath("")).toBe(false);
  });

  it("rejects backslashes and Windows-style paths", () => {
    expect(isValidNextPath("\\evil.com")).toBe(false);
    expect(isValidNextPath("/\\evil.com")).toBe(false);
    expect(isValidNextPath("/path\\to\\resource")).toBe(false);
  });

  it("rejects percent-encoded bypasses (single & double encoding)", () => {
    expect(isValidNextPath("/%2f%2fevil.com")).toBe(false);
    expect(isValidNextPath("/%5cevil.com")).toBe(false);
    expect(isValidNextPath("/%252f%252fevil.com")).toBe(false);
    expect(isValidNextPath("/%255cevil.com")).toBe(false);
  });

  it("rejects control characters and malicious scripts", () => {
    expect(isValidNextPath("/\t/evil.com")).toBe(false);
    expect(isValidNextPath("/\n/evil.com")).toBe(false);
    expect(isValidNextPath("/dashboard?redirect=javascript:alert(1)")).toBe(false);
    expect(isValidNextPath("/dashboard?<script>alert(1)</script>")).toBe(false);
    expect(isValidNextPath("/dashboard?onload=alert(1)")).toBe(false);
  });
});
