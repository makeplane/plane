#!/usr/bin/env node
/**
 * broad-pattern-detector.cjs - Detect overly broad glob patterns
 *
 * Prevents LLMs from filling context by using patterns like "all files"
 * at project root, which returns ALL files of a type.
 *
 * Detection Strategy:
 * 1. Pattern breadth: recursive glob at start = recursive everywhere
 * 2. Path depth: Root or shallow paths are high-risk
 * 3. Combined: Broad pattern + high-level path = BLOCK
 */

const path = require('path');

// Patterns that recursively match everywhere when at root
// These are dangerous because they return ALL matching files
const BROAD_PATTERN_REGEXES = [
  // ** - all files everywhere (no filter at all)
  /^\*\*$/,
  // * - all files in root
  /^\*$/,
  // **/* - all files everywhere
  /^\*\*\/\*$/,
  // **/. - all dotfiles everywhere
  /^\*\*\/\.\*$/,
  // *.ext at root (matches all in root, but combined with deep search)
  /^\*\.\w+$/,
  // *.{ext,ext2} at root
  /^\*\.\{[^}]+\}$/,
];

// Common source directories that indicate a more specific search
const SPECIFIC_DIRS = [
  'src', 'lib', 'app', 'apps', 'packages', 'components', 'pages',
  'api', 'server', 'client', 'web', 'mobile', 'shared', 'common',
  'utils', 'helpers', 'services', 'hooks', 'store', 'routes',
  'models', 'controllers', 'views', 'tests', '__tests__', 'spec'
];

// High-risk paths (project/worktree roots)
const HIGH_RISK_INDICATORS = [
  // Worktree paths
  /\/worktrees\/[^/]+\/?$/,
  // Project roots (contain package.json, etc.)
  /^\.?\/?$/,
  // Shallow paths (just one directory deep)
  /^[^/]+\/?$/
];

/**
 * Check if a glob pattern is overly broad
 *
 * @param {string} pattern - The glob pattern to check
 * @returns {boolean}
 */
function isBroadPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') return false;

  const normalized = pattern.trim();

  // Check against known broad patterns
  for (const regex of BROAD_PATTERN_REGEXES) {
    if (regex.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if pattern contains a specific subdirectory.
 * Scoped patterns like "src/..." are OK because they target specific dirs.
 *
 * @param {string} pattern - The glob pattern
 * @returns {boolean}
 */
function hasSpecificDirectory(pattern) {
  if (!pattern) return false;

  // Check if pattern starts with a specific directory
  for (const dir of SPECIFIC_DIRS) {
    if (pattern.startsWith(`${dir}/`) || pattern.startsWith(`./${dir}/`)) {
      return true;
    }
  }

  // Check for any non-glob directory prefix
  // e.g., "mydir/..." has a specific directory
  const firstSegment = pattern.split('/')[0];
  if (firstSegment && !firstSegment.includes('*') && firstSegment !== '.') {
    return true;
  }

  return false;
}

/**
 * Check if the base path is at a high-level (risky) location
 *
 * @param {string} basePath - The path where glob will run
 * @param {string} cwd - Current working directory
 * @returns {boolean}
 */
function isHighLevelPath(basePath, cwd) {
  // No path specified = uses CWD (often project root)
  if (!basePath) return true;

  const normalized = basePath.replace(/\\/g, '/');

  // Check high-risk indicators
  for (const regex of HIGH_RISK_INDICATORS) {
    if (regex.test(normalized)) {
      return true;
    }
  }

  // Check path depth - shallow paths are higher risk
  const segments = normalized.split('/').filter(s => s && s !== '.');
  if (segments.length <= 1) {
    return true;
  }

  // If path doesn't contain a specific directory, it's high-level
  const hasSpecific = SPECIFIC_DIRS.some(dir =>
    normalized.includes(`/${dir}/`) || normalized.includes(`/${dir}`) ||
    normalized.startsWith(`${dir}/`) || normalized === dir
  );

  return !hasSpecific;
}

/**
 * Generate suggestions for more specific patterns
 *
 * @param {string} pattern - The broad pattern
 * @returns {string[]}
 */
function suggestSpecificPatterns(pattern) {
  const suggestions = [];

  // Extract the extension/file part from the pattern
  let ext = '';
  const extMatch = pattern.match(/\*\.(\{[^}]+\}|\w+)$/);
  if (extMatch) {
    ext = extMatch[1];
  }

  // Suggest common directories
  const commonDirs = ['src', 'lib', 'app', 'components'];
  for (const dir of commonDirs) {
    if (ext) {
      suggestions.push(`${dir}/**/*.${ext}`);
    } else {
      suggestions.push(`${dir}/**/*`);
    }
  }

  // If it's a TypeScript pattern, add specific suggestions
  if (pattern.includes('.ts') || pattern.includes('{ts')) {
    suggestions.unshift('src/**/*.ts', 'src/**/*.tsx');
  }

  // If it's a JavaScript pattern
  if (pattern.includes('.js') || pattern.includes('{js')) {
    suggestions.unshift('src/**/*.js', 'lib/**/*.js');
  }

  return suggestions.slice(0, 4); // Return top 4 suggestions
}

/**
 * Main detection function - check if a Glob tool call is problematic
 *
 * @param {Object} toolInput - The tool_input from hook JSON
 * @param {string} toolInput.pattern - The glob pattern
 * @param {string} [toolInput.path] - Optional base path
 * @returns {Object} { blocked: boolean, reason?: string, suggestions?: string[] }
 */
function detectBroadPatternIssue(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') {
    return { blocked: false };
  }

  const { pattern, path: basePath } = toolInput;

  // No pattern = nothing to check
  if (!pattern) {
    return { blocked: false };
  }

  // Pattern has a specific directory = OK
  if (hasSpecificDirectory(pattern)) {
    return { blocked: false };
  }

  // Check if pattern is broad
  if (!isBroadPattern(pattern)) {
    return { blocked: false };
  }

  // Check if path is high-level
  if (!isHighLevelPath(basePath)) {
    return { blocked: false };
  }

  // Broad pattern at high-level path = BLOCK
  return {
    blocked: true,
    reason: `Pattern '${pattern}' is too broad for ${basePath || 'project root'}`,
    pattern: pattern,
    suggestions: suggestSpecificPatterns(pattern)
  };
}

/**
 * Format error message for broad pattern detection
 *
 * @param {Object} result - Result from detectBroadPatternIssue
 * @param {string} claudeDir - Path to .claude directory
 * @returns {string}
 */
function formatBroadPatternError(result, claudeDir) {
  const { reason, pattern, suggestions } = result;

  const lines = [
    '',
    '\x1b[36mNOTE:\x1b[0m This is not an error - this block is intentional to optimize context.',
    '',
    '\x1b[31mBLOCKED\x1b[0m: Overly broad glob pattern detected',
    '',
    `  \x1b[33mPattern:\x1b[0m  ${pattern}`,
    `  \x1b[33mReason:\x1b[0m   Would return ALL matching files, filling context`,
    '',
    '  \x1b[34mUse more specific patterns:\x1b[0m',
  ];

  for (const suggestion of suggestions || []) {
    lines.push(`    • ${suggestion}`);
  }

  lines.push('');
  lines.push('  \x1b[2mTip: Target specific directories to avoid context overflow\x1b[0m');
  lines.push('');

  return lines.join('\n');
}

module.exports = {
  isBroadPattern,
  hasSpecificDirectory,
  isHighLevelPath,
  suggestSpecificPatterns,
  detectBroadPatternIssue,
  formatBroadPatternError,
  BROAD_PATTERN_REGEXES,
  SPECIFIC_DIRS,
  HIGH_RISK_INDICATORS
};
