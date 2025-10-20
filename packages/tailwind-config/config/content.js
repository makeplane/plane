/**
 * Content paths configuration for Tailwind CSS
 * Defines which files Tailwind should scan for class names
 */

module.exports = {
  relative: true,
  files: [
    // App directories
    "./app/**/*.{js,ts,jsx,tsx}",
    "./core/**/*.{js,ts,jsx,tsx}",
    "./ce/**/*.{js,ts,jsx,tsx}",
    "./ee/**/*.{js,ts,jsx,tsx}",

    // Component directories
    "./components/**/*.tsx",
    "./constants/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.tsx",
    "./pages/**/*.tsx",
    "./ui/**/*.tsx",

    // Shared packages
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/propel/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/editor/src/**/*.{js,ts,jsx,tsx}",

    // Exclude Storybook files
    "!../../packages/ui/**/*.stories{js,ts,jsx,tsx}",
  ],
};
