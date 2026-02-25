#!/usr/bin/env node
/**
 * scout-block.cjs - Cross-platform hook for blocking directory access
 *
 * Blocks access to directories listed in .claude/.ckignore
 * Uses gitignore-spec compliant pattern matching via 'ignore' package
 *
 * Blocking Rules:
 * - File paths: Blocks any file_path/path/pattern containing blocked directories
 * - Bash commands: Blocks directory access (cd, ls, cat, etc.) but ALLOWS build commands
 *   - Blocked: cd node_modules, ls packages/web/node_modules, cat dist/file.js
 *   - Allowed: npm build, go build, cargo build, make, mvn, gradle, docker build, kubectl, terraform
 *
 * Configuration:
 * - Edit .claude/.ckignore to customize blocked patterns (one per line, # for comments)
 * - Supports negation patterns (!) to allow specific paths
 *
 * Exit Codes:
 * - 0: Command allowed
 * - 2: Command blocked
 *
 * Core logic extracted to lib/scout-checker.cjs for OpenCode plugin reuse.
 */

const fs = require('fs');
const path = require('path');

// Import shared scout checking logic
const {
  checkScoutBlock,
  isBuildCommand,
  isVenvExecutable,
  isAllowedCommand
} = require('./lib/scout-checker.cjs');
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('scout-block')) {
  process.exit(0);
}

// Import formatters (kept local as they're Claude-specific output)
const { formatBlockedError } = require('./scout-block/error-formatter.cjs');
const { formatBroadPatternError } = require('./scout-block/broad-pattern-detector.cjs');

try {
  // Read stdin synchronously
  const hookInput = fs.readFileSync(0, 'utf-8');

  // Validate input not empty
  if (!hookInput || hookInput.trim().length === 0) {
    console.error('ERROR: Empty input');
    process.exit(2);
  }

  // Parse JSON
  let data;
  try {
    data = JSON.parse(hookInput);
  } catch (parseError) {
    // Fail-open for unparseable input
    console.error('WARN: JSON parse failed, allowing operation');
    process.exit(0);
  }

  // Validate structure
  if (!data.tool_input || typeof data.tool_input !== 'object') {
    // Fail-open for invalid structure
    console.error('WARN: Invalid JSON structure, allowing operation');
    process.exit(0);
  }

  const toolInput = data.tool_input;
  const toolName = data.tool_name || 'unknown';
  const claudeDir = path.dirname(__dirname); // Go up from hooks/ to .claude/

  // Use shared scout checker
  const result = checkScoutBlock({
    toolName,
    toolInput,
    options: {
      claudeDir,
      ckignorePath: path.join(claudeDir, '.ckignore'),
      checkBroadPatterns: true
    }
  });

  // Handle allowed commands
  if (result.isAllowedCommand) {
    process.exit(0);
  }

  // Handle broad pattern blocks
  if (result.blocked && result.isBroadPattern) {
    const errorMsg = formatBroadPatternError({
      blocked: true,
      reason: result.reason,
      suggestions: result.suggestions
    }, claudeDir);
    console.error(errorMsg);
    process.exit(2);
  }

  // Handle pattern blocks
  if (result.blocked) {
    const errorMsg = formatBlockedError({
      path: result.path,
      pattern: result.pattern,
      tool: toolName,
      claudeDir: claudeDir
    });
    console.error(errorMsg);
    process.exit(2);
  }

  // All paths allowed
  process.exit(0);

} catch (error) {
  // Fail-open for unexpected errors
  console.error('WARN: Hook error, allowing operation -', error.message);
  process.exit(0);
}
