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
    ".agents/**",
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
      // react-hooks v7 "rules-of-hooks" includes React Compiler checks (39
      // pre-existing violations). These bypass severity settings — accepted as-is.
      // Fix by refactoring setState-in-effect patterns or pin react-hooks < v7.
      "no-console": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/no-children-prop": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // --- Downgraded to warn: mass pre-existing violations that are not
      // actionable without major refactoring. Threshold enforces zero new violations.
      // Re-promote to error individually as violations are cleaned up.
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/no-redundant-type-constituents": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      // --- Disabled: upstream packages (@plane/i18n, store hooks) lack proper
      // type declarations, causing cascading `any` throughout the codebase.
      // Re-enable individually as type coverage improves (see Approach B roadmap).
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/only-throw-error": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/restrict-plus-operands": "warn",
      "@typescript-eslint/prefer-promise-reject-errors": "warn",
      // --- a11y / promise / react-refresh: downgraded from plugin defaults
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/tabindex-no-positive": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/iframe-has-title": "warn",
      "promise/always-return": "warn",
      "promise/catch-or-return": "warn",
      "react-refresh/only-export-components": "warn",
      // --- JS base rules: pre-existing violations, downgraded to catch regressions via threshold
      "no-constant-binary-expression": "warn",
      "no-empty-pattern": "warn",
      "valid-typeof": "warn",
      "no-useless-catch": "warn",
      "no-prototype-builtins": "warn",
      "no-unsafe-optional-chaining": "warn",
      "no-empty": "warn",
      "react/no-unknown-property": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/no-for-in-array": "warn",
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
