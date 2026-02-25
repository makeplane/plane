#!/usr/bin/env node
/**
 * test-monorepo-scenarios.cjs - Integration tests for monorepo patterns
 *
 * THIS IS THE CRITICAL TEST FILE FOR THE BUG FIX!
 * Tests that subfolder blocked directories (node_modules, dist, etc.)
 * are properly blocked in monorepo structures.
 */

const { execSync } = require('child_process');
const path = require('path');

const hookPath = path.join(__dirname, '..', '..', 'scout-block.cjs');

const scenarios = [
  // === THE BUG CASES - These MUST be BLOCKED ===
  {
    input: { tool_name: 'Bash', tool_input: { command: 'ls packages/web/node_modules' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] ls subfolder node_modules'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'cd apps/api/node_modules' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] cd subfolder node_modules'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'cat packages/shared/node_modules/lodash/index.js' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] cat file in subfolder node_modules'
  },
  {
    input: { tool_name: 'Read', tool_input: { file_path: 'packages/web/node_modules/react/package.json' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] Read subfolder node_modules'
  },
  {
    input: { tool_name: 'Grep', tool_input: { pattern: 'export', path: 'packages/web/node_modules' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] Grep in subfolder node_modules'
  },
  {
    input: { tool_name: 'Glob', tool_input: { pattern: 'packages/web/node_modules/**/*.js' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] Glob subfolder node_modules'
  },

  // === Deep nesting (also bug cases) ===
  {
    input: { tool_name: 'Read', tool_input: { file_path: 'a/b/c/d/node_modules/pkg/index.js' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] Deep nested node_modules'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'ls packages/web/dist' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] ls subfolder dist'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'cat apps/api/build/server.js' } },
    expected: 'BLOCKED',
    desc: '[BUG FIX] cat subfolder build'
  },

  // === Root level blocking (should still work) ===
  {
    input: { tool_name: 'Bash', tool_input: { command: 'ls node_modules' } },
    expected: 'BLOCKED',
    desc: 'ls root node_modules'
  },
  {
    input: { tool_name: 'Read', tool_input: { file_path: 'node_modules/lodash/index.js' } },
    expected: 'BLOCKED',
    desc: 'Read root node_modules'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'cat .git/config' } },
    expected: 'BLOCKED',
    desc: 'cat .git file'
  },

  // === Build commands - MUST be ALLOWED ===
  {
    input: { tool_name: 'Bash', tool_input: { command: 'npm run build' } },
    expected: 'ALLOWED',
    desc: 'npm run build'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'pnpm build' } },
    expected: 'ALLOWED',
    desc: 'pnpm build'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'yarn build' } },
    expected: 'ALLOWED',
    desc: 'yarn build'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'npm test' } },
    expected: 'ALLOWED',
    desc: 'npm test'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'npm install' } },
    expected: 'ALLOWED',
    desc: 'npm install'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'pnpm --filter web run build' } },
    expected: 'ALLOWED',
    desc: 'pnpm filter build'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'npx tsc' } },
    expected: 'ALLOWED',
    desc: 'npx tsc'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'jest --coverage' } },
    expected: 'ALLOWED',
    desc: 'jest with flags'
  },

  // === Safe operations - MUST be ALLOWED ===
  {
    input: { tool_name: 'Read', tool_input: { file_path: 'packages/web/src/App.tsx' } },
    expected: 'ALLOWED',
    desc: 'Read safe path'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'ls packages/web/src' } },
    expected: 'ALLOWED',
    desc: 'ls safe path'
  },
  {
    input: { tool_name: 'Grep', tool_input: { pattern: 'import', path: 'src' } },
    expected: 'ALLOWED',
    desc: 'Grep in src'
  },
  {
    input: { tool_name: 'Glob', tool_input: { pattern: '**/*.ts' } },
    expected: 'ALLOWED',
    desc: 'Glob all .ts files'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'find packages -name "*.json" | head' } },
    expected: 'ALLOWED',
    desc: 'find without blocked dirs'
  },

  // === Edge cases - names containing blocked words but NOT the dirs ===
  {
    input: { tool_name: 'Read', tool_input: { file_path: 'my-node_modules-project/file.js' } },
    expected: 'ALLOWED',
    desc: 'node_modules in project name'
  },
  {
    input: { tool_name: 'Bash', tool_input: { command: 'ls build-tools' } },
    expected: 'ALLOWED',
    desc: 'build- prefix directory'
  },
];

console.log('Testing monorepo scenarios (scout-block integration)...\n');
console.log('Hook path:', hookPath, '\n');

let passed = 0;
let failed = 0;

for (const scenario of scenarios) {
  try {
    execSync(`node "${hookPath}"`, {
      input: JSON.stringify(scenario.input),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    // Exit 0 = ALLOWED
    const actual = 'ALLOWED';
    const success = actual === scenario.expected;
    if (success) {
      console.log(`\x1b[32m✓\x1b[0m ${scenario.desc}: ${actual}`);
      passed++;
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${scenario.desc}: expected ${scenario.expected}, got ${actual}`);
      failed++;
    }
  } catch (error) {
    // Exit 2 = BLOCKED
    const actual = error.status === 2 ? 'BLOCKED' : `ERROR(${error.status})`;
    const success = actual === scenario.expected;
    if (success) {
      console.log(`\x1b[32m✓\x1b[0m ${scenario.desc}: ${actual}`);
      passed++;
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${scenario.desc}: expected ${scenario.expected}, got ${actual}`);
      if (error.stderr) {
        console.log(`  stderr: ${error.stderr.toString().trim().split('\n')[0]}`);
      }
      failed++;
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Highlight if any bug fix cases failed
const bugFixFailed = scenarios.filter(s => s.desc.includes('[BUG FIX]')).some(s => {
  try {
    execSync(`node "${hookPath}"`, {
      input: JSON.stringify(s.input),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return s.expected === 'BLOCKED'; // Should have been blocked but wasn't
  } catch (error) {
    return error.status !== 2 && s.expected === 'BLOCKED';
  }
});

if (bugFixFailed) {
  console.log('\n\x1b[31mWARNING: Some bug fix test cases failed!\x1b[0m');
  console.log('The subfolder blocking bug has NOT been fixed properly.');
}

process.exit(failed > 0 ? 1 : 0);
