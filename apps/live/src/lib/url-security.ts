/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import net from "node:net";

/**
 * SSRF guards for URLs that the Live service may cause to be fetched.
 *
 * Context (GHSA-55gq-rf47-9pqx): the PDF exporter renders TipTap `image` nodes by
 * handing `node.attrs.src` straight to `@react-pdf/image`, which calls `fetch()` on
 * anything with a host. Because the Live container shares a Docker network with the
 * API, database, Redis, RabbitMQ and MinIO, an unvalidated `src` turns PDF export
 * into a request forgery primitive against internal-only services.
 *
 * A prefix check such as `src.startsWith("http")` does NOT close this: the payloads
 * that matter — `http://api:8000/`, `http://plane-minio:9000/` — all start with
 * "http". The scheme is irrelevant; the *destination* is what has to be judged.
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
  const [a, b] = parts as [number, number, number, number];

  if (a === 0) return true; // 0.0.0.0/8      "this host on this network"
  if (a === 10) return true; // 10.0.0.0/8     private
  if (a === 127) return true; // 127.0.0.0/8    loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10  CGNAT
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. 169.254.169.254 metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12  private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + 192.0.2.0/24 (IETF protocol / TEST-NET-1)
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15  benchmarking
  if (a === 198 && b === 51) return true; // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0) return true; // 203.0.113.0/24  TEST-NET-3
  if (a >= 224) return true; // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved, 255.255.255.255

  return false;
};

/** Returns true when an IPv6 literal must never be fetched. */
const isBlockedIPv6 = (ip: string): boolean => {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, "");

  // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible forms: judge the embedded v4.
  const mapped = addr.match(/^(?:::ffff:|::)((?:\d{1,3}\.){3}\d{1,3})$/);
  if (mapped?.[1]) return isBlockedIPv4(mapped[1]);

  if (addr === "::" || addr === "::1") return true; // unspecified / loopback
  if (addr.startsWith("fe8") || addr.startsWith("fe9") || addr.startsWith("fea") || addr.startsWith("feb")) return true; // fe80::/10 link-local
  // fec0::/10 deprecated site-local. Kept in step with the Python guard's
  // _BLOCKED_NETWORKS (apps/api/plane/utils/ip_address.py) — the two lists must not
  // drift, or one service will block a range the other happily fetches.
  if (addr.startsWith("fec") || addr.startsWith("fed") || addr.startsWith("fee") || addr.startsWith("fef")) return true;
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // fc00::/7 unique local
  if (addr.startsWith("ff")) return true; // ff00::/8 multicast
  if (addr.startsWith("64:ff9b:")) return true; // 64:ff9b::/96 + 64:ff9b:1::/48 NAT64
  if (addr.startsWith("2002:")) return true; // 6to4 — can wrap a private v4
  if (/^2001:(0{1,4})?:/.test(addr)) return true; // 2001::/32 Teredo
  if (addr.startsWith("::ffff:")) return true; // any other IPv4-mapped form

  return false;
};

/**
 * Returns true when `host` is an IP literal pointing somewhere we refuse to fetch,
 * or a numeric/obfuscated host form that is not a canonical address at all.
 *
 * Obfuscated encodings (`0x7f000001`, `2130706433`, `127.1`) are rejected outright:
 * some HTTP clients expand them to loopback, none of them are legitimate image
 * hosts, and normalising every variant is a losing game.
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
 * Single-label hostnames are refused because that is exactly the shape of a Docker
 * Compose service name — `api`, `web`, `plane-db`, `plane-redis`, `plane-minio` —
 * which is the primary escalation path in this advisory. Public image hosts always
 * carry a dot.
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
 * Decides whether a TipTap image `src` may be passed to the PDF image pipeline.
 *
 * `data:` URIs are allowed because the asset pipeline deliberately pre-fetches
 * images server-side and inlines them as `data:image/jpeg;base64,…`; those never
 * touch the network again at render time.
 *
 * NOTE ON DNS REBINDING: for an `http(s)` host that clears these checks we cannot
 * pin the resolved address here — the renderer is synchronous and the actual
 * `fetch()` happens inside `@react-pdf/image`, out of our reach. A hostname under
 * attacker control that resolves to a blocked address therefore remains a residual
 * TOCTOU. Closing it properly means pre-fetching raw image nodes the way
 * `imageComponent` already pre-fetches assets, then rendering only `data:` URIs.
 * Tracked as follow-up to SECUR-245 — do not mistake this helper for a complete
 * SSRF defence on the http(s) path.
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
