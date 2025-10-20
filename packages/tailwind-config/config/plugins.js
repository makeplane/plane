/**
 * Tailwind CSS plugins configuration
 * Includes external plugins and custom utility classes
 */

module.exports = [
  // External plugins
  require("tailwindcss-animate"),
  require("@tailwindcss/typography"),
  require("@tailwindcss/container-queries"),

  // Custom utilities plugin
  function ({ addUtilities }) {
    const newUtilities = {
      // Responsive horizontal padding for pages
      // Mobile screens
      ".px-page-x": {
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
      },
      // Medium screens (768px and up)
      "@media (min-width: 768px)": {
        ".px-page-x": {
          paddingLeft: "1.35rem",
          paddingRight: "1.35rem",
        },
      },

      // Hide scrollbar but keep functionality
      ".scrollbar-hide": {
        "-ms-overflow-style": "none" /* IE and Edge */,
        "scrollbar-width": "none" /* Firefox */,
        "&::-webkit-scrollbar": {
          display: "none" /* Chrome, Safari and Opera */,
        },
      },
    };

    addUtilities(newUtilities, ["responsive"]);
  },
];
