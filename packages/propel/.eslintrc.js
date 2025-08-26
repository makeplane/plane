/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@plane/eslint-config/library.js", "plugin:storybook/recommended"],
  parser: "@typescript-eslint/parser",
  rules: {
    "import/order": [
      "warn",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling"],
        pathGroups: [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
          {
            pattern: "@plane/**",
            group: "external",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin", "internal", "react"],
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
  },
};
