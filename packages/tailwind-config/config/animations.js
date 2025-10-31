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

  // Web app specific animations
  "slide-up": {
    from: {
      transform: "translateY(10px)",
      opacity: "0",
    },
    to: {
      transform: "translateY(0)",
      opacity: "1",
    },
  },
  slideInFromBottom: {
    "0%": {
      transform: "translateY(100%)",
      opacity: "0",
    },
    "100%": {
      transform: "translateY(0)",
      opacity: "1",
    },
  },
  slideInFromTop: {
    "0%": {
      transform: "translateY(-100%)",
      opacity: "0",
    },
    "100%": {
      transform: "translateY(0)",
      opacity: "1",
    },
  },
  slideOut: {
    "0%": {
      transform: "translateY(0)",
      opacity: "1",
    },
    "100%": {
      transform: "translateY(-100%)",
      opacity: "0",
    },
  },
  slideOutDown: {
    "0%": {
      transform: "translateY(0)",
      opacity: "1",
    },
    "100%": {
      transform: "translateY(100%)",
      opacity: "0",
    },
  },
  fadeOut: {
    "0%": {
      opacity: "1",
    },
    "100%": {
      opacity: "0",
    },
  },

  // Lock icon animations
  textSlideIn: {
    "0%": {
      opacity: "0",
      transform: "translateX(-8px)",
      maxWidth: "0px",
    },
    "40%": {
      opacity: "0.7",
      maxWidth: "60px",
    },
    "100%": {
      opacity: "1",
      transform: "translateX(0)",
      maxWidth: "60px",
    },
  },
  textFadeOut: {
    "0%": {
      opacity: "1",
      transform: "translateX(0)",
    },
    "100%": {
      opacity: "0",
      transform: "translateX(8px)",
    },
  },
  lockIconAnimation: {
    "0%": {
      transform: "rotate(-5deg) scale(1)",
    },
    "25%": {
      transform: "rotate(0deg) scale(1.15)",
    },
    "50%": {
      transform: "rotate(5deg) scale(1.08)",
    },
    "100%": {
      transform: "rotate(0deg) scale(1)",
    },
  },
  unlockIconAnimation: {
    "0%": {
      transform: "rotate(0deg) scale(1)",
    },
    "40%": {
      transform: "rotate(-8deg) scale(1.15)",
    },
    "80%": {
      transform: "rotate(3deg) scale(1.05)",
    },
    "100%": {
      transform: "rotate(0deg) scale(1)",
    },
  },
  highlight: {
    "0%": {
      backgroundColor: "rgba(var(--color-background-90), 1)",
      borderRadius: "4px",
    },
    "100%": {
      backgroundColor: "transparent",
      borderRadius: "4px",
    },
  },
};
