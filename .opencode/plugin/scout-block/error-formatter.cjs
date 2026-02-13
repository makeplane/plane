#!/usr/bin/env node
/**
 * error-formatter.cjs - Rich, actionable error messages for scout-block
 *
 * Follows CLI UX best practices: Problem + Reason + Solution
 * Supports ANSI colors with NO_COLOR env var respect.
 */

const path = require('path');

// ANSI color codes
const COLORS = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  reset: '\x1b[0m'
};

/**
 * Check if terminal supports colors
 * Respects NO_COLOR standard and FORCE_COLOR
 *
 * @returns {boolean}
 */
function supportsColor() {
  // Respect NO_COLOR standard (https://no-color.org/)
  if (process.env.NO_COLOR !== undefined) return false;

  // Respect FORCE_COLOR
  if (process.env.FORCE_COLOR !== undefined) return true;

  // Check if stderr is TTY (we output errors to stderr)
  return process.stderr.isTTY || false;
}

/**
 * Apply color to text if supported
 *
 * @param {string} text - Text to colorize
 * @param {string} color - Color name from COLORS
 * @returns {string}
 */
function colorize(text, color) {
  if (!supportsColor()) return text;
  const colorCode = COLORS[color] || '';
  return `${colorCode}${text}${COLORS.reset}`;
}

/**
 * Get .ckignore config path
 *
 * @param {string} claudeDir - Path to .claude directory
 * @returns {string}
 */
function formatConfigPath(claudeDir) {
  if (claudeDir) {
    return path.join(claudeDir, '.ckignore');
  }
  return '.claude/.ckignore';
}

/**
 * Format a blocked path error with actionable guidance
 *
 * Pattern: What went wrong → Why → How to fix → Where to configure
 *
 * @param {Object} details - Error details
 * @param {string} details.path - The blocked path
 * @param {string} details.pattern - The pattern that matched
 * @param {string} details.tool - The tool that was blocked
 * @param {string} details.claudeDir - Path to .claude directory
 * @returns {string}
 */
function formatBlockedError(details) {
  const { path: blockedPath, pattern, tool, claudeDir } = details;
  const configPath = formatConfigPath(claudeDir);

  // Truncate path if too long
  const displayPath = blockedPath.length > 60
    ? '...' + blockedPath.slice(-57)
    : blockedPath;

  const lines = [
    '',
    colorize('NOTE:', 'cyan') + ' This is not an error - this block is intentional to optimize context.',
    '',
    colorize('BLOCKED', 'red') + `: Access to '${displayPath}' denied`,
    '',
    `  ${colorize('Pattern:', 'yellow')}  ${pattern}`,
    `  ${colorize('Tool:', 'yellow')}     ${tool || 'unknown'}`,
    '',
    `  ${colorize('To allow, add to', 'blue')} ${configPath}:`,
    `    !${pattern}`,
    '',
    `  ${colorize('Config:', 'dim')} ${configPath}`,
    ''
  ];

  return lines.join('\n');
}

/**
 * Format a simple error message (one line, for piped output)
 *
 * @param {string} pattern - The pattern that matched
 * @param {string} blockedPath - The path that was blocked
 * @returns {string}
 */
function formatSimpleError(pattern, blockedPath) {
  return `ERROR: Blocked pattern '${pattern}' matched path: ${blockedPath}`;
}

/**
 * Format error for machine-readable output (exit code 2)
 * Used when stderr is not a TTY
 *
 * @param {Object} details - Error details
 * @returns {string}
 */
function formatMachineError(details) {
  const { path: blockedPath, pattern, tool, claudeDir } = details;
  const configPath = formatConfigPath(claudeDir);

  return JSON.stringify({
    error: 'BLOCKED',
    path: blockedPath,
    pattern: pattern,
    tool: tool,
    config: configPath,
    fix: `Add '!${pattern}' to ${configPath} to allow this path`
  });
}

/**
 * Format a warning message (non-blocking)
 *
 * @param {string} message - Warning message
 * @returns {string}
 */
function formatWarning(message) {
  return colorize('WARN:', 'yellow') + ' ' + message;
}

module.exports = {
  formatBlockedError,
  formatSimpleError,
  formatMachineError,
  formatWarning,
  formatConfigPath,
  supportsColor,
  colorize,
  COLORS
};
