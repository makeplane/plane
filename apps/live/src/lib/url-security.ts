/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import type { LookupFunction } from "node:net";

/**
 * Validation for image URLs the Live service fetches from page content.
 *
 * Accepted: inline data:image URIs, and http(s) URLs whose host is a public,
 * multi-label hostname or a public IPv4 literal. Every address a hostname resolves to
 * must also be outside the private, loopback, link-local and reserved ranges below,
 * and the connection is made to the address that was checked.
 */

/** Schemes we are willing to hand to the PDF image pipeline. */
const ALLOWED_SCHEMES = new Set(["http:", "https:", "data:"]);

/**
 * Hostname suffixes that only ever resolve inside a private network.
 * Compared against the lowercased hostname, with a leading dot to avoid
 * matching a public registrable domain that merely ends in these letters.
 */
const BLOCKED_HOST_SUFFIXES = [".local", ".localhost", ".internal", ".home.arpa", ".lan"];

/** Hostnames that only resolve inside a private network. */
const BLOCKED_HOST_EXACT = new Set(["localhost", "metadata", "metadata.google.internal"]);

/**
 * Returns true when an IPv4 literal falls in a range that must never be fetched.
 * Ranges follow the IANA special-purpose address registry.
 */
const isBlockedIPv4 = (ip: string): boolean => {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    // Not a canonical dotted quad — callers treat unparseable hosts as unsafe.
    return true;
  }
  const [a, b, c] = parts as [number, number, number, number];

  if (a === 0) return true; // 0.0.0.0/8      "this host on this network"
  if (a === 10) return true; // 10.0.0.0/8     private
  if (a === 127) return true; // 127.0.0.0/8    loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10  CGNAT
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12  private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15  benchmarking
  if (a >= 224) return true; // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved, 255.255.255.255

  // The remaining special-purpose blocks are /24s inside otherwise-public /16s, so
  // they are matched on the third octet to keep the surrounding public space reachable.
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24   IETF protocol assignments
  if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24   TEST-NET-1
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24  TEST-NET-3

  return false;
};

/**
 * Expands an IPv6 literal to its eight 16-bit groups, or null if unparseable, so
 * every spelling of an address is judged the same way.
 */
const expandIPv6 = (addr: string): number[] | null => {
  let head = addr;
  let tail = "";
  // A trailing dotted quad occupies the last two groups.
  const dotted = head.match(/(?:^|:)((?:\d{1,3}\.){3}\d{1,3})$/);
  if (dotted?.[1]) {
    const quad = dotted[1].split(".").map(Number);
    if (quad.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    head = head.slice(0, head.length - dotted[1].length);
    tail = `${((quad[0] << 8) | quad[1]).toString(16)}:${((quad[2] << 8) | quad[3]).toString(16)}`;
    head = head.endsWith(":") && !head.endsWith("::") ? head.slice(0, -1) : head;
    head = head === "" ? "::" : head;
    head = head.endsWith("::") ? `${head}${tail}` : `${head}:${tail}`;
  }

  const halves = head.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - left.length - right.length : 0;
  if (fill < 0 || (halves.length === 1 && left.length !== 8)) return null;

  const groups = [...left, ...Array<string>(fill).fill("0"), ...right];
  if (groups.length !== 8) return null;
  const out = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return out.some(Number.isNaN) ? null : out;
};

/** Returns true when an IPv6 literal must never be fetched. */
const isBlockedIPv6 = (ip: string): boolean => {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, "");

  // Judge on the expanded form. Unparseable literals are treated as unsafe.
  const groups = expandIPv6(addr);
  if (!groups) return true;

  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d): judge the embedded v4.
  const firstFiveZero = groups.slice(0, 5).every((g) => g === 0);
  if (firstFiveZero && (groups[5] === 0xffff || (groups[5] === 0 && (groups[6] !== 0 || groups[7] !== 0)))) {
    const v4 = [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join(".");
    return isBlockedIPv4(v4);
  }

  const [g0, g1] = groups;
  if (groups.every((g) => g === 0)) return true; // :: unspecified
  if (firstFiveZero && groups[5] === 0 && groups[6] === 0 && groups[7] === 1) return true; // ::1 loopback
  if ((g0 & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  // fec0::/10 deprecated site-local. Keep these ranges in step with _BLOCKED_NETWORKS
  // in apps/api/plane/utils/ip_address.py.
  if ((g0 & 0xffc0) === 0xfec0) return true;
  if ((g0 & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g0 & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g0 === 0x64 && g1 === 0xff9b) return true; // 64:ff9b::/96 + 64:ff9b:1::/48 NAT64
  if (g0 === 0x2002) return true; // 2002::/16 6to4
  if (g0 === 0x2001 && g1 === 0) return true; // 2001::/32 Teredo

  return false;
};

/**
 * Returns true when `host` is a blocked IP literal, or a numeric host that is not a
 * canonical dotted-quad or IPv6 address (hex, decimal or shortened forms).
 */
export const isBlockedHostLiteral = (host: string): boolean => {
  const bare = host.replace(/^\[|\]$/g, "");

  const ipVersion = net.isIP(bare);
  if (ipVersion === 4) return isBlockedIPv4(bare);
  if (ipVersion === 6) return isBlockedIPv6(bare);

  // Hex, decimal or short-form dotted numbers are not canonical addresses.
  if (/^0x[0-9a-f]+$/i.test(bare)) return true;
  if (/^[0-9]+$/.test(bare)) return true;
  if (/^[0-9.]+$/.test(bare)) return true;

  return false;
};

/**
 * Returns true when a hostname may be handed to the image fetcher: a multi-label
 * name outside the local-only suffixes, or a public IPv4 literal.
 */
const isAllowedHostname = (hostname: string): boolean => {
  const host = hostname.toLowerCase();

  if (!host) return false;
  if (BLOCKED_HOST_EXACT.has(host)) return false;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return false;
  if (isBlockedHostLiteral(host)) return false;
  // Public hosts have at least two labels; a trailing dot does not count as one.
  if (!host.includes(".")) return false;
  if (host.endsWith(".")) return false;

  return true;
};

/**
 * Decides whether a TipTap image `src` may reach the PDF image pipeline: a
 * data:image URI, or an http(s) URL whose host passes `isAllowedHostname`.
 *
 * This checks the URL only. Fetch through `fetchImageSrcSafely`, which applies it to
 * every redirect hop and checks the resolved addresses before connecting.
 */
export const isSafeImageSrc = (src: string): boolean => {
  if (!src) return false;

  const trimmed = src.trim();
  if (!trimmed) return false;

  // Reject control characters and whitespace, which URL parsers would strip.
  // oxlint-disable-next-line no-control-regex -- intentional: these are exactly what we reject
  if (/[\u0000-\u0020\u007F]/.test(trimmed)) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Relative and filesystem paths are not URLs and are refused.
    return false;
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) return false;

  // data: carries its payload inline; there is no host to judge.
  if (parsed.protocol === "data:") return trimmed.toLowerCase().startsWith("data:image/");

  // Image URLs must not carry credentials.
  if (parsed.username || parsed.password) return false;

  return isAllowedHostname(parsed.hostname);
};

/** Redirect hops `fetchImageSrcSafely` will follow before giving up on a source. */
const MAX_IMAGE_FETCH_REDIRECTS = 5;

/** Socket idle timeout for a single image request. */
const IMAGE_FETCH_TIMEOUT_MS = 15_000;

/**
 * DNS lookup for image requests that fails when any resolved address is a blocked
 * literal. The socket connects to the address returned here, so the address that was
 * checked is the one used.
 */
export const lookupPublicAddress: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    const first = addresses[0];
    if (!first || addresses.some((entry) => isBlockedHostLiteral(entry.address))) {
      return callback(Object.assign(new Error(`${hostname} resolves to a blocked address`), { code: "EBLOCKED" }), "");
    }
    if (options.all) return callback(null, addresses);
    return callback(null, first.address, first.family);
  });
};

