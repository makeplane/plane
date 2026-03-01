/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

/**
 * PDF Export Color Constants
 *
 * These colors are mapped from the editor CSS variables and tailwind-config tokens
 * to ensure PDF exports match the editor's appearance.
 *
 * Source mappings:
 * - Editor colors: packages/editor/src/styles/variables.css
 * - Tailwind tokens: packages/tailwind-config/variables.css
 */

// Editor text colors (from variables.css :root)
export const EDITOR_TEXT_COLORS = {
  gray: "#5c5e63",
  peach: "#ff5b59",
  pink: "#f65385",
  orange: "#fd9038",
  green: "#0fc27b",
  "light-blue": "#17bee9",
  "dark-blue": "#266df0",
  purple: "#9162f9",
} as const;

// Editor background colors - Light theme (from variables.css [data-theme*="light"])
export const EDITOR_BACKGROUND_COLORS_LIGHT = {
  gray: "#d6d6d8",
  peach: "#ffd5d7",
  pink: "#fdd4e3",
  orange: "#ffe3cd",
  green: "#c3f0de",
  "light-blue": "#c5eff9",
  "dark-blue": "#c9dafb",
  purple: "#e3d8fd",
} as const;

// Editor background colors - Dark theme (from variables.css [data-theme*="dark"])
export const EDITOR_BACKGROUND_COLORS_DARK = {
  gray: "#404144",
  peach: "#593032",
  pink: "#562e3d",
  orange: "#583e2a",
  green: "#1d4a3b",
  "light-blue": "#1f495c",
  "dark-blue": "#223558",
  purple: "#3d325a",
} as const;

// Use light theme colors by default for PDF exports
export const EDITOR_BACKGROUND_COLORS = EDITOR_BACKGROUND_COLORS_LIGHT;

// Color key type
export type EditorColorKey = keyof typeof EDITOR_TEXT_COLORS;

/**
 * Maps a color key to its text color hex value
 */
export const getTextColorHex = (colorKey: string): string | null => {
  if (colorKey in EDITOR_TEXT_COLORS) {
    return EDITOR_TEXT_COLORS[colorKey as EditorColorKey];
  }
  return null;
};

/**
 * Maps a color key to its background color hex value
 */
export const getBackgroundColorHex = (colorKey: string): string | null => {
  if (colorKey in EDITOR_BACKGROUND_COLORS) {
    return EDITOR_BACKGROUND_COLORS[colorKey as EditorColorKey];
  }
  return null;
};

/**
 * Checks if a value is a CSS variable reference (e.g., "var(--editor-colors-gray-text)")
 */
export const isCssVariable = (value: string): boolean => {
  return value.startsWith("var(");
};

/**
 * Extracts the color key from a CSS variable reference
 * e.g., "var(--editor-colors-gray-text)" -> "gray"
 * e.g., "var(--editor-colors-light-blue-background)" -> "light-blue"
 */
export const extractColorKeyFromCssVariable = (cssVar: string): string | null => {
  // Match patterns like: var(--editor-colors-{color}-text) or var(--editor-colors-{color}-background)
  const match = cssVar.match(/var\(--editor-colors-([\w-]+)-(text|background)\)/);
  if (match) {
    return match[1];
  }
  return null;
};

/**
 * Resolves a color value to a hex color for PDF rendering
 * Handles both direct hex values and CSS variable references
 */
export const resolveColorForPdf = (value: string | null | undefined, type: "text" | "background"): string | null => {
  if (!value) return null;

  // If it's already a hex color, return it
  if (value.startsWith("#")) {
    return value;
  }

  // If it's a CSS variable, extract the key and get the hex value
  if (isCssVariable(value)) {
    const colorKey = extractColorKeyFromCssVariable(value);
    if (colorKey) {
      return type === "text" ? getTextColorHex(colorKey) : getBackgroundColorHex(colorKey);
    }
  }

  // If it's just a color key (e.g., "gray", "peach"), get the hex value
  if (type === "text") {
    return getTextColorHex(value);
  }
  return getBackgroundColorHex(value);
};

// Semantic colors from tailwind-config (light theme)
// These are derived from the CSS variables in packages/tailwind-config/variables.css

