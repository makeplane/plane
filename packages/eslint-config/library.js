const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["prettier", "plugin:@typescript-eslint/recommended"],
  plugins: ["react", "@typescript-eslint", "import"],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  rules: {
    "no-useless-escape": "off",
    "prefer-const": "error",
    "no-irregular-whitespace": "error",
    "no-trailing-spaces": "error",
    "no-duplicate-imports": "error",
    "no-useless-catch": "warn",
    "no-case-declarations": "error",
    "no-undef": "error",
    "no-unreachable": "error",
    "arrow-body-style": ["error", "as-needed"],
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-img-element": "off",
    "react/jsx-key": "error",
    "react/self-closing-comp": ["error", { component: true, html: true }],
    "react/jsx-boolean-value": "error",
    "react/jsx-no-duplicate-props": "error",
    // "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-expressions": "warn",
    "@typescript-eslint/no-unused-vars": ["warn"],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-useless-empty-export": "error",
    "@typescript-eslint/prefer-ts-expect-error": "warn",
  },
  ignorePatterns: [".*.js", "node_modules/", "dist/"],
};
