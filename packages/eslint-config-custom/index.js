module.exports = {
  extends: ["next", "turbo", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["react", "@typescript-eslint", "import"],
  settings: {
    next: {
      rootDir: ["web/", "space/", "packages/*/"],
    },
  },
  rules: {
    "prefer-const": "error",
    "no-irregular-whitespace": "error",
    "no-trailing-spaces": "error",
    "no-duplicate-imports": "error",
    "arrow-body-style": ["error", "as-needed"],
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-img-element": "off",
    "react/jsx-key": "error",
    "react/self-closing-comp": ["error", { component: true, html: true }],
    "react/jsx-boolean-value": "error",
    "react/jsx-no-duplicate-props": "error",
    "@typescript-eslint/no-unused-vars": ["error"],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-useless-empty-export": "error",
    "@typescript-eslint/prefer-ts-expect-error": "error",
    "@typescript-eslint/require-array-sort-compare": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: ["function", "variable"],
        format: ["camelCase", "snake_case", "UPPER_CASE", "PascalCase"],
      },
    ],
    "import/order": [
      "error",
      {
        groups: [["external", "builtin"], "internal", "parent", ["sibling"]],
        pathGroups: [
          {
            pattern: "react",
            group: "external",
            position: "before",
          },
          {
            pattern: "@headlessui/**",
            group: "external",
            position: "after",
          },
          {
            pattern: "lucide-react",
            group: "external",
            position: "after",
          },
          {
            pattern: "@plane/ui",
            group: "external",
            position: "after",
          },
          {
            pattern: "components/**",
            group: "internal",
          },
          {
            pattern: "constants/**",
            group: "internal",
          },
          {
            pattern: "contexts/**",
            group: "internal",
          },
          {
            pattern: "helpers/**",
            group: "internal",
          },
          {
            pattern: "hooks/**",
            group: "internal",
          },
          {
            pattern: "layouts/**",
            group: "internal",
          },
          {
            pattern: "lib/**",
            group: "internal",
          },
          {
            pattern: "services/**",
            group: "internal",
          },
          {
            pattern: "store/**",
            group: "internal",
          },
          {
            pattern: "@plane/types",
            group: "internal",
            position: "after",
          },
          {
            pattern: "lib/types",
            group: "internal",
            position: "after",
          },
          {
            pattern: "public/**",
            group: "internal",
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
