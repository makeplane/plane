import libraryConfig from "@plane/eslint-config/next.js";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["node_modules/", "dist/", ".next/"],
  },
  ...libraryConfig,
];
