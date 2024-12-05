/**
 * Represents an RGB color with numeric values for red, green, and blue components
 * @typedef {Object} TRgb
 * @property {number} r - Red component (0-255)
 * @property {number} g - Green component (0-255)
 * @property {number} b - Blue component (0-255)
 */
export type TRgb = { r: number; g: number; b: number };

/**
 * Converts a hexadecimal color code to RGB values
 * @param {string} hex - The hexadecimal color code (e.g., "#ff0000" for red)
 * @returns {TRgb} An object containing the RGB values
 * @example
 * hexToRgb("#ff0000") // returns { r: 255, g: 0, b: 0 }
 * hexToRgb("#00ff00") // returns { r: 0, g: 255, b: 0 }
 * hexToRgb("#0000ff") // returns { r: 0, g: 0, b: 255 }
 */
export const hexToRgb = (hex: string): TRgb => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return { r, g, b };
};

/**
 * Converts RGB values to a hexadecimal color code
 * @param {TRgb} rgb - An object containing RGB values
 * @param {number} rgb.r - Red component (0-255)
 * @param {number} rgb.g - Green component (0-255)
 * @param {number} rgb.b - Blue component (0-255)
 * @returns {string} The hexadecimal color code (e.g., "#ff0000" for red)
 * @example
 * rgbToHex({ r: 255, g: 0, b: 0 }) // returns "#ff0000"
 * rgbToHex({ r: 0, g: 255, b: 0 }) // returns "#00ff00"
 * rgbToHex({ r: 0, g: 0, b: 255 }) // returns "#0000ff"
 */
export const rgbToHex = (rgb: TRgb): string => {
  const { r, g, b } = rgb;

  const hexR = r.toString(16).padStart(2, "0");
  const hexG = g.toString(16).padStart(2, "0");
  const hexB = b.toString(16).padStart(2, "0");

  return `#${hexR}${hexG}${hexB}`;
};
