const defaultConfig = require("config/postcss.config");

module.exports = {
  ...defaultConfig,
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
