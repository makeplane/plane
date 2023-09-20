const sharedConfig = require("tailwind-config-custom/tailwind.config.js");

module.exports = {
  // prefix ui lib classes to avoid conflicting with the app
  ...sharedConfig,
};
