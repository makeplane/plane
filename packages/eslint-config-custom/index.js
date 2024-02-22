module.exports = {
  extends: ["next", "turbo", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["react", "@typescript-eslint"],
  settings: {
    next: {
      rootDir: ["web/", "space/", "packages/*/"],
    },
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "error",
    "prefer-const": "error",
    "no-irregular-whitespace": "error",
    "no-trailing-spaces": "error",
    "no-duplicate-imports": "error",
    "arrow-body-style": ["error", "as-needed"],
    "react/self-closing-comp": ["error", { component: true, html: true }],
    "@next/next/no-img-element": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
    "react/jsx-boolean-value": "error",
    "react/jsx-no-duplicate-props": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-useless-empty-export": "error",
    // "@typescript-eslint/no-array-delete": "error",
    // "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/prefer-ts-expect-error": "error",
    "@typescript-eslint/require-array-sort-compare": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: ["function", "variable"],
        format: ["camelCase", "snake_case", "UPPER_CASE", "PascalCase"],
      },
    ],
  },
};
