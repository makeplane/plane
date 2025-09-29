/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharedConfig = require("@plane/tailwind-config/tailwind.config.js");

module.exports = {
  presets: [sharedConfig],
  content: {
    relative: true,
    files: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./core/**/*.{js,ts,jsx,tsx}",
      "./ce/**/*.{js,ts,jsx,tsx}",
      "./ee/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.tsx",
      "./constants/**/*.{js,ts,jsx,tsx}",
      "./layouts/**/*.tsx",
      "./helpers/**/*.{js,ts,jsx,tsx}",
      "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
      "../../packages/propel/src/**/*.{js,ts,jsx,tsx}",
      "../../packages/editor/src/**/*.{js,ts,jsx,tsx}",
      "!../../packages/ui/**/*.stories{js,ts,jsx,tsx}",
    ],
  },
};
