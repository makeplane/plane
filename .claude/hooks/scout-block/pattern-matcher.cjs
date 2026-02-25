#!/usr/bin/env node
/**
 * pattern-matcher.cjs - Gitignore-spec compliant pattern matching
 *
 * Uses 'ignore' package for .ckignore parsing and path matching.
 * Supports negation patterns (!) for allowlisting.
 */

const Ignore = require('./vendor/ignore.cjs');
const fs = require('fs');
const path = require('path');

// Default patterns if .ckignore doesn't exist or is empty
// Only includes directories with HEAVY file counts (1000+ files typical)
const DEFAULT_PATTERNS = [
  // JavaScript/TypeScript - package dependencies & build outputs
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nuxt',
  // Python - virtualenvs & cache
  '__pycache__',
  '.venv',
  'venv',
  // Go/PHP - vendor dependencies
  'vendor',
  // Rust/Java - compiled outputs
  'target',
  // Version control
  '.git',
  // Test coverage (can be large with reports)
  'coverage',
];

/**
 * Load patterns from .ckignore file
 * Falls back to DEFAULT_PATTERNS if file doesn't exist or is empty
 *
 * @param {string} ckignorePath - Path to .ckignore file
 * @returns {string[]} Array of patterns
 */
function loadPatterns(ckignorePath) {
  if (!ckignorePath || !fs.existsSync(ckignorePath)) {
    return DEFAULT_PATTERNS;
  }

  try {
    const content = fs.readFileSync(ckignorePath, 'utf-8');
    const patterns = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    return patterns.length > 0 ? patterns : DEFAULT_PATTERNS;
  } catch (error) {
    console.error('WARN: Failed to read .ckignore:', error.message);
    return DEFAULT_PATTERNS;
  }
}

/**
 * Create a matcher from patterns
 * Normalizes patterns to match anywhere in the path tree
 *
 * @param {string[]} patterns - Array of patterns from .ckignore
 * @returns {Object} Matcher object with ig instance and pattern info
 */
function createMatcher(patterns) {
  const ig = Ignore();

  // Normalize patterns to match anywhere in path tree
  // e.g., "node_modules" becomes "**\/node_modules" and "**\/node_modules/**"
  const normalizedPatterns = [];

  for (const p of patterns) {
    if (p.startsWith('!')) {
      // Negation pattern - un-ignore
      const inner = p.slice(1);
      if (inner.includes('/') || inner.includes('*')) {
        // Already has path or glob - use as-is
        normalizedPatterns.push(p);
      } else {
        // Simple dir name - match anywhere
        normalizedPatterns.push(`!**/${inner}`);
        normalizedPatterns.push(`!**/${inner}/**`);
      }
    } else {
      // Block pattern
      if (p.includes('/') || p.includes('*')) {
        // Already has path or glob - use as-is
        normalizedPatterns.push(p);
      } else {
        // Simple dir name - match the dir and contents anywhere
        normalizedPatterns.push(`**/${p}`);
        normalizedPatterns.push(`**/${p}/**`);
        // Also match at root
        normalizedPatterns.push(p);
        normalizedPatterns.push(`${p}/**`);
      }
    }
  }

  ig.add(normalizedPatterns);

  return {
    ig,
    patterns: normalizedPatterns,
    original: patterns
  };
}

/**
 * Check if a path should be blocked
 *
 * @param {Object} matcher - Matcher object from createMatcher
 * @param {string} testPath - Path to test
 * @returns {Object} { blocked: boolean, pattern?: string }
 */
function matchPath(matcher, testPath) {
  if (!testPath || typeof testPath !== 'string') {
    return { blocked: false };
  }

  // Normalize path separators (Windows backslash to forward slash)
  let normalized = testPath.replace(/\\/g, '/');

  // Remove leading ./ if present
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }

  // Check if path is ignored (blocked)
  const blocked = matcher.ig.ignores(normalized);

  if (blocked) {
    // Find which original pattern matched for error message
    const matchedPattern = findMatchingPattern(matcher.original, normalized);
    return { blocked: true, pattern: matchedPattern };
  }

  return { blocked: false };
}

/**
 * Find which original pattern matched (for error messages)
 *
 * @param {string[]} originalPatterns - Original patterns from .ckignore
 * @param {string} path - The path that was blocked
 * @returns {string} The pattern that matched
 */
function findMatchingPattern(originalPatterns, path) {
  for (const p of originalPatterns) {
    if (p.startsWith('!')) continue; // Skip negations

    // Simple substring check for common cases
    const pattern = p.replace(/\*\*/g, '').replace(/\*/g, '');
    if (pattern && path.includes(pattern)) {
      return p;
    }

    // For more complex patterns, use ignore to test individually
    const tempIg = Ignore();
    if (p.includes('/') || p.includes('*')) {
      tempIg.add(p);
    } else {
      tempIg.add([`**/${p}`, `**/${p}/**`, p, `${p}/**`]);
    }

    if (tempIg.ignores(path)) {
      return p;
    }
  }

  return originalPatterns.find(p => !p.startsWith('!')) || 'unknown';
}

module.exports = {
  loadPatterns,
  createMatcher,
  matchPath,
  findMatchingPattern,
  DEFAULT_PATTERNS
};
