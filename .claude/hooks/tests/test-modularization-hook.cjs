#!/usr/bin/env node

/**
 * Test script for modularization-hook.js (PostToolUse hook)
 * Tests if the hook correctly identifies files exceeding LOC threshold
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Create a temporary test file
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'modularization-test-'));
const testFilePath = path.join(tempDir, 'test-file.js');

// Create file with 250 lines (exceeds 200 LOC threshold)
const longContent = Array(250).fill('// Test line').join('\n');
fs.writeFileSync(testFilePath, longContent);

// Create file with 50 lines (under threshold)
const shortFilePath = path.join(tempDir, 'short-file.js');
const shortContent = Array(50).fill('// Test line').join('\n');
fs.writeFileSync(shortFilePath, shortContent);

const testCases = [
  {
    name: 'Write tool with file exceeding LOC threshold',
    input: {
      tool_name: 'Write',
      tool_input: {
        file_path: testFilePath,
        content: longContent
      }
    },
    expectSuggestion: true
  },
  {
    name: 'Edit tool with file exceeding LOC threshold',
    input: {
      tool_name: 'Edit',
      tool_input: {
        file_path: testFilePath,
        old_string: '// Test line',
        new_string: '// Modified line'
      }
    },
    expectSuggestion: true
  },
  {
    name: 'Write tool with short file (under threshold)',
    input: {
      tool_name: 'Write',
      tool_input: {
        file_path: shortFilePath,
        content: shortContent
      }
    },
    expectSuggestion: false
  },
  {
    name: 'Write tool with non-existent file',
    input: {
      tool_name: 'Write',
      tool_input: {
        file_path: '/tmp/non-existent-file.js',
        content: 'test'
      }
    },
    expectSuggestion: false
  }
];

console.log('Testing modularization-hook.js...\n');

const scriptPath = path.join(__dirname, '..', 'modularization-hook.js');
let passed = 0;
let failed = 0;

for (const test of testCases) {
  try {
    const input = JSON.stringify(test.input);
    const result = execSync(`node "${scriptPath}"`, {
      input,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, MODULARIZATION_HOOK_DEBUG: 'false' }
    });

    let hasSuggestion = false;
    if (result && result.trim()) {
      try {
        const output = JSON.parse(result.trim());
        hasSuggestion = output.hookSpecificOutput?.additionalContext?.includes('LOC');
      } catch (e) {
        // Not valid JSON or no output
      }
    }

    const success = hasSuggestion === test.expectSuggestion;

    if (success) {
      console.log(`✓ ${test.name}: ${hasSuggestion ? 'suggestion shown' : 'no suggestion'}`);
      passed++;
    } else {
      console.log(`✗ ${test.name}: expected ${test.expectSuggestion ? 'suggestion' : 'no suggestion'}, got ${hasSuggestion ? 'suggestion' : 'no suggestion'}`);
      if (result) {
        console.log(`  Output: ${result.trim()}`);
      }
      failed++;
    }
  } catch (error) {
    console.log(`✗ ${test.name}: error executing hook`);
    console.log(`  Error: ${error.message}`);
    if (error.stderr) {
      console.log(`  Stderr: ${error.stderr.toString()}`);
    }
    failed++;
  }
}

// Cleanup
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
