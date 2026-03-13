// ESLint plugin for Plane-specific lint rules
import noLegacyTokens from "./rules/no-legacy-tokens.js";

const plugin = {
  meta: {
    name: "eslint-plugin-plane",
    version: "0.0.1",
  },
  rules: {
    "no-legacy-tokens": noLegacyTokens,
  },
};

export default plugin;
