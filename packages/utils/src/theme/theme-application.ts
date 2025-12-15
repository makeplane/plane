/**
 * Theme Application Utilities
 * Applies generated palettes to CSS variables for Plane's theme system
 */

import { generateThemePalettes } from "./palette-generator";
import { getBrandMapping, getNeutralMapping, invertPalette } from "./theme-inversion";

/**
 * Apply custom theme using 2-color palette system
 * Generates full 13-shade palettes from brand and neutral colors
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

  // Generate 13-shade palettes directly in OKLCH color space
  const { brandPalette, neutralPalette } = generateThemePalettes(brandColor, neutralColor);

  // For dark mode, invert the palettes
  const activeBrandPalette = mode === "dark" ? invertPalette(brandPalette) : brandPalette;
  const activeNeutralPalette = mode === "dark" ? invertPalette(neutralPalette) : neutralPalette;

  // Get CSS variable mappings
  const neutralMapping = getNeutralMapping(activeNeutralPalette, mode);
  const brandMapping = getBrandMapping(activeBrandPalette);

  // Apply base palette colors
  // This updates the source palette variables that semantic colors reference
  Object.entries(neutralMapping).forEach(([key, value]) => {
    themeElement.style.setProperty(`--color-neutral-${key}`, value);
  });

  Object.entries(brandMapping).forEach(([key, value]) => {
    themeElement.style.setProperty(`--color-brand-${key}`, value);
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
    themeElement.style.removeProperty(`--color-neutral-${key}`);
  });

  // Clear brand base palette colors
  const brandKeys = ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "1100", "1200", "default"];
  brandKeys.forEach((key) => {
    themeElement.style.removeProperty(`--color-brand-${key}`);
  });
}
