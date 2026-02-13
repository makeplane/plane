#!/usr/bin/env node

/**
 * Test script for scout-block.cjs hook
 * Tests various tool inputs to verify blocking logic
 *
 * Updated to use Node.js dispatcher directly (not bash wrapper)
 */

const { execSync } = require('child_process');
const path = require('path');

const testCases = [
  // Directory access - should be BLOCKED
  {
    name: 'Bash: ls node_modules',
    input: { tool_name: 'Bash', tool_input: { command: 'ls node_modules' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Bash: cd build',
    input: { tool_name: 'Bash', tool_input: { command: 'cd build' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Bash: cat dist/bundle.js',
    input: { tool_name: 'Bash', tool_input: { command: 'cat dist/bundle.js' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Grep with node_modules path',
    input: { tool_name: 'Grep', tool_input: { pattern: 'test', path: 'node_modules' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Glob with node_modules pattern',
    input: { tool_name: 'Glob', tool_input: { pattern: '**/node_modules/**' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Read with node_modules file_path',
    input: { tool_name: 'Read', tool_input: { file_path: 'node_modules/package.json' } },
    expected: 'BLOCKED'
  },

  // Subfolder blocking (THE BUG FIX)
  {
    name: '[BUG FIX] Bash: ls packages/web/node_modules',
    input: { tool_name: 'Bash', tool_input: { command: 'ls packages/web/node_modules' } },
    expected: 'BLOCKED'
  },
  {
    name: '[BUG FIX] Read: subfolder node_modules',
    input: { tool_name: 'Read', tool_input: { file_path: 'apps/api/node_modules/pkg/index.js' } },
    expected: 'BLOCKED'
  },

  // Build commands - should be ALLOWED
  {
    name: 'Bash: npm build',
    input: { tool_name: 'Bash', tool_input: { command: 'npm build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: pnpm build',
    input: { tool_name: 'Bash', tool_input: { command: 'pnpm build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: yarn build',
    input: { tool_name: 'Bash', tool_input: { command: 'yarn build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: npm run build',
    input: { tool_name: 'Bash', tool_input: { command: 'npm run build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: pnpm --filter web run build',
    input: { tool_name: 'Bash', tool_input: { command: 'pnpm --filter web run build 2>&1 | tail -100' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: npm install',
    input: { tool_name: 'Bash', tool_input: { command: 'npm install' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: npx tsc',
    input: { tool_name: 'Bash', tool_input: { command: 'npx tsc' } },
    expected: 'ALLOWED'
  },

  // Safe operations - should be ALLOWED
  {
    name: 'Grep with safe path',
    input: { tool_name: 'Grep', tool_input: { pattern: 'test', path: 'src' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Read with safe file_path',
    input: { tool_name: 'Read', tool_input: { file_path: 'src/index.js' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Glob with scoped pattern',
    input: { tool_name: 'Glob', tool_input: { pattern: 'src/**/*.ts' } },
    expected: 'ALLOWED'
  },
  // Broad pattern detection (NEW)
  {
    name: '[NEW] Glob with broad pattern (should block)',
    input: { tool_name: 'Glob', tool_input: { pattern: '**/*.ts' } },
    expected: 'BLOCKED'
  },

  // Venv executable paths - should be ALLOWED (Issue #265)
  // .venv (with dot)
  {
    name: '[#265] Bash: Unix .venv python executable',
    input: { tool_name: 'Bash', tool_input: { command: '~/.claude/skills/.venv/bin/python3 script.py' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#265] Bash: Windows .venv python executable',
    input: { tool_name: 'Bash', tool_input: { command: '.venv/Scripts/python.exe script.py' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#265] Bash: project .venv pip',
    input: { tool_name: 'Bash', tool_input: { command: './project/.venv/bin/pip install requests' } },
    expected: 'ALLOWED'
  },
  // venv (without dot)
  {
    name: '[#265] Bash: Unix venv python executable',
    input: { tool_name: 'Bash', tool_input: { command: 'venv/bin/python3 script.py' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#265] Bash: Windows venv python executable',
    input: { tool_name: 'Bash', tool_input: { command: 'venv/Scripts/python.exe script.py' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#265] Bash: project venv pip',
    input: { tool_name: 'Bash', tool_input: { command: './myproject/venv/bin/pip install flask' } },
    expected: 'ALLOWED'
  },

  // Venv exploration - should be BLOCKED
  {
    name: '[#265] Bash: cat .venv lib (blocked)',
    input: { tool_name: 'Bash', tool_input: { command: 'cat .venv/lib/python3.11/site.py' } },
    expected: 'BLOCKED'
  },
  {
    name: '[#265] Bash: ls .venv (blocked)',
    input: { tool_name: 'Bash', tool_input: { command: 'ls -la .venv/' } },
    expected: 'BLOCKED'
  },
  {
    name: '[#265] Read: .venv file (blocked)',
    input: { tool_name: 'Read', tool_input: { file_path: '.venv/pyvenv.cfg' } },
    expected: 'BLOCKED'
  },
  {
    name: '[#265] Bash: cat venv lib (blocked)',
    input: { tool_name: 'Bash', tool_input: { command: 'cat venv/lib/python3.11/site.py' } },
    expected: 'BLOCKED'
  },
  {
    name: '[#265] Bash: ls venv (blocked)',
    input: { tool_name: 'Bash', tool_input: { command: 'ls -la venv/' } },
    expected: 'BLOCKED'
  },
  {
    name: '[#265] Read: venv file (blocked)',
    input: { tool_name: 'Read', tool_input: { file_path: 'venv/pyvenv.cfg' } },
    expected: 'BLOCKED'
  },

  // Venv creation commands - should be ALLOWED (Issue #386)
  {
    name: '[#386] Bash: python -m venv .venv',
    input: { tool_name: 'Bash', tool_input: { command: 'python -m venv .venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: python3 -m venv .venv',
    input: { tool_name: 'Bash', tool_input: { command: 'python3 -m venv .venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: python3 -m venv --system-site-packages .venv',
    input: { tool_name: 'Bash', tool_input: { command: 'python3 -m venv --system-site-packages .venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: py -m venv .venv (Windows)',
    input: { tool_name: 'Bash', tool_input: { command: 'py -m venv .venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: py -3.11 -m venv .venv (Windows version)',
    input: { tool_name: 'Bash', tool_input: { command: 'py -3.11 -m venv .venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: uv venv',
    input: { tool_name: 'Bash', tool_input: { command: 'uv venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: uv venv .venv',
    input: { tool_name: 'Bash', tool_input: { command: 'uv venv .venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: virtualenv .venv',
    input: { tool_name: 'Bash', tool_input: { command: 'virtualenv .venv' } },
    expected: 'ALLOWED'
  },
  {
    name: '[#386] Bash: virtualenv --python=python3.11 my_env',
    input: { tool_name: 'Bash', tool_input: { command: 'virtualenv --python=python3.11 my_env' } },
    expected: 'ALLOWED'
  },

  // Non-venv python commands - should NOT be specially allowed (Issue #386 negative tests)
  {
    name: '[#386] Bash: python3 --version (not specially allowed)',
    input: { tool_name: 'Bash', tool_input: { command: 'python3 --version' } },
    expected: 'ALLOWED'  // Allowed because no blocked path, but NOT via isAllowedCommand
  },
  {
    name: '[#386] Bash: uv pip install (not venv creation)',
    input: { tool_name: 'Bash', tool_input: { command: 'uv pip install requests' } },
    expected: 'ALLOWED'  // Allowed because no blocked path, but NOT via isAllowedCommand
  }
];

console.log('Testing scout-block.cjs hook...\n');

// Test Node.js dispatcher directly
const scriptPath = path.join(__dirname, '..', 'scout-block.cjs');
let passed = 0;
let failed = 0;

for (const test of testCases) {
  try {
    const input = JSON.stringify(test.input);
    const result = execSync(`node "${scriptPath}"`, {
      input,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const actual = 'ALLOWED';
    const success = actual === test.expected;

    if (success) {
      console.log(`\x1b[32m✓\x1b[0m ${test.name}: ${actual}`);
      passed++;
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${test.name}: expected ${test.expected}, got ${actual}`);
      failed++;
    }
  } catch (error) {
    const actual = error.status === 2 ? 'BLOCKED' : 'ERROR';
    const success = actual === test.expected;

    if (success) {
      console.log(`\x1b[32m✓\x1b[0m ${test.name}: ${actual}`);
      passed++;
    } else {
      console.log(`\x1b[31m✗\x1b[0m ${test.name}: expected ${test.expected}, got ${actual}`);
      if (error.stderr) {
        console.log(`  Error: ${error.stderr.toString().trim().split('\n')[0]}`);
      }
      failed++;
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
