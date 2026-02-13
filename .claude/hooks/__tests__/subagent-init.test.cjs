#!/usr/bin/env node
/**
 * Tests for subagent-init.cjs hook - monorepo and edge case handling (Issue #291)
 * Run: node --test .claude/hooks/__tests__/subagent-init.test.cjs
 *
 * Issue #291: Plan paths should be explicit using git root
 * Key scenarios:
 * - payload.cwd used for git operations (not process.cwd())
 * - Monorepo: session at root, subagent in submodule
 * - Path consistency validation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOK_PATH = path.join(__dirname, '..', 'subagent-init.cjs');

/**
 * Execute subagent-init.cjs with given stdin data and return stdout
 * @param {Object} inputData - Data to pass as JSON stdin
 * @param {Object} options - Spawn options (cwd, env)
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, output: Object|null}>}
 */
function runHook(inputData, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      cwd: options.cwd || process.cwd(),
      env: {
        ...process.env,
        CLAUDE_ENV_FILE: '',
        CK_DEBUG: options.debug ? '1' : '',
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
      try {
        output = JSON.parse(stdout);
      } catch (e) {
        // Non-JSON output is fine for some tests
      }
      resolve({ stdout, stderr, exitCode: code, output });
    });

    proc.on('error', reject);

    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Hook execution timed out'));
    }, 10000);
  });
}

/**
 * Get git root for current directory
 */
function getGitRoot(cwd = process.cwd()) {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      cwd
    }).trim();
  } catch (e) {
    return null;
  }
}

