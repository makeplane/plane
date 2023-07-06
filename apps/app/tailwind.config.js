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
        custom: {
          primary: {
            10: convertToRGB("--color-accent-10"),
            20: convertToRGB("--color-accent-20"),
            30: convertToRGB("--color-accent-30"),
            40: convertToRGB("--color-accent-40"),
            50: convertToRGB("--color-accent-50"),
            60: convertToRGB("--color-accent-60"),
            70: convertToRGB("--color-accent-70"),
            80: convertToRGB("--color-accent-80"),
            90: convertToRGB("--color-accent-90"),
            100: convertToRGB("--color-accent-100"),
            200: convertToRGB("--color-accent-200"),
            300: convertToRGB("--color-accent-300"),
            400: convertToRGB("--color-accent-400"),
            500: convertToRGB("--color-accent-500"),
            600: convertToRGB("--color-accent-600"),
            700: convertToRGB("--color-accent-700"),
            800: convertToRGB("--color-accent-800"),
            900: convertToRGB("--color-accent-900"),
            950: convertToRGB("--color-accent-950"),
            DEFAULT: convertToRGB("--color-accent-100"),
          },
          background: {
            10: convertToRGB("--color-bg-10"),
            20: convertToRGB("--color-bg-20"),
            30: convertToRGB("--color-bg-30"),
            40: convertToRGB("--color-bg-40"),
            50: convertToRGB("--color-bg-50"),
            60: convertToRGB("--color-bg-60"),
            70: convertToRGB("--color-bg-70"),
            80: convertToRGB("--color-bg-80"),
            90: convertToRGB("--color-bg-90"),
            100: convertToRGB("--color-bg-100"),
            200: convertToRGB("--color-bg-200"),
            300: convertToRGB("--color-bg-300"),
            400: convertToRGB("--color-bg-400"),
            500: convertToRGB("--color-bg-500"),
            600: convertToRGB("--color-bg-600"),
            700: convertToRGB("--color-bg-700"),
            800: convertToRGB("--color-bg-800"),
            900: convertToRGB("--color-bg-900"),
            950: convertToRGB("--color-bg-950"),
            DEFAULT: convertToRGB("--color-bg-100"),
          },
          text: {
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
            400: convertToRGB("--color-text-400"),
            500: convertToRGB("--color-text-500"),
            600: convertToRGB("--color-text-600"),
            700: convertToRGB("--color-text-700"),
            800: convertToRGB("--color-text-800"),
            900: convertToRGB("--color-text-900"),
            950: convertToRGB("--color-text-950"),
            DEFAULT: convertToRGB("--color-text-500"),
          },
          sidebar: {
            background: {
              10: convertToRGB("--color-sidebar-bg-10"),
              20: convertToRGB("--color-sidebar-bg-20"),
              30: convertToRGB("--color-sidebar-bg-30"),
              40: convertToRGB("--color-sidebar-bg-40"),
              50: convertToRGB("--color-sidebar-bg-50"),
              60: convertToRGB("--color-sidebar-bg-60"),
              70: convertToRGB("--color-sidebar-bg-70"),
              80: convertToRGB("--color-sidebar-bg-80"),
              90: convertToRGB("--color-sidebar-bg-90"),
              100: convertToRGB("--color-sidebar-bg-100"),
              200: convertToRGB("--color-sidebar-bg-200"),
              300: convertToRGB("--color-sidebar-bg-300"),
              400: convertToRGB("--color-sidebar-bg-400"),
              500: convertToRGB("--color-sidebar-bg-500"),
              600: convertToRGB("--color-sidebar-bg-600"),
              700: convertToRGB("--color-sidebar-bg-700"),
              800: convertToRGB("--color-sidebar-bg-800"),
              900: convertToRGB("--color-sidebar-bg-900"),
              950: convertToRGB("--color-sidebar-bg-950"),
              DEFAULT: convertToRGB("--color-sidebar-bg-100"),
            },
            text: {
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
              950: convertToRGB("--color-sidebar-text-950"),
              DEFAULT: convertToRGB("--color-sidebar-text-100"),
            },
          },
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
