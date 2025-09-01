export type TRgb = { r: number; g: number; b: number };

export const hexToRgb = (hex: string): TRgb => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return { r, g, b };
};

export const rgbToHex = (rgb: TRgb): string => {
  const { r, g, b } = rgb;

  const hexR = r.toString(16).padStart(2, "0");
  const hexG = g.toString(16).padStart(2, "0");
  const hexB = b.toString(16).padStart(2, "0");

  return `#${hexR}${hexG}${hexB}`;
};

/**
 * Calculate relative luminance of a color according to WCAG
 * @param {Object} rgb - RGB color object with r, g, b properties
 * @returns {number} Relative luminance value
 */
export function getLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  // Convert RGB to sRGB
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;

  // Convert sRGB to linear RGB with gamma correction
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors
 * @param {Object} rgb1 - First RGB color object
 * @param {Object} rgb2 - Second RGB color object
 * @returns {number} Contrast ratio between the colors
 */
export function getContrastRatio(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }) {
  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Lighten a color by a specified amount
 * @param {Object} rgb - RGB color object
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {Object} Lightened RGB color
 */
export function lightenColor(rgb: { r: number; g: number; b: number }, amount: number) {
  return {
    r: rgb.r + (255 - rgb.r) * amount,
    g: rgb.g + (255 - rgb.g) * amount,
    b: rgb.b + (255 - rgb.b) * amount,
  };
}

/**
 * Darken a color by a specified amount
 * @param {Object} rgb - RGB color object
 * @param {number} amount - Amount to darken (0-1)
 * @returns {Object} Darkened RGB color
 */
export function darkenColor(rgb: { r: number; g: number; b: number }, amount: number) {
  return {
    r: rgb.r * (1 - amount),
    g: rgb.g * (1 - amount),
    b: rgb.b * (1 - amount),
  };
}

/**
 * Generate appropriate foreground and background colors based on input color
 * @param {string} color - Input color in hex format
 * @returns {Object} Object containing foreground and background colors in hex format
 */
export function generateIconColors(color: string) {
  // Parse input color
  const rgbColor = hexToRgb(color);
  const luminance = getLuminance(rgbColor);

  // Initialize output colors
  let foregroundColor = rgbColor;

  // Constants for color adjustment
  const MIN_CONTRAST_RATIO = 3.0; // Minimum acceptable contrast ratio

  // For light colors, use as foreground and darken for background
  if (luminance > 0.5) {
    // Make sure the foreground color is dark enough for visibility
    let adjustedForeground = foregroundColor;
    const whiteContrast = getContrastRatio(foregroundColor, { r: 255, g: 255, b: 255 });

    if (whiteContrast < MIN_CONTRAST_RATIO) {
      // Darken the foreground color until it has enough contrast
      let darkenAmount = 0.1;
      while (darkenAmount <= 0.9) {
        adjustedForeground = darkenColor(foregroundColor, darkenAmount);
        if (getContrastRatio(adjustedForeground, { r: 255, g: 255, b: 255 }) >= MIN_CONTRAST_RATIO) {
          break;
        }
        darkenAmount += 0.1;
      }
      foregroundColor = adjustedForeground;
    }
  }
  // For dark colors, use as foreground and lighten for background
  else {
    // Make sure the foreground color is light enough for visibility
    let adjustedForeground = foregroundColor;
    const blackContrast = getContrastRatio(foregroundColor, { r: 0, g: 0, b: 0 });

    if (blackContrast < MIN_CONTRAST_RATIO) {
      // Lighten the foreground color until it has enough contrast
      let lightenAmount = 0.1;
      while (lightenAmount <= 0.9) {
        adjustedForeground = lightenColor(foregroundColor, lightenAmount);
        if (getContrastRatio(adjustedForeground, { r: 0, g: 0, b: 0 }) >= MIN_CONTRAST_RATIO) {
          break;
        }
        lightenAmount += 0.1;
      }
      foregroundColor = adjustedForeground;
    }
  }

  return {
    foreground: rgbToHex({ r: foregroundColor.r, g: foregroundColor.g, b: foregroundColor.b }),
    background: `rgba(${foregroundColor.r}, ${foregroundColor.g}, ${foregroundColor.b}, 0.25)`,
  };
}
