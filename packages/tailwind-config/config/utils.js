/**
 * Helper functions for Tailwind CSS configuration
 */

/**
 * Converts a CSS variable name to RGB format
 * @param {string} variableName - CSS variable name (e.g., "--color-primary-100")
 * @returns {string} RGBA color string
 */
const convertToRGB = (variableName) => `rgba(var(${variableName}))`;

/**
 * Converts a CSS variable name to RGBA format with custom alpha
 * @param {string} variableName - CSS variable name (e.g., "--color-background-80")
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string with alpha
 */
const convertToRGBA = (variableName, alpha) =>
  `rgba(var(${variableName}), ${alpha})`;

module.exports = {
  convertToRGB,
  convertToRGBA,
};
