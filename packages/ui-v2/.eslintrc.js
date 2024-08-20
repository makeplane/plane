/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@plane/ui-v2/react-internal.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
