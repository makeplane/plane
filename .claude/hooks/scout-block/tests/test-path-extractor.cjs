#!/usr/bin/env node
/**
 * test-path-extractor.cjs - Unit tests for path-extractor module
 */

const { extractFromToolInput, extractFromCommand, looksLikePath } = require('../path-extractor.cjs');

const toolInputTests = [
  {
    input: { file_path: 'packages/web/src/index.js' },
    expected: ['packages/web/src/index.js'],
    desc: 'file_path extraction'
  },
  {
    input: { path: 'node_modules' },
    expected: ['node_modules'],
    desc: 'path extraction'
  },
  {
    input: { pattern: '**/node_modules/**' },
    expected: ['**/node_modules/**'],
    desc: 'pattern extraction'
  },
  {
    input: { command: 'ls packages/web/node_modules' },
    hasPath: 'packages/web/node_modules',
    desc: 'command path extraction'
  },
  {
    input: { file_path: '/home/user/project/node_modules/pkg/index.js' },
    expected: ['/home/user/project/node_modules/pkg/index.js'],
    desc: 'absolute path extraction'
  },
  {
    input: { file_path: 'packages/web/node_modules/react/package.json', path: 'src' },
    hasPath: 'packages/web/node_modules',
    desc: 'multiple params extraction'
  }
];

const commandTests = [
  { cmd: 'ls packages/web/node_modules', hasPath: 'packages/web/node_modules', desc: 'ls with subfolder' },
  { cmd: 'cat "path with spaces/file.js"', hasPath: 'path with spaces/file.js', desc: 'quoted path' },
  { cmd: "cat 'single/quoted/path.js'", hasPath: 'single/quoted/path.js', desc: 'single quoted path' },
  { cmd: 'cd apps/api/node_modules && ls', hasPath: 'apps/api/node_modules', desc: 'cd with chained command' },
  { cmd: 'rm -rf node_modules', hasPath: 'node_modules', desc: 'rm with flags' },
  { cmd: 'cp -r dist/ backup/', hasPath: 'dist', desc: 'cp with flags' },

  // Note: Build commands may extract 'build' as a blocked dir name, but this is handled
  // at the dispatcher level (build commands bypass path checking entirely).
  // The path extractor correctly identifies blocked dir names like 'build'.
  { cmd: 'npm run build', hasPath: 'build', desc: 'npm run build (extracts build)' },
  { cmd: 'pnpm build', hasPath: 'build', desc: 'pnpm build (extracts build)' },
  { cmd: 'cd build', hasPath: 'build', desc: 'cd build (extracts build)' },
  { cmd: 'yarn test', hasPath: null, desc: 'yarn test (no blocked paths)' },
  { cmd: 'npm install', hasPath: null, desc: 'npm install (no blocked paths)' },
];

const looksLikePathTests = [
  { str: 'packages/web/src', expected: true, desc: 'relative path with slashes' },
  { str: '/home/user/project', expected: true, desc: 'absolute path' },
  { str: './src/index.js', expected: true, desc: 'dot-relative path' },
  { str: '../parent/file.js', expected: true, desc: 'parent-relative path' },
  { str: 'file.txt', expected: true, desc: 'file with extension' },
  { str: 'node_modules', expected: true, desc: 'blocked dir name' },
  { str: 'ls', expected: false, desc: 'command word' },
  { str: 'npm', expected: false, desc: 'package manager' },
  { str: '-rf', expected: false, desc: 'flag' },
  { str: '123', expected: false, desc: 'number' },
];

console.log('Testing path-extractor module...\n');

let passed = 0;
let failed = 0;

// Tool input tests
console.log('--- Tool Input Tests ---');
for (const test of toolInputTests) {
  const result = extractFromToolInput(test.input);
  let success;

  if (test.expected) {
    success = test.expected.every(e => result.includes(e));
  } else if (test.hasPath) {
    success = result.some(p => p.includes(test.hasPath));
  }

  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: got ${JSON.stringify(result)}`);
    failed++;
  }
}

// Command tests
console.log('\n--- Command Tests ---');
for (const test of commandTests) {
  const result = extractFromCommand(test.cmd);
  let success;

  if (test.hasPath === null) {
    // Build commands should extract few/no blocked-related paths
    success = result.length === 0 || !result.some(p =>
      p.includes('node_modules') || p.includes('dist') || p.includes('build')
    );
  } else {
    success = result.some(p => p.includes(test.hasPath));
  }

  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}: ${JSON.stringify(result)}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected path containing '${test.hasPath}', got ${JSON.stringify(result)}`);
    failed++;
  }
}

// looksLikePath tests
console.log('\n--- looksLikePath Tests ---');
for (const test of looksLikePathTests) {
  const result = looksLikePath(test.str);
  const success = result === test.expected;

  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}: '${test.str}' -> ${result}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected ${test.expected}, got ${result}`);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
