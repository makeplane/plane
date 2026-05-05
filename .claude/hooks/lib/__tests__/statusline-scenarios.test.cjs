#!/usr/bin/env node
'use strict';

/**
 * Statusline Scenario Suite
 *
 * Focus:
 * - Cross-platform path handling (Linux/macOS/Windows/WSL-like paths)
 * - User-facing configuration modes (none/minimal/compact/full)
 * - Slow stdin / timeout behavior
 * - Usage cache handling
 * - Native Task API transcript flows
 * - Terminal width layout behavior
 *
 * Run:
 *   node .claude/hooks/lib/__tests__/statusline-scenarios.test.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const TEST_ROOT = path.resolve(__dirname, '../../../..');
const STATUSLINE_PATH = path.resolve(__dirname, '../../..', 'statusline.cjs');
const USAGE_CACHE_PATH = path.join(os.tmpdir(), `ck-usage-limits-cache-statusline-test-${process.pid}.json`);

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
    failures.push({ name, error: error.message });
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertContains(actual, expected, message) {
  if (!actual.includes(expected)) {
    throw new Error(
      `${message || 'Missing expected string'}\nExpected: ${expected}\nActual: ${actual}`
    );
  }
}

function assertMatch(actual, pattern, message) {
  if (!pattern.test(actual)) {
    throw new Error(
      `${message || 'Pattern did not match'}\nPattern: ${pattern}\nActual: ${actual}`
    );
  }
}

function assertLineCountBetween(output, min, max, message) {
  const lineCount = output.replace(/\n+$/, '').split('\n').length;
  if (lineCount < min || lineCount > max) {
    throw new Error(
      `${message || 'Line count mismatch'}\nExpected: ${min}-${max}\nActual: ${lineCount}\nOutput:\n${output}`
    );
  }
}

function assertSuccessfulRun(result, messagePrefix) {
  assertTrue(result.status === 0, `${messagePrefix || 'Statusline run'} should exit with status 0`);
  assertTrue(
    (result.stderr || '').trim() === '',
    `${messagePrefix || 'Statusline run'} should not write stderr${result.stderr ? `\nStderr: ${result.stderr}` : ''}`
  );
}

function runStatuslineSync({ payload, cwd = TEST_ROOT, env = {}, inputRaw = null, timeoutMs = 20000 }) {
  const input = inputRaw == null ? JSON.stringify(payload || {}) : inputRaw;
  const eligibilityCachePath = env.CK_USAGE_ELIGIBILITY_CACHE_PATH
    || path.join(os.tmpdir(), `ck-usage-eligibility-statusline-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const runtimeEnv = {
    ...process.env,
    CK_USAGE_CACHE_PATH: USAGE_CACHE_PATH,
    CK_USAGE_ELIGIBILITY_CACHE_PATH: eligibilityCachePath,
    ...env
  };
  if (!Object.prototype.hasOwnProperty.call(env, 'NO_COLOR')) delete runtimeEnv.NO_COLOR;
  if (!Object.prototype.hasOwnProperty.call(env, 'HOME') && fs.existsSync(path.join(cwd, '.claude', '.ck.json'))) {
    runtimeEnv.HOME = cwd;
  }
  const result = spawnSync('node', [STATUSLINE_PATH], {
    cwd,
    encoding: 'utf8',
    input,
    timeout: timeoutMs,
    env: runtimeEnv
  });
  if (result.error) {
    throw result.error;
  }
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function runStatuslineWithDelayedChunks({ chunks, delaysMs, cwd = TEST_ROOT, env = {}, timeoutMs = 30000 }) {
  return new Promise((resolve, reject) => {
    const eligibilityCachePath = env.CK_USAGE_ELIGIBILITY_CACHE_PATH
      || path.join(os.tmpdir(), `ck-usage-eligibility-statusline-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    const runtimeEnv = {
      ...process.env,
      CK_USAGE_CACHE_PATH: USAGE_CACHE_PATH,
      CK_USAGE_ELIGIBILITY_CACHE_PATH: eligibilityCachePath,
      ...env
    };
    if (!Object.prototype.hasOwnProperty.call(env, 'NO_COLOR')) delete runtimeEnv.NO_COLOR;
    if (!Object.prototype.hasOwnProperty.call(env, 'HOME') && fs.existsSync(path.join(cwd, '.claude', '.ck.json'))) {
      runtimeEnv.HOME = cwd;
    }
    const child = spawn('node', [STATUSLINE_PATH], {
      cwd,
      env: runtimeEnv,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    const killTimer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (err) => {
      clearTimeout(killTimer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(killTimer);
      resolve({ status: code, stdout, stderr });
    });

    let i = 0;
    const writeNext = () => {
      if (i >= chunks.length) {
        child.stdin.end();
        return;
      }
      child.stdin.write(chunks[i]);
      const delay = delaysMs[i] || 0;
      i++;
      setTimeout(writeNext, delay);
    };
    writeNext();
  });
}

function createTempConfigProject(mode, extraConfig = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `statusline-mode-${mode}-`));
  const ckDir = path.join(tmpDir, '.claude');
  fs.mkdirSync(ckDir, { recursive: true });
  fs.writeFileSync(
    path.join(ckDir, '.ck.json'),
    JSON.stringify({ statusline: mode, statuslineQuota: true, ...extraConfig }, null, 2)
  );
  return tmpDir;
}

function withTempConfigProject(mode, extraConfig, fn) {
  const tmpDir = createTempConfigProject(mode, extraConfig);
  try {
    return fn(tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function withUsageCache(payload, fn) {
  const backup = fs.existsSync(USAGE_CACHE_PATH)
    ? fs.readFileSync(USAGE_CACHE_PATH, 'utf8')
    : null;

  try {
    fs.writeFileSync(USAGE_CACHE_PATH, JSON.stringify(payload));
    return fn();
  } finally {
    if (backup == null) {
      try { fs.unlinkSync(USAGE_CACHE_PATH); } catch {}
    } else {
      fs.writeFileSync(USAGE_CACHE_PATH, backup);
    }
  }
}

function withQuotaEligibilityCache(payload, fn) {
  const cachePath = path.join(
    os.tmpdir(),
    `ck-usage-eligibility-statusline-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
  );

  try {
    fs.writeFileSync(cachePath, JSON.stringify(payload));
    return fn({ CK_USAGE_ELIGIBILITY_CACHE_PATH: cachePath });
  } finally {
    try { fs.unlinkSync(cachePath); } catch {}
  }
}

function mkTranscript(lines) {
  const p = path.join(os.tmpdir(), `statusline-scenario-transcript-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`);
  fs.writeFileSync(p, lines.map((line) => JSON.stringify(line)).join('\n'));
  return p;
}

function writeSessionStateFile(sessionId, state) {
  const sessionPath = path.join(os.tmpdir(), `ck-session-${sessionId}.json`);
  fs.writeFileSync(sessionPath, JSON.stringify(state, null, 2));
  return sessionPath;
}

async function main() {
  console.log('\n==============================================');
  console.log('STATUSLINE SCENARIO SUITE');
  console.log('==============================================\n');

  await test('Linux/macOS path output works', async () => {
    const payload = {
      model: { display_name: 'Claude' },
      workspace: { current_dir: '/home/user/project' },
      context_window: { context_window_size: 200000 }
    };
    const result = runStatuslineSync({ payload });
    assertSuccessfulRun(result, 'Linux/macOS path scenario');
    const { stdout } = result;
    assertContains(stdout, '/home/user/project', 'Should display Unix-style path');
  });

  await test('Windows drive-letter path output works', async () => {
    const payload = {
      model: { display_name: 'Claude' },
      workspace: { current_dir: 'D:\\statusline-test\\project' },
      context_window: { context_window_size: 200000 }
    };
    const result = runStatuslineSync({ payload });
    assertSuccessfulRun(result, 'Windows drive path scenario');
    const { stdout } = result;
    assertContains(stdout, 'D:\\statusline-test\\project', 'Should preserve Windows path');
  });

  await test('Windows UNC path output works', async () => {
    const payload = {
      model: { display_name: 'Claude' },
      workspace: { current_dir: '\\\\server\\share\\repo' },
      context_window: { context_window_size: 200000 }
    };
    const result = runStatuslineSync({ payload });
    assertSuccessfulRun(result, 'Windows UNC path scenario');
    const { stdout } = result;
    assertContains(stdout, '\\\\server\\share\\repo', 'Should preserve UNC path');
  });

  await test('WSL-style path output works', async () => {
    const payload = {
      model: { display_name: 'Claude' },
      workspace: { current_dir: '/mnt/c/Users/kai/project' },
      context_window: { context_window_size: 200000 }
    };
    const result = runStatuslineSync({ payload });
    assertSuccessfulRun(result, 'WSL path scenario');
    const { stdout } = result;
    assertContains(stdout, '/mnt/c/Users/kai/project', 'Should preserve WSL path');
  });

  await test('Home path is expanded to ~ for current OS homedir', async () => {
    const payload = {
      model: { display_name: 'Claude' },
      workspace: { current_dir: path.join(os.homedir(), 'projects', 'test') },
      context_window: { context_window_size: 200000 }
    };
    const result = runStatuslineSync({ payload });
    assertSuccessfulRun(result, 'Home path expansion scenario');
    const stripped = result.stdout.replace(/\x1b\[[0-9;]*m/g, '');
    assertTrue(
      stripped.includes('~/projects/test') || stripped.includes(path.join(os.homedir(), 'projects', 'test')),
      `Should preserve or compress the homedir path\nActual: ${stripped}`
    );
  });

  await test('Mode none produces empty output', async () => {
    const tmpDir = createTempConfigProject('none');
    try {
      const payload = {
        model: { display_name: 'Claude' },
        workspace: { current_dir: '/tmp' },
        context_window: { context_window_size: 200000 }
      };
      const result = runStatuslineSync({ payload, cwd: tmpDir });
      assertSuccessfulRun(result, 'Mode none scenario');
      const { stdout } = result;
      assertTrue(stdout.trim() === '', 'Mode none should produce empty output');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Mode minimal keeps output to one line', async () => {
    const tmpDir = createTempConfigProject('minimal');
    try {
      const payload = {
        model: { display_name: 'Claude' },
        workspace: { current_dir: '/tmp' },
        context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
      };
      const result = runStatuslineSync({ payload, cwd: tmpDir });
      assertSuccessfulRun(result, 'Mode minimal scenario');
      const { stdout } = result;
      assertLineCountBetween(stdout, 1, 1, 'Minimal mode should be single-line');
      assertContains(stdout, '/tmp', 'Minimal mode should still include workspace info');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Minimal mode honors explicit context and quota theme overrides', async () => {
    const tmpDir = createTempConfigProject('minimal', {
      statuslineLayout: {
        theme: {
          contextLow: 'brightGreen',
          contextMid: 'brightYellow',
          contextHigh: 'brightMagenta',
          quotaLow: 'yellow',
          quotaHigh: 'brightRed'
        }
      }
    });

    try {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date().toISOString(),
            fiveHourPercent: 91,
            weekPercent: 38
          },
          data: {
            five_hour: {
              utilization: 91,
              resets_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
            },
            seven_day: {
              utilization: 38,
              resets_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 180000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'Minimal theme override scenario');
          assertContains(result.stdout, '\x1b[95m🔋', 'Minimal context indicator should honor the explicit high-usage theme color');
          assertContains(result.stdout, '\x1b[91m5h 91%', 'Minimal quota text should honor the explicit high-usage theme color');
        });
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Mode compact keeps output to two lines', async () => {
    const tmpDir = createTempConfigProject('compact');
    try {
      const payload = {
        model: { display_name: 'Claude' },
        workspace: { current_dir: '/tmp' },
        context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
      };
      const result = runStatuslineSync({ payload, cwd: tmpDir });
      assertSuccessfulRun(result, 'Mode compact scenario');
      const { stdout } = result;
      assertLineCountBetween(stdout, 2, 2, 'Compact mode should be exactly two lines');
      assertContains(stdout, 'Claude', 'Compact mode should include model');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Default/full mode includes model and path', async () => {
    const payload = {
      model: { display_name: 'Claude' },
      workspace: { current_dir: '/tmp/full-mode' },
      context_window: { context_window_size: 200000, current_usage: { input_tokens: 50000 } }
    };
    const result = runStatuslineSync({ payload });
    assertSuccessfulRun(result, 'Default/full mode scenario');
    const { stdout } = result;
    assertContains(stdout, 'Claude', 'Full mode should include model');
    assertContains(stdout, '/tmp/full-mode', 'Full mode should include directory');
  });

  await test('Custom context and quota theme colors are emitted in ANSI output', async () => {
    const tmpDir = createTempConfigProject('full', {
      statuslineLayout: {
        lines: [['context', 'quota']],
        theme: {
          contextLow: 'brightGreen',
          quotaLow: 'yellow',
          quotaHigh: 'red'
        }
      }
    });

    try {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date().toISOString(),
            fiveHourPercent: 91,
            weekPercent: 38
          },
          data: {
            five_hour: {
              utilization: 91,
              resets_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
            },
            seven_day: {
              utilization: 38,
              resets_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 8000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'Theme color override scenario');
          assertContains(result.stdout, '\x1b[92m', 'Context low color should use brightGreen');
          assertContains(result.stdout, '\x1b[31m5h 91%', 'Quota high color should use the configured red tint');
        });
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Quota stays dim when no explicit quota palette is configured', async () => {
    const tmpDir = createTempConfigProject('full', {
      statuslineLayout: {
        lines: [['quota']]
      }
    });

    try {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date().toISOString(),
            fiveHourPercent: 91,
            weekPercent: 38
          },
          data: {
            five_hour: {
              utilization: 91,
              resets_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
            },
            seven_day: {
              utilization: 38,
              resets_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 8000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'Default quota tint scenario');
          assertContains(result.stdout, '\x1b[2m5h 91%', 'Quota should stay muted unless the user explicitly overrides its palette');
        });
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Configured todo icon and color are applied to activity lines', async () => {
    const tmpDir = createTempConfigProject('full', {
      statuslineLayout: {
        lines: [['todos']],
        sectionConfig: {
          todos: {
            icon: '✅',
            color: 'brightGreen'
          }
        }
      }
    });
    const sessionId = `statusline-todo-${Date.now()}`;
    const sessionPath = writeSessionStateFile(sessionId, {
      statusline: {
        sessionStart: new Date(Date.now() - 120000).toISOString(),
        updatedAt: new Date().toISOString(),
        warmed: true,
        agents: [],
        todos: [
          { content: 'First task', status: 'completed', activeForm: 'First task done' },
          { content: 'Second task', status: 'in_progress', activeForm: 'Working on second task' },
          { content: 'Third task', status: 'pending', activeForm: 'Starting third task' }
        ]
      }
    });

    try {
      const payload = {
        session_id: sessionId,
        model: { display_name: 'Claude' },
        workspace: { current_dir: tmpDir },
        context_window: { context_window_size: 200000 }
      };
      const result = runStatuslineSync({ payload, cwd: tmpDir });
      assertSuccessfulRun(result, 'Todo section override scenario');
      assertContains(result.stdout, '✅', 'Todo line should use the configured icon');
      assertContains(result.stdout, '\x1b[92m', 'Todo line should use the configured brightGreen color');
      assertContains(result.stdout, 'Working on second task', 'Todo line should show the in-progress task');
    } finally {
      try { fs.unlinkSync(sessionPath); } catch {}
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Legacy sections[] still picks up top-level todo sectionConfig overrides', async () => {
    const tmpDir = createTempConfigProject('full', {
      statuslineLayout: {
        sections: [
          { id: 'todos', enabled: true, order: 0 }
        ],
        sectionConfig: {
          todos: {
            icon: '✅',
            color: 'brightGreen'
          }
        }
      }
    });
    const sessionId = `statusline-legacy-todo-${Date.now()}`;
    const sessionPath = writeSessionStateFile(sessionId, {
      statusline: {
        sessionStart: new Date(Date.now() - 120000).toISOString(),
        updatedAt: new Date().toISOString(),
        warmed: true,
        agents: [],
        todos: [
          { content: 'First task', status: 'completed', activeForm: 'First task done' },
          { content: 'Second task', status: 'in_progress', activeForm: 'Working on second task' }
        ]
      }
    });

    try {
      const payload = {
        session_id: sessionId,
        model: { display_name: 'Claude' },
        workspace: { current_dir: tmpDir },
        context_window: { context_window_size: 200000 }
      };
      const result = runStatuslineSync({ payload, cwd: tmpDir });
      assertSuccessfulRun(result, 'Legacy todo override scenario');
      assertContains(result.stdout, '✅', 'Legacy sections[] config should still honor the configured todo icon');
      assertContains(result.stdout, '\x1b[92m', 'Legacy sections[] config should still honor the configured todo color');
      assertContains(result.stdout, 'Working on second task', 'Legacy sections[] config should still render the active todo');
    } finally {
      try { fs.unlinkSync(sessionPath); } catch {}
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Configured agent color is applied when agent flow is rendered', async () => {
    const tmpDir = createTempConfigProject('full', {
      statuslineLayout: {
        lines: [['agents']],
        sectionConfig: {
          agents: {
            color: 'brightYellow'
          }
        }
      }
    });
    const sessionId = `statusline-agent-${Date.now()}`;
    const sessionPath = writeSessionStateFile(sessionId, {
      statusline: {
        sessionStart: new Date(Date.now() - 180000).toISOString(),
        updatedAt: new Date().toISOString(),
        warmed: true,
        agents: [
          {
            id: 'agent-1',
            type: 'planner',
            model: 'haiku',
            description: 'Planning the statusline fix',
            status: 'completed',
            startTime: new Date(Date.now() - 180000).toISOString(),
            endTime: new Date(Date.now() - 120000).toISOString()
          }
        ],
        todos: []
      }
    });

    try {
      const payload = {
        session_id: sessionId,
        model: { display_name: 'Claude' },
        workspace: { current_dir: tmpDir },
        context_window: { context_window_size: 200000 }
      };
      const result = runStatuslineSync({ payload, cwd: tmpDir });
      assertSuccessfulRun(result, 'Agent section override scenario');
      assertContains(result.stdout, '\x1b[93m', 'Agent line should use the configured brightYellow color');
      assertContains(result.stdout, 'planner', 'Agent flow should include the agent type');
    } finally {
      try { fs.unlinkSync(sessionPath); } catch {}
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('Default stdin handling supports slow chunked input (>5s)', async () => {
    const result = await runStatuslineWithDelayedChunks({
      chunks: [
        '{"model":{"display_name":"Claude"}',
        ',"workspace":{"current_dir":"/tmp/slow-input-ok"},"context_window":{"context_window_size":200000}}'
      ],
      delaysMs: [5500, 0]
    });
    assertTrue(result.status === 0, 'Slow chunk input should still exit successfully');
    assertTrue(result.stderr.trim() === '', 'Slow chunk input should not emit stderr');
    assertContains(result.stdout, '/tmp/slow-input-ok', 'Slow input should still parse without forced fallback');
  });

  await test('Optional stdin timeout forces fallback when enabled', async () => {
    const result = await runStatuslineWithDelayedChunks({
      chunks: [
        '{"model":{"display_name":"Claude"}',
        ',"workspace":{"current_dir":"/tmp/slow-input-timeout"},"context_window":{"context_window_size":200000}}'
      ],
      delaysMs: [400, 0],
      env: { CK_STATUSLINE_STDIN_TIMEOUT_MS: '100' }
    });
    assertTrue(result.status === 0, 'Timeout fallback path should still exit successfully');
    assertTrue(result.stderr.trim() === '', 'Timeout fallback path should not emit stderr');
    assertContains(result.stdout, TEST_ROOT, 'Timeout path should fall back to cwd');
  });

  await test('Usage cache unavailable suppresses reset string gracefully', async () => {
    withUsageCache({
      timestamp: Date.now(),
      status: 'unavailable',
      data: null
    }, () => {
      const payload = {
        model: { display_name: 'Claude' },
        workspace: { current_dir: '/tmp' },
        context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
      };
      const result = runStatuslineSync({ payload });
      assertSuccessfulRun(result, 'Usage unavailable scenario');
      const { stdout } = result;
      assertTrue(stdout.length > 0, 'Unavailable usage cache should still render statusline');
      assertTrue(!stdout.includes('until reset') && !stdout.includes(' left'), 'Unavailable usage should not render reset countdown text');
    });
  });

  await test('Usage cache available shows 5h and wk cosmetic chips', async () => {
    withTempConfigProject('full', {}, (tmpDir) => {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date().toISOString(),
            fiveHourPercent: 38,
            weekPercent: 19
          },
          data: {
            five_hour: {
              utilization: 38,
              resets_at: new Date(Date.now() + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString()
            },
            seven_day: {
              utilization: 19,
              resets_at: new Date(Date.now() + 6 * 24 * 3600 * 1000 + 5 * 3600 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'Usage available scenario');
          const { stdout } = result;
          assertContains(stdout, '5h 38%', 'Available usage should show the 5h utilization');
          assertContains(stdout, 'wk 19%', 'Available usage should show the weekly utilization');
          assertMatch(stdout, /\(\d+[mhd]/, 'Available usage should show the countdown text when reset data is present');
        });
      });
    });
  });

  await test('Usage cache falls back to legacy raw payload when snapshot is absent', async () => {
    withTempConfigProject('full', {}, (tmpDir) => {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          data: {
            five_hour: {
              utilization: 36,
              resets_at: new Date(Date.now() + 90 * 60 * 1000).toISOString()
            },
            seven_day: {
              utilization: 18,
              resets_at: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'Legacy usage fallback scenario');
          assertContains(result.stdout, '5h 36%', 'Legacy raw cache should still render the 5h chip');
          assertContains(result.stdout, 'wk 18%', 'Legacy raw cache should still render the weekly chip');
        });
      });
    });
  });

  await test('Stale usage cache hides cosmetic chips instead of rendering old percentages forever', async () => {
    withTempConfigProject('full', {}, (tmpDir) => {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now() - 10 * 60 * 1000,
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            fiveHourPercent: 41,
            weekPercent: 22
          },
          data: {
            five_hour: {
              utilization: 41,
              resets_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            },
            seven_day: {
              utilization: 22,
              resets_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'Stale usage cache scenario');
          assertTrue(!result.stdout.includes('5h 41%'), 'Stale cache should suppress the 5h chip');
          assertTrue(!result.stdout.includes('wk 22%'), 'Stale cache should suppress the weekly chip');
        });
      });
    });
  });

  await test('Usage display is decoupled from usage-context-awareness config gating', async () => {
    const tmpDir = createTempConfigProject('full', {
      hooks: {
        'usage-context-awareness': false
      }
    });

    try {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date().toISOString(),
            fiveHourPercent: 37,
            weekPercent: 19
          },
          data: {
            five_hour: {
              utilization: 37,
              resets_at: new Date(Date.now() + 2 * 3600 * 1000 + 10 * 60 * 1000).toISOString()
            },
            seven_day: {
              utilization: 19,
              resets_at: new Date(Date.now() + 5 * 24 * 3600 * 1000 + 12 * 3600 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'Usage decoupling scenario');
          assertContains(result.stdout, '5h 37%', 'Statusline should keep cosmetic 5h display even when the hook is disabled');
          assertContains(result.stdout, 'wk 19%', 'Statusline should keep cosmetic weekly display even when the hook is disabled');
        });
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('statuslineQuota=false hides cosmetic usage chips without changing the rest of the statusline', async () => {
    const tmpDir = createTempConfigProject('full', {
      statuslineQuota: false
    });

    try {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date().toISOString(),
            fiveHourPercent: 37,
            weekPercent: 19
          },
          data: {
            five_hour: {
              utilization: 37,
              resets_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
            },
            seven_day: {
              utilization: 19,
              resets_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
          };
          const result = runStatuslineSync({ payload, cwd: tmpDir, env });
          assertSuccessfulRun(result, 'statuslineQuota=false scenario');
          assertTrue(!result.stdout.includes('5h 37%'), 'Quota toggle should hide the 5h chip');
          assertTrue(!result.stdout.includes('wk 19%'), 'Quota toggle should hide the weekly chip');
          assertContains(result.stdout, '🤖', 'Other statusline content should still render');
        });
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await test('third-party Anthropic runtime override hides quota chips even with a fresh native cache', async () => {
    withTempConfigProject('full', {}, (tmpDir) => {
      withQuotaEligibilityCache({ timestamp: Date.now(), eligible: true, note: 'eligible' }, (env) => {
        withUsageCache({
          timestamp: Date.now(),
          status: 'available',
          snapshot: {
            sourceVersion: 1,
            fetchedAt: new Date().toISOString(),
            fiveHourPercent: 52,
            weekPercent: 18
          },
          data: {
            five_hour: {
              utilization: 52,
              resets_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString()
            },
            seven_day: {
              utilization: 18,
              resets_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString()
            }
          }
        }, () => {
          const payload = {
            model: { display_name: 'Claude' },
            workspace: { current_dir: tmpDir },
            context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
          };
          const result = runStatuslineSync({
            payload,
            cwd: tmpDir,
            env: {
              ...env,
              ANTHROPIC_BASE_URL: 'http://127.0.0.1:8317/api/provider/gemini',
              ANTHROPIC_AUTH_TOKEN: 'ccs-managed'
            }
          });
          assertSuccessfulRun(result, 'Third-party runtime override scenario');
          assertTrue(!result.stdout.includes('5h 52%'), 'Third-party runtime should auto-hide the 5h chip');
          assertTrue(!result.stdout.includes('wk 18%'), 'Third-party runtime should auto-hide the weekly chip');
          assertContains(result.stdout, '🤖', 'Other statusline content should still render');
        });
      });
    });
  });

  await test('Native TaskCreate/TaskUpdate flow is rendered', async () => {
    const sessionId = `native-task-${Date.now()}`;
    const sessionPath = writeSessionStateFile(sessionId, {
      statusline: {
        sessionStart: new Date(Date.now() - 120000).toISOString(),
        updatedAt: new Date().toISOString(),
        warmed: true,
        agents: [],
        todos: [
          {
            id: 'task-001',
            content: 'Implement auth flow',
            status: 'in_progress',
            activeForm: 'Implementing auth flow'
          }
        ]
      }
    });

    try {
      const payload = {
        session_id: sessionId,
        model: { display_name: 'Claude' },
        workspace: { current_dir: '/tmp/project' },
        context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
      };
      const result = runStatuslineSync({ payload });
      assertSuccessfulRun(result, 'Native TaskCreate/TaskUpdate scenario');
      const { stdout } = result;
      assertContains(stdout, 'Implementing auth flow', 'Native task activeForm should be shown');
    } finally {
      try { fs.unlinkSync(sessionPath); } catch {}
    }
  });

  await test('Mixed TodoWrite + Native TaskUpdate keeps legacy todo unchanged', async () => {
    const sessionId = `mixed-task-${Date.now()}`;
    const sessionPath = writeSessionStateFile(sessionId, {
      statusline: {
        sessionStart: new Date(Date.now() - 120000).toISOString(),
        updatedAt: new Date().toISOString(),
        warmed: true,
        agents: [],
        todos: [
          { content: 'Legacy first', status: 'pending' },
          { content: 'Legacy second', status: 'pending' },
          {
            id: 'task-001',
            content: 'Native first',
            status: 'in_progress',
            activeForm: 'Working native first'
          }
        ]
      }
    });

    try {
      const payload = {
        session_id: sessionId,
        model: { display_name: 'Claude' },
        workspace: { current_dir: '/tmp/project' },
        context_window: { context_window_size: 200000, current_usage: { input_tokens: 1000 } }
      };
      const result = runStatuslineSync({ payload });
      assertSuccessfulRun(result, 'Mixed native/legacy transcript scenario');
      const { stdout } = result;
      assertContains(stdout, 'Working native first', 'Native fallback should map to native tasks, not legacy TodoWrite');
      assertTrue(!stdout.includes('Legacy first'), 'Legacy TodoWrite item should not be promoted to active task');
      assertTrue(!stdout.includes('Legacy second'), 'Legacy TodoWrite list should not leak into native active line');
    } finally {
      try { fs.unlinkSync(sessionPath); } catch {}
    }
  });

  await test('Wide terminal keeps layout compact', async () => {
    const payload = {
      model: { display_name: 'Opus 4.5' },
      workspace: { current_dir: '/tmp/short' },
      context_window: { context_window_size: 200000, current_usage: { input_tokens: 50000 } },
      cost: { total_lines_added: 10, total_lines_removed: 5 }
    };
    const result = runStatuslineSync({ payload, env: { COLUMNS: '180' } });
    assertSuccessfulRun(result, 'Wide terminal scenario');
    const { stdout } = result;
    assertLineCountBetween(stdout, 1, 3, 'Wide layout should avoid excessive wrapping');
    assertContains(stdout, '/tmp/short', 'Wide layout should still include directory');
  });

  await test('Narrow terminal wraps long unicode path without crashing', async () => {
    const payload = {
      model: { display_name: 'Claude' },
      workspace: { current_dir: '/tmp/工程工程工程/e\u0301/🤖/very/long/path/segment' },
      context_window: { context_window_size: 200000, current_usage: { input_tokens: 50000 } }
    };
    const result = runStatuslineSync({ payload, env: { COLUMNS: '50' } });
    assertSuccessfulRun(result, 'Narrow terminal scenario');
    const { stdout } = result;
    assertTrue(stdout.length > 0, 'Should render output in narrow mode');
    assertTrue(stdout.split('\n').length >= 2, 'Narrow width should wrap to multiple lines');
  });

  console.log('\n==============================================');
  console.log('SCENARIO TEST SUMMARY');
  console.log('==============================================');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`- ${f.name}: ${f.error.split('\n')[0]}`);
    }
    process.exit(1);
  }

  console.log('\n✓ All scenario tests passed!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
