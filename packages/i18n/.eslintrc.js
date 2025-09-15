module.exports = {
  root: true,
  extends: ["@plane/eslint-config/library.js"],
  overrides: [
    {
      env: {
        jest: true,
        node: true,
      },
    },
  ],
};
