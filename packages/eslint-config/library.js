import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: [".*.js", "node_modules/", "dist/"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        React: "readonly",
        JSX: "readonly",
      },
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project,
      },
    },
    plugins: {
      react: "eslint-plugin-react",
      "react-hooks": "eslint-plugin-react-hooks",
      "@typescript-eslint": "@typescript-eslint/eslint-plugin",
      import: "eslint-plugin-import",
    },
    extends: ["prettier", "plugin:@typescript-eslint/recommended"],
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
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/prefer-ts-expect-error": "warn",
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling"],
          pathGroups: [
            {
              pattern: "@plane/**",
              group: "external",
              position: "after",
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
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
  },
];
