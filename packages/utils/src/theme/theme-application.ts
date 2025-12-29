/**
 * Theme Application Utilities
 * Applies generated palettes to CSS variables for Plane's theme system
 */

import { hexToOKLCH, oklchToCSS, getRelativeLuminance, getPerceptualBrightness } from "./color-conversion";
import type { OKLCH } from "./color-conversion";
import { ALPHA_MAPPING, EDITOR_COLORS_LIGHT, EDITOR_COLORS_DARK } from "./constants";
import { generateThemePalettes } from "./palette-generator";
import { getBrandMapping, getNeutralMapping, invertPalette } from "./theme-inversion";

/**
 * Color darkness detection methods
 */
export type DarknessDetectionMethod = "wcag" | "oklch" | "perceptual";

/**
 * Determine if a color is dark using various methods
 *
 * Methods:
 * - 'wcag': Uses WCAG relative luminance (0-1 scale, threshold 0.5) - Most accurate for accessibility
 * - 'oklch': Uses OKLCH lightness (0-1 scale, threshold 0.5) - Good for perceptual uniformity
 * - 'perceptual': Uses weighted RGB brightness (0-255 scale, threshold 128) - Simple and fast
 *
 * @param brandColor - Brand color in hex format
 * @param method - Detection method to use (default: 'wcag')
 * @returns true if the color is dark, false if light
 */
export function isColorDark(brandColor: string, method: DarknessDetectionMethod = "wcag"): boolean {
  switch (method) {
    case "wcag": {
      // WCAG relative luminance: 0 (black) to 1 (white)
      // Threshold of 0.5 means colors darker than 50% gray are considered dark
      const luminance = getRelativeLuminance(brandColor);
      return luminance < 0.5;
    }
    case "oklch": {
      // OKLCH lightness: 0 (black) to 1 (white)
      // Threshold of 0.5 provides good balance for most colors
      const oklch = hexToOKLCH(brandColor);
      return oklch.l < 0.5;
    }
    case "perceptual": {
      // Perceptual brightness: 0 (black) to 255 (white)
      // Threshold of 128 is the midpoint
      const brightness = getPerceptualBrightness(brandColor);
      return brightness < 128;
    }
    default:
      return getRelativeLuminance(brandColor) < 0.5;
  }
}

/**
 * Get contrasting text colors for use on a colored background
 * Returns white text for dark backgrounds, black text for light backgrounds
 *
 * @param brandColor - Brand color in hex format
 * @param method - Detection method to use (default: 'wcag')
 * @returns Object with text and icon colors in OKLCH format
 */
export function getOnColorTextColors(
  brandColor: string,
  method: DarknessDetectionMethod = "wcag"
): {
  textColor: OKLCH;
  iconColor: OKLCH;
} {
  const isDark = isColorDark(brandColor, method);
  const white: OKLCH = { l: 1, c: 0, h: 0 };
  const black: OKLCH = { l: 0, c: 0, h: 0 };

  return {
    textColor: isDark ? white : black,
    iconColor: isDark ? black : white,
  };
}

/**
 * Apply custom theme using 2-color palette system
 * Generates full palettes from brand and neutral colors
 * and maps them to CSS variables
 *
 * @param brandColor - Brand accent color (hex with or without #)
 * @param neutralColor - Neutral/background color (hex with or without #)
 * @param mode - 'light' or 'dark' theme mode
 */
export function applyCustomTheme(brandColor: string, neutralColor: string, mode: "light" | "dark"): void {
  if (!brandColor || !neutralColor) {
    console.warn("applyCustomTheme: brandColor and neutralColor are required");
    return;
  }

  const themeElement = document?.querySelector("html");
  if (!themeElement) {
    console.warn("applyCustomTheme: html element not found");
    return;
  }

  // Generate palettes directly in OKLCH color space
  const { brandPalette, neutralPalette } = generateThemePalettes(brandColor, neutralColor, mode);
  const neutralOKLCH = hexToOKLCH(neutralColor);

  // For dark mode, invert the palettes
  const activeBrandPalette = mode === "dark" ? invertPalette(brandPalette) : brandPalette;
  const activeNeutralPalette = mode === "dark" ? invertPalette(neutralPalette) : neutralPalette;

  // Get CSS variable mappings
  const neutralMapping = getNeutralMapping(activeNeutralPalette);
  const brandMapping = getBrandMapping(activeBrandPalette);

  // Apply base palette colors
  // This updates the source palette variables that semantic colors reference
  Object.entries(neutralMapping).forEach(([key, value]) => {
    themeElement.style.setProperty(`--neutral-${key}`, value);
  });

  Object.entries(brandMapping).forEach(([key, value]) => {
    themeElement.style.setProperty(`--brand-${key}`, value);
  });

  Object.entries(ALPHA_MAPPING).forEach(([key, value]) => {
    themeElement.style.setProperty(`--alpha-white-${key}`, oklchToCSS(neutralOKLCH, value * 100));
    themeElement.style.setProperty(`--alpha-black-${key}`, oklchToCSS(neutralOKLCH, value * 100));
  });

  // Apply contrasting text colors for use on colored backgrounds
  // Uses WCAG relative luminance for accurate contrast determination
  const { textColor, iconColor } = getOnColorTextColors(brandColor, "wcag");
  themeElement.style.setProperty(`--txt-on-color`, oklchToCSS(textColor));
  themeElement.style.setProperty(`--txt-icon-on-color`, oklchToCSS(iconColor));

  // Apply editor color backgrounds based on mode
  const editorColors = mode === "dark" ? EDITOR_COLORS_DARK : EDITOR_COLORS_LIGHT;
  Object.entries(editorColors).forEach(([color, value]) => {
    themeElement.style.setProperty(`--editor-colors-${color}-background`, value);
  });
}

/**
 * Clear custom theme CSS variables
 * Removes base palette color overrides
 */
export function clearCustomTheme(): void {
  const themeElement = document?.querySelector("html");
  if (!themeElement) return;

  // Clear neutral base palette colors
  const neutralKeys = [
    "white",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "1000",
    "1100",
    "1200",
    "black",
  ];
  neutralKeys.forEach((key) => {
    themeElement.style.removeProperty(`--neutral-${key}`);
  });

  // Clear brand base palette colors
  const brandKeys = ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "1100", "1200", "default"];
  brandKeys.forEach((key) => {
    themeElement.style.removeProperty(`--brand-${key}`);
  });

  Object.keys(ALPHA_MAPPING).forEach((key) => {
    themeElement.style.removeProperty(`--alpha-white-${key}`);
    themeElement.style.removeProperty(`--alpha-black-${key}`);
  });

  themeElement.style.removeProperty(`--txt-on-color`);
  themeElement.style.removeProperty(`--txt-icon-on-color`);

  // Clear editor color background overrides
  Object.keys(EDITOR_COLORS_LIGHT).forEach((color) => {
    themeElement.style.removeProperty(`--editor-colors-${color}-background`);
  });
}
