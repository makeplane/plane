/**
 * Theme Inversion Utilities
 * Handles dark mode palette inversion and mapping
 */

import type { ColorPalette } from "./palette-generator";

/**
 * Invert a color palette for dark mode
 * Maps each shade to its opposite (50↔1250, 100↔1200, 200↔1100, etc.)
 * Shades around the middle are preserved for smooth transitions
 *
 * @param palette - 14-shade color palette to invert
 * @returns Inverted palette with swapped shades
 */
export function invertPalette(palette: ColorPalette): ColorPalette {
  return {
    50: palette[1250],
    100: palette[1200],
    200: palette[1100],
    300: palette[1000],
    400: palette[900],
    500: palette[800],
    600: palette[700],
    700: palette[600],
    800: palette[500],
    900: palette[400],
    1000: palette[300],
    1100: palette[200],
    1200: palette[100],
    1250: palette[50],
  };
}

/**
 * Get CSS variable mapping for a theme mode
 * Maps 14-shade palette to Plane's CSS variable system
 *
 * For light mode:
 * - Uses lighter shades for backgrounds (50-100-200)
 * - Uses darker shades for text (1000, 1100, 1200)
 *
 * For dark mode:
 * - Uses inverted palette
 * - Shifts mapping to lighter shades to avoid cave-like darkness
 *
 * @param palette - 14-shade palette (already inverted for dark mode)
 * @param mode - 'light' or 'dark'
 * @returns Mapping object for neutral color CSS variables
 */
export function getNeutralMapping(palette: ColorPalette, mode: "light" | "dark"): Record<string, string> {
  if (mode === "light") {
    return {
      white: palette["50"],
      "100": palette["100"],
      "200": palette["200"],
      "300": palette["300"],
      "400": palette["400"],
      "500": palette["500"],
      "600": palette["600"],
      "700": palette["700"],
      "800": palette["800"],
      "900": palette["900"],
      "1000": palette["1000"],
      "1100": palette["1100"],
      "1200": palette["1200"],
      black: palette["1250"],
    };
  } else {
    // Dark mode: use lighter shades to avoid cave-like appearance
    return {
      white: palette["50"],
      "100": palette["100"],
      "200": palette["200"],
      "300": palette["300"],
      "400": palette["400"],
      "500": palette["500"],
      "600": palette["600"],
      "700": palette["700"],
      "800": palette["800"],
      "900": palette["900"],
      "1000": palette["1000"],
      "1100": palette["1100"],
      "1200": palette["1200"],
      black: palette["1250"],
    };
  }
}

/**
 * Get CSS variable mapping for brand colors
 * Brand colors use active palette (already inverted for dark mode)
 *
 * @param palette - 14-shade brand palette
 * @returns Mapping object for brand color CSS variables
 */
export function getBrandMapping(palette: ColorPalette): Record<string, string> {
  return {
    "100": palette["100"],
    "200": palette["200"],
    "300": palette["300"],
    "400": palette["400"],
    "500": palette["500"],
    "600": palette["600"],
    "700": palette["700"],
    "800": palette["800"],
    "900": palette["900"],
    "1000": palette["1000"],
    "1100": palette["1100"],
    "1200": palette["1200"],
    default: palette["700"], // Default brand color (middle-ish)
  };
}