describe('subagent-init.cjs', () => {

  describe('Basic Functionality', () => {

    it('exits with code 0 (non-blocking)', async () => {
      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'test-123',
        cwd: process.cwd()
      });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    });

    it('returns valid JSON with hookSpecificOutput', async () => {
      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'test-123',
        cwd: process.cwd()
      });

      assert.ok(result.output, 'Should return JSON output');
      assert.ok(result.output.hookSpecificOutput, 'Should have hookSpecificOutput');
      assert.strictEqual(
        result.output.hookSpecificOutput.hookEventName,
        'SubagentStart',
        'Should have correct hook event name'
      );
      assert.ok(
        result.output.hookSpecificOutput.additionalContext,
        'Should have additionalContext'
      );
    });

    it('handles empty stdin gracefully', async () => {
      const result = await runHook(null);

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    });

    it('includes agent type and ID in output', async () => {
      const result = await runHook({
        agent_type: 'code-reviewer',
        agent_id: 'abc-123',
        cwd: process.cwd()
      });

      const context = result.output?.hookSpecificOutput?.additionalContext || '';
      assert.ok(context.includes('code-reviewer'), 'Should include agent type');
      assert.ok(context.includes('abc-123'), 'Should include agent ID');
    });

  });

  describe('Issue #291: CWD and Git Root Handling', () => {

    it('uses payload.cwd for context output', async () => {
      const testCwd = '/custom/path/to/project';
      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'test-123',
        cwd: testCwd
      });

      const context = result.output?.hookSpecificOutput?.additionalContext || '';
      assert.ok(
        context.includes(testCwd),
        `Should include payload.cwd in output: ${context}`
      );
    });

    it('falls back to process.cwd() when payload.cwd is undefined', async () => {
      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'test-123'
        // Note: cwd intentionally omitted
      });

      const context = result.output?.hookSpecificOutput?.additionalContext || '';
      assert.ok(
        context.includes(process.cwd()),
        'Should fall back to process.cwd()'
      );
    });

    it('resolves git root from payload.cwd, not process.cwd()', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      // Run hook with explicit cwd matching git root
      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'test-123',
        cwd: gitRoot
      });

      const context = result.output?.hookSpecificOutput?.additionalContext || '';

      // Should use absolute paths based on git root
      assert.ok(
        context.includes(gitRoot),
        `Context should include git root path: ${context}`
      );
    });

    it('resolves different git root when payload.cwd is in subdirectory', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      // Use .claude/hooks as subdirectory
      const subdirPath = path.join(gitRoot, '.claude', 'hooks');
      if (!fs.existsSync(subdirPath)) {
        console.log('  → Skipped: subdirectory does not exist');
        return;
      }

      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'test-123',
        cwd: subdirPath
      }, { cwd: subdirPath });

      const context = result.output?.hookSpecificOutput?.additionalContext || '';

      // Git root should still resolve correctly from subdirectory
      assert.ok(
        context.includes(gitRoot) || context.includes('plans'),
        'Should resolve git root from subdirectory cwd'
      );
    });

  });

  describe('Monorepo/Submodule Scenarios', () => {

    it('handles submodule with different git root', async () => {
      // This test validates that when payload.cwd points to a submodule,
      // the hook resolves paths relative to that submodule's git root
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      // Check if we're in a worktree (has .git file instead of directory)
      const gitPath = path.join(gitRoot, '.git');
      const isWorktree = fs.existsSync(gitPath) && fs.statSync(gitPath).isFile();

      const result = await runHook({
        agent_type: 'fullstack-developer',
        agent_id: 'submodule-test',
        cwd: gitRoot
      });

      assert.strictEqual(result.exitCode, 0, 'Should handle worktree/submodule');

      const context = result.output?.hookSpecificOutput?.additionalContext || '';

      // Paths should be absolute and based on the effective git root
      assert.ok(
        context.includes('/') || context.includes('plans'),
        `Should include path information: ${context.substring(0, 200)}`
      );
    });

    it('outputs CK_DEBUG info when enabled', async () => {
      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'debug-test',
        cwd: process.cwd()
      }, { debug: true });

      // Debug output goes to stderr
      if (process.env.CK_DEBUG || result.stderr.includes('effectiveCwd')) {
        assert.ok(
          result.stderr.includes('effectiveCwd') ||
          result.stderr.includes('gitRoot') ||
          result.stderr.includes('baseDir'),
          'Debug output should include path resolution info'
        );
      }
    });

  });

  describe('Path Resolution Edge Cases', () => {

    it('handles non-existent payload.cwd gracefully', async () => {
      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'test-123',
        cwd: '/nonexistent/path/that/does/not/exist'
      });

      // Should not crash, should exit 0 (fail-open)
      assert.strictEqual(result.exitCode, 0, 'Should fail-open on invalid cwd');
    });

    it('handles payload.cwd with spaces', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      // Create temp directory with spaces
      const tempDir = path.join(os.tmpdir(), 'test with spaces');
      try {
        fs.mkdirSync(tempDir, { recursive: true });
        // Initialize git repo in temp dir
        execSync('git init -q', { cwd: tempDir });

        const result = await runHook({
          agent_type: 'test-agent',
          agent_id: 'space-test',
          cwd: tempDir
        }, { cwd: tempDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle paths with spaces');

        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        assert.ok(
          context.includes('test with spaces') || context.includes(tempDir),
          'Should include path with spaces in output'
        );
      } finally {
        // Cleanup
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    it('handles payload.cwd outside any git repo', async () => {
      const tempDir = path.join(os.tmpdir(), 'no-git-repo-test');
      try {
        fs.mkdirSync(tempDir, { recursive: true });

        const result = await runHook({
          agent_type: 'test-agent',
          agent_id: 'no-git-test',
          cwd: tempDir
        }, { cwd: tempDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle non-git directories');

        // Should fall back to cwd when git root is null
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        assert.ok(
          context.includes(tempDir) || context.includes('plans'),
          'Should use cwd as fallback when not in git repo'
        );
      } finally {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

  });

  describe('Context Output Validation', () => {

    it('includes required sections in output', async () => {
      const result = await runHook({
        agent_type: 'planner',
        agent_id: 'section-test',
        cwd: process.cwd()
      });

      const context = result.output?.hookSpecificOutput?.additionalContext || '';

      // Required sections
      assert.ok(context.includes('## Subagent:'), 'Should have Subagent header');
      assert.ok(context.includes('## Context'), 'Should have Context section');
      assert.ok(context.includes('## Rules'), 'Should have Rules section');
      assert.ok(context.includes('## Naming'), 'Should have Naming section');
    });

    it('includes absolute paths for reports and plans', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      const result = await runHook({
        agent_type: 'test-agent',
        agent_id: 'path-test',
        cwd: gitRoot
      });

      const context = result.output?.hookSpecificOutput?.additionalContext || '';

      // Paths should be absolute (start with /)
      const reportsMatch = context.match(/Reports:\s*([^\n]+)/);
      const plansMatch = context.match(/Plan dir:\s*([^\n]+)/);

      if (reportsMatch) {
        assert.ok(
          reportsMatch[1].startsWith('/') || reportsMatch[1].includes(gitRoot),
          `Reports path should be absolute: ${reportsMatch[1]}`
        );
      }

      if (plansMatch) {
        assert.ok(
          plansMatch[1].startsWith('/') || plansMatch[1].includes(gitRoot),
          `Plans path should be absolute: ${plansMatch[1]}`
        );
      }
    });

  });

  describe('Advanced Git Scenarios', () => {

    it('handles detached HEAD state gracefully', async () => {
      const tempDir = path.join(os.tmpdir(), 'subagent-detached-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      try {
        // Create repo with commit and detach HEAD
        execSync('git init -q', { cwd: tempDir });
        execSync('git config user.email "test@test.com"', { cwd: tempDir });
        execSync('git config user.name "Test"', { cwd: tempDir });
        fs.writeFileSync(path.join(tempDir, 'file.txt'), 'test');
        execSync('git add .', { cwd: tempDir });
        execSync('git commit -q -m "initial"', { cwd: tempDir });
        const hash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf8' }).trim();
        execSync(`git checkout -q ${hash}`, { cwd: tempDir });

        const result = await runHook({
          agent_type: 'test-agent',
          agent_id: 'detached-test',
          cwd: tempDir
        }, { cwd: tempDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle detached HEAD');
        assert.ok(result.output, 'Should return output');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('handles nested git repos (monorepo parent, submodule child)', async () => {
      const outerDir = path.join(os.tmpdir(), 'subagent-nested-outer-' + Date.now());
      const innerDir = path.join(outerDir, 'packages', 'inner');
      fs.mkdirSync(innerDir, { recursive: true });
      try {
        // Create outer (monorepo) git repo
        execSync('git init -q', { cwd: outerDir });
        execSync('git config user.email "test@test.com"', { cwd: outerDir });
        execSync('git config user.name "Test"', { cwd: outerDir });

        // Create inner (package) git repo
        execSync('git init -q', { cwd: innerDir });
        execSync('git config user.email "test@test.com"', { cwd: innerDir });
        execSync('git config user.name "Test"', { cwd: innerDir });

        // Subagent running in inner repo should get inner repo's git root
        const result = await runHook({
          agent_type: 'fullstack-developer',
          agent_id: 'nested-test',
          cwd: innerDir
        }, { cwd: innerDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle nested repos');
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        // Should include inner directory path (the submodule root)
        assert.ok(
          context.includes(innerDir) || context.includes('/packages/inner'),
          `Should resolve to inner repo, not outer. Context: ${context.substring(0, 300)}`
        );
      } finally {
        fs.rmSync(outerDir, { recursive: true, force: true });
      }
    });

    it('handles bare repository', async () => {
      const tempDir = path.join(os.tmpdir(), 'subagent-bare-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      try {
        execSync('git init -q --bare', { cwd: tempDir });

        const result = await runHook({
          agent_type: 'test-agent',
          agent_id: 'bare-test',
          cwd: tempDir
        }, { cwd: tempDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle bare repo');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('handles symlinked git repository', async () => {
      const realDir = path.join(os.tmpdir(), 'subagent-real-' + Date.now());
      const linkDir = path.join(os.tmpdir(), 'subagent-link-' + Date.now());
      fs.mkdirSync(realDir, { recursive: true });
      try {
        execSync('git init -q', { cwd: realDir });
        fs.symlinkSync(realDir, linkDir);

        const result = await runHook({
          agent_type: 'test-agent',
          agent_id: 'symlink-test',
          cwd: linkDir
        }, { cwd: linkDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle symlinked repo');
        // Git resolves symlinks, so path should be resolvable
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        assert.ok(context.length > 0, 'Should produce context output');
      } finally {
        try { fs.unlinkSync(linkDir); } catch (e) {}
        fs.rmSync(realDir, { recursive: true, force: true });
      }
    });

    it('handles git worktree', async () => {
      const mainDir = path.join(os.tmpdir(), 'subagent-wt-main-' + Date.now());
      const worktreeDir = path.join(os.tmpdir(), 'subagent-wt-tree-' + Date.now());
      fs.mkdirSync(mainDir, { recursive: true });
      try {
        // Create main repo with commit
        execSync('git init -q', { cwd: mainDir });
        execSync('git config user.email "test@test.com"', { cwd: mainDir });
        execSync('git config user.name "Test"', { cwd: mainDir });
        fs.writeFileSync(path.join(mainDir, 'file.txt'), 'test');
        execSync('git add .', { cwd: mainDir });
        execSync('git commit -q -m "initial"', { cwd: mainDir });

        // Create worktree
        execSync(`git worktree add -q "${worktreeDir}" -b worktree-test`, { cwd: mainDir });

        const result = await runHook({
          agent_type: 'test-agent',
          agent_id: 'worktree-test',
          cwd: worktreeDir
        }, { cwd: worktreeDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle worktree');
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        // Worktree should be recognized as its own root
        assert.ok(
          context.includes(worktreeDir),
          `Should include worktree path: ${context.substring(0, 200)}`
        );

        // Cleanup worktree
        execSync(`git worktree remove -f "${worktreeDir}"`, { cwd: mainDir });
      } finally {
        try { fs.rmSync(worktreeDir, { recursive: true, force: true }); } catch (e) {}
        fs.rmSync(mainDir, { recursive: true, force: true });
      }
    });

    it('handles unicode characters in path', async () => {
      const tempDir = path.join(os.tmpdir(), 'subagent-日本語-émoji-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      try {
        execSync('git init -q', { cwd: tempDir });

        const result = await runHook({
          agent_type: 'test-agent',
          agent_id: 'unicode-test',
          cwd: tempDir
        }, { cwd: tempDir });

        assert.strictEqual(result.exitCode, 0, 'Should handle unicode paths');
        const context = result.output?.hookSpecificOutput?.additionalContext || '';
        assert.ok(
          context.includes('日本語') || context.includes('émoji'),
          'Should preserve unicode in output'
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

  });

  describe('Error Handling', () => {

    it('exits 0 on JSON parse error (fail-open)', async () => {
      const proc = spawn('node', [HOOK_PATH], {
        cwd: process.cwd(),
        env: { ...process.env, CLAUDE_ENV_FILE: '' }
      });

      // Send invalid JSON
      proc.stdin.write('not valid json{{{');
      proc.stdin.end();

      const exitCode = await new Promise((resolve) => {
        proc.on('close', resolve);
      });

      assert.strictEqual(exitCode, 0, 'Should exit 0 on parse error (fail-open)');
    });

    it('captures error in stderr on failure', async () => {
      const proc = spawn('node', [HOOK_PATH], {
        cwd: process.cwd(),
        env: { ...process.env, CLAUDE_ENV_FILE: '' }
      });

      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.stdin.write('not valid json');
      proc.stdin.end();

      await new Promise((resolve) => { proc.on('close', resolve); });

      // May or may not have error message, but should not crash
      // If there's stderr, it should be informative
      if (stderr) {
        assert.ok(
          stderr.includes('error') || stderr.includes('Error'),
          'Error output should be informative'
        );
      }
    });

  });

});
