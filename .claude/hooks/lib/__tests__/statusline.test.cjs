#!/usr/bin/env node
'use strict';

/**
 * Comprehensive Tests for Statusline Implementation
 * Modules tested: colors, transcript-parser, config-counter, statusline
 * Run: node .claude/hooks/lib/__tests__/statusline.test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// Import modules
const {
  shouldUseColor,
  coloredBar,
  green,
  yellow,
  red,
  cyan,
  magenta,
  dim,
  RESET,
  getContextColor
} = require('../colors.cjs');

const {
  parseTranscript,
  processEntry,
  extractTarget
} = require('../transcript-parser.cjs');

const {
  countConfigs,
  countRulesInDir,
  countMcpServersInFile,
  countHooksInFile
} = require('../config-counter.cjs');

// Test framework
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
    failures.push({ name, error: e.message });
  }
}

function assertEquals(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, msg = '') {
  if (!condition) {
    throw new Error(`${msg}\n  Expected: true, got: ${condition}`);
  }
}

function assertFalse(condition, msg = '') {
  if (condition) {
    throw new Error(`${msg}\n  Expected: false, got: ${condition}`);
  }
}

function assertContains(actual, search, msg = '') {
  if (!actual.includes(search)) {
    throw new Error(`${msg}\n  Expected to contain: ${search}\n  Actual: ${actual}`);
  }
}

function assertMatch(actual, regex, msg = '') {
  if (!regex.test(actual)) {
    throw new Error(`${msg}\n  Pattern: ${regex}\n  Actual: ${actual}`);
  }
}

// ============================================================================
// TEST 1: Module Load Test
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 1: Module Load Test');
console.log('═══════════════════════════════════════════════════════\n');

test('colors.cjs exports required functions', () => {
  assertTrue(typeof green === 'function', 'green should be function');
  assertTrue(typeof yellow === 'function', 'yellow should be function');
  assertTrue(typeof red === 'function', 'red should be function');
  assertTrue(typeof cyan === 'function', 'cyan should be function');
  assertTrue(typeof magenta === 'function', 'magenta should be function');
  assertTrue(typeof dim === 'function', 'dim should be function');
  assertTrue(typeof coloredBar === 'function', 'coloredBar should be function');
  assertTrue(typeof getContextColor === 'function', 'getContextColor should be function');
  assertTrue(RESET === '\x1b[0m', 'RESET should be proper escape code');
});

test('transcript-parser.cjs exports required functions', () => {
  assertTrue(typeof parseTranscript === 'function', 'parseTranscript should be function');
  assertTrue(typeof processEntry === 'function', 'processEntry should be function');
  assertTrue(typeof extractTarget === 'function', 'extractTarget should be function');
});

test('config-counter.cjs exports required functions', () => {
  assertTrue(typeof countConfigs === 'function', 'countConfigs should be function');
  assertTrue(typeof countRulesInDir === 'function', 'countRulesInDir should be function');
  assertTrue(typeof countMcpServersInFile === 'function', 'countMcpServersInFile should be function');
  assertTrue(typeof countHooksInFile === 'function', 'countHooksInFile should be function');
});

// ============================================================================
// TEST 2: Colors Test
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 2: Colors Test');
console.log('═══════════════════════════════════════════════════════\n');

test('green() wraps text with color codes or returns plain text', () => {
  const text = 'success';
  const result = green(text);
  assertTrue(
    result === text || result.includes(text),
    'green() should return colored or plain text'
  );
});

test('yellow() returns valid output', () => {
  const result = yellow('warning');
  assertTrue(result.length >= 7, 'yellow() should return non-empty string');
});

test('red() returns valid output', () => {
  const result = red('error');
  assertTrue(result.length >= 5, 'red() should return non-empty string');
});

test('cyan() returns valid output', () => {
  const result = cyan('info');
  assertTrue(result.length >= 4, 'cyan() should return non-empty string');
});

test('magenta() returns valid output', () => {
  const result = magenta('debug');
  assertTrue(result.length >= 5, 'magenta() should return non-empty string');
});

test('dim() returns valid output', () => {
  const result = dim('dim text');
  assertTrue(result.length >= 8, 'dim() should return non-empty string');
});

test('shouldUseColor is boolean', () => {
  assertTrue(
    typeof shouldUseColor === 'boolean',
    'shouldUseColor should be boolean'
  );
});

// ============================================================================
// TEST 3: Context Color Thresholds
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 3: Context Color Thresholds');
console.log('═══════════════════════════════════════════════════════\n');

test('getContextColor(50%) returns GREEN', () => {
  const color = getContextColor(50);
  assertEquals(color, '\x1b[32m', 'Should return GREEN for 50%');
});

test('getContextColor(75%) returns YELLOW', () => {
  const color = getContextColor(75);
  assertEquals(color, '\x1b[33m', 'Should return YELLOW for 75%');
});

test('getContextColor(90%) returns RED', () => {
  const color = getContextColor(90);
  assertEquals(color, '\x1b[31m', 'Should return RED for 90%');
});

test('getContextColor(69%) returns GREEN (below 70%)', () => {
  const color = getContextColor(69);
  assertEquals(color, '\x1b[32m', 'Should return GREEN for 69%');
});

test('getContextColor(70%) returns YELLOW (exactly 70%)', () => {
  const color = getContextColor(70);
  assertEquals(color, '\x1b[33m', 'Should return YELLOW for exactly 70%');
});

test('getContextColor(85%) returns RED (exactly 85%)', () => {
  const color = getContextColor(85);
  assertEquals(color, '\x1b[31m', 'Should return RED for exactly 85%');
});

// ============================================================================
// TEST 4: Colored Bar Rendering
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 4: Colored Bar Rendering');
console.log('═══════════════════════════════════════════════════════\n');

test('coloredBar(0) renders empty bar', () => {
  const bar = coloredBar(0);
  assertTrue(bar.includes('▱'), 'Empty bar should contain empty blocks (▱)');
});

test('coloredBar(50) renders half-filled bar', () => {
  const bar = coloredBar(50, 12);
  assertTrue(bar.length >= 6, 'Half-filled bar should have content');
});

test('coloredBar(100) renders full bar', () => {
  const bar = coloredBar(100, 12);
  assertTrue(bar.length >= 12, 'Full bar should be substantial length');
});

test('coloredBar clamping: negative percent treated as 0', () => {
  const bar = coloredBar(-10, 12);
  assertTrue(bar.includes('▱'), 'Negative percent should show empty bar (▱)');
});

test('coloredBar clamping: >100 percent treated as 100', () => {
  const bar = coloredBar(150, 12);
  assertTrue(bar.length >= 10, '>100 percent should show full bar');
});

test('coloredBar respects custom width', () => {
  const bar6 = coloredBar(50, 6);
  const bar20 = coloredBar(50, 20);
  assertTrue(bar6.length < bar20.length, 'Width=6 should be shorter than width=20');
});

// ============================================================================
// TEST 5: Transcript Parser - Empty/Non-existent
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 5: Transcript Parser - Empty/Non-existent');
console.log('═══════════════════════════════════════════════════════\n');

test('parseTranscript returns empty result for non-existent file', async () => {
  const result = await parseTranscript('/tmp/nonexistent-transcript-12345.jsonl');
  assertEquals(result.tools.length, 0, 'tools should be empty array');
  assertEquals(result.agents.length, 0, 'agents should be empty array');
  assertEquals(result.todos.length, 0, 'todos should be empty array');
});

test('parseTranscript returns empty result for null path', async () => {
  const result = await parseTranscript(null);
  assertEquals(result.tools.length, 0, 'tools should be empty array');
  assertEquals(result.agents.length, 0, 'agents should be empty array');
  assertEquals(result.todos.length, 0, 'todos should be empty array');
});

test('parseTranscript returns empty result for undefined path', async () => {
  const result = await parseTranscript(undefined);
  assertEquals(result.tools.length, 0, 'tools should be empty array');
  assertEquals(result.agents.length, 0, 'agents should be empty array');
  assertEquals(result.todos.length, 0, 'todos should be empty array');
});

// ============================================================================
// TEST 6: Transcript Parser - Real JSONL File
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 6: Transcript Parser - Real JSONL File');
console.log('═══════════════════════════════════════════════════════\n');

// Create temporary test transcript
const tmpTranscript = path.join(os.tmpdir(), `test-transcript-${Date.now()}.jsonl`);
const sampleTranscriptData = [
  {
    timestamp: '2026-01-06T12:00:00Z',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'Read',
          input: { file_path: '/home/user/file.txt' }
        }
      ]
    }
  },
  {
    timestamp: '2026-01-06T12:01:00Z',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool-1',
          is_error: false
        }
      ]
    }
  },
  {
    timestamp: '2026-01-06T12:02:00Z',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'tool-2',
          name: 'Bash',
          input: { command: 'git status' }
        }
      ]
    }
  },
  {
    timestamp: '2026-01-06T12:03:00Z',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'agent-1',
          name: 'Task',
          input: { subagent_type: 'researcher', model: 'claude-opus', description: 'Research topic' }
        }
      ]
    }
  },
  {
    timestamp: '2026-01-06T12:04:00Z',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'agent-1',
          is_error: false
        }
      ]
    }
  },
  {
    timestamp: '2026-01-06T12:05:00Z',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'todo-1',
          name: 'TodoWrite',
          input: {
            todos: [
              { content: 'First task', status: 'completed', activeForm: 'Completing first task' },
              { content: 'Second task', status: 'in_progress', activeForm: 'Working on second task' }
            ]
          }
        }
      ]
    }
  }
];

fs.writeFileSync(tmpTranscript, sampleTranscriptData.map(d => JSON.stringify(d)).join('\n'));

test('parseTranscript reads valid JSONL file', async () => {
  const result = await parseTranscript(tmpTranscript);
  assertTrue(Array.isArray(result.tools), 'tools should be array');
  assertTrue(Array.isArray(result.agents), 'agents should be array');
  assertTrue(Array.isArray(result.todos), 'todos should be array');
});

test('parseTranscript tracks tools correctly', async () => {
  const result = await parseTranscript(tmpTranscript);
  assertTrue(result.tools.length >= 2, 'Should track at least 2 tools');
  const toolNames = result.tools.map(t => t.name);
  assertContains(toolNames.join(','), 'Read', 'Should contain Read tool');
  assertContains(toolNames.join(','), 'Bash', 'Should contain Bash tool');
});

test('parseTranscript marks tool status correctly', async () => {
  const result = await parseTranscript(tmpTranscript);
  const completedTools = result.tools.filter(t => t.status === 'completed');
  assertTrue(completedTools.length > 0, 'Should have at least one completed tool');
});

test('parseTranscript tracks agents correctly', async () => {
  const result = await parseTranscript(tmpTranscript);
  assertTrue(result.agents.length > 0, 'Should track agents');
  const agent = result.agents[0];
  assertEquals(agent.type, 'researcher', 'Should capture agent type');
  assertEquals(agent.model, 'claude-opus', 'Should capture agent model');
});

test('parseTranscript tracks todos correctly', async () => {
  const result = await parseTranscript(tmpTranscript);
  assertTrue(result.todos.length >= 2, 'Should track todos');
  const inProgressTodos = result.todos.filter(t => t.status === 'in_progress');
  assertTrue(inProgressTodos.length > 0, 'Should have in_progress todo');
});

test('parseTranscript extracts targets from tools', async () => {
  const result = await parseTranscript(tmpTranscript);
  const readTool = result.tools.find(t => t.name === 'Read');
  if (readTool) {
    assertTrue(readTool.target, 'Read tool should have target');
    assertContains(readTool.target, 'file.txt', 'Should contain file path');
  }
});

// ============================================================================
// TEST 7: Extract Target Function
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 7: Extract Target Function');
console.log('═══════════════════════════════════════════════════════\n');

test('extractTarget: Read tool', () => {
  const target = extractTarget('Read', { file_path: '/home/user/file.txt' });
  assertEquals(target, '/home/user/file.txt', 'Should extract file_path');
});

test('extractTarget: Write tool', () => {
  const target = extractTarget('Write', { file_path: '/home/user/output.txt' });
  assertEquals(target, '/home/user/output.txt', 'Should extract file_path from Write');
});

test('extractTarget: Edit tool', () => {
  const target = extractTarget('Edit', { path: '/home/user/config.json' });
  assertEquals(target, '/home/user/config.json', 'Should extract path from Edit');
});

test('extractTarget: Glob tool', () => {
  const target = extractTarget('Glob', { pattern: '**/*.js' });
  assertEquals(target, '**/*.js', 'Should extract pattern from Glob');
});

