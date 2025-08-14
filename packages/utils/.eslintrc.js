import libraryConfig from "@plane/eslint-config/library.js";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["node_modules/", "dist/"],
  },
  ...libraryConfig,
];
