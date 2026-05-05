#!/usr/bin/env node
/**
 * Tests for task-completed-handler.cjs hook
 * Run: node --test .claude/hooks/__tests__/task-completed-handler.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOK_PATH = path.join(__dirname, '..', 'task-completed-handler.cjs');

/**
 * Execute hook with given stdin data and return parsed output
 */
function runHook(inputData, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      cwd: process.cwd(),
      env: { ...process.env, ...(options.env || {}) }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    if (inputData !== null && inputData !== undefined) {
      proc.stdin.write(typeof inputData === 'string' ? inputData : JSON.stringify(inputData));
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      let output = null;
      try { output = JSON.parse(stdout); } catch { /* non-JSON ok */ }
      resolve({ stdout, stderr, exitCode: code, output });
    });

    proc.on('error', reject);
    setTimeout(() => { proc.kill('SIGTERM'); reject(new Error('Timeout')); }, 10000);
  });
}

/**
 * Create temp team with task files for testing
 */
function createTestTeam(baseDir, teamName, tasks) {
  const taskDir = path.join(baseDir, '.claude', 'tasks', teamName);
  fs.mkdirSync(taskDir, { recursive: true });
  for (const task of tasks) {
    fs.writeFileSync(path.join(taskDir, `${task.id}.json`), JSON.stringify(task));
  }
  return taskDir;
}

describe('task-completed-handler.cjs', () => {

  describe('Fail-open behavior', () => {

    it('exits 0 on empty stdin', async () => {
      const result = await runHook(null);
      assert.strictEqual(result.exitCode, 0);
    });

    it('exits 0 on invalid JSON', async () => {
      const result = await runHook('not valid json{{{');
      assert.strictEqual(result.exitCode, 0);
    });

    it('exits 0 when no team_name in payload', async () => {
      const result = await runHook({ task_id: '1', teammate_name: 'worker' });
      assert.strictEqual(result.exitCode, 0);
    });

  });

  describe('Output format', () => {

    it('returns valid JSON with hookEventName = TaskCompleted', async () => {
      const tmpDir = path.join(os.tmpdir(), 'tc-hook-format-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'test-team', [
          { id: '1', status: 'completed', subject: 'Task 1' },
          { id: '2', status: 'pending', subject: 'Task 2' }
        ]);

        const result = await runHook({
          task_id: '1', task_subject: 'Task 1',
          teammate_name: 'worker-1', team_name: 'test-team'
        }, { env: { HOME: tmpDir } });

        assert.strictEqual(result.exitCode, 0);
        assert.ok(result.output, 'Should return JSON');
        assert.strictEqual(result.output.hookSpecificOutput.hookEventName, 'TaskCompleted');
        assert.strictEqual(typeof result.output.hookSpecificOutput.additionalContext, 'string');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Progress counting', () => {

    it('includes correct progress counts', async () => {
      const tmpDir = path.join(os.tmpdir(), 'tc-hook-count-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'count-team', [
          { id: '1', status: 'completed', subject: 'Done 1' },
          { id: '2', status: 'completed', subject: 'Done 2' },
          { id: '3', status: 'in_progress', subject: 'Working' },
          { id: '4', status: 'pending', subject: 'Todo' }
        ]);

        const result = await runHook({
          task_id: '2', task_subject: 'Done 2',
          teammate_name: 'dev-1', team_name: 'count-team'
        }, { env: { HOME: tmpDir } });

        const ctx = result.output.hookSpecificOutput.additionalContext;
        assert.ok(ctx.includes('2/4 done'), 'Should show 2/4 completed');
        assert.ok(ctx.includes('1 pending'), 'Should show 1 pending');
        assert.ok(ctx.includes('1 in progress'), 'Should show 1 in progress');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('includes "All tasks completed" when all done', async () => {
      const tmpDir = path.join(os.tmpdir(), 'tc-hook-alldone-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'done-team', [
          { id: '1', status: 'completed', subject: 'A' },
          { id: '2', status: 'completed', subject: 'B' }
        ]);

        const result = await runHook({
          task_id: '2', task_subject: 'B',
          teammate_name: 'dev-1', team_name: 'done-team'
        }, { env: { HOME: tmpDir } });

        const ctx = result.output.hookSpecificOutput.additionalContext;
        assert.ok(ctx.includes('All tasks completed'), 'Should indicate all done');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Completion logging', () => {

    it('logs completion to report file when CK_REPORTS_PATH set', async () => {
      const tmpDir = path.join(os.tmpdir(), 'tc-hook-log-' + Date.now());
      const reportsDir = path.join(tmpDir, 'reports');
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'log-team', [
          { id: '1', status: 'completed', subject: 'Logged task' }
        ]);

        await runHook({
          task_id: '1', task_subject: 'Logged task',
          teammate_name: 'worker-1', team_name: 'log-team'
        }, { env: { HOME: tmpDir, CK_REPORTS_PATH: reportsDir } });

        const logFile = path.join(reportsDir, 'team-log-team-completions.md');
        assert.ok(fs.existsSync(logFile), 'Log file should exist');
        const content = fs.readFileSync(logFile, 'utf-8');
        assert.ok(content.includes('Logged task'), 'Should contain task subject');
        assert.ok(content.includes('worker-1'), 'Should contain teammate name');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('does not crash when CK_REPORTS_PATH is unset', async () => {
      const tmpDir = path.join(os.tmpdir(), 'tc-hook-nolog-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'nolog-team', [
          { id: '1', status: 'completed', subject: 'A' }
        ]);

        const result = await runHook({
          task_id: '1', task_subject: 'A',
          teammate_name: 'w', team_name: 'nolog-team'
        }, { env: { HOME: tmpDir, CK_REPORTS_PATH: '' } });

        assert.strictEqual(result.exitCode, 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Error resilience', () => {

    it('handles missing task directory gracefully', async () => {
      const tmpDir = path.join(os.tmpdir(), 'tc-hook-nodir-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        // No task dir created
        const result = await runHook({
          task_id: '1', task_subject: 'X',
          teammate_name: 'w', team_name: 'missing-team'
        }, { env: { HOME: tmpDir } });

        assert.strictEqual(result.exitCode, 0);
        assert.ok(result.output, 'Should still return JSON');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles corrupted task JSON gracefully', async () => {
      const tmpDir = path.join(os.tmpdir(), 'tc-hook-corrupt-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const taskDir = path.join(tmpDir, '.claude', 'tasks', 'bad-team');
        fs.mkdirSync(taskDir, { recursive: true });
        fs.writeFileSync(path.join(taskDir, '1.json'), '{bad json{{{');
        fs.writeFileSync(path.join(taskDir, '2.json'), JSON.stringify({ id: '2', status: 'pending', subject: 'OK' }));

        const result = await runHook({
          task_id: '1', task_subject: 'X',
          teammate_name: 'w', team_name: 'bad-team'
        }, { env: { HOME: tmpDir } });

        assert.strictEqual(result.exitCode, 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

});