test('extractTarget: Grep tool', () => {
  const target = extractTarget('Grep', { pattern: 'function.*test' });
  assertEquals(target, 'function.*test', 'Should extract pattern from Grep');
});

test('extractTarget: Bash tool (short command)', () => {
  const target = extractTarget('Bash', { command: 'ls -la' });
  assertEquals(target, 'ls -la', 'Should extract short command');
});

test('extractTarget: Bash tool (long command truncated)', () => {
  const longCmd = 'npm install --save-dev @types/node @types/jest @types/react @types/react-dom @types/webpack';
  const target = extractTarget('Bash', { command: longCmd });
  assertTrue(target.endsWith('...'), 'Should truncate long command with ...');
  assertTrue(target.length <= 33, 'Should be max 30 chars + ...');
});

test('extractTarget: Unknown tool returns null', () => {
  const target = extractTarget('UnknownTool', { someParam: 'value' });
  assertEquals(target, null, 'Should return null for unknown tools');
});

test('extractTarget: Null input returns null', () => {
  const target = extractTarget('Read', null);
  assertEquals(target, null, 'Should return null for null input');
});

// ============================================================================
// TEST 8: Config Counter - Edge Cases
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 8: Config Counter - Edge Cases');
console.log('═══════════════════════════════════════════════════════\n');

