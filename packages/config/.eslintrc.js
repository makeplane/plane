module.exports = {
  extends: ["next", "turbo", "prettier"],
  settings: {
    next: {
      rootDir: ["apps/*/", "packages/*/"],
    },
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "no-unused-vars": "warn",
    "prefer-const": "error",
    "no-irregular-whitespace": "error",
    "no-trailing-spaces": "error",
    "no-empty-function": "error",
    "no-duplicate-imports": "error",
    "arrow-body-style": ["error", "as-needed"],
    "react/self-closing-comp": ["error", { component: true, html: true }],
    "import/order": [
      "error",
      {
        groups: ["external", "parent", "sibling", "index", "object", "type"],
        pathGroups: [
          {
            pattern: "@/**/**",
            group: "parent",
            position: "before",
          },
        ],
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        patterns: ["../"],
      },
    ],
  },
};
