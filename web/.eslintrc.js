module.exports = {
  root: true,
  extends: ["custom"],
  parser: "@typescript-eslint/parser",
  settings: {
    "import/resolver": {
      typescript: {},
      node: {
        moduleDirectory: ["node_modules", "."],
      },
    },
  },
  rules: {
    // "import/order": [
    //   "error",
    //   {
    //     groups: ["builtin", "external", "internal", "parent", "sibling"],
    //     pathGroups: [
    //       {
    //         pattern: "react",
    //         group: "external",
    //         position: "before",
    //       },
    //       {
    //         pattern: "@headlessui/**",
    //         group: "external",
    //         position: "after",
    //       },
    //       {
    //         pattern: "lucide-react",
    //         group: "external",
    //         position: "after",
    //       },
    //       {
    //         pattern: "@plane/ui",
    //         group: "external",
    //         position: "after",
    //       },
    //       {
    //         pattern: "components/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "constants/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "contexts/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "helpers/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "hooks/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "layouts/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "lib/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "services/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "store/**",
    //         group: "internal",
    //         position: "before",
    //       },
    //       {
    //         pattern: "@plane/types",
    //         group: "internal",
    //         position: "after",
    //       },
    //       {
    //         pattern: "lib/types",
    //         group: "internal",
    //         position: "after",
    //       },
    //     ],
    //     pathGroupsExcludedImportTypes: ["builtin", "internal", "react"],
    //     alphabetize: {
    //       order: "asc",
    //       caseInsensitive: true,
    //     },
    //   },
    // ],
  },
};
