/**
 * Color Conversion Utilities
 * Provides hex/RGB/HSL/OKLCH conversions using chroma-js
 */

import chroma from "chroma-js";
import { validateAndAdjustOKLCH } from "./color-validation";

/**
 * RGB color interface
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * OKLCH color interface (modern perceptual color space)
 * L = Lightness (0-1)
 * C = Chroma/Saturation
 * H = Hue (0-360 degrees)
 */
export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

/**
 * Convert hex color to OKLCH color space
 * Uses chroma-js for accurate conversion
 */
export function hexToOKLCH(hex: string): OKLCH {
  try {
    const cleanHex = hex.replace("#", "");
    const color = chroma(`#${cleanHex}`);
    const [l, c, h] = color.oklch();

    // Validate and adjust if needed
    return validateAndAdjustOKLCH({ l, c: c || 0, h: h || 0 });
  } catch (error) {
    console.error("Error converting hex to OKLCH:", error);
    // Return a safe default (mid-gray)
    return { l: 0.5, c: 0, h: 0 };
  }
}

/**
 * Convert OKLCH to CSS string format
 * Example: oklch(0.5840 0.1200 250.00)
 */
export function oklchToCSS(oklch: OKLCH, alpha?: number): string {
  const { l, c, h } = oklch;
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)}${alpha ? ` / ${alpha.toFixed(2)}%` : ""})`;
}

/**
 * Convert hex color to OKLCH CSS string
 * Combines hexToOKLCH and oklchToCSS
 */
export function hexToOKLCHString(hex: string): string {
  const oklch = hexToOKLCH(hex);
  return oklchToCSS(oklch);
}

/**
 * Parse OKLCH CSS string to OKLCH object
 * Example: "oklch(0.5840 0.1200 250.00)" -> { l: 0.5840, c: 0.1200, h: 250.00 }
 */
export function parseOKLCH(oklchString: string): OKLCH | null {
  const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (match) {
    return {
      l: parseFloat(match[1]),
      c: parseFloat(match[2]),
      h: parseFloat(match[3]),
    };
  }
  return null;
}

/**
 * Convert hex color to RGB object
 * Legacy function for backward compatibility
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace("#", "");

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB to hex color
 * Legacy function for backward compatibility
 */
export function rgbToHex(rgb: RGB): string {
  const { r, g, b } = rgb;
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex to chroma-js HSL
 * Returns [hue (0-360), saturation (0-1), lightness (0-1)]
 */
export function hexToHSL(hex: string): [number, number, number] {
  try {
    const cleanHex = hex.replace("#", "");
    const color = chroma(`#${cleanHex}`);
    return color.hsl();
  } catch (error) {
    console.error("Error converting hex to HSL:", error);
    return [0, 0, 0.5]; // Safe default
  }
}

/**
 * Check if a color is grayscale (has no saturation)
 */
export function isGrayscale(hex: string): boolean {
  try {
    const cleanHex = hex.replace("#", "");
    const color = chroma(`#${cleanHex}`);
    const [, s] = color.hsl();
    return isNaN(s) || s < 0.01; // NaN hue or very low saturation
  } catch {
    return false;
  }
}

/**
 * Calculate relative luminance using WCAG standard
 * Returns a value between 0 (black) and 1 (white)
 * Based on: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getRelativeLuminance(hex: string): number {
  try {
    const cleanHex = hex.replace("#", "");
    const color = chroma(`#${cleanHex}`);
    return color.luminance();
  } catch (error) {
    console.error("Error calculating luminance:", error);
    return 0.5; // Safe default
  }
}

/**
 * Calculate perceptual brightness using weighted RGB formula
 * Returns a value between 0 (dark) and 255 (bright)
 * Uses ITU-R BT.709 coefficients for better perceptual accuracy
 */
export function getPerceptualBrightness(hex: string): number {
  try {
    const { r, g, b } = hexToRgb(hex);
    // ITU-R BT.709 coefficients
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch (error) {
    console.error("Error calculating brightness:", error);
    return 128; // Safe default (mid-gray)
  }
}