test('countRulesInDir: returns 0 for non-existent directory', () => {
  const count = countRulesInDir('/tmp/nonexistent-rules-dir-12345');
  assertEquals(count, 0, 'Should return 0 for non-existent directory');
});

test('countRulesInDir: handles empty directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-'));
  try {
    const count = countRulesInDir(tmpDir);
    assertEquals(count, 0, 'Should return 0 for empty directory');
  } finally {
    fs.rmdirSync(tmpDir);
  }
});

test('countRulesInDir: counts .md files only', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-'));
  try {
    fs.writeFileSync(path.join(tmpDir, 'rule1.md'), '# Rule 1');
    fs.writeFileSync(path.join(tmpDir, 'rule2.md'), '# Rule 2');
    fs.writeFileSync(path.join(tmpDir, 'ignore.txt'), 'ignore');
    const count = countRulesInDir(tmpDir);
    assertEquals(count, 2, 'Should count only .md files');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('countRulesInDir: handles nested directories', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-'));
  try {
    fs.mkdirSync(path.join(tmpDir, 'nested'));
    fs.writeFileSync(path.join(tmpDir, 'rule1.md'), '# Rule 1');
    fs.writeFileSync(path.join(tmpDir, 'nested', 'rule2.md'), '# Rule 2');
    const count = countRulesInDir(tmpDir);
    assertEquals(count, 2, 'Should count .md files in nested directories');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('countConfigs: returns object with expected properties', () => {
  const result = countConfigs('/tmp');
  assertTrue(typeof result === 'object', 'Should return object');
  assertTrue('claudeMdCount' in result, 'Should have claudeMdCount');
  assertTrue('rulesCount' in result, 'Should have rulesCount');
  assertTrue('mcpCount' in result, 'Should have mcpCount');
  assertTrue('hooksCount' in result, 'Should have hooksCount');
});

test('countConfigs: all counts are numbers', () => {
  const result = countConfigs('/tmp');
  assertEquals(typeof result.claudeMdCount, 'number', 'claudeMdCount should be number');
  assertEquals(typeof result.rulesCount, 'number', 'rulesCount should be number');
  assertEquals(typeof result.mcpCount, 'number', 'mcpCount should be number');
  assertEquals(typeof result.hooksCount, 'number', 'hooksCount should be number');
});

test('countConfigs: handles null/undefined cwd gracefully', () => {
  const result1 = countConfigs(null);
  assertEquals(typeof result1, 'object', 'Should handle null cwd');

  const result2 = countConfigs(undefined);
  assertEquals(typeof result2, 'object', 'Should handle undefined cwd');
});

// ============================================================================
// TEST 9: Fallback Error Handling
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 9: Fallback Error Handling');
console.log('═══════════════════════════════════════════════════════\n');

test('processEntry handles entry without timestamp', () => {
  const toolMap = new Map();
  const agentMap = new Map();
  const latestTodos = [];
  const result = { sessionStart: null };

  const entry = {
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'Bash',
          input: { command: 'ls' }
        }
      ]
    }
  };

  processEntry(entry, toolMap, agentMap, latestTodos, result);
  assertTrue(toolMap.has('tool-1'), 'Should process entry without timestamp');
});

test('processEntry handles missing content array', () => {
  const toolMap = new Map();
  const agentMap = new Map();
  const latestTodos = [];
  const result = { sessionStart: null };

  const entry = { timestamp: '2026-01-06T12:00:00Z' };
  processEntry(entry, toolMap, agentMap, latestTodos, result);
  assertEquals(toolMap.size, 0, 'Should handle missing content gracefully');
});

test('processEntry handles malformed tool_result', () => {
  const toolMap = new Map();
  const agentMap = new Map();
  const latestTodos = [];
  const result = { sessionStart: null };

  const entry = {
    timestamp: '2026-01-06T12:00:00Z',
    message: {
      content: [
        { type: 'tool_result' } // missing tool_use_id
      ]
    }
  };

  processEntry(entry, toolMap, agentMap, latestTodos, result);
  // Should not crash, just skip
  assertEquals(toolMap.size, 0, 'Should handle malformed tool_result');
});

// ============================================================================
// TEST 10: Performance Test
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 10: Performance Test');
console.log('═══════════════════════════════════════════════════════\n');

test('parseTranscript processes 100 entries <100ms', async () => {
  const largeTranscript = path.join(os.tmpdir(), `perf-transcript-${Date.now()}.jsonl`);
  const lines = [];

  for (let i = 0; i < 100; i++) {
    lines.push(JSON.stringify({
      timestamp: new Date().toISOString(),
      message: {
        content: [
          {
            type: 'tool_use',
            id: `tool-${i}`,
            name: 'Bash',
            input: { command: 'echo test' }
          }
        ]
      }
    }));
  }

  fs.writeFileSync(largeTranscript, lines.join('\n'));

  try {
    const start = Date.now();
    await parseTranscript(largeTranscript);
    const elapsed = Date.now() - start;
    assertTrue(elapsed < 100, `Should parse 100 entries in <100ms, took ${elapsed}ms`);
  } finally {
    fs.unlinkSync(largeTranscript);
  }
});

test('coloredBar(50, 12) renders in <1ms', () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    coloredBar(50, 12);
  }
  const elapsed = Date.now() - start;
  assertTrue(elapsed < 50, `1000 bar renders should be <50ms, took ${elapsed}ms`);
});

// ============================================================================
// CLEANUP
// ============================================================================

try {
  fs.unlinkSync(tmpTranscript);
} catch {}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed Tests:');
  failures.forEach(f => {
    console.log(`  ✗ ${f.name}`);
    console.log(`    ${f.error.split('\n')[0]}`);
  });
  process.exit(1);
} else {
  console.log('\n✓ All tests passed!');
  process.exit(0);
}
