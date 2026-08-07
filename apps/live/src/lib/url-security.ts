/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import net from "node:net";

/**
 * SSRF guards for URLs the Live service may cause to be fetched.
 *
 * The PDF exporter hands TipTap `node.attrs.src` to `@react-pdf/image`, which
 * fetch()es anything with a host — and Live shares a Docker network with the API,
 * database, Redis, RabbitMQ and MinIO. A `startsWith("http")` check is no defence:
 * `http://api:8000/` starts with "http" too. The destination is what must be judged.
 */

/** Schemes we are willing to hand to the PDF image pipeline. */
const ALLOWED_SCHEMES = new Set(["http:", "https:", "data:"]);

/**
 * Hostname suffixes that only ever resolve inside a private network.
 * Compared against the lowercased hostname, with a leading dot to avoid
 * matching a public registrable domain that merely ends in these letters.
 */
const BLOCKED_HOST_SUFFIXES = [".local", ".localhost", ".internal", ".home.arpa", ".lan"];

/** Bare hostnames that need no DNS to be dangerous. */
const BLOCKED_HOST_EXACT = new Set(["localhost", "metadata", "metadata.google.internal"]);

/**
 * Returns true when an IPv4 literal falls in a range that must never be fetched.
 * Ranges follow IANA special-purpose registries rather than a hand-rolled
 * "private IP" list, so CGNAT and benchmarking space are covered too.
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
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. 169.254.169.254 metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12  private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15  benchmarking
  if (a >= 224) return true; // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved, 255.255.255.255

  // The remaining special-purpose blocks are /24s inside otherwise-public /16s, so
  // they must be matched on the third octet — testing only the second would blackhole
  // real public space (192.0.3.0/24, 198.51.x, 203.0.x) and break legitimate images.
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24   IETF protocol assignments
  if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24   TEST-NET-1
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24  TEST-NET-3

  return false;
};

/**
 * Expands an IPv6 literal to its eight 16-bit groups, or null if unparseable.
 * Prefix matching alone is not enough: `::ffff:127.0.0.1` and its expanded twin
 * `0:0:0:0:0:ffff:127.0.0.1` denote the same address, so anything comparing raw
 * strings blocks one and fetches the other.
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

  // Judge on the expanded form so alternate spellings cannot slip past the
  // prefix checks below. Unparseable literals are treated as unsafe.
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
  // fec0::/10 deprecated site-local. Kept in step with the Python guard's
  // _BLOCKED_NETWORKS (apps/api/plane/utils/ip_address.py) — the two lists must not
  // drift, or one service will block a range the other happily fetches.
  if ((g0 & 0xffc0) === 0xfec0) return true;
  if ((g0 & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g0 & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g0 === 0x64 && g1 === 0xff9b) return true; // 64:ff9b::/96 + 64:ff9b:1::/48 NAT64
  if (g0 === 0x2002) return true; // 6to4 — can wrap a private v4
  if (g0 === 0x2001 && g1 === 0) return true; // 2001::/32 Teredo

  return false;
};

/**
 * Returns true when `host` is an IP literal we refuse to fetch, or a numeric/
 * obfuscated host form that is not a canonical address at all. Obfuscated encodings
 * (`0x7f000001`, `2130706433`, `127.1`) are rejected outright — some HTTP clients
 * expand them to loopback, and normalising every variant is a losing game.
 */
export const isBlockedHostLiteral = (host: string): boolean => {
  const bare = host.replace(/^\[|\]$/g, "");

  const ipVersion = net.isIP(bare);
  if (ipVersion === 4) return isBlockedIPv4(bare);
  if (ipVersion === 6) return isBlockedIPv6(bare);

  // Hex (0x…), octal-ish, decimal, or short-form dotted numbers — never a real host.
  if (/^0x[0-9a-f]+$/i.test(bare)) return true;
  if (/^[0-9]+$/.test(bare)) return true;
  if (/^[0-9.]+$/.test(bare)) return true;

  return false;
};

/**
 * Returns true when a hostname is safe enough to hand to the image fetcher.
 *
 * Single-label hostnames are refused: that is exactly the shape of a Docker Compose
 * service name (`api`, `plane-db`, `plane-minio`), the primary escalation path here.
 * Public image hosts always carry a dot.
 */
const isAllowedHostname = (hostname: string): boolean => {
  const host = hostname.toLowerCase();

  if (!host) return false;
  if (BLOCKED_HOST_EXACT.has(host)) return false;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return false;
  if (isBlockedHostLiteral(host)) return false;
  // No dot => single-label => container/service name on the internal network.
  if (!host.includes(".")) return false;
  // A trailing dot ("api.") sidesteps the check above without adding a real label.
  if (host.endsWith(".")) return false;

  return true;
};

/**
 * Decides whether a TipTap image `src` may reach the PDF image pipeline. `data:` is
 * allowed because the asset pipeline pre-fetches images server-side and inlines them,
 * so nothing is fetched at render time. Not a complete http(s) defence: the fetch
 * happens inside `@react-pdf/image`, so a host that passes here but resolves to a
 * blocked address is a residual DNS-rebinding TOCTOU (SECUR-245 follow-up).
 * TODO(SECUR-245): close it by pre-fetching raw image nodes, as imageComponent does.
 */
export const isSafeImageSrc = (src: string): boolean => {
  if (!src) return false;

  const trimmed = src.trim();
  if (!trimmed) return false;

  // Reject control characters and whitespace, which URL parsers strip and
  // which have historically been used to smuggle a scheme past naive checks.
  // oxlint-disable-next-line no-control-regex -- intentional: these are exactly what we reject
  if (/[\u0000-\u0020\u007F]/.test(trimmed)) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Relative paths and bare filesystem paths land here. `@react-pdf/image`
    // would hand those to fs.readFile(), so they are refused.
    return false;
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) return false;

  // data: carries its payload inline; there is no host to judge.
  if (parsed.protocol === "data:") return trimmed.toLowerCase().startsWith("data:image/");

  // Credentials in an image URL are never legitimate and can confuse host parsing.
  if (parsed.username || parsed.password) return false;

  return isAllowedHostname(parsed.hostname);
};
