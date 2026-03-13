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
import planePlugin from "eslint-plugin-plane";
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
    ".claude/**",
    ".agent/**",
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
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      plane: planePlugin,
      vitest: vitestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        projectService: {
          allowDefaultProject: [".eslintrc.*"],
        },
      },
    },
    rules: {
      "no-console": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/no-children-prop": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "import/no-unresolved": "off",
      "plane/no-legacy-tokens": "error",
      "promise/no-nesting": "warn",
      "promise/no-promise-in-callback": "warn",
    },
    settings: {
      react: {
        version: "18.3",
      },
    },
  },
  prettierConfig,
]);
