/**
 * Color Validation Utilities
 * Validates and adjusts color inputs for palette generation
 */

/**
 * Validate hex color format
 * Accepts formats: #RGB, #RRGGBB, RGB, RRGGBB
 */
export function validateHexColor(hex: string): boolean {
  if (!hex) return false;

  const cleanHex = hex.replace("#", "");
  const hexRegex = /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/;

  return hexRegex.test(cleanHex);
}

/**
 * Normalize hex color to 6-digit format without #
 * Converts #RGB to RRGGBB format
 */
export function normalizeHexColor(hex: string): string {
  const cleanHex = hex.replace("#", "").toUpperCase();

  // Expand 3-digit hex to 6-digit
  if (cleanHex.length === 3) {
    return cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return cleanHex;
}

/**
 * Validate and adjust OKLCH color for better visibility
 * Ensures the color is not too extreme (too light or too dark)
 */
export function validateAndAdjustOKLCH(oklch: { l: number; c: number; h: number }): {
  l: number;
  c: number;
  h: number;
} {
  let { l, c, h } = oklch;

  // Adjust lightness if too extreme
  if (l > 0.95) {
    l = 0.9; // Too light - darken slightly
  } else if (l < 0.1) {
    l = 0.15; // Too dark - lighten slightly
  }

  // Ensure minimum chroma for color distinction (not pure gray)
  if (c < 0.001) {
    c = 0.002;
  }

  // Clamp chroma to reasonable range
  c = Math.max(0.001, Math.min(0.37, c));

  // Normalize hue to 0-360 range
  h = ((h % 360) + 360) % 360;

  return { l, c, h };
}

/**
 * Adjust lightness for dark mode with improved algorithm
 * Applies different scaling based on original lightness
 */
export function adjustLightnessForDarkMode(lightness: number, offset: number): number {
  // Apply offset (negative to make darker)
  let adjusted = lightness + offset;

  // Enhanced clamping with better distribution
  // Keep very light colors from becoming too dark
  if (lightness > 0.9) {
    // For very light colors, apply less offset
    adjusted = lightness + offset * 0.6;
  } else if (lightness < 0.25) {
    // For already dark colors, apply more offset to ensure they stay very dark
    adjusted = lightness + offset * 1.2;
  }

  // Clamp to valid range (0.1 to 0.95)
  adjusted = Math.max(0.1, Math.min(0.95, adjusted));

  return adjusted;
}
