module.exports = {
  root: true,
  extends: ["@plane/eslint-config/next.js"],
  rules: {
    "no-duplicate-imports": "off",
    "import/no-duplicates": ["error", { "prefer-inline": false }],
    "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
    "@typescript-eslint/no-import-type-side-effects": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
        disallowTypeAnnotations: false,
      },
    ],
  },
};
