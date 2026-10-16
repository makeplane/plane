/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchImageSrcSafely, isBlockedHostLiteral, isSafeImageSrc } from "@/lib/url-security";

describe("isSafeImageSrc", () => {
  describe("internal Docker service names", () => {
    // The escalation path that matters: every one of these starts with "http", which
    // is why an imageComponent-style startsWith("http") guard does not close it.
    it.each([
      "http://api:8000/api/workspaces/",
      "http://plane-minio:9000/uploads/",
      "http://plane-db:5432/",
      "http://plane-redis:6379/",
      "http://plane-mq:5672/",
      "http://web:3000/",
      "http://admin:3000/",
      "http://space:3000/",
      "http://live:3000/",
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });

    it("rejects a single-label host even over https", () => {
      expect(isSafeImageSrc("https://api/")).toBe(false);
    });

    it("rejects a trailing-dot host that would otherwise look multi-label", () => {
      expect(isSafeImageSrc("http://api./")).toBe(false);
    });
  });

  describe("cloud metadata and loopback", () => {
    it.each([
      "http://169.254.169.254/latest/meta-data/",
      "http://metadata.google.internal/computeMetadata/v1/",
      "http://metadata/computeMetadata/v1/",
      "http://localhost:8000/",
      "http://127.0.0.1:8000/",
      "http://127.1.2.3/",
      "http://[::1]/",
      "http://[::ffff:127.0.0.1]/",
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });
  });

  describe("private, CGNAT, link-local and reserved ranges", () => {
    it.each([
      "http://10.0.0.5/",
      "http://172.16.0.1/",
      "http://172.31.255.254/",
      "http://192.168.1.1/",
      "http://100.64.0.1/", // CGNAT — missed by naive "private IP" lists
      "http://100.127.255.255/",
      "http://0.0.0.0/",
      "http://224.0.0.1/", // multicast
      "http://255.255.255.255/",
      "http://198.18.0.1/", // benchmarking
      "http://[fd00::1]/", // IPv6 unique local
      "http://[fe80::1]/", // IPv6 link-local
      "http://[ff02::1]/", // IPv6 multicast
      "http://[fec0::1]/", // IPv6 deprecated site-local
      "http://[2002:7f00:1::]/", // 6to4 wrapping 127.0.0.1
      "http://[2001::1]/", // Teredo
      "http://[64:ff9b::7f00:1]/", // NAT64 wrapping 127.0.0.1
      "http://[64:ff9b:1::1]/", // NAT64 local-use prefix
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });

    it("allows a public IP just outside a blocked range", () => {
      // 100.63.x is public; the CGNAT block starts at 100.64.
      expect(isSafeImageSrc("http://100.63.0.1/")).toBe(true);
      // 172.32.x is public; the private block ends at 172.31.
      expect(isSafeImageSrc("http://172.32.0.1/")).toBe(true);
    });

    // These /24s sit inside otherwise-public /16s. Blocking the whole /16 would
    // silently stop legitimate images from rendering, so the boundaries are pinned
    // in both directions.
    it("blocks the reserved /24s exactly", () => {
      expect(isSafeImageSrc("http://192.0.0.1/")).toBe(false); // 192.0.0.0/24 IETF protocol assignments
      expect(isSafeImageSrc("http://192.0.2.1/")).toBe(false); // 192.0.2.0/24 TEST-NET-1
      expect(isSafeImageSrc("http://198.51.100.1/")).toBe(false); // 198.51.100.0/24 TEST-NET-2
      expect(isSafeImageSrc("http://203.0.113.1/")).toBe(false); // 203.0.113.0/24 TEST-NET-3
    });

    it("still allows the public space surrounding those /24s", () => {
      expect(isSafeImageSrc("http://192.0.1.1/")).toBe(true);
      expect(isSafeImageSrc("http://192.0.3.1/")).toBe(true);
      expect(isSafeImageSrc("http://198.51.99.1/")).toBe(true);
      expect(isSafeImageSrc("http://198.51.101.1/")).toBe(true);
      expect(isSafeImageSrc("http://203.0.112.1/")).toBe(true);
      expect(isSafeImageSrc("http://203.0.114.1/")).toBe(true);
    });
  });

  describe("obfuscated address encodings", () => {
    // Not canonical addresses, but several HTTP clients expand them to loopback.
    it.each([
      "http://2130706433/", // decimal 127.0.0.1
      "http://0x7f000001/", // hex 127.0.0.1
      "http://127.1/", // short-form 127.0.0.1
      "http://0/", // shorthand for 0.0.0.0
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });
  });

  describe("scheme handling", () => {
    it.each([
      "file:///etc/passwd",
      "ftp://example.com/x.png",
      "gopher://example.com/",
      "javascript:alert(1)",
      "vbscript:msgbox(1)",
      "blob:https://example.com/abc",
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });

    it("rejects bare filesystem paths that would reach fs.readFile", () => {
      // Secondary local-file-read path: @react-pdf/image would fs.readFile these.
      expect(isSafeImageSrc("/etc/passwd")).toBe(false);
      expect(isSafeImageSrc("./relative.png")).toBe(false);
      expect(isSafeImageSrc("../../etc/hosts")).toBe(false);
    });

    it("allows image data URIs (the asset pipeline's own output)", () => {
      expect(isSafeImageSrc("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(true);
      expect(isSafeImageSrc("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    });

    it("rejects non-image data URIs", () => {
      expect(isSafeImageSrc("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeImageSrc("data:application/javascript,alert(1)")).toBe(false);
    });
  });

  describe("whitespace and control-character smuggling", () => {
    // URL parsers strip these, so a check performed before stripping can be walked
    // straight past — a well-known class of URL-validation bypass.
    it.each([
      "\thttp://api:8000/",
      "\nhttp://api:8000/",
      "\rhttp://api:8000/",
      " http://127.0.0.1/",
      "http://api\t:8000/",
      "\u0000http://api:8000/",
      "\u00A0http://api:8000/", // non-breaking space
      "\uFEFFhttp://api:8000/", // BOM
    ])("rejects %j", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });
  });

  describe("embedded credentials", () => {
    it("rejects URLs carrying credentials", () => {
      expect(isSafeImageSrc("http://user:pass@images.example.com/a.png")).toBe(false);
      // Credentials can also be used to make the real host hard to read.
      expect(isSafeImageSrc("http://images.example.com@127.0.0.1/a.png")).toBe(false);
    });
  });

  describe("internal-only hostname suffixes", () => {
    it.each([
      "http://printer.local/x.png",
      "http://app.localhost/x.png",
      "http://svc.internal/x.png",
      "http://box.lan/x.png",
      "http://thing.home.arpa/x.png",
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });
  });

  describe("legitimate images still render", () => {
    it.each([
      "https://images.example.com/photo.png",
      "http://cdn.example.org/a/b/c.jpg",
      "https://user-images.githubusercontent.com/1/2.png",
      "https://example.co.uk/img.webp",
      "https://sub.domain.example.com:8443/img.png",
    ])("allows %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(true);
    });
  });

  describe("empty and malformed input", () => {
    it.each(["", "   ", "not a url", "http://", "://example.com"])("rejects %j", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });
  });
});

describe("isBlockedHostLiteral", () => {
  it("classifies canonical IPv4 literals", () => {
    expect(isBlockedHostLiteral("127.0.0.1")).toBe(true);
    expect(isBlockedHostLiteral("10.1.2.3")).toBe(true);
    expect(isBlockedHostLiteral("8.8.8.8")).toBe(false);
    expect(isBlockedHostLiteral("1.1.1.1")).toBe(false);
  });

  it("classifies IPv6 literals with and without brackets", () => {
    expect(isBlockedHostLiteral("::1")).toBe(true);
    expect(isBlockedHostLiteral("[::1]")).toBe(true);
    expect(isBlockedHostLiteral("2606:4700:4700::1111")).toBe(false);
  });

  it("blocks alternate spellings of the same IPv6 address", () => {
    // The address is judged on its expanded form, so a non-canonical spelling
    // cannot slip past a prefix check. Each of these is ::ffff:127.0.0.1.
    expect(isBlockedHostLiteral("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedHostLiteral("::ffff:7f00:1")).toBe(true);
    expect(isBlockedHostLiteral("0:0::ffff:7f00:1")).toBe(true);
    expect(isBlockedHostLiteral("0:0:0:0:0:ffff:127.0.0.1")).toBe(true);
    expect(isBlockedHostLiteral("0000:0000:0000:0000:0000:ffff:7f00:0001")).toBe(true);
    // ...and of ::1 and the cloud metadata address.
    expect(isBlockedHostLiteral("0:0:0:0:0:0:0:1")).toBe(true);
    expect(isBlockedHostLiteral("0:0:0:0:0:ffff:a9fe:a9fe")).toBe(true);
    // Expanded forms of the range checks must hold too.
    expect(isBlockedHostLiteral("fe80:0:0:0:0:0:0:1")).toBe(true);
    expect(isBlockedHostLiteral("fc00:0:0:0:0:0:0:1")).toBe(true);
    // Public addresses stay reachable in either spelling.
    expect(isBlockedHostLiteral("2001:4860:4860:0:0:0:0:8888")).toBe(false);
    expect(isBlockedHostLiteral("2001:4860:4860::8888")).toBe(false);
  });

  it("rejects malformed IPv6 URLs (caught at URL parsing, before the literal check)", () => {
    expect(isSafeImageSrc("http://[::ffff:999.1.1.1]/x.png")).toBe(false);
    expect(isSafeImageSrc("http://[1:2:3:4:5:6:7:8:9]/x.png")).toBe(false);
    expect(isSafeImageSrc("http://[::1::2]/x.png")).toBe(false);
  });

  it("treats real hostnames as non-literals", () => {
    expect(isBlockedHostLiteral("example.com")).toBe(false);
    expect(isBlockedHostLiteral("api")).toBe(false);
  });
});

const redirectTo = (location?: string) =>
  new Response(null, { status: 302, headers: location ? { Location: location } : undefined });

const ok = (body = "image-bytes") => new Response(body, { status: 200 });

describe("fetchImageSrcSafely", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refuses the initial URL without fetching when it fails isSafeImageSrc", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchImageSrcSafely("http://169.254.169.254/latest/meta-data/");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a safe host that redirects to a blocked address (link-local metadata)", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo("http://169.254.169.254/latest/meta-data/"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchImageSrcSafely("https://images.example.com/a.png");

    expect(result).toBeNull();
    // The redirect target fails isSafeImageSrc before it is ever fetched.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a safe host that redirects to a loopback address", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo("http://127.0.0.1:8000/"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchImageSrcSafely("https://images.example.com/a.png")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a safe host that redirects to an RFC1918 private address", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo("http://10.0.0.5/internal"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchImageSrcSafely("https://images.example.com/a.png")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a safe host that redirects to a Docker service name", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo("http://api:8000/api/workspaces/"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchImageSrcSafely("https://images.example.com/a.png")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows a redirect from one safe host to another and returns the fetched body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(redirectTo("https://cdn.example.org/final.png"))
      .mockResolvedValueOnce(ok("final-bytes"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchImageSrcSafely("https://images.example.com/a.png");

    expect(result).not.toBeNull();
    expect(result?.toString("utf-8")).toBe("final-bytes");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://images.example.com/a.png", { redirect: "manual" });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://cdn.example.org/final.png", { redirect: "manual" });
  });

  it("resolves a relative Location header against the current URL before re-validating it", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo("/final.png")).mockResolvedValueOnce(ok("final-bytes"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchImageSrcSafely("https://images.example.com/a.png");

    expect(result?.toString("utf-8")).toBe("final-bytes");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://images.example.com/final.png", { redirect: "manual" });
  });

  it("refuses a redirect chain that exceeds the cap", async () => {
    let hop = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      hop += 1;
      return Promise.resolve(redirectTo(`https://images.example.com/hop-${hop}`));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchImageSrcSafely("https://images.example.com/a.png");

    expect(result).toBeNull();
    // 1 initial request plus 5 allowed redirects = 6 requests; the 6th response is
    // itself a redirect and is never followed.
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("refuses a redirect with no Location header", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo());
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchImageSrcSafely("https://images.example.com/a.png")).toBeNull();
  });

  it("refuses an unparseable Location header", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(redirectTo("http://[not-a-valid-host"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchImageSrcSafely("https://images.example.com/a.png")).toBeNull();
  });

  it("refuses a non-ok, non-redirect response", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchImageSrcSafely("https://images.example.com/a.png")).toBeNull();
  });

  it("refuses when the fetch itself throws", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchImageSrcSafely("https://images.example.com/a.png")).toBeNull();
  });

  it("returns the body untouched on a direct 200 with no redirects", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok("direct-bytes"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchImageSrcSafely("https://images.example.com/a.png");

    expect(result?.toString("utf-8")).toBe("direct-bytes");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
