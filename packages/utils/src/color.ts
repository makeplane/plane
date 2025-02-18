/**
 * Represents an RGB color with numeric values for red, green, and blue components
 * @typedef {Object} RGB
 * @property {number} r - Red component (0-255)
 * @property {number} g - Green component (0-255)
 * @property {number} b - Blue component (0-255)
 */
export type RGB = { r: number; g: number; b: number };

export type HSL = { h: number; s: number; l: number };

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
export const hexToRgb = (hex: string): RGB => {
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
export const rgbToHex = ({ r, g, b }: RGB): string => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

/**
 * Converts Hex values to HSL values
 * @param {string} hex - The hexadecimal color code (e.g., "#ff0000" for red)
 * @returns {HSL} An object containing the HSL values
 * @example
 * hexToHsl("#ff0000") // returns { h: 0, s: 100, l: 50 }
 * hexToHsl("#00ff00") // returns { h: 120, s: 100, l: 50 }
 * hexToHsl("#0000ff") // returns { h: 240, s: 100, l: 50 }
 */
export const hexToHsl = (hex: string): HSL => {
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
export const hslToHex = ({ h, s, l }: HSL): string => {
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
