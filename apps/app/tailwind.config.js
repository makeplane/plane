function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) return `rgba(var(${variableName}), ${opacityValue})`;

    return `rgb(var(${variableName}))`;
  };
}

function convertToRGB(variableName) {
  return `rgb(var(${variableName}))`;
}

module.exports = {
  darkMode: "class",
  content: ["./pages/**/*.tsx", "./components/**/*.tsx", "./layouts/**/*.tsx", "./ui/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        brand: {
          accent: withOpacity("--color-accent"),
          base: withOpacity("--color-bg-base"),
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
          backdrop: "#131313",
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
      typography: ({ theme }) => ({
        brand: {
          css: {
            "--tw-prose-body": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-p": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-headings": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-lead": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-links": `${convertToRGB("--color-accent")}`,
            "--tw-prose-bold": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-counters": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-bullets": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-hr": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-quotes": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-quote-borders": `${convertToRGB("--color-border")}`,
            "--tw-prose-code": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-pre-code": `${convertToRGB("--color-text-base")}`,
            "--tw-prose-pre-bg": `${convertToRGB("--color-bg-base")}`,
            "--tw-prose-th-borders": `${convertToRGB("--color-border")}`,
            "--tw-prose-td-borders": `${convertToRGB("--color-border")}`,
          },
        },
      }),
    },
    fontFamily: {
      custom: ["Inter", "sans-serif"],
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
