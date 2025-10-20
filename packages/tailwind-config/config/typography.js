/**
 * Typography configuration for Tailwind CSS
 * Includes font sizes (90% scaled), font families, and prose styles
 */

const { convertToRGB } = require("./utils");

module.exports = {
  // Font sizes scaled down to 90% of default
  fontSize: {
    "2xs": "0.5625rem",
    xs: "0.675rem",
    sm: "0.7875rem",
    base: "0.9rem",
    lg: "1.0125rem",
    xl: "1.125rem",
    "2xl": "1.35rem",
    "3xl": "1.6875rem",
    "4xl": "2.25rem",
    "5xl": "2.7rem",
    "6xl": "3.375rem",
    "7xl": "4.05rem",
    "8xl": "5.4rem",
    "9xl": "7.2rem",
  },

  // Font family
  fontFamily: {
    custom: ["Inter", "sans-serif"],
  },

  // Prose/Typography plugin configuration
  typography: () => ({
    brand: {
      css: {
        "--tw-prose-body": convertToRGB("--color-text-100"),
        "--tw-prose-p": convertToRGB("--color-text-100"),
        "--tw-prose-headings": convertToRGB("--color-text-100"),
        "--tw-prose-lead": convertToRGB("--color-text-100"),
        "--tw-prose-links": convertToRGB("--color-primary-100"),
        "--tw-prose-bold": "inherit",
        "--tw-prose-counters": convertToRGB("--color-text-100"),
        "--tw-prose-bullets": convertToRGB("--color-text-100"),
        "--tw-prose-hr": convertToRGB("--color-text-100"),
        "--tw-prose-quotes": convertToRGB("--color-text-100"),
        "--tw-prose-quote-borders": convertToRGB("--color-border-200"),
        "--tw-prose-code": convertToRGB("--color-text-100"),
        "--tw-prose-pre-code": convertToRGB("--color-text-100"),
        "--tw-prose-pre-bg": convertToRGB("--color-background-100"),
        "--tw-prose-th-borders": convertToRGB("--color-border-200"),
        "--tw-prose-td-borders": convertToRGB("--color-border-200"),
      },
    },
  }),
};
