import type { Plugin } from "@opencode-ai/plugin";

const { checkScoutBlock } = require("./lib/scout-checker.cjs");

/**
 * Scout Block Plugin - Prevent access to heavy directories
 *
 * Blocks node_modules, dist, .git, etc. to prevent context overflow.
 * Equivalent to Claude's scout-block.cjs hook.
 */
export const ScoutBlockPlugin: Plugin = async ({ directory }) => {
  const ckignorePath = `${directory}/.opencode/.ckignore`;
  const claudeDir = `${directory}/.opencode`;

  return {
    "tool.execute.before": async (input: any, output: any) => {
      const result = checkScoutBlock({
        toolName: input.tool,
        toolInput: output.args,
        options: { ckignorePath, claudeDir }
      });

      if (result.blocked) {
        let errorMsg = `[Scout Block] Access to '${result.path}' blocked.\n`;
        errorMsg += `Pattern: ${result.pattern}\n`;

        if (result.isBroadPattern && result.suggestions?.length) {
          errorMsg += `\nSuggested alternatives:\n`;
          result.suggestions.forEach((s: string) => errorMsg += `  - ${s}\n`);
        }

        errorMsg += `\nTo allow, add '!${result.pattern}' to .opencode/.ckignore`;

        throw new Error(errorMsg);
      }
    }
  };
};

export default ScoutBlockPlugin;
