#!/usr/bin/env node
/**
 * privacy-checker.cjs - Privacy pattern matching logic for sensitive file detection
 *
 * Extracted from privacy-block.cjs for reuse in both Claude hooks and OpenCode plugins.
 * Pure logic module - no stdin/stdout, no exit codes.
 *
 * @module privacy-checker
 */

const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const APPROVED_PREFIX = 'APPROVED:';

// Safe file patterns - exempt from privacy checks (documentation/template files)
const SAFE_PATTERNS = [
  /\.example$/i,   // .env.example, config.example
  /\.sample$/i,    // .env.sample
  /\.template$/i,  // .env.template
];

// Privacy-sensitive patterns
const PRIVACY_PATTERNS = [
  /^\.env$/,              // .env
  /^\.env\./,             // .env.local, .env.production, etc.
  /\.env$/,               // path/to/.env
  /\/\.env\./,            // path/to/.env.local
  /credentials/i,         // credentials.json, etc.
  /secrets?\.ya?ml$/i,    // secrets.yaml, secret.yml
  /\.pem$/,               // Private keys
  /\.key$/,               // Private keys
  /id_rsa/,               // SSH keys
  /id_ed25519/,           // SSH keys
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if path is a safe file (example/sample/template)
 * @param {string} testPath - Path to check
 * @returns {boolean} true if file matches safe patterns
 */
function isSafeFile(testPath) {
  if (!testPath) return false;
  const basename = path.basename(testPath);
  return SAFE_PATTERNS.some(p => p.test(basename));
}

/**
 * Check if path has APPROVED: prefix
 * @param {string} testPath - Path to check
 * @returns {boolean} true if path starts with APPROVED:
 */
function hasApprovalPrefix(testPath) {
  return testPath && testPath.startsWith(APPROVED_PREFIX);
}

/**
 * Strip APPROVED: prefix from path
 * @param {string} testPath - Path to process
 * @returns {string} Path without APPROVED: prefix
 */
function stripApprovalPrefix(testPath) {
  if (hasApprovalPrefix(testPath)) {
    return testPath.slice(APPROVED_PREFIX.length);
  }
  return testPath;
}

/**
 * Check if stripped path is suspicious (path traversal or absolute)
 * @param {string} strippedPath - Path after stripping APPROVED: prefix
 * @returns {boolean} true if path looks suspicious
 */
function isSuspiciousPath(strippedPath) {
  return strippedPath.includes('..') || path.isAbsolute(strippedPath);
}

/**
 * Check if path matches privacy patterns
 * @param {string} testPath - Path to check
 * @returns {boolean} true if path matches privacy-sensitive patterns
 */
function isPrivacySensitive(testPath) {
  if (!testPath) return false;

  // Strip prefix for pattern matching
  const cleanPath = stripApprovalPrefix(testPath);
  let normalized = cleanPath.replace(/\\/g, '/');

  // Decode URI components to catch obfuscated paths (%2e = '.')
  try {
    normalized = decodeURIComponent(normalized);
  } catch (e) {
    // Invalid encoding, use as-is
  }

  // Check safe patterns first - exempt example/sample/template files
  if (isSafeFile(normalized)) {
    return false;
  }

  const basename = path.basename(normalized);

  for (const pattern of PRIVACY_PATTERNS) {
    if (pattern.test(basename) || pattern.test(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract paths from tool input
 * @param {Object} toolInput - Tool input object with file_path, path, pattern, or command
 * @returns {Array<{value: string, field: string}>} Array of extracted paths with field names
 */
function extractPaths(toolInput) {
  const paths = [];
  if (!toolInput) return paths;

  if (toolInput.file_path) paths.push({ value: toolInput.file_path, field: 'file_path' });
  if (toolInput.path) paths.push({ value: toolInput.path, field: 'path' });
  if (toolInput.pattern) paths.push({ value: toolInput.pattern, field: 'pattern' });

  // Check bash commands for file paths
  if (toolInput.command) {
    // Look for APPROVED:.env or .env patterns
    const approvedMatch = toolInput.command.match(/APPROVED:[^\s]+/g) || [];
    approvedMatch.forEach(p => paths.push({ value: p, field: 'command' }));

    // Only look for .env if no APPROVED: version found
    if (approvedMatch.length === 0) {
      const envMatch = toolInput.command.match(/\.env[^\s]*/g) || [];
      envMatch.forEach(p => paths.push({ value: p, field: 'command' }));

      // Also check bash variable assignments (FILE=.env, ENV_FILE=.env.local)
      const varAssignments = toolInput.command.match(/\w+=[^\s]*\.env[^\s]*/g) || [];
      varAssignments.forEach(a => {
        const value = a.split('=')[1];
        if (value) paths.push({ value, field: 'command' });
      });

      // Check command substitution containing sensitive patterns - extract .env from inside
      const cmdSubst = toolInput.command.match(/\$\([^)]*?(\.env[^\s)]*)[^)]*\)/g) || [];
      for (const subst of cmdSubst) {
        const inner = subst.match(/\.env[^\s)]*/);
        if (inner) paths.push({ value: inner[0], field: 'command' });
      }
    }
  }

  return paths.filter(p => p.value);
}

/**
 * Load .ck.json config to check if privacy block is disabled
 * @param {string} [configDir] - Directory containing .ck.json (defaults to .claude in cwd)
 * @returns {boolean} true if privacy block should be skipped
 */
function isPrivacyBlockDisabled(configDir) {
  try {
    const configPath = configDir
      ? path.join(configDir, '.ck.json')
      : path.join(process.cwd(), '.claude', '.ck.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.privacyBlock === false;
  } catch {
    return false; // Default to enabled on error (file not found or invalid JSON)
  }
}

/**
 * Build prompt data for AskUserQuestion tool
 * @param {string} filePath - Blocked file path
 * @returns {Object} Prompt data object
 */
function buildPromptData(filePath) {
  const basename = path.basename(filePath);
  return {
    type: 'PRIVACY_PROMPT',
    file: filePath,
    basename: basename,
    question: {
      header: 'File Access',
      text: `I need to read "${basename}" which may contain sensitive data (API keys, passwords, tokens). Do you approve?`,
      options: [
        { label: 'Yes, approve access', description: `Allow reading ${basename} this time` },
        { label: 'No, skip this file', description: 'Continue without accessing this file' }
      ]
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a tool call accesses privacy-sensitive files
 *
 * @param {Object} params
 * @param {string} params.toolName - Name of tool (Read, Write, Bash, etc.)
 * @param {Object} params.toolInput - Tool input with file_path, path, command, etc.
 * @param {Object} [params.options]
 * @param {boolean} [params.options.disabled] - Skip checks if true
 * @param {string} [params.options.configDir] - Directory for .ck.json config
 * @param {boolean} [params.options.allowBash] - Allow Bash tool without blocking (default: true)
 * @returns {{
 *   blocked: boolean,
 *   filePath?: string,
 *   reason?: string,
 *   approved?: boolean,
 *   isBash?: boolean,
 *   suspicious?: boolean,
 *   promptData?: Object
 * }}
 */
function checkPrivacy({ toolName, toolInput, options = {} }) {
  const { disabled, configDir, allowBash = true } = options;

  // Check if disabled via options or config
  if (disabled || isPrivacyBlockDisabled(configDir)) {
    return { blocked: false };
  }

  const isBashTool = toolName === 'Bash';
  const paths = extractPaths(toolInput);

  // Check each path
  for (const { value: testPath } of paths) {
    if (!isPrivacySensitive(testPath)) continue;

    // Check for approval prefix
    if (hasApprovalPrefix(testPath)) {
      const strippedPath = stripApprovalPrefix(testPath);
      return {
        blocked: false,
        approved: true,
        filePath: strippedPath,
        suspicious: isSuspiciousPath(strippedPath)
      };
    }

    // For Bash: warn but don't block (allows "Yes → bash cat" flow)
    if (isBashTool && allowBash) {
      return {
        blocked: false,
        isBash: true,
        filePath: testPath,
        reason: `Bash command accesses sensitive file: ${testPath}`
      };
    }

    // Block - sensitive file without approval
    return {
      blocked: true,
      filePath: testPath,
      reason: `Sensitive file access requires user approval`,
      promptData: buildPromptData(testPath)
    };
  }

  // No sensitive paths found
  return { blocked: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main entry point
  checkPrivacy,

  // Helper functions (for testing and direct use)
  isSafeFile,
  isPrivacySensitive,
  hasApprovalPrefix,
  stripApprovalPrefix,
  isSuspiciousPath,
  extractPaths,
  isPrivacyBlockDisabled,
  buildPromptData,

  // Constants
  APPROVED_PREFIX,
  SAFE_PATTERNS,
  PRIVACY_PATTERNS
};
