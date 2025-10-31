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
      animation: {
        // Web app animations
        "slide-up": "slide-up 0.3s ease-out forwards",
        "text-slide-in": "textSlideIn 400ms ease-out forwards",
        "text-fade-out": "textFadeOut 600ms ease-in 300ms forwards",
        "lock-icon": "lockIconAnimation 600ms ease-out forwards",
        "unlock-icon": "unlockIconAnimation 600ms ease-out forwards",
        "fade-out": "fadeOut 500ms ease-in 100ms forwards",
      },

      // Layout
      zIndex: layout.zIndex,
      screens: layout.screens,
      height: layout.height,
    },
  },
  plugins,
};
