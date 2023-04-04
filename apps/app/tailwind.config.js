function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
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
        skin: {
          accent: withOpacity("--color-accent-base"),
        },
      },
      borderColor: {
        skin: {
          base: withOpacity("--color-border-base"),
        },
      },
      backgroundColor: {
        skin: {
          base: withOpacity("--color-bg-base"),
          "surface-1": withOpacity("--color-bg-surface-1"),
          "surface-2": withOpacity("--color-bg-surface-2"),
        },
      },
      textColor: {
        skin: {
          base: withOpacity("--color-text-base"),
          "muted-1": withOpacity("--color-text-muted-1"),
          "muted-2": withOpacity("--color-text-muted-2"),
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
