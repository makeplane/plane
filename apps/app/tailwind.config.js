function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) return `rgba(var(${variableName}), ${opacityValue})`;

    return `rgb(var(${variableName}))`;
  };
}

module.exports = {
  darkMode: "class",
  content: ["./pages/**/*.tsx", "./components/**/*.tsx", "./layouts/**/*.tsx", "./ui/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        theme: "#3f76ff",
        "hover-gray": "#f5f5f5",
        primary: "#f9fafb", // gray-50
        secondary: "white",
        brand: {
          accent: withOpacity("--color-accent"),
          base: withOpacity("--color-border"),
        },
      },
      borderColor: {
        brand: {
          base: withOpacity("--color-border"),
          "surface-1": withOpacity("--color-bg-surface-1"),
          "surface-2": withOpacity("--color-bg-surface-2"),
        },
      },
      backgroundColor: {
        brand: {
          base: withOpacity("--color-bg-base"),
          "surface-1": withOpacity("--color-bg-surface-1"),
          "surface-2": withOpacity("--color-bg-surface-2"),
          sidebar: withOpacity("--color-bg-sidebar"),
        },
      },
      textColor: {
        brand: {
          base: withOpacity("--color-text-base"),
          secondary: withOpacity("--color-text-secondary"),
        },
      },
      keyframes: {
        leftToaster: {
          "0%": { left: "-20rem" },
          "100%": { left: "0" },
        },
        rightToaster: {
          "0%": { right: "-20rem" },
          "100%": { right: "0" },
        },
      },
    },
    fontFamily: {
      custom: ["Inter", "sans-serif"],
    },
  },
};
