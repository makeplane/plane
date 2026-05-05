#!/usr/bin/env node
/**
 * Tests for session-state.cjs hook cache refresh behavior
 * Run: node --test .claude/hooks/__tests__/session-state.test.cjs
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sanitizeActivitySnapshot } = require('../lib/statusline-session-cache.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'session-state.cjs');
const tempFiles = new Set();

function track(filePath) {
  tempFiles.add(filePath);
  return filePath;
}

afterEach(() => {
  for (const filePath of tempFiles) {
    try { fs.rmSync(filePath, { recursive: true, force: true }); } catch {}
  }
  tempFiles.clear();
});

function runHook(inputData) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      cwd: process.cwd(),
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.stdin.write(JSON.stringify(inputData));
    proc.stdin.end();

    proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code }));
    proc.on('error', reject);

    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Hook execution timed out'));
    }, 5000);
  });
}

describe('session-state.cjs', () => {
  it('refreshes cached session activity on task-related PostToolUse events', async () => {
    const sessionId = `session-state-test-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));

    fs.writeFileSync(transcriptPath, [
      JSON.stringify({
        timestamp: new Date(Date.now() - 100000).toISOString(),
        message: {
          content: [{
            type: 'tool_use',
            id: 'task-create-1',
            name: 'TaskCreate',
            input: { subject: 'Implement startup cache' }
          }]
        }
      }),
      JSON.stringify({
        timestamp: new Date(Date.now() - 90000).toISOString(),
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'task-create-1',
            is_error: false,
            content: '{"taskId":"task-604"}'
          }]
        }
      }),
      JSON.stringify({
        timestamp: new Date(Date.now() - 80000).toISOString(),
        message: {
          content: [{
            type: 'tool_use',
            id: 'task-update-1',
            name: 'TaskUpdate',
            input: {
              taskId: 'task-604',
              status: 'in_progress',
              activeForm: 'Implementing startup cache'
            }
          }]
        }
      })
    ].join('\n'));

    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: new Date(Date.now() - 100000).toISOString(),
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        warmed: false,
        agents: [],
        todos: []
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'TaskUpdate',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    assert.match(result.stdout, /continue/, 'PostToolUse should emit continue payload');

    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.warmed, true, 'Statusline cache should be warmed');
    assert.strictEqual(sessionState.statusline.todos.length, 1, 'Should cache current todo state');
    assert.strictEqual(
      sessionState.statusline.todos[0].activeForm,
      'Implementing startup cache',
      'Should cache native task active form from transcript'
    );
  });

  it('reuses the cached transcript path when SubagentStop omits transcript_path', async () => {
    const sessionId = `session-state-subagent-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 100000).toISOString();

    fs.writeFileSync(transcriptPath, JSON.stringify({
      timestamp: startTs,
      message: {
        content: [{
          type: 'tool_use',
          id: 'agent-1',
          name: 'Task',
          input: { subagent_type: 'researcher', description: 'Research startup regressions' }
        }]
      }
    }) + '\n');

    fs.writeFileSync(sessionPath, JSON.stringify({ statusline: { sessionStart: startTs, updatedAt: startTs, warmed: false, agents: [], todos: [] } }, null, 2));

    await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'Task',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    fs.appendFileSync(transcriptPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      message: {
        content: [{
          type: 'tool_result',
          tool_use_id: 'agent-1',
          is_error: false,
          content: 'done'
        }]
      }
    }) + '\n');

    const result = await runHook({
      hook_event_name: 'SubagentStop',
      session_id: sessionId,
      agent_id: 'agent-1',
      agent_type: 'researcher',
      cwd: process.cwd()
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.lastTranscriptPath, transcriptPath, 'Should persist the transcript path for later refreshes');
    assert.strictEqual(sessionState.statusline.agents[0].status, 'completed', 'Should refresh the cached agent status without a direct transcript_path');
  });

  it('marks the matching agent completed on SubagentStop even without any transcript path', async () => {
    const sessionId = `session-state-stop-${Date.now()}`;
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 120000).toISOString();

    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: startTs,
        updatedAt: startTs,
        warmed: true,
        agents: [{ id: 'agent-99', type: 'tester', status: 'running', startTime: startTs, endTime: null }],
        todos: []
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'SubagentStop',
      session_id: sessionId,
      agent_id: 'agent-99',
      agent_type: 'tester',
      cwd: process.cwd()
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.agents[0].status, 'completed', 'Should complete the cached agent from event metadata alone');
    assert.ok(sessionState.statusline.agents[0].endTime, 'Should stamp an end time when completing the cached agent');
  });

  it('preserves a warmed snapshot when transcript parsing yields no activity', async () => {
    const sessionId = `session-state-malformed-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 90000).toISOString();

    fs.writeFileSync(transcriptPath, '{"timestamp":');
    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: startTs,
        updatedAt: startTs,
        warmed: true,
        agents: [],
        todos: [{ id: 'task-1', content: 'Keep current task', status: 'in_progress', activeForm: 'Keeping current task' }]
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'TaskUpdate',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.todos.length, 1, 'Malformed transcript should not wipe the cached todo list');
    assert.strictEqual(sessionState.statusline.todos[0].activeForm, 'Keeping current task', 'Malformed transcript should preserve the existing active task');
  });

  it('preserves a fresher warmed snapshot when the transcript ends with a truncated stale tail', async () => {
    const sessionId = `session-state-truncated-tail-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const olderTs = new Date(Date.now() - 120000).toISOString();
    const newerTs = new Date(Date.now() - 30000).toISOString();

    fs.writeFileSync(transcriptPath, [
      JSON.stringify({
        timestamp: olderTs,
        message: {
          content: [{
            type: 'tool_use',
            id: 'task-create-1',
            name: 'TaskCreate',
            input: { subject: 'Keep fresher cached task' }
          }]
        }
      }),
      JSON.stringify({
        timestamp: olderTs,
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'task-create-1',
            is_error: false,
            content: '{"taskId":"task-fresh"}'
          }]
        }
      }),
      '{"timestamp":"2026-03-31T12:00:00.000Z",'
    ].join('\n'));

    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: olderTs,
        updatedAt: newerTs,
        warmed: true,
        agents: [],
        todos: [{ id: 'task-fresh', content: 'Keep fresher cached task', status: 'in_progress', activeForm: 'Keeping fresher cached task' }]
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'TaskUpdate',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.todos.length, 1, 'Truncated tail should not replace the fresher cached todo');
    assert.strictEqual(sessionState.statusline.todos[0].status, 'in_progress', 'Truncated tail should preserve the fresher cached status');
    assert.strictEqual(sessionState.statusline.todos[0].activeForm, 'Keeping fresher cached task', 'Truncated tail should preserve the fresher cached active form');
  });

  it('does not let a slower stale transcript overwrite a fresher cached snapshot', async () => {
    const sessionId = `session-state-race-${Date.now()}`;
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const olderTranscriptPath = track(path.join(os.tmpdir(), `${sessionId}-older.jsonl`));
    const newerTranscriptPath = track(path.join(os.tmpdir(), `${sessionId}-newer.jsonl`));
    const olderTs = new Date(Date.now() - 120000).toISOString();
    const newerTs = new Date(Date.now() - 10000).toISOString();
    const parserPath = require.resolve('../lib/transcript-parser.cjs');
    const managerPath = require.resolve('../lib/session-state-manager.cjs');

    fs.writeFileSync(olderTranscriptPath, '{}\n');
    fs.writeFileSync(newerTranscriptPath, '{}\n');
    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: olderTs,
        updatedAt: olderTs,
        warmed: true,
        agents: [],
        todos: [{ id: 'task-base', content: 'Base task', status: 'pending', activeForm: 'Base task' }]
      }
    }, null, 2));

    const parserModule = require(parserPath);
    const originalParseTranscript = parserModule.parseTranscript;
    parserModule.parseTranscript = async (transcriptPath) => {
      if (transcriptPath === olderTranscriptPath) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        return {
          sessionStart: olderTs,
          agents: [],
          todos: [{ id: 'task-old', content: 'Older task', status: 'pending', activeForm: 'Older task' }],
          invalidLineCount: 0,
          statuslineActivityCount: 1,
          lastActivityAt: olderTs,
          lastValidEntryAt: olderTs
        };
      }

      if (transcriptPath === newerTranscriptPath) {
        return {
          sessionStart: olderTs,
          agents: [],
          todos: [{ id: 'task-new', content: 'Newer task', status: 'in_progress', activeForm: 'Newer task' }],
          invalidLineCount: 0,
          statuslineActivityCount: 1,
          lastActivityAt: newerTs,
          lastValidEntryAt: newerTs
        };
      }

      return originalParseTranscript(transcriptPath);
    };

    delete require.cache[managerPath];
    const { refreshStatuslineSnapshot } = require('../lib/session-state-manager.cjs');

    try {
      const olderRefresh = refreshStatuslineSnapshot({
        session_id: sessionId,
        transcript_path: olderTranscriptPath
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const newerRefresh = refreshStatuslineSnapshot({
        session_id: sessionId,
        transcript_path: newerTranscriptPath
      });

      const [olderResult, newerResult] = await Promise.all([olderRefresh, newerRefresh]);
      assert.strictEqual(olderResult.success, true, 'Older refresh should still succeed');
      assert.strictEqual(newerResult.success, true, 'Newer refresh should succeed');

      const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      assert.strictEqual(sessionState.statusline.todos.length, 1, 'Should keep a single current todo snapshot');
      assert.strictEqual(sessionState.statusline.todos[0].id, 'task-new', 'Slower stale refresh should not overwrite the newer todo');
      assert.strictEqual(sessionState.statusline.todos[0].activeForm, 'Newer task', 'Slower stale refresh should preserve the fresher active form');
      assert.strictEqual(sessionState.lastTranscriptPath, newerTranscriptPath, 'Slower stale refresh should not regress the cached transcript path');
    } finally {
      parserModule.parseTranscript = originalParseTranscript;
      delete require.cache[managerPath];
    }
  });

  it('does not truncate todo snapshots', () => {
    const todos = Array.from({ length: 30 }, (_, index) => ({
      id: `task-${index + 1}`,
      content: `Task ${index + 1}`,
      status: index === 0 ? 'in_progress' : 'pending',
      activeForm: index === 0 ? 'Working task 1' : null
    }));

    const snapshot = sanitizeActivitySnapshot({
      sessionStart: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      warmed: true,
      agents: [],
      todos
    });

    assert.strictEqual(snapshot.todos.length, 30, 'Todo cache should keep the full task set');
    assert.strictEqual(snapshot.todos[0].status, 'in_progress', 'Todo cache should preserve the active task');
  });

  it('allows a valid empty TodoWrite snapshot to clear cached todos', async () => {
    const sessionId = `session-state-clear-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 90000).toISOString();

    fs.writeFileSync(transcriptPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      message: {
        content: [{
          type: 'tool_use',
          id: 'todo-write-1',
          name: 'TodoWrite',
          input: { todos: [] }
        }]
      }
    }) + '\n');

    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: startTs,
        updatedAt: startTs,
        warmed: true,
        agents: [],
        todos: [{ id: 'task-old', content: 'Old task', status: 'in_progress', activeForm: 'Old task' }]
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'TodoWrite',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.todos.length, 0, 'A valid empty TodoWrite should clear the cached todo list');
  });
});
