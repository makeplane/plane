/**
 * Color system configuration for Tailwind CSS
 * Includes custom colors, sidebar colors, toast colors, and subscription colors
 */

const { convertToRGB, convertToRGBA } = require("./utils");

module.exports = {
  custom: {
    // Primary brand colors (0-1000 scale)
    primary: {
      0: "rgb(255, 255, 255)",
      10: convertToRGB("--color-primary-10"),
      20: convertToRGB("--color-primary-20"),
      30: convertToRGB("--color-primary-30"),
      40: convertToRGB("--color-primary-40"),
      50: convertToRGB("--color-primary-50"),
      60: convertToRGB("--color-primary-60"),
      70: convertToRGB("--color-primary-70"),
      80: convertToRGB("--color-primary-80"),
      90: convertToRGB("--color-primary-90"),
      100: convertToRGB("--color-primary-100"),
      200: convertToRGB("--color-primary-200"),
      300: convertToRGB("--color-primary-300"),
      400: convertToRGB("--color-primary-400"),
      500: convertToRGB("--color-primary-500"),
      600: convertToRGB("--color-primary-600"),
      700: convertToRGB("--color-primary-700"),
      800: convertToRGB("--color-primary-800"),
      900: convertToRGB("--color-primary-900"),
      1000: "rgb(0, 0, 0)",
      DEFAULT: convertToRGB("--color-primary-100"),
    },

    // Background colors
    background: {
      0: "rgb(255, 255, 255)",
      10: convertToRGB("--color-background-10"),
      20: convertToRGB("--color-background-20"),
      30: convertToRGB("--color-background-30"),
      40: convertToRGB("--color-background-40"),
      50: convertToRGB("--color-background-50"),
      60: convertToRGB("--color-background-60"),
      70: convertToRGB("--color-background-70"),
      80: convertToRGB("--color-background-80"),
      90: convertToRGB("--color-background-90"),
      100: convertToRGB("--color-background-100"),
      200: convertToRGB("--color-background-200"),
      300: convertToRGB("--color-background-300"),
      400: convertToRGB("--color-background-400"),
      500: convertToRGB("--color-background-500"),
      600: convertToRGB("--color-background-600"),
      700: convertToRGB("--color-background-700"),
      800: convertToRGB("--color-background-800"),
      900: convertToRGB("--color-background-900"),
      1000: "rgb(0, 0, 0)",
      overlay: convertToRGBA("--color-background-80", 0.95),
      primary: convertToRGB("--color-background-primary"),
      error: convertToRGB("--color-background-error"),
      DEFAULT: convertToRGB("--color-background-100"),
    },

    // Text colors
    text: {
      0: "rgb(255, 255, 255)",
      10: convertToRGB("--color-text-10"),
      20: convertToRGB("--color-text-20"),
      30: convertToRGB("--color-text-30"),
      40: convertToRGB("--color-text-40"),
      50: convertToRGB("--color-text-50"),
      60: convertToRGB("--color-text-60"),
      70: convertToRGB("--color-text-70"),
      80: convertToRGB("--color-text-80"),
      90: convertToRGB("--color-text-90"),
      100: convertToRGB("--color-text-100"),
      200: convertToRGB("--color-text-200"),
      300: convertToRGB("--color-text-300"),
      350: convertToRGB("--color-text-350"),
      400: convertToRGB("--color-text-400"),
      500: convertToRGB("--color-text-500"),
      600: convertToRGB("--color-text-600"),
      700: convertToRGB("--color-text-700"),
      800: convertToRGB("--color-text-800"),
      900: convertToRGB("--color-text-900"),
      1000: "rgb(0, 0, 0)",
      primary: convertToRGB("--color-text-primary"),
      error: convertToRGB("--color-text-error"),
      DEFAULT: convertToRGB("--color-text-100"),
    },

    // Border colors
    border: {
      0: "rgb(255, 255, 255)",
      100: convertToRGB("--color-border-100"),
      200: convertToRGB("--color-border-200"),
      300: convertToRGB("--color-border-300"),
      400: convertToRGB("--color-border-400"),
      1000: "rgb(0, 0, 0)",
      primary: convertToRGB("--color-border-primary"),
      error: convertToRGB("--color-border-error"),
      DEFAULT: convertToRGB("--color-border-200"),
    },

    // Error state colors
    error: {
      10: convertToRGB("--color-error-10"),
      20: convertToRGB("--color-error-20"),
      30: convertToRGB("--color-error-30"),
      100: convertToRGB("--color-error-100"),
      200: convertToRGB("--color-error-200"),
      500: convertToRGB("--color-error-500"),
    },

    // Sidebar-specific colors
    sidebar: {
      background: {
        0: "rgb(255, 255, 255)",
        10: convertToRGB("--color-sidebar-background-10"),
        20: convertToRGB("--color-sidebar-background-20"),
        30: convertToRGB("--color-sidebar-background-30"),
        40: convertToRGB("--color-sidebar-background-40"),
        50: convertToRGB("--color-sidebar-background-50"),
        60: convertToRGB("--color-sidebar-background-60"),
        70: convertToRGB("--color-sidebar-background-70"),
        80: convertToRGB("--color-sidebar-background-80"),
        90: convertToRGB("--color-sidebar-background-90"),
        100: convertToRGB("--color-sidebar-background-100"),
        200: convertToRGB("--color-sidebar-background-200"),
        300: convertToRGB("--color-sidebar-background-300"),
        400: convertToRGB("--color-sidebar-background-400"),
        500: convertToRGB("--color-sidebar-background-500"),
        600: convertToRGB("--color-sidebar-background-600"),
        700: convertToRGB("--color-sidebar-background-700"),
        800: convertToRGB("--color-sidebar-background-800"),
        900: convertToRGB("--color-sidebar-background-900"),
        1000: "rgb(0, 0, 0)",
        DEFAULT: convertToRGB("--color-sidebar-background-100"),
      },
      text: {
        0: "rgb(255, 255, 255)",
        10: convertToRGB("--color-sidebar-text-10"),
        20: convertToRGB("--color-sidebar-text-20"),
        30: convertToRGB("--color-sidebar-text-30"),
        40: convertToRGB("--color-sidebar-text-40"),
        50: convertToRGB("--color-sidebar-text-50"),
        60: convertToRGB("--color-sidebar-text-60"),
        70: convertToRGB("--color-sidebar-text-70"),
        80: convertToRGB("--color-sidebar-text-80"),
        90: convertToRGB("--color-sidebar-text-90"),
        100: convertToRGB("--color-sidebar-text-100"),
        200: convertToRGB("--color-sidebar-text-200"),
        300: convertToRGB("--color-sidebar-text-300"),
        400: convertToRGB("--color-sidebar-text-400"),
        500: convertToRGB("--color-sidebar-text-500"),
        600: convertToRGB("--color-sidebar-text-600"),
        700: convertToRGB("--color-sidebar-text-700"),
        800: convertToRGB("--color-sidebar-text-800"),
        900: convertToRGB("--color-sidebar-text-900"),
        1000: "rgb(0, 0, 0)",
        DEFAULT: convertToRGB("--color-sidebar-text-100"),
      },
      border: {
        0: "rgb(255, 255, 255)",
        100: convertToRGB("--color-sidebar-border-100"),
        200: convertToRGB("--color-sidebar-border-200"),
        300: convertToRGB("--color-sidebar-border-300"),
        400: convertToRGB("--color-sidebar-border-400"),
        1000: "rgb(0, 0, 0)",
        DEFAULT: convertToRGB("--color-sidebar-border-200"),
      },
    },

    // UI utility colors
    backdrop: "rgba(0, 0, 0, 0.25)",
    scrollbar: {
      neutral: "rgba(96, 100, 108, 0.1)",
      hover: "rgba(96, 100, 108, 0.25)",
      active: "rgba(96, 100, 108, 0.7)",
    },

    // Subscription tier colors
    subscription: {
      free: {
        200: convertToRGB("--color-subscription-free-200"),
        400: convertToRGB("--color-subscription-free-400"),
      },
      one: {
        200: convertToRGB("--color-subscription-one-200"),
        400: convertToRGB("--color-subscription-one-400"),
      },
      pro: {
        200: convertToRGB("--color-subscription-pro-200"),
        400: convertToRGB("--color-subscription-pro-400"),
      },
      business: {
        200: convertToRGB("--color-subscription-business-200"),
        400: convertToRGB("--color-subscription-business-400"),
      },
      enterprise: {
        200: convertToRGB("--color-subscription-enterprise-200"),
        400: convertToRGB("--color-subscription-enterprise-400"),
      },
    },
  },

  // Toast notification colors
  toast: {
    text: {
      success: convertToRGB("--color-toast-success-text"),
      error: convertToRGB("--color-toast-error-text"),
      warning: convertToRGB("--color-toast-warning-text"),
      info: convertToRGB("--color-toast-info-text"),
      loading: convertToRGB("--color-toast-loading-text"),
      secondary: convertToRGB("--color-toast-secondary-text"),
      tertiary: convertToRGB("--color-toast-tertiary-text"),
    },
    background: {
      success: convertToRGB("--color-toast-success-background"),
      error: convertToRGB("--color-toast-error-background"),
      warning: convertToRGB("--color-toast-warning-background"),
      info: convertToRGB("--color-toast-info-background"),
      loading: convertToRGB("--color-toast-loading-background"),
    },
    border: {
      success: convertToRGB("--color-toast-success-border"),
      error: convertToRGB("--color-toast-error-border"),
      warning: convertToRGB("--color-toast-warning-border"),
      info: convertToRGB("--color-toast-info-border"),
      loading: convertToRGB("--color-toast-loading-border"),
    },
  },
};
