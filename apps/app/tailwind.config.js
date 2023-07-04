function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) return `rgba(var(${variableName}), ${opacityValue})`;

    return `rgb(var(${variableName}))`;
  };
}

const convertToRGB = (variableName) => `rgb(var(${variableName}))`;

module.exports = {
  darkMode: "class",
  content: ["./pages/**/*.tsx", "./components/**/*.tsx", "./layouts/**/*.tsx", "./ui/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        brand: {
          accent: {
            50: convertToRGB("--color-accent-50"),
            100: convertToRGB("--color-accent-100"),
            200: convertToRGB("--color-accent-200"),
            300: convertToRGB("--color-accent-300"),
            400: convertToRGB("--color-accent-400"),
            500: convertToRGB("--color-accent-500"),
            600: convertToRGB("--color-accent-600"),
            700: convertToRGB("--color-accent-700"),
            800: convertToRGB("--color-accent-800"),
            900: convertToRGB("--color-accent-900"),
            DEFAULT: convertToRGB("--color-accent-500"),
          },
          bg: {
            50: convertToRGB("--color-bg-50"),
            100: convertToRGB("--color-bg-100"),
            200: convertToRGB("--color-bg-200"),
            300: convertToRGB("--color-bg-300"),
            400: convertToRGB("--color-bg-400"),
            500: convertToRGB("--color-bg-500"),
            600: convertToRGB("--color-bg-600"),
            700: convertToRGB("--color-bg-700"),
            800: convertToRGB("--color-bg-800"),
            900: convertToRGB("--color-bg-900"),
            DEFAULT: convertToRGB("--color-bg-500"),
          },
          base: withOpacity("--color-bg-base"),
        },
      },
      borderColor: {
        brand: {
          base: withOpacity("--color-bg-400"),
          "surface-1": withOpacity("--color-bg-surface-1"),
          "surface-2": withOpacity("--color-bg-surface-2"),
        },
      },
      backgroundColor: {
        brand: {
          base: withOpacity("--color-bg-500"),
          "surface-1": withOpacity("--color-bg-700"),
          "surface-2": withOpacity("--color-bg-900"),
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
