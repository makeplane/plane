/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

const HEX_3 = /^[0-9a-f]{3}$/i;
const HEX_6 = /^[0-9a-f]{6}$/i;

/**
 * Parses the two hex forms a person actually types — `abc` and `abc123`, with or without the leading `#` —
 * into a lowercased `#rrggbb` (`#abc` → `#aabbcc`). Anything else comes back as `null`. Both lengths are
 * accepted because the Twitter-style picker this replaces accepted both.
 */
export function parseHexColor(value: string): string | null {
  const raw = value.trim().replace(/^#/, "").toLowerCase();
  if (HEX_6.test(raw)) return `#${raw}`;
  if (HEX_3.test(raw)) {
    const [r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

/** Normalises `#abc`, `abc123`, `#ABC123` … to `#abc123`; anything that is not a hex colour comes back as-is. */
export function normalizeHex(value: string): string {
  return parseHexColor(value) ?? value;
}