// Neutral colors (light theme)
export const NEUTRAL_COLORS = {
  white: "#ffffff",
  100: "#fafafa", // oklch(0.9848 0.0003 230.66) ≈ #fafafa
  200: "#f5f5f5", // oklch(0.9696 0.0007 230.67) ≈ #f5f5f5
  300: "#f0f0f0", // oklch(0.9543 0.001 230.67) ≈ #f0f0f0
  400: "#ebebeb", // oklch(0.9389 0.0014 230.68) ≈ #ebebeb
  500: "#e5e5e5", // oklch(0.9235 0.001733 230.6853) ≈ #e5e5e5
  600: "#d9d9d9", // oklch(0.8925 0.0024 230.7) ≈ #d9d9d9
  700: "#cccccc", // oklch(0.8612 0.0032 230.71) ≈ #cccccc
  800: "#8c8c8c", // oklch(0.6668 0.0079 230.82) ≈ #8c8c8c
  900: "#7a7a7a", // oklch(0.6161 0.009153 230.867) ≈ #7a7a7a
  1000: "#636363", // oklch(0.5288 0.0083 230.88) ≈ #636363
  1100: "#4d4d4d", // oklch(0.4377 0.0066 230.87) ≈ #4d4d4d
  1200: "#1f1f1f", // oklch(0.2378 0.0029 230.83) ≈ #1f1f1f
  black: "#0f0f0f", // oklch(0.1472 0.0034 230.83) ≈ #0f0f0f
} as const;

// Brand colors (light theme accent)
export const BRAND_COLORS = {
  default: "#3f76ff", // oklch(0.4799 0.1158 242.91) - primary accent blue
  100: "#f5f8ff",
  200: "#e8f0ff",
  300: "#d1e1ff",
  400: "#b3d0ff",
  500: "#8ab8ff",
  600: "#5c9aff",
  700: "#3f76ff",
  900: "#2952b3",
  1000: "#1e3d80",
  1100: "#142b5c",
  1200: "#0d1f40",
} as const;

// Semantic text colors
export const TEXT_COLORS = {
  primary: NEUTRAL_COLORS[1200], // --txt-primary
  secondary: NEUTRAL_COLORS[1100], // --txt-secondary
  tertiary: NEUTRAL_COLORS[1000], // --txt-tertiary
  placeholder: NEUTRAL_COLORS[900], // --txt-placeholder
  disabled: NEUTRAL_COLORS[800], // --txt-disabled
  accentPrimary: BRAND_COLORS.default, // --txt-accent-primary
  linkPrimary: BRAND_COLORS.default, // --txt-link-primary
} as const;

// Semantic background colors
export const BACKGROUND_COLORS = {
  canvas: NEUTRAL_COLORS[300], // --bg-canvas
  surface1: NEUTRAL_COLORS.white, // --bg-surface-1
  surface2: NEUTRAL_COLORS[100], // --bg-surface-2
  layer1: NEUTRAL_COLORS[200], // --bg-layer-1
  layer2: NEUTRAL_COLORS.white, // --bg-layer-2
  layer3: NEUTRAL_COLORS[300], // --bg-layer-3
  accentSubtle: "#f5f8ff", // --bg-accent-subtle (brand-100)
} as const;

// Semantic border colors
export const BORDER_COLORS = {
  subtle: NEUTRAL_COLORS[400], // --border-subtle
  subtle1: NEUTRAL_COLORS[500], // --border-subtle-1
  strong: NEUTRAL_COLORS[600], // --border-strong
  strong1: NEUTRAL_COLORS[700], // --border-strong-1
  accentStrong: BRAND_COLORS.default, // --border-accent-strong
} as const;

// Code/inline code colors
export const CODE_COLORS = {
  background: NEUTRAL_COLORS[200], // Similar to bg-layer-1
  text: "#dc2626", // Red for inline code text (matches editor)
  blockText: NEUTRAL_COLORS[1200], // Regular text for code blocks
} as const;

// Link colors
export const LINK_COLORS = {
  primary: BRAND_COLORS.default,
  hover: BRAND_COLORS[900],
} as const;

// Mention colors (from pi-chat-editor mention styles: bg-accent-primary/20 text-accent-primary)
export const MENTION_COLORS = {
  background: "#e0e9ff", // accent-primary with ~20% opacity on white
  text: BRAND_COLORS.default,
} as const;

// Success/Green colors
export const SUCCESS_COLORS = {
  primary: "#10b981",
  subtle: "#d1fae5",
} as const;

// Warning/Amber colors
export const WARNING_COLORS = {
  primary: "#f59e0b",
  subtle: "#fef3c7",
} as const;

// Danger/Red colors
export const DANGER_COLORS = {
  primary: "#ef4444",
  subtle: "#fee2e2",
} as const;
