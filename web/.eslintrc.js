module.exports = {
  extends: ["next", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["react", "@typescript-eslint"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
    "prefer-const": "error",
    "no-irregular-whitespace": "error",
    "no-trailing-spaces": "error",
    "no-duplicate-imports": "error",
    "arrow-body-style": ["error", "as-needed"],
    "react/self-closing-comp": ["error", { component: true, html: true }],
    "@next/next/no-img-element": "off",
  },
};
