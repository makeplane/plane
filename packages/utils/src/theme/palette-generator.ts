/**
 * Palette Generator
 * Generates 14-shade color palettes directly in OKLCH color space
 * Keeps C (chroma) and H (hue) constant, only varies L (lightness)
 * Inspired by tints.dev but optimized for OKLCH
 */

import type { OKLCH } from "./color-conversion";
import { hexToOKLCH, oklchToCSS } from "./color-conversion";
import { normalizeHexColor, validateHexColor } from "./color-validation";
import {
  BASELINE_LIGHTNESS_MAP,
  DEFAULT_LIGHT_MODE_LIGHTNESS_MIN,
  DEFAULT_LIGHT_MODE_LIGHTNESS_MAX,
  DEFAULT_DARK_MODE_LIGHTNESS_MIN,
  DEFAULT_DARK_MODE_LIGHTNESS_MAX,
  DEFAULT_VALUE_STOP,
  SHADE_STOPS,
} from "./constants";

/**
 * Type representing valid shade stop values
 */
export type ShadeStop = (typeof SHADE_STOPS)[number];

/**
 * 14-shade color palette
 * Keys: 50, 100, 200, 300, 400, 500, 600, 700, 750, 800, 850, 900, 950, 1000
 * Values: OKLCH CSS strings (e.g., "oklch(0.5840 0.1200 250.00)")
 */
export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  750: string;
  800: string;
  850: string;
  900: string;
  950: string;
  1000: string;
}

/**
 * Palette generation options
 */
export interface PaletteOptions {
  /** Minimum lightness (0-1) for darkest shade */
  lightnessMin?: number;
  /** Maximum lightness (0-1) for lightest shade */
  lightnessMax?: number;
  /** Stop where the input color is anchored (default: auto-calculated) */
  valueStop?: number | "auto";
}

/**
 * Calculate the appropriate stop value based on a color's OKLCH lightness
 * Inspired by tints.dev's calculateStopFromColor but simplified for OKLCH
 *
 * @param oklch - OKLCH color object
 * @returns The nearest available stop value (50, 100, 200, etc.)
 */
export function calculateDynamicValueStop(oklch: OKLCH): number {
  const { l: lightness } = oklch;

  // Find the stop whose baseline lightness is closest to the input color's lightness
  let closestStop = DEFAULT_VALUE_STOP;
  let smallestDiff = Infinity;

  for (const stop of SHADE_STOPS) {
    const baselineLightness = BASELINE_LIGHTNESS_MAP[stop];
    const diff = Math.abs(baselineLightness - lightness);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestStop = stop;
    }
  }

  return closestStop;
}

/**
 * Type guard to check if a number is a valid shade stop
 * @param value - Number to check
 * @returns True if value is a valid shade stop
 */
function isValidShadeStop(value: number): value is ShadeStop {
  return (SHADE_STOPS as readonly number[]).includes(value);
}

/**
 * Generate a 14-shade color palette from a base hex color
 * Works directly in OKLCH space, keeping C and H constant, only varying L
 *
 * @param baseColor - Hex color (with or without #)
 * @param mode - "light" or "dark"
 * @param options - Palette generation options
 * @returns ColorPalette with 14 OKLCH CSS strings
 */
export function generateColorPalette(
  baseColor: string,
  mode: "light" | "dark",
  options: PaletteOptions = {}
): ColorPalette {
  // Validate and normalize input
  if (!validateHexColor(baseColor)) {
    throw new Error(`Invalid hex color: ${baseColor}`);
  }

  const normalizedHex = normalizeHexColor(baseColor);

  // Convert to OKLCH
  const inputOKLCH = hexToOKLCH(normalizedHex);
  const { l: inputL, c: inputC, h: inputH } = inputOKLCH;

  const DEFAULT_LIGHTNESS_MIN = mode === "light" ? DEFAULT_LIGHT_MODE_LIGHTNESS_MIN : DEFAULT_DARK_MODE_LIGHTNESS_MIN;
  const DEFAULT_LIGHTNESS_MAX = mode === "light" ? DEFAULT_LIGHT_MODE_LIGHTNESS_MAX : DEFAULT_DARK_MODE_LIGHTNESS_MAX;

  // Extract options with defaults
  const {
    lightnessMin = DEFAULT_LIGHTNESS_MIN / 100, // Convert to 0-1 scale
    lightnessMax = DEFAULT_LIGHTNESS_MAX / 100, // Convert to 0-1 scale
    valueStop = options.valueStop ?? DEFAULT_VALUE_STOP,
  } = options;

  // Calculate or use provided valueStop
  const anchorStop = valueStop === "auto" ? calculateDynamicValueStop(inputOKLCH) : valueStop;

  // Validate valueStop if provided manually
  if (typeof anchorStop === "number" && !isValidShadeStop(anchorStop)) {
    throw new Error(`Invalid valueStop: ${anchorStop}. Must be one of ${SHADE_STOPS.join(", ")}`);
  }

  // Create lightness distribution with three anchor points
  const distributionAnchors = [
    { stop: SHADE_STOPS[0], lightness: lightnessMax }, // Lightest
    { stop: anchorStop, lightness: inputL }, // Input color
    { stop: SHADE_STOPS[SHADE_STOPS.length - 1], lightness: lightnessMin }, // Darkest
  ];

  // Generate palette by interpolating lightness for each stop
  const palette: Partial<ColorPalette> = {};

  SHADE_STOPS.forEach((stop) => {
    let targetLightness: number;

    // Check if this is an anchor point
    const anchor = distributionAnchors.find((a) => a.stop === stop);
    if (anchor) {
      targetLightness = anchor.lightness;
    } else {
      // Interpolate between anchor points
      let leftAnchor, rightAnchor;

      if (stop < anchorStop) {
        leftAnchor = distributionAnchors[0]; // stop 50
        rightAnchor = distributionAnchors[1]; // anchorStop
      } else {
        leftAnchor = distributionAnchors[1]; // anchorStop
        rightAnchor = distributionAnchors[2]; // stop 1000
      }

      // Linear interpolation
      const range = rightAnchor.stop - leftAnchor.stop;
      const position = stop - leftAnchor.stop;
      const ratio = position / range;
      targetLightness = leftAnchor.lightness + (rightAnchor.lightness - leftAnchor.lightness) * ratio;
    }

    // Create OKLCH color with constant C and H, only varying L
    const shadeOKLCH: OKLCH = {
      l: Math.max(0, Math.min(1, targetLightness)), // Clamp to 0-1
      c: inputC, // Keep chroma constant
      h: inputH, // Keep hue constant
    };

    // Convert to CSS string
    const key = stop as keyof ColorPalette;
    palette[key] = oklchToCSS(shadeOKLCH);
  });

  return palette as ColorPalette;
}

/**
 * Generate both brand and neutral palettes for a custom theme
 * Optimized for Plane's 2-color theme system
 * Uses auto-calculated value stops for better color matching
 *
 * @param brandColor - Brand accent color (hex)
 * @param neutralColor - Neutral/background color (hex)
 * @returns Object with brandPalette and neutralPalette
 */
export function generateThemePalettes(
  brandColor: string,
  neutralColor: string,
  mode: "light" | "dark"
): {
  brandPalette: ColorPalette;
  neutralPalette: ColorPalette;
} {
  // Brand palette - auto-calculate value stop based on color lightness
  const brandPalette = generateColorPalette(brandColor, mode);

  // Neutral palette - auto-calculate value stop based on color lightness
  const neutralPalette = generateColorPalette(neutralColor, mode);

  return { brandPalette, neutralPalette };
}
