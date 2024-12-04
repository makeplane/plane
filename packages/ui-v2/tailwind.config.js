/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        white: "var(--white)",
        grey: {
          50: "var(--grey-50)",
          100: "var(--grey-100)",
          200: "var(--grey-200)",
          300: "var(--grey-300)",
          400: "var(--grey-400)",
          500: "var(--grey-500)",
          600: "var(--grey-600)",
          700: "var(--grey-700)",
          800: "var(--grey-800)",
          900: "var(--grey-900)",
          950: "var(--grey-950)",
        },
        black: "var(--black)",

        border: {
          neutral: {
            subtle: "var(--grey-100)",
            DEFAULT: "var(--grey-200)",
            emphasis: "var(--grey-300)",
          },
        },
      },
    },
  },
  plugins: [],
};
