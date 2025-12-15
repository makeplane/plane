/**
 * Theme System Constants
 * Defines shade stops, default configurations, and color modes
 */

/**
 * All shade stops for 14-shade palette system
 * 50 = white, 1250 = black
 * Extended range: 50-1250 for more granular control
 */
export const SHADE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1250] as const;

/**
 * Default stop where user input color is anchored
 * This is now dynamically calculated based on the input color's lightness
 * This constant serves as a fallback only
 */
export const DEFAULT_VALUE_STOP = 500;

/**
 * Baseline lightness values for each stop (in OKLCH L scale 0-1)
 * Used to determine which stop best matches an input color
 * Based on perceptually uniform distribution
 */
export const BASELINE_LIGHTNESS_MAP: Record<number, number> = {
  50: 0.98, // Near white
  100: 0.95, // Lightest
  200: 0.88, // Very light
  300: 0.78, // Light
  400: 0.68, // Light-medium
  500: 0.58, // Medium (typical input)
  600: 0.48, // Medium-dark
  700: 0.38, // Dark
  800: 0.28, // Very dark
  900: 0.18, // Darkest
  1000: 0.12, // Near black
  1100: 0.08, // Almost black
  1200: 0.04, // Nearly black
  1250: 0.02, // Black
};

/**
 * Default hue shift for brand colors (in degrees)
 * Adds visual interest by shifting hue at extremes
 */
export const DEFAULT_HUE_SHIFT_BRAND = 10;

/**
 * Default hue shift for neutral colors (in degrees)
 * No shift to keep neutrals truly neutral
 */
export const DEFAULT_HUE_SHIFT_NEUTRAL = 0;

/**
 * Default minimum lightness (0-100 scale)
 * Used for darkest shade (1250)
 */
export const DEFAULT_LIGHTNESS_MIN = 0;

/**
 * Default maximum lightness (0-100 scale)
 * Used for lightest shade (50)
 */
export const DEFAULT_LIGHTNESS_MAX = 100;

/**
 * Color generation modes
 * - perceived: HSLuv-based perceptually uniform lightness (recommended)
 * - linear: Direct HSL manipulation
 */
export type ColorMode = "perceived" | "linear";

/**
 * Default color generation mode
 */
export const DEFAULT_COLOR_MODE: ColorMode = "perceived";

/**
 * Saturation curve types
 * - ease-in-out: Increase saturation at extremes (recommended for brand colors)
 * - linear: Maintain constant saturation (recommended for neutrals)
 */
export type SaturationCurve = "ease-in-out" | "linear";

/**
 * Default saturation curve
 */
export const DEFAULT_SATURATION_CURVE: SaturationCurve = "ease-in-out";
