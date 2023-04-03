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
      },
      backgroundColor: {
        skin: {
          default: withOpacity("--color-bg-default"),
          surface: withOpacity("--color-bg-surface"),
          primary: withOpacity("--color-primary"),
          secondary: withOpacity("---color-secondary"),
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
