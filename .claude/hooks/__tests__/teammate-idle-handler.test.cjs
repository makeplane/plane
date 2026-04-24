#!/usr/bin/env node
/**
 * Tests for teammate-idle-handler.cjs hook
 * Run: node --test .claude/hooks/__tests__/teammate-idle-handler.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOK_PATH = path.join(__dirname, '..', 'teammate-idle-handler.cjs');

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

describe('teammate-idle-handler.cjs', () => {

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
      const result = await runHook({ teammate_name: 'worker' });
      assert.strictEqual(result.exitCode, 0);
    });

  });

  describe('Output format', () => {

    it('returns valid JSON with hookEventName = TeammateIdle', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-format-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'test-team', [
          { id: '1', status: 'pending', subject: 'Task 1' }
        ]);

        const result = await runHook({
          teammate_name: 'worker-1', team_name: 'test-team'
        }, { env: { HOME: tmpDir } });

        assert.strictEqual(result.exitCode, 0);
        assert.ok(result.output, 'Should return JSON');
        assert.strictEqual(result.output.hookSpecificOutput.hookEventName, 'TeammateIdle');
        assert.strictEqual(typeof result.output.hookSpecificOutput.additionalContext, 'string');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Task availability detection', () => {

    it('lists unblocked, unassigned tasks', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-unblocked-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'avail-team', [
          { id: '1', status: 'completed', subject: 'Done' },
          { id: '2', status: 'pending', subject: 'Available task' },
          { id: '3', status: 'pending', subject: 'Blocked', blockedBy: ['99'] }
        ]);

        const result = await runHook({
          teammate_name: 'dev-1', team_name: 'avail-team'
        }, { env: { HOME: tmpDir } });

        const ctx = result.output.hookSpecificOutput.additionalContext;
        assert.ok(ctx.includes('Available task'), 'Should list unblocked task');
        assert.ok(!ctx.includes('Blocked'), 'Should not list blocked task');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('suggests shutdown when no tasks remain', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-shutdown-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'empty-team', [
          { id: '1', status: 'completed', subject: 'A' },
          { id: '2', status: 'completed', subject: 'B' }
        ]);

        const result = await runHook({
          teammate_name: 'dev-1', team_name: 'empty-team'
        }, { env: { HOME: tmpDir } });

        const ctx = result.output.hookSpecificOutput.additionalContext;
        assert.ok(ctx.includes('No remaining tasks'), 'Should suggest shutdown');
        assert.ok(ctx.includes('shutting down'), 'Should mention shutdown');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('shows "blocked or assigned" when tasks exist but none available', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-blocked-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'blocked-team', [
          { id: '1', status: 'in_progress', subject: 'Busy', owner: 'dev-2' },
          { id: '2', status: 'pending', subject: 'Blocked', blockedBy: ['1'] }
        ]);

        const result = await runHook({
          teammate_name: 'dev-1', team_name: 'blocked-team'
        }, { env: { HOME: tmpDir } });

        const ctx = result.output.hookSpecificOutput.additionalContext;
        assert.ok(ctx.includes('blocked or assigned'), 'Should indicate all tasks blocked/assigned');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('skips tasks that have an owner (already claimed)', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-owned-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'owned-team', [
          { id: '1', status: 'pending', subject: 'Claimed', owner: 'dev-2' },
          { id: '2', status: 'pending', subject: 'Free task' }
        ]);

        const result = await runHook({
          teammate_name: 'dev-1', team_name: 'owned-team'
        }, { env: { HOME: tmpDir } });

        const ctx = result.output.hookSpecificOutput.additionalContext;
        assert.ok(ctx.includes('Free task'), 'Should list unowned task');
        assert.ok(!ctx.includes('#1 "Claimed"'), 'Should not list owned task as available');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('correctly identifies unblocked tasks (blockedBy all completed)', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-deps-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        createTestTeam(tmpDir, 'deps-team', [
          { id: '1', status: 'completed', subject: 'Prereq' },
          { id: '2', status: 'pending', subject: 'Unblocked now', blockedBy: ['1'] },
          { id: '3', status: 'pending', subject: 'Still blocked', blockedBy: ['99'] }
        ]);

        const result = await runHook({
          teammate_name: 'dev-1', team_name: 'deps-team'
        }, { env: { HOME: tmpDir } });

        const ctx = result.output.hookSpecificOutput.additionalContext;
        assert.ok(ctx.includes('Unblocked now'), 'Should list task whose deps are met');
        assert.ok(!ctx.includes('Still blocked'), 'Should not list task with unmet deps');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

  describe('Error resilience', () => {

    it('handles missing task directory gracefully', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-nodir-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const result = await runHook({
          teammate_name: 'w', team_name: 'missing-team'
        }, { env: { HOME: tmpDir } });

        assert.strictEqual(result.exitCode, 0);
        assert.ok(result.output, 'Should still return JSON');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles corrupted task JSON gracefully', async () => {
      const tmpDir = path.join(os.tmpdir(), 'ti-hook-corrupt-' + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const taskDir = path.join(tmpDir, '.claude', 'tasks', 'bad-team');
        fs.mkdirSync(taskDir, { recursive: true });
        fs.writeFileSync(path.join(taskDir, '1.json'), '{bad{{{');
        fs.writeFileSync(path.join(taskDir, '2.json'), JSON.stringify({ id: '2', status: 'pending', subject: 'OK' }));

        const result = await runHook({
          teammate_name: 'w', team_name: 'bad-team'
        }, { env: { HOME: tmpDir } });

        assert.strictEqual(result.exitCode, 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

  });

});
