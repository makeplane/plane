/**
 * Represents an RGB color with numeric values for red, green, and blue components
 * @typedef {Object} TRgb
 * @property {number} r - Red component (0-255)
 * @property {number} g - Green component (0-255)
 * @property {number} b - Blue component (0-255)
 */
export type TRgb = { r: number; g: number; b: number };

export type THsl = { h: number; s: number; l: number };

/**
 * @description Validates and clamps color values to RGB range (0-255)
 * @param {number} value - The color value to validate
 * @returns {number} Clamped and floored value between 0-255
 * @example
 * validateColor(-10) // returns 0
 * validateColor(300) // returns 255
 * validateColor(128) // returns 128
 */
export const validateColor = (value: number) => {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return Math.floor(value);
};

/**
 * Converts a decimal color value to two-character hex
 * @param {number} value - Decimal color value (0-255)
 * @returns {string} Two-character hex value with leading zero if needed
 */
export const toHex = (value: number) => validateColor(value).toString(16).padStart(2, "0");

/**
 * Converts a hexadecimal color code to RGB values
 * @param {string} hex - The hexadecimal color code (e.g., "#ff0000" for red)
 * @returns {RGB} An object containing the RGB values
 * @example
 * hexToRgb("#ff0000") // returns { r: 255, g: 0, b: 0 }
 * hexToRgb("#00ff00") // returns { r: 0, g: 255, b: 0 }
 * hexToRgb("#0000ff") // returns { r: 0, g: 0, b: 255 }
 */
export const hexToRgb = (hex: string): TRgb => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Converts RGB values to a hexadecimal color code
 * @param {RGB} rgb - An object containing RGB values
 * @param {number} rgb.r - Red component (0-255)
 * @param {number} rgb.g - Green component (0-255)
 * @param {number} rgb.b - Blue component (0-255)
 * @returns {string} The hexadecimal color code (e.g., "#ff0000" for red)
 * @example
 * rgbToHex({ r: 255, g: 0, b: 0 }) // returns "#ff0000"
 * rgbToHex({ r: 0, g: 255, b: 0 }) // returns "#00ff00"
 * rgbToHex({ r: 0, g: 0, b: 255 }) // returns "#0000ff"
 */
export const rgbToHex = ({ r, g, b }: TRgb): string => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

/**
 * Converts Hex values to HSL values
 * @param {string} hex - The hexadecimal color code (e.g., "#ff0000" for red)
 * @returns {HSL} An object containing the HSL values
 * @example
 * hexToHsl("#ff0000") // returns { h: 0, s: 100, l: 50 }
 * hexToHsl("#00ff00") // returns { h: 120, s: 100, l: 50 }
 * hexToHsl("#0000ff") // returns { h: 240, s: 100, l: 50 }
 */
export const hexToHsl = (hex: string): THsl => {
  // return default value for invalid hex
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return { h: 0, s: 0, l: 0 };

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
};

/**
 * Converts HSL values to a hexadecimal color code
 * @param {HSL} hsl - An object containing HSL values
 * @param {number} hsl.h - Hue component (0-360)
 * @param {number} hsl.s - Saturation component (0-100)
 * @param {number} hsl.l - Lightness component (0-100)
 * @returns {string} The hexadecimal color code (e.g., "#ff0000" for red)
 * @example
 * hslToHex({ h: 0, s: 100, l: 50 }) // returns "#ff0000"
 * hslToHex({ h: 120, s: 100, l: 50 }) // returns "#00ff00"
 * hslToHex({ h: 240, s: 100, l: 50 }) // returns "#0000ff"
 */
export const hslToHex = ({ h, s, l }: THsl): string => {
  if (h < 0 || h > 360) return "#000000";
  if (s < 0 || s > 100) return "#000000";
  if (l < 0 || l > 100) return "#000000";

  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;

  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Calculate relative luminance of a color according to WCAG
 * @param {Object} rgb - RGB color object with r, g, b properties
 * @returns {number} Relative luminance value
 */
export const getLuminance = ({ r, g, b }: TRgb) => {
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
};

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

/**
 * @description Generates a deterministic HSL color based on input string
 * @param {string} input - Input string to generate color from
 * @returns {THsl} An object containing the HSL values
 * @example
 * generateRandomColor("hello") // returns consistent HSL color for "hello"
 * generateRandomColor("") // returns { h: 0, s: 0, l: 0 }
 */
export const generateRandomColor = (input: string): THsl => {
  // If input is falsy, generate a random seed string.
  // The random seed is created by converting a random number to base-36 and taking a substring.
  const seed = input || Math.random().toString(36).substring(2, 8);

  const uniqueId = seed.length.toString() + seed; // Unique identifier based on string length
  const combinedString = uniqueId + seed;

  // Create a hash value from the combined string.
  const hash = Array.from(combinedString).reduce((acc, char) => {
    const charCode = char.charCodeAt(0);
    return (acc << 5) - acc + charCode;
  }, 0);

  // Derive the HSL values from the hash.
  const hue = Math.abs(hash % 360);
  const saturation = 70; // Maintains a good amount of color
  const lightness = 70; // Increased lightness for a pastel look

  return { h: hue, s: saturation, l: lightness };
};
