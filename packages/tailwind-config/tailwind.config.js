/**
 * Tailwind CSS Configuration
 * Modular configuration split into focused files for better maintainability
 */

// Import configuration modules
const content = require("./config/content");
const colors = require("./config/colors");
const shadows = require("./config/shadows");
const spacing = require("./config/spacing");
const typography = require("./config/typography");
const animations = require("./config/animations");
const layout = require("./config/layout");
const plugins = require("./config/plugins");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content,
  theme: {
    extend: {
      // Colors
      colors,

      // Shadows
      boxShadow: shadows,

      // Spacing
      padding: spacing.padding,
      margin: spacing.margin,
      gap: spacing.gap,
      space: spacing.space,

      // Typography
      fontSize: typography.fontSize,
      fontFamily: typography.fontFamily,
      typography: typography.typography,

      // Animations
      keyframes: animations,

      // Layout
      zIndex: layout.zIndex,
      screens: layout.screens,
      height: layout.height,
    },
  },
  plugins,
};
