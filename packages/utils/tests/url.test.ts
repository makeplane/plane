/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  extractHostname,
  extractTLD,
  extractURLComponents,
  formatURLForDisplay,
  isLocalhost,
  isValidIPv4,
  isValidIPv6,
  isValidNextPath,
  validateIPAddress,
} from "../src/url";

describe("extractHostname", () => {
  it("should extract hostname from standard HTTP/HTTPS URLs", () => {
    expect(extractHostname("https://plane.so")).toBe("plane.so");
    expect(extractHostname("http://localhost:3000/dashboard")).toBe("localhost");
    expect(extractHostname("https://app.plane.so/workspace/issues?tab=all#top")).toBe("app.plane.so");
  });

  it("should strip ports from IPv4 and domain names", () => {
    expect(extractHostname("http://127.0.0.1:8000")).toBe("127.0.0.1");
    expect(extractHostname("127.0.0.1:8000")).toBe("127.0.0.1");
    expect(extractHostname("example.com:8080")).toBe("example.com");
  });

  it("should correctly handle IPv6 URLs without truncating to bracket", () => {
    expect(extractHostname("http://[::1]:3000")).toBe("[::1]");
    expect(extractHostname("https://[2001:db8::1]:8080/api/v1")).toBe("[2001:db8::1]");
    expect(extractHostname("[::1]:3000")).toBe("[::1]");
    expect(extractHostname("[::1]")).toBe("[::1]");
    expect(extractHostname("::1")).toBe("::1");
  });

  it("should remove auth credentials if present", () => {
    expect(extractHostname("https://user:password@example.com:8080/path")).toBe("example.com");
  });

  it("should handle empty or non-string inputs safely", () => {
    expect(extractHostname("")).toBe("");
    expect(extractHostname(null as any)).toBe("");
    expect(extractHostname(undefined as any)).toBe("");
  });
});

describe("isLocalhost", () => {
  it("should return true for IPv4 localhost addresses", () => {
    expect(isLocalhost("http://localhost:3000")).toBe(true);
    expect(isLocalhost("http://127.0.0.1:8000")).toBe(true);
    expect(isLocalhost("http://0.0.0.0:8000")).toBe(true);
    expect(isLocalhost("localhost:3000")).toBe(true);
    expect(isLocalhost("127.0.0.1")).toBe(true);
  });

  it("should return true for IPv6 localhost loopback addresses", () => {
    expect(isLocalhost("http://[::1]:3000")).toBe(true);
    expect(isLocalhost("https://[::1]:8080/api")).toBe(true);
    expect(isLocalhost("[::1]:3000")).toBe(true);
    expect(isLocalhost("[::1]")).toBe(true);
    expect(isLocalhost("::1")).toBe(true);
    expect(isLocalhost("[::]")).toBe(true);
  });

  it("should return false for public domains and non-localhost addresses", () => {
    expect(isLocalhost("https://plane.so")).toBe(false);
    expect(isLocalhost("https://google.com")).toBe(false);
    expect(isLocalhost("http://[2001:db8::1]:8000")).toBe(false);
    expect(isLocalhost("192.168.1.1")).toBe(false);
  });
});

describe("formatURLForDisplay", () => {
  it("should format valid URLs for display", () => {
    expect(formatURLForDisplay("https://plane.so/features")).toBe("plane.so");
    expect(formatURLForDisplay("http://localhost:3000/dashboard")).toBe("localhost:3000");
  });

  it("should format IPv6 URLs without returning single bracket", () => {
    expect(formatURLForDisplay("http://[::1]:3000")).toBe("[::1]:3000");
    expect(formatURLForDisplay("[::1]:3000")).toBe("[::1]");
  });

  it("should return empty string for empty input", () => {
    expect(formatURLForDisplay("")).toBe("");
  });
});

describe("extractTLD", () => {
  it("should extract valid TLD from URL strings", () => {
    expect(extractTLD("https://plane.so")).toBe("so");
    expect(extractTLD("https://example.com/path")).toBe("com");
    expect(extractTLD("sub.domain.co.uk")).toBe("uk");
  });

  it("should return empty string for invalid domains or IP addresses", () => {
    expect(extractTLD("")).toBe("");
    expect(extractTLD(".invalid.")).toBe("");
    expect(extractTLD("http://localhost:3000")).toBe("");
    expect(extractTLD("http://127.0.0.1")).toBe("");
  });
});

describe("validateIPAddress & isValidIPv4 & isValidIPv6", () => {
  it("should validate IPv4 addresses", () => {
    expect(isValidIPv4("127.0.0.1")).toBe(true);
    expect(isValidIPv4("192.168.1.1")).toBe(true);
    expect(isValidIPv4("256.0.0.1")).toBe(false);
    expect(isValidIPv4("invalid")).toBe(false);
  });

  it("should validate IPv6 addresses", () => {
    expect(isValidIPv6("::1")).toBe(true);
    expect(isValidIPv6("[::1]")).toBe(true);
    expect(isValidIPv6("2001:db8::1")).toBe(true);
    expect(isValidIPv6("invalid")).toBe(false);
  });

  it("should return correct type from validateIPAddress", () => {
    expect(validateIPAddress("127.0.0.1")).toEqual({ isValid: true, type: "ipv4", formatted: "127.0.0.1" });
    expect(validateIPAddress("[::1]")).toEqual({ isValid: true, type: "ipv6", formatted: "::1" });
    expect(validateIPAddress("invalid")).toEqual({ isValid: false, type: "invalid" });
  });
});

describe("extractURLComponents", () => {
  it("should parse full URLs correctly", () => {
    const components = extractURLComponents("https://blog.plane.so/posts");
    expect(components).toBeDefined();
    expect(components?.protocol).toBe("https");
    expect(components?.subdomain).toBe("blog");
    expect(components?.rootDomain).toBe("plane");
    expect(components?.tld).toBe("so");
    expect(components?.pathname).toBe("/posts");
  });

  it("should parse IPv6 localhost URLs correctly", () => {
    const components = extractURLComponents("http://[::1]:3000/dashboard");
    expect(components).toBeDefined();
    expect(components?.protocol).toBe("http");
    expect(components?.pathname).toBe("/dashboard");
  });
});

describe("isValidNextPath", () => {
  it("should allow safe relative redirect paths", () => {
    expect(isValidNextPath("/dashboard")).toBe(true);
    expect(isValidNextPath("/workspace/123/projects")).toBe(true);
    expect(isValidNextPath("  /profile  ")).toBe(true);
  });

  it("should reject open redirect and malicious paths", () => {
    expect(isValidNextPath("https://malicious.com")).toBe(false);
    expect(isValidNextPath("//malicious.com")).toBe(false);
    expect(isValidNextPath("javascript:alert(1)")).toBe(false);
    expect(isValidNextPath("\\malicious")).toBe(false);
    expect(isValidNextPath("dashboard")).toBe(false);
    expect(isValidNextPath("")).toBe(false);
  });
});
