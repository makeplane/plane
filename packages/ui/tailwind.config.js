// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require("@plane/tailwind-config/tailwind.config.js");

config.content.files = ["./src/**/*.{js,ts,jsx,tsx}"];

module.exports = config;
