import tsParser from "@typescript-eslint/parser"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  ...compat.extends("eslint:recommended", "prettier"),
  {
    languageOptions: {
      parser: tsParser
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
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/prefer-ts-expect-error": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: ["function", "variable"],
          format: ["camelCase", "snake_case", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow"
        }
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling"],
          pathGroupsExcludedImportTypes: ["builtin", "internal", "react"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ]
    }
  }
]
