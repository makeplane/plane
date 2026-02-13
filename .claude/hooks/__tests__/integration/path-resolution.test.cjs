#!/usr/bin/env node
/**
 * Integration tests for Issue #327: Path Resolution
 * Run: node --test .claude/hooks/__tests__/integration/path-resolution.test.cjs
 *
 * Tests the full workflow of path resolution across all hooks:
 * - session-init.cjs
 * - subagent-init.cjs
 * - dev-rules-reminder.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOKS_DIR = path.join(__dirname, '..', '..');

/**
 * Run a hook with given input
 */
function runHook(hookName, inputData, options = {}) {
  return new Promise((resolve, reject) => {
    const hookPath = path.join(HOOKS_DIR, hookName);
    const proc = spawn('node', [hookPath], {
      cwd: options.cwd || process.cwd(),
      env: {
        ...process.env,
        CLAUDE_ENV_FILE: '',
        ...options.env
      }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    if (inputData) {
      proc.stdin.write(JSON.stringify(inputData));
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      let output = null;
      try { output = JSON.parse(stdout); } catch (e) { /* non-JSON is fine */ }
      resolve({ stdout, stderr, exitCode: code, output });
    });

    proc.on('error', reject);
    setTimeout(() => { proc.kill('SIGTERM'); reject(new Error('timeout')); }, 10000);
  });
}

/**
 * Get git root
 */
function getGitRoot(cwd = process.cwd()) {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8', cwd }).trim();
  } catch (e) {
    return null;
  }
}

