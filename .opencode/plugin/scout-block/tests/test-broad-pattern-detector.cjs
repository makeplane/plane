#!/usr/bin/env node
/**
 * test-broad-pattern-detector.cjs - Unit tests for broad pattern detection
 *
 * Tests the detection of overly broad glob patterns that would fill context.
 */

const {
  isBroadPattern,
  hasSpecificDirectory,
  isHighLevelPath,
  detectBroadPatternIssue,
  suggestSpecificPatterns
} = require('../broad-pattern-detector.cjs');

// === isBroadPattern tests ===
const broadPatternTests = [
  // Should be detected as broad - TypeScript/JavaScript
  { pattern: '**/*', expected: true, desc: 'all files everywhere' },
  { pattern: '**', expected: true, desc: 'double star alone' },
  { pattern: '*', expected: true, desc: 'single star alone' },
  { pattern: '**/.*', expected: true, desc: 'all dotfiles' },

  // Should NOT be detected as broad (specific)
  { pattern: 'package.json', expected: false, desc: 'specific file' },
  { pattern: 'src/index.ts', expected: false, desc: 'specific file path' },
  { pattern: null, expected: false, desc: 'null pattern' },
  { pattern: '', expected: false, desc: 'empty pattern' },
];

// === isHighLevelPath tests ===
const highLevelPathTests = [
  // High level (risky)
  { path: null, expected: true, desc: 'null path (uses CWD)' },
  { path: undefined, expected: true, desc: 'undefined path' },
  { path: '.', expected: true, desc: 'current directory' },
  { path: './', expected: true, desc: 'current directory with slash' },
  { path: '', expected: true, desc: 'empty path' },
  { path: '/home/user/worktrees/myproject', expected: true, desc: 'worktree root' },
  { path: 'myproject', expected: true, desc: 'single directory' },

  // Specific (OK)
  { path: 'src/components', expected: false, desc: 'nested in src' },
  { path: 'lib/utils', expected: false, desc: 'nested in lib' },
  { path: 'packages/web/src', expected: false, desc: 'monorepo src' },
  { path: '/home/user/project/src', expected: false, desc: 'absolute with src' },
];

// === detectBroadPatternIssue integration tests ===
const integrationTests = [
  // Should BLOCK
  {
    input: { pattern: '**/*.ts' },
    expected: true,
    desc: 'broad pattern, no path'
  },
  {
    input: { pattern: '**/*.{ts,tsx}', path: '/home/user/worktrees/myproject' },
    expected: true,
    desc: 'broad pattern at worktree'
  },
  {
    input: { pattern: '**/*', path: '.' },
    expected: true,
    desc: 'all files at current dir'
  },
  {
    input: { pattern: '**/index.ts', path: 'myproject' },
    expected: true,
    desc: 'all index.ts at shallow path'
  },

  // Should ALLOW
  {
    input: { pattern: 'src/**/*.ts' },
    expected: false,
    desc: 'scoped to src'
  },
  {
    input: { pattern: '**/*.ts', path: 'src/components' },
    expected: false,
    desc: 'broad pattern but specific path'
  },
  {
    input: { pattern: 'package.json' },
    expected: false,
    desc: 'specific file'
  },
  {
    input: { pattern: 'lib/**/*.js', path: '/home/user/project' },
    expected: false,
    desc: 'scoped pattern'
  },
  {
    input: {},
    expected: false,
    desc: 'no pattern'
  },
  {
    input: null,
    expected: false,
    desc: 'null input'
  },
];

// Run tests
console.log('Testing broad-pattern-detector module...\n');
let passed = 0;
let failed = 0;

// Test isBroadPattern
console.log('\x1b[1m--- isBroadPattern ---\x1b[0m');
for (const test of broadPatternTests) {
  const result = isBroadPattern(test.pattern);
  const success = result === test.expected;
  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}: "${test.pattern}" -> ${result ? 'BROAD' : 'OK'}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected ${test.expected ? 'BROAD' : 'OK'}, got ${result ? 'BROAD' : 'OK'}`);
    failed++;
  }
}

// Test isHighLevelPath
console.log('\n\x1b[1m--- isHighLevelPath ---\x1b[0m');
for (const test of highLevelPathTests) {
  const result = isHighLevelPath(test.path);
  const success = result === test.expected;
  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}: "${test.path}" -> ${result ? 'HIGH_LEVEL' : 'SPECIFIC'}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected ${test.expected ? 'HIGH_LEVEL' : 'SPECIFIC'}, got ${result ? 'HIGH_LEVEL' : 'SPECIFIC'}`);
    failed++;
  }
}

// Test integration
console.log('\n\x1b[1m--- detectBroadPatternIssue (integration) ---\x1b[0m');
for (const test of integrationTests) {
  const result = detectBroadPatternIssue(test.input);
  const success = result.blocked === test.expected;
  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc} -> ${result.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected ${test.expected ? 'BLOCKED' : 'ALLOWED'}, got ${result.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    failed++;
  }
}

// Test suggestions
console.log('\n\x1b[1m--- suggestSpecificPatterns ---\x1b[0m');
const suggestions = suggestSpecificPatterns('**/*.ts');
if (suggestions.length > 0 && suggestions.some(s => s.includes('src/'))) {
  console.log(`\x1b[32m✓\x1b[0m suggestions for **/*.ts include src-scoped patterns`);
  passed++;
} else {
  console.log(`\x1b[31m✗\x1b[0m suggestions should include src-scoped patterns`);
  failed++;
}

console.log(`\n\x1b[1mResults:\x1b[0m ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
