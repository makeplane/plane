/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Font used when the caller passes none: the 12px caption type the property chips render with. */
const DEFAULT_MEASURE_FONT = "400 12px sans-serif";
/** Average glyph width relative to the font size, used when no canvas is available (SSR, tests). */
const FALLBACK_GLYPH_RATIO = 0.6;
/** Bound on cached measurements; the cache is dropped wholesale once it grows past this. */
const MAX_CACHE_ENTRIES = 2000;

type TMeasureContext = Pick<CanvasRenderingContext2D, "font" | "measureText">;

let measureContext: TMeasureContext | null | undefined;
const widthCache = new Map<string, number>();

function getMeasureContext(): TMeasureContext | null {
  if (measureContext !== undefined) return measureContext;
  measureContext = null;
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      measureContext = new OffscreenCanvas(1, 1).getContext("2d");
    } else if (typeof document !== "undefined" && !/jsdom/i.test(globalThis.navigator?.userAgent ?? "")) {
      measureContext = document.createElement("canvas").getContext("2d");
    }
  } catch {
    measureContext = null;
  }
  return measureContext;
}

/**
 * Font size in px from a CSS `font` shorthand, e.g. `"500 13px Inter"` or `"13px/1.5 Inter"` → 13.
 * Scans whitespace-separated tokens rather than running a regex over the whole string, so the cost
 * stays linear in the input.
 */
const fontSizeOf = (font: string) => {
  for (const token of font.split(" ")) {
    const size = token.split("/")[0];
    if (!size.endsWith("px")) continue;
    const value = Number(size.slice(0, -2));
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 12;
};

/**
 * Width in px that `text` takes when rendered in `font` (a CSS `font` shorthand), measured off-DOM
 * on a shared canvas so it never forces a layout. Results are cached per font + text. Without a
 * canvas (SSR, jsdom) it falls back to an average-glyph estimate, so callers should treat the value
 * as an estimate and correct it against the rendered element where precision matters.
 */
export function measureTextWidth(text: string, font: string = DEFAULT_MEASURE_FONT): number {
  if (!text) return 0;
  const cacheKey = `${font}\u0000${text}`;
  const cached = widthCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const context = getMeasureContext();
  let width: number;
  if (context) {
    context.font = font;
    width = context.measureText(text).width;
  } else {
    width = text.length * fontSizeOf(font) * FALLBACK_GLYPH_RATIO;
  }
  width = Math.ceil(width);
  if (widthCache.size >= MAX_CACHE_ENTRIES) widthCache.clear();
  widthCache.set(cacheKey, width);
  return width;
}
