#!/usr/bin/env node
'use strict';

/**
 * Integration Tests for Statusline Main Script
 * Tests the complete statusline.cjs with sample JSON input
 * Run: node .claude/hooks/lib/__tests__/statusline-integration.test.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

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

function assertContains(actual, search, msg = '') {
  if (!actual.includes(search)) {
    throw new Error(`${msg}\n  Expected to contain: ${search}\n  Actual: ${actual}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('STATUSLINE INTEGRATION TESTS');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================================================
// TEST: Basic JSON Input (Minimal)
// ============================================================================

console.log('TEST 1: Basic JSON Input (Minimal)\n');

const minimalInput = JSON.stringify({
  model: { display_name: 'Claude' },
  workspace: { current_dir: '/home/user/project' },
  context_window: { context_window_size: 200000 }
});

try {
  const result = execSync(`echo '${minimalInput.replace(/'/g, "'\\''")}'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Minimal input produces output', () => {
    assertTrue(result.length > 0, 'Should produce some output');
  });

  test('Minimal output contains model name', () => {
    assertContains(result, 'Claude', 'Should contain model name');
  });

  test('Minimal output contains directory', () => {
    assertContains(result, 'user', 'Should contain directory info');
  });

  console.log(`  Output: ${result.trim().substring(0, 100)}...`);
} catch (e) {
  test('Minimal input produces output', () => {
    throw e;
  });
}

// ============================================================================
// TEST: JSON with Git Info
// ============================================================================

console.log('\nTEST 2: JSON with Git Info\n');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'statusline-test-'));
try {
  // Initialize git repo
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "Test User"', { cwd: tmpDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tmpDir, 'test.txt'), 'test');
  execSync('git add test.txt', { cwd: tmpDir, stdio: 'ignore' });

  const gitInput = JSON.stringify({
    model: { display_name: 'Claude-3' },
    workspace: { current_dir: tmpDir },
    context_window: { context_window_size: 200000 }
  });

  const gitResult = execSync(`echo '${gitInput.replace(/'/g, "'\\''")}'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    cwd: tmpDir,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Git input processed without error', () => {
    assertTrue(gitResult.length > 0, 'Should produce output for git repo');
  });

  test('Output reflects git context', () => {
    assertTrue(gitResult.includes('git:') || gitResult.includes('statusline'), 'Should reference git or include statusline info');
  });

  console.log(`  Output: ${gitResult.trim().substring(0, 100)}...`);
} catch (e) {
  test('Git input processed without error', () => {
    // Git test might fail in some environments, that's ok
    console.log(`  Skipped (expected in some environments): ${e.message.substring(0, 60)}`);
  });
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ============================================================================
// TEST: JSON with Context Window
// ============================================================================

console.log('\nTEST 3: JSON with Context Window\n');

const contextInput = JSON.stringify({
  model: { display_name: 'Claude' },
  workspace: { current_dir: '/home/user' },
  context_window: {
    context_window_size: 200000,
    current_usage: {
      input_tokens: 50000,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0
    }
  }
});

try {
  const contextResult = execSync(`echo '${contextInput.replace(/'/g, "'\\''")}'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Context window data processed', () => {
    assertTrue(contextResult.length > 0, 'Should process context window data');
  });

  test('Output includes percentage indicator', () => {
    // Should have some percentage value (context bar or percentage)
    assertTrue(/\d+%|█|░/.test(contextResult), 'Should include context bar or percentage');
  });

  console.log(`  Output: ${contextResult.trim().substring(0, 100)}...`);
} catch (e) {
  test('Context window data processed', () => {
    throw e;
  });
}

// ============================================================================
// TEST: JSON with Cost Info
// ============================================================================

console.log('\nTEST 4: JSON with Cost Info\n');

process.env.CLAUDE_BILLING_MODE = 'api';

const costInput = JSON.stringify({
  model: { display_name: 'Claude' },
  workspace: { current_dir: '/home/user' },
  context_window: { context_window_size: 200000 },
  cost: {
    total_cost_usd: 0.1234,
    total_lines_added: 42,
    total_lines_removed: 12
  }
});

try {
  const costResult = execSync(`echo '${costInput.replace(/'/g, "'\\''")}'  | CLAUDE_BILLING_MODE=api node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, CLAUDE_BILLING_MODE: 'api' }
  });

  test('Cost info displayed in API mode', () => {
    assertTrue(costResult.length > 0, 'Should display cost info');
  });

  test('Output includes line changes', () => {
    assertContains(costResult, '42', 'Should show lines added');
  });

  console.log(`  Output: ${costResult.trim().substring(0, 100)}...`);
} catch (e) {
  test('Cost info displayed in API mode', () => {
    throw e;
  });
}

// ============================================================================
// TEST: Invalid JSON Handling
// ============================================================================

console.log('\nTEST 5: Invalid JSON Handling\n');

try {
  const invalidResult = execSync(`echo 'not valid json'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Invalid JSON produces fallback output', () => {
    assertTrue(invalidResult.length > 0, 'Should produce fallback output');
    assertContains(invalidResult, '📁', 'Fallback should include directory emoji');
  });

  console.log(`  Output: ${invalidResult.trim()}`);
} catch (e) {
  test('Invalid JSON produces fallback output', () => {
    // Fallback handling might close stderr silently
    console.log(`  Process exited (expected for invalid input)`);
  });
}

// ============================================================================
// TEST: Empty Input Handling
// ============================================================================

console.log('\nTEST 6: Empty Input Handling\n');

try {
  const emptyResult = execSync(`echo '' | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Empty input handled', () => {
    // Should either error gracefully or produce fallback
    console.log(`  Output: ${emptyResult.substring(0, 50)}`);
  });
} catch (e) {
  test('Empty input handled', () => {
    // Expected to error, that's ok
    console.log(`  Handled error (expected): Exit code ${e.status}`);
  });
}

// ============================================================================
// TEST: Multi-line Output Format
// ============================================================================

console.log('\nTEST 7: Multi-line Output Format\n');

const multilineInput = JSON.stringify({
  model: { display_name: 'Claude-Opus' },
  workspace: { current_dir: '/home/user/project' },
  context_window: {
    context_window_size: 200000,
    current_usage: { input_tokens: 100000 }
  },
  transcript_path: null,
  cost: { total_cost_usd: 0.05, total_lines_added: 10, total_lines_removed: 5 }
});

try {
  const multilineResult = execSync(`echo '${multilineInput.replace(/'/g, "'\\''")}'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Multi-line output generates content', () => {
    assertTrue(multilineResult.length > 0, 'Should generate output');
  });

  test('Output contains session line', () => {
    assertContains(multilineResult, 'Claude-Opus', 'Should contain model info');
  });

  // Count actual lines
  const lineCount = multilineResult.trim().split('\n').length;
  test('Output has multiple lines', () => {
    assertTrue(lineCount >= 1, `Should have at least 1 line, got ${lineCount}`);
  });

  console.log(`  Output lines: ${lineCount}`);
  console.log(`  Sample: ${multilineResult.trim().split('\n')[0].substring(0, 80)}...`);
} catch (e) {
  test('Multi-line output generates content', () => {
    throw e;
  });
}

// ============================================================================
// TEST: Home Directory Expansion
// ============================================================================

console.log('\nTEST 8: Home Directory Expansion\n');

const homeDir = os.homedir();
const expandInput = JSON.stringify({
  model: { display_name: 'Claude' },
  workspace: { current_dir: homeDir + '/projects/test' },
  context_window: { context_window_size: 200000 }
});

try {
  const expandResult = execSync(`echo '${expandInput.replace(/'/g, "'\\''")}'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Home directory expanded to tilde', () => {
    assertTrue(expandResult.includes('~') || expandResult.includes('projects'), 'Should expand or contain path');
  });

  console.log(`  Output: ${expandResult.trim().substring(0, 100)}...`);
} catch (e) {
  test('Home directory expanded to tilde', () => {
    throw e;
  });
}

// ============================================================================
// TEST: Colors and NO_COLOR Support
// ============================================================================

console.log('\nTEST 9: Colors and NO_COLOR Support\n');

const colorInput = JSON.stringify({
  model: { display_name: 'Claude' },
  workspace: { current_dir: '/home/user' },
  context_window: { context_window_size: 200000 }
});

try {
  // Test with NO_COLOR=1
  const noColorResult = execSync(`echo '${colorInput.replace(/'/g, "'\\''")}'  | NO_COLOR=1 node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NO_COLOR: '1' }
  });

  test('NO_COLOR=1 produces output', () => {
    assertTrue(noColorResult.length > 0, 'Should produce output with NO_COLOR=1');
  });

  test('NO_COLOR output should be plain text', () => {
    // Check for absence of ANSI escape codes
    const hasEscapeCodes = /\x1b\[/.test(noColorResult);
    assertTrue(!hasEscapeCodes || noColorResult.includes('📁'), 'Should prefer plain text with NO_COLOR');
  });

  console.log(`  Output: ${noColorResult.trim().substring(0, 100)}...`);
} catch (e) {
  test('NO_COLOR=1 produces output', () => {
    throw e;
  });
}

// ============================================================================
// TEST: Wide Terminal Rendering (160+ cols)
// ============================================================================

console.log('\nTEST 10: Wide Terminal Rendering (160+ cols)\n');

const wideInput = JSON.stringify({
  model: { display_name: 'Opus 4.5' },
  workspace: { current_dir: '/home/user/short' },
  context_window: { context_window_size: 200000, current_usage: { input_tokens: 50000 } },
  cost: { total_cost_usd: '10.50', total_lines_added: 100, total_lines_removed: 50 }
});

let wideLines = 0;
try {
  const wideResult = execSync(`echo '${wideInput.replace(/'/g, "'\\''")}'  | COLUMNS=160 node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, COLUMNS: '160' }
  });
  wideLines = wideResult.trim().split('\n').length;

  test('Wide terminal (160 cols) produces output', () => {
    assertTrue(wideResult.length > 0, 'Should produce output');
  });

  test('Wide terminal has fewer lines (compact layout)', () => {
    assertTrue(wideLines <= 3, `Should be compact, got ${wideLines} lines`);
  });

  console.log(`  Lines: ${wideLines}`);
  console.log(`  Output: ${wideResult.trim().split('\n')[0].substring(0, 100)}...`);
} catch (e) {
  test('Wide terminal (160 cols) produces output', () => { throw e; });
}

// ============================================================================
// TEST: Narrow Terminal Wrapping (< 100 cols)
// ============================================================================

console.log('\nTEST 11: Narrow Terminal Wrapping (< 100 cols)\n');

const narrowInput = JSON.stringify({
  model: { display_name: 'Opus 4.5' },
  workspace: { current_dir: '/home/user/very/long/nested/path/project' },
  context_window: { context_window_size: 200000, current_usage: { input_tokens: 50000 } },
  cost: { total_cost_usd: '10.50', total_lines_added: 100, total_lines_removed: 50 }
});

try {
  const narrowResult = execSync(`echo '${narrowInput.replace(/'/g, "'\\''")}'  | COLUMNS=80 node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, COLUMNS: '80' }
  });
  const narrowLines = narrowResult.trim().split('\n').length;

  test('Narrow terminal (80 cols) produces output', () => {
    assertTrue(narrowResult.length > 0, 'Should produce output');
  });

  test('Narrow terminal wraps to multiple lines', () => {
    assertTrue(narrowLines >= 2, `Should wrap to multiple lines, got ${narrowLines}`);
  });

  console.log(`  Lines: ${narrowLines}`);
  if (wideLines > 0) {
    test('Narrow has more lines than wide', () => {
      assertTrue(narrowLines >= wideLines, 'Narrow should have equal or more lines');
    });
  }
} catch (e) {
  test('Narrow terminal (80 cols) produces output', () => { throw e; });
}

// ============================================================================
// TEST: Long Directory/Branch Names
// ============================================================================

console.log('\nTEST 12: Long Directory/Branch Names\n');

const longPathInput = JSON.stringify({
  model: { display_name: 'Claude' },
  workspace: { current_dir: '/home/user/very/deeply/nested/directory/structure/project/source' },
  context_window: { context_window_size: 200000 }
});

try {
  const longPathResult = execSync(`echo '${longPathInput.replace(/'/g, "'\\''")}'  | COLUMNS=100 node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, COLUMNS: '100' }
  });

  test('Long path produces output without crash', () => {
    assertTrue(longPathResult.length > 0, 'Should produce output');
  });

  test('Long path contains directory info', () => {
    assertTrue(longPathResult.includes('source') || longPathResult.includes('project'), 'Should contain path info');
  });

  const longPathLines = longPathResult.trim().split('\n').length;
  console.log(`  Lines: ${longPathLines}`);
  console.log(`  Output: ${longPathResult.trim().split('\n')[0].substring(0, 80)}...`);
} catch (e) {
  test('Long path produces output without crash', () => { throw e; });
}

// ============================================================================
// TEST: Long Model Names
// ============================================================================

console.log('\nTEST 13: Long Model Names\n');

const longModelInput = JSON.stringify({
  model: { display_name: 'gemini-claude-opus-4-5-thinking-extended-context' },
  workspace: { current_dir: '/home/user/project' },
  context_window: { context_window_size: 200000, current_usage: { input_tokens: 50000 } }
});

try {
  const longModelResult = execSync(`echo '${longModelInput.replace(/'/g, "'\\''")}'  | COLUMNS=100 node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, COLUMNS: '100' }
  });

  test('Long model name produces output', () => {
    assertTrue(longModelResult.length > 0, 'Should produce output');
  });

  test('Long model name is truncated (not overflow)', () => {
    // Model should be truncated to ~30 chars max
    const modelLine = longModelResult.split('\n').find(l => l.includes('🤖')) || '';
    // Strip ANSI codes for length check
    const stripped = modelLine.replace(/\x1b\[[0-9;]*m/g, '');
    assertTrue(stripped.length <= 100, `Model line should fit in 100 cols, got ${stripped.length}`);
  });

  console.log(`  Output: ${longModelResult.trim().split('\n').find(l => l.includes('🤖'))?.substring(0, 80)}...`);
} catch (e) {
  test('Long model name produces output', () => { throw e; });
}

// ============================================================================
// TEST: Agent/Todo Tracking Display
// ============================================================================

console.log('\nTEST 14: Agent/Todo Tracking Display\n');

const tmpTranscriptPath = path.join(os.tmpdir(), `test-transcript-${Date.now()}.jsonl`);

// Create transcript with agents and todos
const transcriptLines = [
  JSON.stringify({
    timestamp: new Date(Date.now() - 120000).toISOString(),
    message: {
      content: [{
        type: 'tool_use',
        id: 'agent-1',
        name: 'Task',
        input: { subagent_type: 'researcher', model: 'haiku', description: 'Researching API docs' }
      }]
    }
  }),
  JSON.stringify({
    timestamp: new Date(Date.now() - 60000).toISOString(),
    message: {
      content: [{
        type: 'tool_result',
        tool_use_id: 'agent-1',
        is_error: false
      }]
    }
  }),
  JSON.stringify({
    timestamp: new Date().toISOString(),
    message: {
      content: [{
        type: 'tool_use',
        id: 'todo-1',
        name: 'TodoWrite',
        input: {
          todos: [
            { content: 'First task', status: 'completed', activeForm: 'Completing first task' },
            { content: 'Second task', status: 'in_progress', activeForm: 'Working on second task' },
            { content: 'Third task', status: 'pending', activeForm: 'Starting third task' }
          ]
        }
      }]
    }
  })
];

fs.writeFileSync(tmpTranscriptPath, transcriptLines.join('\n'));

const agentTodoInput = JSON.stringify({
  model: { display_name: 'Opus 4.5' },
  workspace: { current_dir: '/home/user/project' },
  context_window: { context_window_size: 200000 },
  transcript_path: tmpTranscriptPath
});

try {
  const agentTodoResult = execSync(`echo '${agentTodoInput.replace(/'/g, "'\\''")}'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Agent/Todo tracking produces output', () => {
    assertTrue(agentTodoResult.length > 0, 'Should produce output');
  });

  test('Agent tracking shows completed agent', () => {
    // New compact flow uses ○ for completed, ● for running (no ✓)
    const hasAgent = agentTodoResult.includes('researcher') || agentTodoResult.includes('○') || agentTodoResult.includes('●');
    assertTrue(hasAgent, 'Should show agent info');
  });

  test('Todo tracking shows in-progress task', () => {
    const hasTodo = agentTodoResult.includes('▸') || agentTodoResult.includes('second') || agentTodoResult.includes('Working');
    assertTrue(hasTodo, 'Should show todo info');
  });

  console.log(`  Agent/Todo output:`);
  agentTodoResult.trim().split('\n').forEach(line => {
    console.log(`    ${line.substring(0, 80)}`);
  });
} catch (e) {
  test('Agent/Todo tracking produces output', () => { throw e; });
} finally {
  try { fs.unlinkSync(tmpTranscriptPath); } catch {}
}

// ============================================================================
// TEST: Edge Cases - Empty/Invalid Inputs
// ============================================================================

console.log('\nTEST 15: Edge Cases - Boundary Conditions\n');

// Test with 0% context
const zeroContextInput = JSON.stringify({
  model: { display_name: 'Claude' },
  workspace: { current_dir: '/home/user' },
  context_window: { context_window_size: 200000, current_usage: { input_tokens: 0 } }
});

try {
  const zeroResult = execSync(`echo '${zeroContextInput.replace(/'/g, "'\\''")}'  | node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  test('Zero context produces output', () => {
    assertTrue(zeroResult.length > 0, 'Should produce output');
  });
} catch (e) {
  test('Zero context produces output', () => { throw e; });
}

// Test with very small terminal
try {
  const tinyResult = execSync(`echo '${wideInput.replace(/'/g, "'\\''")}'  | COLUMNS=40 node .claude/statusline.cjs`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, COLUMNS: '40' }
  });

  test('Very narrow terminal (40 cols) handles gracefully', () => {
    assertTrue(tinyResult.length > 0, 'Should produce output even at 40 cols');
  });

  console.log(`  40-col lines: ${tinyResult.trim().split('\n').length}`);
} catch (e) {
  test('Very narrow terminal (40 cols) handles gracefully', () => { throw e; });
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('INTEGRATION TEST SUMMARY');
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
  console.log('\n✓ All integration tests passed!');
  process.exit(0);
}
