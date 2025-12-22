// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import promisePlugin from "eslint-plugin-promise";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";
import turboPlugin from "eslint-plugin-turbo";
import vitestPlugin from "@vitest/eslint-plugin";
// import storybookPlugin from "eslint-plugin-storybook";

import prettierConfig from "eslint-config-prettier/flat";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    "**/.cache/**",
    "**/.env.*",
    "**/.env",
    "**/.next/**",
    "**/.react-router/**",
    "**/.storybook/**",
    "**/.turbo/**",
    "**/.vite/**",
    "**/*.config.{js,mjs,cjs,ts}",
    "**/build/**",
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**",
    "**/public/**",
  ]),
  eslint.configs.recommended,
  // @ts-expect-error promise plugin has no flat type definitions
  promisePlugin.configs["flat/recommended"],
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooksPlugin.configs.flat.recommended,
  jsxA11yPlugin.flatConfigs.recommended,
  reactRefreshPlugin.configs.recommended,
  reactRefreshPlugin.configs.vite,
  turboPlugin.configs["flat/recommended"],
  tseslint.configs.recommendedTypeChecked,
  vitestPlugin.configs.recommended,
  // TODO: enable storybook linting once issues are resolved
  // storybookPlugin.configs["flat/recommended"],
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // @ts-ignore
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/no-duplicate-type-constituents": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-for-in-array": "warn",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/no-redundant-type-constituents": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-enum-comparison": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/only-throw-error": "warn",
      "@typescript-eslint/prefer-promise-reject-errors": "warn",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/restrict-plus-operands": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/unbound-method": "warn",
      "jsdoc/require-jsdoc": "off",
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/iframe-has-title": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/tabindex-no-positive": "warn",
      "no-cond-assign": "warn",
      "no-constant-binary-expression": "warn",
      "no-empty-pattern": "warn",
      "no-empty": "warn",
      "no-extra-boolean-cast": "warn",
      "no-prototype-builtins": "warn",
      "no-unsafe-optional-chaining": "warn",
      "no-useless-catch": "warn",
      "no-useless-escape": "warn",
      "promise/always-return": "warn",
      "promise/catch-or-return": "warn",
      "promise/param-names": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowExportNames: ["meta", "links", "headers", "loader", "action"] },
      ],
      "react/display-name": "warn",
      "react/jsx-no-target-blank": "warn",
      "react/no-unknown-property": "warn",
      "react/prop-types": "off",
      "valid-typeof": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
    settings: {
      "import/ignore": ["next/link", "next/navigation", "next/script"],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "{apps,packages}/*/tsconfig.json",
        },
      },
      "import/internal-regex": "^@plane/",
    },
    rules: {
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/no-unresolved": ["error", { ignore: ["next/link", "next/navigation", "next/script"] }],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  prettierConfig,
]);
