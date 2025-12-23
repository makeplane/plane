/**
 * Theme System Constants
 * Defines shade stops, default configurations, and color modes
 */

/**
 * Alpha mapping for 14-shade palette system
 */
export const ALPHA_MAPPING = {
  100: 0.05,
  200: 0.1,
  300: 0.15,
  400: 0.2,
  500: 0.3,
  600: 0.4,
  700: 0.5,
  800: 0.6,
  900: 0.7,
  1000: 0.8,
  1100: 0.9,
  1200: 0.95,
};

/**
 * All shade stops for 14-shade palette system
 * 50 = white, 1000 = black
 * Extended range: 50-1000 for more granular control
 */
export const SHADE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 750, 800, 850, 900, 950, 1000] as const;

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
  750: 0.28, // Very dark
  800: 0.18, // Darkest
  850: 0.12, // Near black
  900: 0.08, // Almost black
  950: 0.04, // Nearly black
  1000: 0.02, // Black
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
 * Default minimum lightness for light mode (0-100 scale)
 */
export const DEFAULT_LIGHT_MODE_LIGHTNESS_MIN = 0;

/**
 * Default maximum lightness for light mode (0-100 scale)
 */
export const DEFAULT_LIGHT_MODE_LIGHTNESS_MAX = 100;

/**
 * Default minimum lightness for dark mode (0-100 scale)
 */
export const DEFAULT_DARK_MODE_LIGHTNESS_MIN = 10;

/**
 * Default maximum lightness for dark mode (0-100 scale)
 */
export const DEFAULT_DARK_MODE_LIGHTNESS_MAX = 80;

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

/**
 * Editor color backgrounds for light mode
 * Used for stickies and editor elements
 */
export const EDITOR_COLORS_LIGHT = {
  gray: "#d6d6d8",
  peach: "#ffd5d7",
  pink: "#fdd4e3",
  orange: "#ffe3cd",
  green: "#c3f0de",
  "light-blue": "#c5eff9",
  "dark-blue": "#c9dafb",
  purple: "#e3d8fd",
} as const;

/**
 * Editor color backgrounds for dark mode
 * Used for stickies and editor elements
 */
export const EDITOR_COLORS_DARK = {
  gray: "#404144",
  peach: "#593032",
  pink: "#562e3d",
  orange: "#583e2a",
  green: "#1d4a3b",
  "light-blue": "#1f495c",
  "dark-blue": "#223558",
  purple: "#3d325a",
};
