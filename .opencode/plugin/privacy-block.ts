import type { Plugin } from "@opencode-ai/plugin";

// Import shared CJS module
const { checkPrivacy } = require("./lib/privacy-checker.cjs");

/**
 * Privacy Block Plugin - Block access to sensitive files
 *
 * Equivalent to Claude's privacy-block.cjs hook.
 * Blocks .env, credentials, keys unless explicitly approved.
 */
export const PrivacyBlockPlugin: Plugin = async ({ directory }) => {
  return {
    "tool.execute.before": async (input: any, output: any) => {
      const result = checkPrivacy({
        toolName: input.tool,
        toolInput: output.args,
        options: { configDir: `${directory}/.opencode` }
      });

      if (result.blocked && !result.approved) {
        throw new Error(
          `[Privacy Block] Access to ${result.filePath} requires approval.\n` +
          `File may contain sensitive data (API keys, passwords).\n` +
          `Reason: ${result.reason}`
        );
      }
    }
  };
};

export default PrivacyBlockPlugin;