/** Largest body accepted for one image, summed over every response in its redirect chain. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ImageResponse = { status: number; location?: string; body: Buffer };

/**
 * A single GET that does not follow redirects and connects only through `lookupPublicAddress`.
 * Rejects, and stops reading, once the body would exceed `maxBytes`.
 */
const requestImage = (url: string, maxBytes: number): Promise<ImageResponse> =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(
      url,
      { agent: false, lookup: lookupPublicAddress, timeout: IMAGE_FETCH_TIMEOUT_MS },
      (res) => {
        const tooLarge = () => req.destroy(new Error("Image response exceeds the size limit"));
        if (Number(res.headers["content-length"]) > maxBytes) return tooLarge();
        const chunks: Buffer[] = [];
        let received = 0;
        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > maxBytes) return tooLarge();
          chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, location: res.headers.location, body: Buffer.concat(chunks) })
        );
      }
    );
    req.on("timeout", () => req.destroy(new Error("Image request timed out")));
    req.on("error", reject);
  });

/**
 * Fetches an http(s) image URL, following at most MAX_IMAGE_FETCH_REDIRECTS redirects.
 * The initial URL and every redirect target must pass `isSafeImageSrc`, and each
 * connection goes through `lookupPublicAddress`. The response bodies of the whole chain
 * share one MAX_IMAGE_BYTES budget. Returns the body, or null on any failure, which
 * callers treat like a rejected src.
 */
export const fetchImageSrcSafely = async (
  uri: string,
  request: (url: string, maxBytes: number) => Promise<ImageResponse> = requestImage
): Promise<Buffer | null> => {
  let current = uri;
  let remainingBytes = MAX_IMAGE_BYTES;

  for (let hop = 0; hop <= MAX_IMAGE_FETCH_REDIRECTS; hop++) {
    if (!isSafeImageSrc(current)) return null;

    let response: ImageResponse;
    try {
      // Each hop's target comes from the previous response, so the hops run in order.
      // oxlint-disable-next-line no-await-in-loop -- intentional, see above
      response = await request(current, remainingBytes);
    } catch {
      return null;
    }
    remainingBytes -= response.body.length;

    if (response.status >= 300 && response.status < 400) {
      if (!response.location) return null;
      try {
        current = new URL(response.location, current).toString();
      } catch {
        return null;
      }
      continue; // Re-validated by isSafeImageSrc at the top of the next iteration.
    }

    return response.status >= 200 && response.status < 300 ? response.body : null;
  }

  return null;
};
