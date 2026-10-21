/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import dns from "node:dns";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImageResponse } from "@/lib/url-security";
import { fetchImageSrcSafely, isBlockedHostLiteral, isSafeImageSrc, lookupPublicAddress } from "@/lib/url-security";

describe("isSafeImageSrc", () => {
  describe("single-label hosts", () => {
    it.each(["http://api:8000/", "http://service/", "http://web:3000/a.png"])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });

    it("rejects a single-label host even over https", () => {
      expect(isSafeImageSrc("https://api/")).toBe(false);
    });

    it("rejects a single-label host with a trailing dot", () => {
      expect(isSafeImageSrc("http://api./")).toBe(false);
    });
  });

  describe("loopback and link-local", () => {
    it.each([
      "http://169.254.0.1/",
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
      "http://100.64.0.1/", // shared address space (100.64.0.0/10)
      "http://100.127.255.255/",
      "http://0.0.0.0/",
      "http://224.0.0.1/", // multicast
      "http://255.255.255.255/",
      "http://198.18.0.1/", // benchmarking
      "http://[fd00::1]/", // IPv6 unique local
      "http://[fe80::1]/", // IPv6 link-local
      "http://[ff02::1]/", // IPv6 multicast
      "http://[fec0::1]/", // IPv6 deprecated site-local
      "http://[2002:7f00:1::]/", // 6to4
      "http://[2001::1]/", // Teredo
      "http://[64:ff9b::7f00:1]/", // NAT64
      "http://[64:ff9b:1::1]/", // NAT64 local-use prefix
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });

    it("allows a public IP just outside a blocked range", () => {
      // 100.63.x is public; the shared address space starts at 100.64.
      expect(isSafeImageSrc("http://100.63.0.1/")).toBe(true);
      // 172.32.x is public; the private block ends at 172.31.
      expect(isSafeImageSrc("http://172.32.0.1/")).toBe(true);
    });

    // These /24s sit inside otherwise-public /16s, so both boundaries are pinned.
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

  describe("non-canonical numeric hosts", () => {
    it.each(["http://2130706433/", "http://0x7f000001/", "http://127.1/", "http://0/"])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });
  });

  describe("scheme handling", () => {
    it.each([
      "file:///etc/passwd",
      "ftp://example.com/x.png",
      "gopher://example.com/",
      "javascript:void(0)",
      "vbscript:void",
      "blob:https://example.com/abc",
    ])("rejects %s", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });

    it("rejects relative and filesystem paths", () => {
      expect(isSafeImageSrc("/etc/passwd")).toBe(false);
      expect(isSafeImageSrc("./relative.png")).toBe(false);
      expect(isSafeImageSrc("../../etc/hosts")).toBe(false);
    });

    it("allows image data URIs", () => {
      expect(isSafeImageSrc("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(true);
      expect(isSafeImageSrc("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    });

    it("rejects non-image data URIs", () => {
      expect(isSafeImageSrc("data:text/html,<p>hello</p>")).toBe(false);
      expect(isSafeImageSrc("data:application/javascript,void(0)")).toBe(false);
    });
  });

  describe("whitespace and control characters", () => {
    it.each([
      "https://images\t.example.com/a.png",
      "https://images.example.com/a\n.png",
      "https://images.example.com/a\r.png",
      "https://images.example.com/a .png",
      "\u0000https://images.example.com/a.png",
      "https://images.example.com/a.png\u007F",
    ])("rejects %j", (src) => {
      expect(isSafeImageSrc(src)).toBe(false);
    });

    it("judges the URL after trimming surrounding whitespace", () => {
      expect(isSafeImageSrc("\t http://127.0.0.1/\n")).toBe(false);
      expect(isSafeImageSrc(" https://images.example.com/a.png ")).toBe(true);
    });
  });

  describe("embedded credentials", () => {
    it("rejects URLs carrying credentials", () => {
      expect(isSafeImageSrc("http://user:pass@images.example.com/a.png")).toBe(false);
      expect(isSafeImageSrc("http://images.example.com@127.0.0.1/a.png")).toBe(false);
    });
  });

  describe("local-only hostname suffixes", () => {
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

  describe("public image hosts", () => {
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

  it("judges every spelling of an IPv6 address the same way", () => {
    // Each of these is ::ffff:127.0.0.1.
    expect(isBlockedHostLiteral("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedHostLiteral("::ffff:7f00:1")).toBe(true);
    expect(isBlockedHostLiteral("0:0::ffff:7f00:1")).toBe(true);
    expect(isBlockedHostLiteral("0:0:0:0:0:ffff:127.0.0.1")).toBe(true);
    expect(isBlockedHostLiteral("0000:0000:0000:0000:0000:ffff:7f00:0001")).toBe(true);
    // ...and of ::1 and an IPv4-mapped link-local address.
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

const redirectTo = (location?: string): ImageResponse => ({ status: 302, location, body: Buffer.alloc(0) });

const ok = (body = "image-bytes"): ImageResponse => ({ status: 200, body: Buffer.from(body) });

describe("fetchImageSrcSafely", () => {
  it("refuses an invalid initial URL without requesting it", async () => {
    const request = vi.fn();

    expect(await fetchImageSrcSafely("http://169.254.0.1/a.png", request)).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    ["a link-local address", "http://169.254.0.1/a.png"],
    ["a loopback address", "http://127.0.0.1:8000/"],
    ["a private address", "http://10.0.0.5/a.png"],
    ["a single-label host", "http://api:8000/"],
  ])("refuses a redirect to %s without requesting it", async (_label, location) => {
    const request = vi.fn().mockResolvedValueOnce(redirectTo(location));

    expect(await fetchImageSrcSafely("https://images.example.com/a.png", request)).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("follows a redirect between public hosts and returns the body", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(redirectTo("https://cdn.example.org/final.png"))
      .mockResolvedValueOnce(ok("final-bytes"));

    const result = await fetchImageSrcSafely("https://images.example.com/a.png", request);

    expect(result?.toString("utf-8")).toBe("final-bytes");
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenNthCalledWith(1, "https://images.example.com/a.png");
    expect(request).toHaveBeenNthCalledWith(2, "https://cdn.example.org/final.png");
  });

  it("resolves a relative Location header against the current URL", async () => {
    const request = vi.fn().mockResolvedValueOnce(redirectTo("/final.png")).mockResolvedValueOnce(ok("final-bytes"));

    const result = await fetchImageSrcSafely("https://images.example.com/a.png", request);

    expect(result?.toString("utf-8")).toBe("final-bytes");
    expect(request).toHaveBeenNthCalledWith(2, "https://images.example.com/final.png");
  });

  it("refuses a redirect chain that exceeds the cap", async () => {
    let hop = 0;
    const request = vi.fn().mockImplementation(() => {
      hop += 1;
      return Promise.resolve(redirectTo(`https://images.example.com/hop-${hop}`));
    });

    expect(await fetchImageSrcSafely("https://images.example.com/a.png", request)).toBeNull();
    // 1 initial request plus 5 allowed redirects; the 6th response is not followed.
    expect(request).toHaveBeenCalledTimes(6);
  });

  it("refuses a redirect with no Location header", async () => {
    const request = vi.fn().mockResolvedValueOnce(redirectTo());

    expect(await fetchImageSrcSafely("https://images.example.com/a.png", request)).toBeNull();
  });

  it("refuses an unparseable Location header", async () => {
    const request = vi.fn().mockResolvedValueOnce(redirectTo("http://[not-a-valid-host"));

    expect(await fetchImageSrcSafely("https://images.example.com/a.png", request)).toBeNull();
  });

  it("refuses a non-2xx, non-redirect response", async () => {
    const request = vi.fn().mockResolvedValueOnce({ status: 404, body: Buffer.alloc(0) });

    expect(await fetchImageSrcSafely("https://images.example.com/a.png", request)).toBeNull();
  });

  it("refuses when the request fails", async () => {
    const request = vi.fn().mockRejectedValueOnce(new Error("network error"));

    expect(await fetchImageSrcSafely("https://images.example.com/a.png", request)).toBeNull();
  });

  it("returns the body of a direct 200", async () => {
    const request = vi.fn().mockResolvedValueOnce(ok("direct-bytes"));

    const result = await fetchImageSrcSafely("https://images.example.com/a.png", request);

    expect(result?.toString("utf-8")).toBe("direct-bytes");
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe("resolved address checks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const resolveTo = (address: string, family = 4) =>
    vi
      .spyOn(dns, "lookup")
      .mockImplementation(((_host: string, _options: unknown, callback: Function) =>
        callback(null, [{ address, family }])) as unknown as typeof dns.lookup);

  const lookup = (hostname: string, options: dns.LookupOptions = {}) =>
    new Promise<{ err: NodeJS.ErrnoException | null; address: unknown }>((resolve) =>
      lookupPublicAddress(hostname, options, (err, address) => resolve({ err, address }))
    );

  it.each([
    ["127.0.0.1", 4],
    ["10.0.0.5", 4],
    ["169.254.0.1", 4],
    ["::1", 6],
    ["::ffff:127.0.0.1", 6],
  ])("fails the lookup when the host resolves to %s", async (address, family) => {
    resolveTo(address, family);

    const { err } = await lookup("images.example.com");

    expect(err?.code).toBe("EBLOCKED");
  });

  it("returns a public address in the shape the caller asked for", async () => {
    resolveTo("93.184.216.34");

    expect((await lookup("images.example.com")).address).toBe("93.184.216.34");
    expect((await lookup("images.example.com", { all: true })).address).toEqual([
      { address: "93.184.216.34", family: 4 },
    ]);
  });

  it("does not connect when a valid URL's host resolves to a blocked address", async () => {
    let requests = 0;
    const server = http.createServer((_req, res) => {
      requests += 1;
      res.end("image-bytes");
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    resolveTo("127.0.0.1");

    try {
      expect(await fetchImageSrcSafely(`http://images.example.com:${port}/a.png`)).toBeNull();
      expect(requests).toBe(0);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
