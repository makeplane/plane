#!/usr/bin/env node
/**
 * scout-checker.cjs - Facade for scout-block modules
 *
 * Provides unified interface to scout-block/* modules for reuse in both
 * Claude hooks and OpenCode plugins.
 *
 * @module scout-checker
 */

const path = require('path');

// Import scout-block modules
const { loadPatterns, createMatcher, matchPath } = require('../scout-block/pattern-matcher.cjs');
const { extractFromToolInput } = require('../scout-block/path-extractor.cjs');
const { detectBroadPatternIssue } = require('../scout-block/broad-pattern-detector.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

// Build command allowlist - these are allowed even if they contain blocked paths
// Handles flags and filters: npm build, pnpm --filter web run build, yarn workspace app build
const BUILD_COMMAND_PATTERN = /^(npm|pnpm|yarn|bun)\s+([^\s]+\s+)*(run\s+)?(build|test|lint|dev|start|install|ci|add|remove|update|publish|pack|init|create|exec)/;

// Tool commands - JS/TS, Go, Rust, Java, .NET, containers, IaC, Python, Ruby, PHP, Deno, Elixir
const TOOL_COMMAND_PATTERN = /^(\.\/)?(npx|pnpx|bunx|tsc|esbuild|vite|webpack|rollup|turbo|nx|jest|vitest|mocha|eslint|prettier|go|cargo|make|mvn|mvnw|gradle|gradlew|dotnet|docker|podman|kubectl|helm|terraform|ansible|bazel|cmake|sbt|flutter|swift|ant|ninja|meson|python3?|pip|uv|deno|bundle|rake|gem|php|composer|ruby|mix|elixir)/;

// Allow execution from .venv/bin/ or venv/bin/ (Unix) and .venv/Scripts/ or venv/Scripts/ (Windows)
const VENV_EXECUTABLE_PATTERN = /(^|[\/\\])\.?venv[\/\\](bin|Scripts)[\/\\]/;

// Allow Python venv creation commands (cross-platform):
// - python/python3 -m venv (Unix/macOS/Windows)
// - py -m venv (Windows py launcher, supports -3, -3.11, etc.)
// - uv venv (fast Rust-based Python package manager)
// - virtualenv (legacy but still widely used)
const VENV_CREATION_PATTERN = /^(python3?|py)\s+(-[\w.]+\s+)*-m\s+venv\s+|^uv\s+venv(\s|$)|^virtualenv\s+/;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strip leading ENV variable assignments and command wrappers (sudo, env, etc.)
 * e.g., "NODE_ENV=production npm run build" → "npm run build"
 * @param {string} command - The command to strip
 * @returns {string}
 */
function stripCommandPrefix(command) {
  if (!command || typeof command !== 'string') return command;
  let stripped = command.trim();
  // Strip env var assignments (KEY=VALUE KEY2=VALUE2 ...)
  stripped = stripped.replace(/^(\w+=\S+\s+)+/, '');
  // Strip common command wrappers (one level)
  stripped = stripped.replace(/^(sudo|env|nice|nohup|time|timeout)\s+/, '');
  // Strip env vars again (sudo env VAR=x cmd)
  stripped = stripped.replace(/^(\w+=\S+\s+)+/, '');
  return stripped.trim();
}

/**
 * Check if a command is a build/tooling command (should be allowed)
 * @param {string} command - The command to check
 * @returns {boolean}
 */
function isBuildCommand(command) {
  if (!command || typeof command !== 'string') return false;
  const trimmed = command.trim();
  return BUILD_COMMAND_PATTERN.test(trimmed) || TOOL_COMMAND_PATTERN.test(trimmed);
}

/**
 * Split a compound command into sub-commands on &&, ||, and ;.
 * Does NOT split on newlines — newlines in command strings are typically
 * heredoc bodies or multiline strings, not compound operators.
 * Does not handle operators inside quoted strings (extremely rare in practice).
 *
 * @param {string} command - The compound command string
 * @returns {string[]} Array of sub-commands (trimmed, non-empty)
 */
function splitCompoundCommand(command) {
  if (!command || typeof command !== 'string') return [];
  return command.split(/\s*(?:&&|\|\||;)\s*/).filter(cmd => cmd && cmd.trim().length > 0);
}

/**
 * Unwrap shell executor wrappers (bash -c "...", sh -c '...', eval "...").
 * Returns the inner command string for re-processing.
 * @param {string} command - The command to unwrap
 * @returns {string} Inner command, or original if not a shell executor
 */
function unwrapShellExecutor(command) {
  if (!command || typeof command !== 'string') return command;
  const match = command.trim().match(
    /^(?:(?:bash|sh|zsh)\s+-c|eval)\s+["'](.+)["']\s*$/
  );
  return match ? match[1] : command;
}

/**
 * Check if command executes from a .venv bin directory
 * @param {string} command - The command to check
 * @returns {boolean}
 */
function isVenvExecutable(command) {
  if (!command || typeof command !== 'string') return false;
  return VENV_EXECUTABLE_PATTERN.test(command);
}

/**
 * Check if command creates a Python virtual environment
 * @param {string} command - The command to check
 * @returns {boolean}
 */
function isVenvCreationCommand(command) {
  if (!command || typeof command !== 'string') return false;
  return VENV_CREATION_PATTERN.test(command.trim());
}

/**
 * Check if command should be allowed (build, venv executable, or venv creation)
 * Strips ENV prefixes and command wrappers before checking.
 * @param {string} command - The command to check
 * @returns {boolean}
 */
function isAllowedCommand(command) {
  const stripped = stripCommandPrefix(command);
  return isBuildCommand(stripped) || isVenvExecutable(stripped) || isVenvCreationCommand(stripped);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a tool call accesses blocked directories or uses overly broad patterns
 *
 * @param {Object} params
 * @param {string} params.toolName - Name of tool (Bash, Glob, Read, etc.)
 * @param {Object} params.toolInput - Tool input with file_path, path, pattern, command
 * @param {Object} [params.options]
 * @param {string} [params.options.ckignorePath] - Path to .ckignore file
 * @param {string} [params.options.claudeDir] - Path to .claude or .opencode directory
 * @param {boolean} [params.options.checkBroadPatterns] - Check for overly broad glob patterns (default: true)
 * @returns {{
 *   blocked: boolean,
 *   path?: string,
 *   pattern?: string,
 *   reason?: string,
 *   isBroadPattern?: boolean,
 *   suggestions?: string[],
 *   isAllowedCommand?: boolean
 * }}
 */
function checkScoutBlock({ toolName, toolInput, options = {} }) {
  const {
    ckignorePath,
    claudeDir = path.join(process.cwd(), '.claude'),
    checkBroadPatterns = true
  } = options;

  // Unwrap shell executor wrappers (bash -c "...", eval "...")
  // so the inner command gets properly analyzed
  if (toolInput.command) {
    const unwrapped = unwrapShellExecutor(toolInput.command);
    if (unwrapped !== toolInput.command) {
      toolInput = { ...toolInput, command: unwrapped };
    }
  }

  // For Bash commands, split compound commands (&&, ||, ;) and check
  // each sub-command independently. This prevents "echo msg && npm run build"
  // from being blocked due to "build" token in the allowed build sub-command.
  // Must split BEFORE isAllowedCommand because BUILD_COMMAND_PATTERN has no end
  // anchor and would match the prefix of "npm run build && cat dist/file.js".
  if (toolInput.command) {
    const subCommands = splitCompoundCommand(toolInput.command);
    const nonAllowed = subCommands.filter(cmd => !isAllowedCommand(cmd.trim()));
    if (nonAllowed.length === 0) {
      return { blocked: false, isAllowedCommand: true };
    }
    // Only extract paths from non-allowed sub-commands
    if (nonAllowed.length < subCommands.length) {
      toolInput = { ...toolInput, command: nonAllowed.join(' ; ') };
    }
  }

  // Check for overly broad glob patterns (Glob tool)
  if (checkBroadPatterns && (toolName === 'Glob' || toolInput.pattern)) {
    const broadResult = detectBroadPatternIssue(toolInput);
    if (broadResult.blocked) {
      return {
        blocked: true,
        isBroadPattern: true,
        pattern: toolInput.pattern,
        reason: broadResult.reason || 'Pattern too broad - may fill context with too many files',
        suggestions: broadResult.suggestions || []
      };
    }
  }

  // Resolve .ckignore path
  const resolvedCkignorePath = ckignorePath || path.join(claudeDir, '.ckignore');

  // Load patterns and create matcher
  const patterns = loadPatterns(resolvedCkignorePath);
  const matcher = createMatcher(patterns);

  // Extract paths from tool input
  const extractedPaths = extractFromToolInput(toolInput);

  // If no paths extracted, allow operation
  if (extractedPaths.length === 0) {
    return { blocked: false };
  }

  // Check each path against patterns
  for (const extractedPath of extractedPaths) {
    const result = matchPath(matcher, extractedPath);
    if (result.blocked) {
      return {
        blocked: true,
        path: extractedPath,
        pattern: result.pattern,
        reason: `Path matches blocked pattern: ${result.pattern}`
      };
    }
  }

  // All paths allowed
  return { blocked: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main entry point
  checkScoutBlock,

  // Command checkers
  isBuildCommand,
  isVenvExecutable,
  isVenvCreationCommand,
  isAllowedCommand,
  splitCompoundCommand,
  stripCommandPrefix,
  unwrapShellExecutor,

  // Re-export scout-block modules for direct access
  loadPatterns,
  createMatcher,
  matchPath,
  extractFromToolInput,
  detectBroadPatternIssue,

  // Patterns (for testing)
  BUILD_COMMAND_PATTERN,
  TOOL_COMMAND_PATTERN,
  VENV_EXECUTABLE_PATTERN,
  VENV_CREATION_PATTERN
};
