import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintTurboPlugin from "eslint-config-turbo";
import eslintTypescript from "typescript-eslint";
import onlyWarnPlugin from "eslint-plugin-only-warn";

/**
 * @type {import("eslint").Linter.Config}
 */
export const configs = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...eslintTypescript.configs.recommended,
  {
    plugins: {
      turbo: eslintTurboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn: onlyWarnPlugin,
    },
  },
  {
    ignores: ["dist/**", "node_modules/"],
  },
];