describe('Issue #327: Path Resolution Integration', () => {

  describe('Subdirectory Workflow', () => {

    it('all hooks use CWD as base when in subdirectory', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      const subdirPath = path.join(gitRoot, '.claude', 'hooks');
      if (!fs.existsSync(subdirPath)) {
        console.log('  → Skipped: subdirectory does not exist');
        return;
      }

      // Run session-init from subdirectory
      const sessionResult = await runHook('session-init.cjs', { source: 'startup' }, { cwd: subdirPath });
      assert.strictEqual(sessionResult.exitCode, 0, 'session-init should succeed');

      // Run subagent-init with subdirectory cwd
      const subagentResult = await runHook('subagent-init.cjs', {
        agent_type: 'test-agent',
        agent_id: 'integration-test',
        cwd: subdirPath
      }, { cwd: subdirPath });
      assert.strictEqual(subagentResult.exitCode, 0, 'subagent-init should succeed');

      // Run dev-rules-reminder from subdirectory
      const devRulesResult = await runHook('dev-rules-reminder.cjs', { user_prompt: 'test' }, { cwd: subdirPath });
      assert.strictEqual(devRulesResult.exitCode, 0, 'dev-rules-reminder should succeed');

      // Verify subagent output includes subdirectory path
      const subagentContext = subagentResult.output?.hookSpecificOutput?.additionalContext || '';
      assert.ok(
        subagentContext.includes(subdirPath) || subagentContext.includes('.claude/hooks'),
        'Subagent should reference subdirectory'
      );
    });

    it('session-init shows subdirectory info message', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      const subdirPath = path.join(gitRoot, '.claude', 'hooks');
      if (!fs.existsSync(subdirPath)) {
        console.log('  → Skipped: subdirectory does not exist');
        return;
      }

      const result = await runHook('session-init.cjs', { source: 'startup' }, { cwd: subdirPath });

      assert.strictEqual(result.exitCode, 0);
      assert.ok(
        result.stdout.includes('Subdirectory mode') || result.stdout.includes('Git root'),
        'Should show subdirectory info when not at git root'
      );
    });

    it('no subdirectory message when at git root', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      const result = await runHook('session-init.cjs', { source: 'startup' }, { cwd: gitRoot });

      assert.strictEqual(result.exitCode, 0);
      assert.ok(
        !result.stdout.includes('Subdirectory mode'),
        'Should NOT show subdirectory message at git root'
      );
    });

  });

  describe('Monorepo/Worktree Scenarios', () => {

    it('subagent uses payload.cwd for path resolution', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      // Simulate subagent spawned with different CWD
      const subdirPath = path.join(gitRoot, '.claude');
      const result = await runHook('subagent-init.cjs', {
        agent_type: 'fullstack-developer',
        agent_id: 'monorepo-test',
        cwd: subdirPath  // Payload CWD
      }, { cwd: gitRoot });  // Process CWD different from payload

      assert.strictEqual(result.exitCode, 0);
      const context = result.output?.hookSpecificOutput?.additionalContext || '';
      // Should use payload.cwd, not process.cwd()
      assert.ok(
        context.includes(subdirPath) || context.includes('.claude'),
        'Should use payload.cwd for path resolution'
      );
    });

    it('empty payload.cwd falls back to process.cwd()', async () => {
      const result = await runHook('subagent-init.cjs', {
        agent_type: 'test-agent',
        agent_id: 'fallback-test',
        cwd: ''  // Empty string
      });

      assert.strictEqual(result.exitCode, 0);
      const context = result.output?.hookSpecificOutput?.additionalContext || '';
      assert.ok(
        context.includes(process.cwd()),
        'Should fall back to process.cwd() for empty cwd'
      );
    });

    it('whitespace-only payload.cwd falls back to process.cwd()', async () => {
      const result = await runHook('subagent-init.cjs', {
        agent_type: 'test-agent',
        agent_id: 'whitespace-test',
        cwd: '   '  // Whitespace only
      });

      assert.strictEqual(result.exitCode, 0);
      const context = result.output?.hookSpecificOutput?.additionalContext || '';
      assert.ok(
        context.includes(process.cwd()),
        'Should fall back to process.cwd() for whitespace cwd'
      );
    });

  });

  describe('Git Scenarios', () => {

    it('handles detached HEAD gracefully', async () => {
      const tempDir = path.join(os.tmpdir(), 'integration-detached-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        execSync('git init -q', { cwd: tempDir });
        execSync('git config user.email "test@test.com"', { cwd: tempDir });
        execSync('git config user.name "Test"', { cwd: tempDir });
        fs.writeFileSync(path.join(tempDir, 'file.txt'), 'test');
        execSync('git add .', { cwd: tempDir });
        execSync('git commit -q -m "initial"', { cwd: tempDir });
        const hash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf8' }).trim();
        execSync(`git checkout -q ${hash}`, { cwd: tempDir });

        // All hooks should succeed in detached HEAD state
        const sessionResult = await runHook('session-init.cjs', { source: 'startup' }, { cwd: tempDir });
        assert.strictEqual(sessionResult.exitCode, 0, 'session-init should succeed in detached HEAD');

        const subagentResult = await runHook('subagent-init.cjs', {
          agent_type: 'test',
          agent_id: 'detached',
          cwd: tempDir
        }, { cwd: tempDir });
        assert.strictEqual(subagentResult.exitCode, 0, 'subagent-init should succeed in detached HEAD');

      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('handles non-git directory gracefully', async () => {
      const tempDir = path.join(os.tmpdir(), 'integration-no-git-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        // All hooks should succeed in non-git directory
        const sessionResult = await runHook('session-init.cjs', { source: 'startup' }, { cwd: tempDir });
        assert.strictEqual(sessionResult.exitCode, 0, 'session-init should succeed without git');

        const subagentResult = await runHook('subagent-init.cjs', {
          agent_type: 'test',
          agent_id: 'no-git',
          cwd: tempDir
        }, { cwd: tempDir });
        assert.strictEqual(subagentResult.exitCode, 0, 'subagent-init should succeed without git');

      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

  });

  describe('Path Consistency', () => {

    it('reports path uses absolute format when baseDir provided', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      const result = await runHook('subagent-init.cjs', {
        agent_type: 'test-agent',
        agent_id: 'path-test',
        cwd: gitRoot
      });

      assert.strictEqual(result.exitCode, 0);
      const context = result.output?.hookSpecificOutput?.additionalContext || '';

      // Reports and Plans paths should be absolute (start with /)
      const reportsMatch = context.match(/Reports:\s*([^\n]+)/);
      if (reportsMatch) {
        assert.ok(
          reportsMatch[1].startsWith('/'),
          `Reports path should be absolute: ${reportsMatch[1]}`
        );
      }
    });

  });

  describe('Error Handling', () => {

    it('all hooks fail-open on errors', async () => {
      // Send invalid JSON to each hook
      const hooks = ['session-init.cjs', 'subagent-init.cjs', 'dev-rules-reminder.cjs'];

      for (const hookName of hooks) {
        const hookPath = path.join(HOOKS_DIR, hookName);
        const proc = spawn('node', [hookPath], {
          cwd: process.cwd(),
          env: { ...process.env, CLAUDE_ENV_FILE: '' }
        });

        proc.stdin.write('invalid json{{{');
        proc.stdin.end();

        const exitCode = await new Promise((resolve) => {
          proc.on('close', resolve);
        });

        assert.strictEqual(exitCode, 0, `${hookName} should fail-open with exit 0`);
      }
    });

  });

});
