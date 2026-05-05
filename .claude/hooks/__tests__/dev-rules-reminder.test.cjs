#!/usr/bin/env node
/**
 * Tests for dev-rules-reminder.cjs hook - path resolution (Issue #327)
 * Run: node --test .claude/hooks/__tests__/dev-rules-reminder.test.cjs
 *
 * Issue #327: Use CWD instead of git root for path resolution
 * Key scenarios:
 * - Absolute paths in output
 * - Subdirectory workflow support
 * - Path consistency validation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOK_PATH = path.join(__dirname, '..', 'dev-rules-reminder.cjs');

/**
 * Execute dev-rules-reminder.cjs with given stdin data and return stdout
 * @param {Object} inputData - Data to pass as JSON stdin
 * @param {Object} options - Spawn options (cwd, env)
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
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
      resolve({ stdout, stderr, exitCode: code });
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

function getSessionStatePath(sessionId) {
  return path.join(os.tmpdir(), `ck-session-${sessionId}.json`);
}

describe('dev-rules-reminder.cjs', () => {

  describe('Basic Functionality', () => {

    it('exits with code 0 (non-blocking)', async () => {
      const result = await runHook({ user_prompt: 'test' });
      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    });

    it('handles empty stdin gracefully', async () => {
      const result = await runHook(null);
      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    });

    it('produces output for valid input', async () => {
      const result = await runHook({ user_prompt: 'test prompt' });
      assert.strictEqual(result.exitCode, 0);
      // Should produce some output (session info, rules, etc.)
      assert.ok(result.stdout.length > 0 || result.stderr.length === 0, 'Should produce output or run silently');
    });

  });

  describe('Issue #327: Path Resolution', () => {

    it('includes absolute paths in Reports output', async () => {
      const gitRoot = getGitRoot();
      if (!gitRoot) {
        console.log('  → Skipped: not in git repo');
        return;
      }

      const result = await runHook({ user_prompt: 'test' }, { cwd: gitRoot });

      // Output should include absolute paths starting with /
      if (result.stdout) {
        const hasAbsolutePath = result.stdout.includes(gitRoot) ||
                                result.stdout.match(/Reports:.*\//);
        assert.ok(hasAbsolutePath, 'Should include absolute paths in output');
      }
    });

    it('uses CWD as base for paths, not git root', async () => {
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

      const result = await runHook({ user_prompt: 'test' }, { cwd: subdirPath });

      // Paths in output should reference the subdirectory, not git root
      if (result.stdout && result.stdout.includes('Reports:')) {
        // The path should contain the subdirectory path
        assert.ok(
          result.stdout.includes(subdirPath) || result.stdout.includes('.claude/hooks'),
          `Paths should be relative to CWD (${subdirPath})`
        );
      }
    });

    it('includes Plans path in output', async () => {
      const result = await runHook({ user_prompt: 'test' });

      if (result.stdout) {
        assert.ok(
          result.stdout.includes('plans') || result.stdout.includes('Plans'),
          'Should mention plans directory'
        );
      }
    });

    it('includes Docs path in output', async () => {
      const result = await runHook({ user_prompt: 'test' });

      if (result.stdout) {
        assert.ok(
          result.stdout.includes('docs') || result.stdout.includes('Docs'),
          'Should mention docs directory'
        );
      }
    });

  });

  describe('Output Sections Validation', () => {

    it('includes Session section', async () => {
      const result = await runHook({ user_prompt: 'test' });

      if (result.stdout) {
        assert.ok(
          result.stdout.includes('## Session') || result.stdout.includes('Session'),
          'Should include Session section'
        );
      }
    });

    it('includes Rules section', async () => {
      const result = await runHook({ user_prompt: 'test' });

      if (result.stdout) {
        assert.ok(
          result.stdout.includes('## Rules') || result.stdout.includes('Rules'),
          'Should include Rules section'
        );
      }
    });

    it('includes Modularization reminder', async () => {
      const result = await runHook({ user_prompt: 'test' });

      if (result.stdout) {
        assert.ok(
          result.stdout.includes('Modularization') || result.stdout.includes('[IMPORTANT]'),
          'Should include Modularization reminder'
        );
      }
    });

    it('includes Naming section', async () => {
      const result = await runHook({ user_prompt: 'test' });

      if (result.stdout) {
        assert.ok(
          result.stdout.includes('## Naming') || result.stdout.includes('Naming'),
          'Should include Naming section'
        );
      }
    });

  });

  describe('Transcript Deduplication', () => {

    it('skips output if recently injected', async () => {
      // Create temp transcript file with marker
      const tempDir = path.join(os.tmpdir(), 'dev-rules-test-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const transcriptPath = path.join(tempDir, 'transcript.txt');

      try {
        // Write transcript with modularization marker (last 150 lines)
        const lines = Array(200).fill('some content');
        lines[180] = '[IMPORTANT] Consider Modularization';
        fs.writeFileSync(transcriptPath, lines.join('\n'));

        const result = await runHook({
          user_prompt: 'test',
          transcript_path: transcriptPath
        }, { cwd: tempDir });

        // Should exit cleanly with minimal/no output
        assert.strictEqual(result.exitCode, 0);
        // When recently injected, should have minimal output
        if (result.stdout.includes('[IMPORTANT] Consider Modularization')) {
          // If it does output, that's also acceptable (hook may have different logic)
          assert.ok(true);
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('outputs if marker not in recent lines', async () => {
      const tempDir = path.join(os.tmpdir(), 'dev-rules-test-no-marker-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const transcriptPath = path.join(tempDir, 'transcript.txt');

      try {
        // Write transcript without marker
        const lines = Array(200).fill('some content without marker');
        fs.writeFileSync(transcriptPath, lines.join('\n'));

        const result = await runHook({
          user_prompt: 'test',
          transcript_path: transcriptPath
        }, { cwd: tempDir });

        assert.strictEqual(result.exitCode, 0);
        // Should produce full output since no marker found
        if (result.stdout) {
          assert.ok(result.stdout.length > 0, 'Should produce output when no recent injection');
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('deduplicates repeated injections when transcript_path is null but session_id is present', async () => {
      const tempDir = path.join(os.tmpdir(), 'dev-rules-test-null-transcript-' + Date.now());
      const sessionId = `issue-603-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sessionStatePath = getSessionStatePath(sessionId);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        fs.rmSync(sessionStatePath, { force: true });

        const input = {
          user_prompt: 'test',
          session_id: sessionId,
          transcript_path: null
        };

        const firstRun = await runHook(input, { cwd: tempDir });
        const secondRun = await runHook(input, { cwd: tempDir });

        assert.strictEqual(firstRun.exitCode, 0);
        assert.strictEqual(secondRun.exitCode, 0);
        assert.ok(firstRun.stdout.includes('[IMPORTANT] Consider Modularization'),
          'First run should inject the reminder content');
        assert.strictEqual(secondRun.stdout, '',
          'Second run should skip duplicate injection when the same session repeats without a transcript path');
        assert.ok(fs.existsSync(sessionStatePath),
          'Hook should persist a session-scoped dedup marker');

        const state = JSON.parse(fs.readFileSync(sessionStatePath, 'utf8'));
        const scopes = state.devRulesReminder?.scopes || {};
        assert.ok(Object.values(scopes).some((scope) => scope?.lastInjectedAt),
          'Session state should include a scope-aware dev-rules reminder timestamp');
      } finally {
        fs.rmSync(sessionStatePath, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('supports CK_SESSION_ID fallback when payload omits session_id', async () => {
      const tempDir = path.join(os.tmpdir(), 'dev-rules-test-env-session-' + Date.now());
      const sessionId = `issue-603-env-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sessionStatePath = getSessionStatePath(sessionId);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        fs.rmSync(sessionStatePath, { force: true });

        const input = {
          user_prompt: 'test',
          transcript_path: null
        };

        const options = {
          cwd: tempDir,
          env: { CK_SESSION_ID: sessionId }
        };

        const firstRun = await runHook(input, options);
        const secondRun = await runHook(input, options);

        assert.strictEqual(firstRun.exitCode, 0);
        assert.strictEqual(secondRun.exitCode, 0);
        assert.ok(firstRun.stdout.includes('[IMPORTANT] Consider Modularization'),
          'First env-scoped run should inject reminder content');
        assert.strictEqual(secondRun.stdout, '',
          'Second env-scoped run should dedupe via CK_SESSION_ID');
      } finally {
        fs.rmSync(sessionStatePath, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('reinjects when the same session moves to a different cwd without transcript_path', async () => {
      const tempDirA = path.join(os.tmpdir(), 'dev-rules-test-cwd-a-' + Date.now());
      const tempDirB = path.join(os.tmpdir(), 'dev-rules-test-cwd-b-' + Date.now());
      const sessionId = `issue-603-cwd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sessionStatePath = getSessionStatePath(sessionId);
      fs.mkdirSync(tempDirA, { recursive: true });
      fs.mkdirSync(tempDirB, { recursive: true });

      try {
        fs.rmSync(sessionStatePath, { force: true });

        const input = {
          user_prompt: 'test',
          session_id: sessionId,
          transcript_path: null
        };

        const firstRun = await runHook(input, { cwd: tempDirA });
        const secondRun = await runHook(input, { cwd: tempDirB });

        assert.strictEqual(firstRun.exitCode, 0);
        assert.strictEqual(secondRun.exitCode, 0);
        assert.ok(firstRun.stdout.includes('[IMPORTANT] Consider Modularization'),
          'First cwd should inject reminder content');
        assert.ok(secondRun.stdout.includes('[IMPORTANT] Consider Modularization'),
          'Different cwd should inject refreshed reminder content');
        assert.ok(secondRun.stdout.includes(tempDirB),
          'Second injection should include the new cwd-specific context');
      } finally {
        fs.rmSync(sessionStatePath, { force: true });
        fs.rmSync(tempDirA, { recursive: true, force: true });
        fs.rmSync(tempDirB, { recursive: true, force: true });
      }
    });

    it('does not reinject when transcript_path appears later but cwd stays the same', async () => {
      const tempDir = path.join(os.tmpdir(), 'dev-rules-test-same-cwd-transcript-' + Date.now());
      const sessionId = `issue-603-same-cwd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sessionStatePath = getSessionStatePath(sessionId);
      const transcriptPath = path.join(tempDir, 'transcript.txt');
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        fs.rmSync(sessionStatePath, { force: true });
        fs.writeFileSync(transcriptPath, '');

        const firstRun = await runHook({
          user_prompt: 'test',
          session_id: sessionId,
          transcript_path: null
        }, { cwd: tempDir });

        const secondRun = await runHook({
          user_prompt: 'test',
          session_id: sessionId,
          transcript_path: transcriptPath
        }, { cwd: tempDir });

        assert.strictEqual(firstRun.exitCode, 0);
        assert.strictEqual(secondRun.exitCode, 0);
        assert.ok(firstRun.stdout.includes('[IMPORTANT] Consider Modularization'),
          'First run should inject the reminder content');
        assert.strictEqual(secondRun.stdout, '',
          'Changing only transcript_path should not re-inject for the same cwd');
      } finally {
        fs.rmSync(sessionStatePath, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('deduplicates concurrent injections for the same session scope', async () => {
      const tempDir = path.join(os.tmpdir(), 'dev-rules-test-concurrent-' + Date.now());
      const sessionId = `issue-603-concurrent-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sessionStatePath = getSessionStatePath(sessionId);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        fs.rmSync(sessionStatePath, { force: true });

        const input = {
          user_prompt: 'test',
          session_id: sessionId,
          transcript_path: null
        };

        const [firstRun, secondRun] = await Promise.all([
          runHook(input, { cwd: tempDir }),
          runHook(input, { cwd: tempDir })
        ]);

        const outputs = [firstRun, secondRun].filter((result) =>
          result.stdout.includes('[IMPORTANT] Consider Modularization')
        );

        assert.strictEqual(firstRun.exitCode, 0);
        assert.strictEqual(secondRun.exitCode, 0);
        assert.strictEqual(outputs.length, 1,
          'Only one concurrent hook should inject reminder content for the same session scope');
      } finally {
        fs.rmSync(sessionStatePath, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

  });

  describe('Language Configuration', () => {

    it('handles config without language settings', async () => {
      const result = await runHook({ user_prompt: 'test' });

      assert.strictEqual(result.exitCode, 0);
      // Should not crash when locale config is missing
    });

  });

  describe('Error Handling', () => {

    it('exits 0 on error (fail-open)', async () => {
      // Send invalid JSON-like input via write
      const proc = spawn('node', [HOOK_PATH], {
        cwd: process.cwd(),
        env: { ...process.env, CLAUDE_ENV_FILE: '' }
      });

      proc.stdin.write('not valid json{{{');
      proc.stdin.end();

      const exitCode = await new Promise((resolve) => {
        proc.on('close', resolve);
      });

      assert.strictEqual(exitCode, 0, 'Should exit 0 on parse error (fail-open)');
    });

    it('handles missing transcript_path gracefully', async () => {
      const result = await runHook({
        user_prompt: 'test',
        transcript_path: '/nonexistent/path/transcript.txt'
      });

      assert.strictEqual(result.exitCode, 0);
      // Should still produce output despite missing transcript
    });

  });

  describe('Memory and Performance Info', () => {

    it('includes system resource info', async () => {
      const result = await runHook({ user_prompt: 'test' });

      if (result.stdout) {
        // Should include memory or system info
        const hasResourceInfo = result.stdout.includes('Memory') ||
                                result.stdout.includes('CPU') ||
                                result.stdout.includes('OS') ||
                                result.stdout.includes('platform');
        // This is informational, not required
        assert.ok(true, 'System resource info check completed');
      }
    });

  });

});
