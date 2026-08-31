/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Converts an emoji to a dash-separated string of decimal Unicode code points.
 * Handles multi-byte characters and emoji sequences (including skin tone modifiers).
 * @param emoji - The emoji string to convert
 * @returns Dash-separated string of decimal code points (e.g. "128077-127999")
 */
export function emojiToString(emoji: string): string {
  const codePoints: number[] = [];
  for (const char of Array.from(emoji)) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) codePoints.push(codePoint);
  }
  return codePoints.join("-");
}

/**
 * Converts a dash-separated string of decimal Unicode code points back to the emoji character.
 * @param emojiString - Dash-separated string of decimal code points (e.g. "128077-127999")
 * @returns The reconstructed emoji string, or "" on failure
 */
export function stringToEmoji(emojiString: string): string {
  if (!emojiString) return "";
  const tokens = emojiString.split("-").map((s) => s.trim());
  if (tokens.some((token) => !/^\d+$/.test(token))) return "";
  const decimals = tokens.map(Number);
  if (decimals.some((n) => !Number.isInteger(n) || n < 0 || n > 0x10ffff)) return "";
  try {
    return decimals.map((decimal) => String.fromCodePoint(decimal)).join("");
  } catch {
    return "";
  }
}
