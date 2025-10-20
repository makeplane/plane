/**
 * Spacing configuration for Tailwind CSS
 * All values are scaled down to 90% of default Tailwind spacing
 * Used by: padding, margin, space, gap
 */

// Base spacing scale (90% of Tailwind defaults)
const spacingScale = {
  0: "0",
  0.5: "0.1125rem",
  1: "0.225rem",
  1.5: "0.3375rem",
  2: "0.45rem",
  2.5: "0.5625rem",
  3: "0.675rem",
  3.5: "0.7875rem",
  4: "0.9rem",
  5: "1.125rem",
  6: "1.35rem",
  7: "1.575rem",
  8: "1.8rem",
  9: "2.025rem",
  10: "2.25rem",
  11: "2.475rem",
  12: "2.7rem",
  16: "3.6rem",
  20: "4.5rem",
  24: "5.4rem",
  32: "7.2rem",
  40: "9rem",
  48: "10.8rem",
  56: "12.6rem",
  64: "14.4rem",
  72: "16.2rem",
  80: "18rem",
  96: "21.6rem",
};

module.exports = {
  // Padding with custom page utilities
  padding: {
    ...spacingScale,
    "page-x": "1.35rem",
    "page-y": "1.35rem",
  },

  // Margin (same scale as padding)
  margin: spacingScale,

  // Gap (same scale as padding)
  gap: spacingScale,

  // Space (same scale as padding)
  space: spacingScale,
};
