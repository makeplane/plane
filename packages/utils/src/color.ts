/**
 * Represents an RGB color with numeric values for red, green, and blue components
 * @typedef {Object} RGB
 * @property {number} r - Red component (0-255)
 * @property {number} g - Green component (0-255)
 * @property {number} b - Blue component (0-255)
 */
export type RGB = { r: number; g: number; b: number };

/**
 * Validates and clamps color values to RGB range (0-255)
 * @param {number} value - The color value to validate
 * @returns {number} Clamped and floored value between 0-255
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
