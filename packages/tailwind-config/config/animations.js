/**
 * Animation keyframes configuration for Tailwind CSS
 */

module.exports = {
  // Toast notification animations
  leftToaster: {
    "0%": { left: "-20rem" },
    "100%": { left: "0" },
  },
  rightToaster: {
    "0%": { right: "-20rem" },
    "100%": { right: "0" },
  },

  // Progress bar animation
  "bar-loader": {
    from: { left: "-100%" },
    to: { left: "100%" },
  },
};
