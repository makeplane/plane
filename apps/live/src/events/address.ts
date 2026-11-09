/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { BlockList, isIP } from "net";

const normalize = (value: string | undefined): string | null => {
  if (!value) return null;
  let v = value.trim();
  if (v.toLowerCase().startsWith("::ffff:") && isIP(v.slice(7)) === 4) v = v.slice(7);
  return isIP(v) ? v.toLowerCase() : null;
};

const familyOf = (ip: string) => (isIP(ip) === 6 ? "ipv6" : "ipv4");

/** Entries are single addresses or CIDR ranges. Returns the list and how many entries were unusable. */
export const buildTrustedProxies = (entries: string[]): { list: BlockList; invalid: number; valid: number } => {
  const list = new BlockList();
  let invalid = 0;
  let valid = 0;
  for (const entry of entries) {
    const [addr, prefix, ...rest] = entry.split("/");
    const ip = normalize(addr);
    // the prefix must be plain digits: "10.0.0.1/" would otherwise read as /0 and trust everything
    const prefixOk = prefix === undefined || /^\d{1,3}$/.test(prefix);
    const bits = prefix === undefined || !prefixOk ? null : Number(prefix);
    const max = ip && isIP(ip) === 6 ? 128 : 32;
    if (!ip || rest.length > 0 || !prefixOk || (bits !== null && bits > max)) {
      invalid++;
      continue;
    }
    if (bits === null) list.addAddress(ip, familyOf(ip));
    else list.addSubnet(ip, bits, familyOf(ip));
    valid++;
  }
  return { list, invalid, valid };
};

const PRIVATE_RANGES: Array<[string, number, "ipv4" | "ipv6"]> = [
  ["127.0.0.0", 8, "ipv4"],
  ["10.0.0.0", 8, "ipv4"],
  ["172.16.0.0", 12, "ipv4"],
  ["192.168.0.0", 16, "ipv4"],
  ["169.254.0.0", 16, "ipv4"],
  // shared address space (RFC 6598): carrier-grade NAT and overlay networks such as Tailscale
  ["100.64.0.0", 10, "ipv4"],
  ["::1", 128, "ipv6"],
  ["fe80::", 10, "ipv6"],
  ["fc00::", 7, "ipv6"],
];
const privateList = new BlockList();
for (const [net, bits, family] of PRIVATE_RANGES) privateList.addSubnet(net, bits, family);

/** True when the direct peer is one of the trusted proxies. */
export const isTrustedPeer = (peer: string | undefined, trusted: BlockList): boolean => {
  const ip = normalize(peer);
  return ip !== null && trusted.check(ip, familyOf(ip));
};

/** Loopback, private (including 100.64.0.0/10), link-local or unique-local address. */
export const isPrivateAddress = (address: string): boolean => {
  const ip = normalize(address);
  return ip !== null && privateList.check(ip, familyOf(ip));
};

/**
 * The address a socket is attributed to. X-Forwarded-For is read only when the direct peer is a
 * trusted proxy; the chain is then walked from the right and the first address that is not itself
 * a trusted proxy wins. Anything else uses the direct peer. Returns null when no address is known.
 */
export const resolveClientAddress = (
  peer: string | undefined,
  forwardedFor: string | string[] | undefined,
  trusted: BlockList
): string | null => {
  const direct = normalize(peer);
  if (!direct) return null;
  const isTrusted = (ip: string) => trusted.check(ip, familyOf(ip));
  if (!isTrusted(direct)) return direct;
  const chain = (Array.isArray(forwardedFor) ? forwardedFor.join(",") : (forwardedFor ?? ""))
    .split(",")
    .map((p) => normalize(p));
  for (let i = chain.length - 1; i >= 0; i--) {
    const hop = chain[i];
    if (hop === null) return direct; // malformed entry: do not guess
    if (!isTrusted(hop)) return hop;
  }
  return direct;
};
