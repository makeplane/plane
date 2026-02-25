#!/usr/bin/env node
/**
 * Tests for session-init.cjs hook - specifically the compact mitigation (Issue #277)
 * Run: node --test .claude/hooks/__tests__/session-init.test.cjs
 *
 * Issue #277: Auto-compact bypasses AskUserQuestion approval gates
 * Mitigation: When source=compact, inject warning to re-verify approval state
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');

const HOOK_PATH = path.join(__dirname, '..', 'session-init.cjs');

/**
 * Execute session-init.cjs with given stdin data and return stdout
 * @param {Object} inputData - Data to pass as JSON stdin
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runHook(inputData) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Unset CLAUDE_ENV_FILE to avoid writing env vars during tests
        CLAUDE_ENV_FILE: ''
      }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    // Write input and close stdin
    if (inputData) {
      proc.stdin.write(JSON.stringify(inputData));
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    proc.on('error', reject);

    // Timeout protection (5s)
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Hook execution timed out'));
    }, 5000);
  });
}

describe('session-init.cjs', () => {

  describe('Issue #277 Mitigation: Compact Warning', () => {

    it('outputs warning when source=compact', async () => {
      const result = await runHook({ source: 'compact' });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        result.stdout.includes('⚠️ CONTEXT COMPACTED - APPROVAL STATE CHECK'),
        'Should include warning header'
      );
      assert.ok(
        result.stdout.includes('AskUserQuestion'),
        'Should mention AskUserQuestion'
      );
      assert.ok(
        result.stdout.includes('MUST re-confirm'),
        'Should instruct to re-confirm with user'
      );
    });

    it('does NOT output warning when source=startup', async () => {
      const result = await runHook({ source: 'startup' });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        !result.stdout.includes('⚠️ CONTEXT COMPACTED'),
        'Should NOT include compact warning for startup'
      );
    });

    it('does NOT output warning when source=resume', async () => {
      const result = await runHook({ source: 'resume' });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        !result.stdout.includes('⚠️ CONTEXT COMPACTED'),
        'Should NOT include compact warning for resume'
      );
    });

    it('does NOT output warning when source=clear', async () => {
      const result = await runHook({ source: 'clear' });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        !result.stdout.includes('⚠️ CONTEXT COMPACTED'),
        'Should NOT include compact warning for clear'
      );
    });

    it('does NOT output warning when source=unknown', async () => {
      const result = await runHook({ source: 'unknown' });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        !result.stdout.includes('⚠️ CONTEXT COMPACTED'),
        'Should NOT include compact warning for unknown source'
      );
    });

    it('does NOT output warning when source is missing (undefined)', async () => {
      const result = await runHook({});

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        !result.stdout.includes('⚠️ CONTEXT COMPACTED'),
        'Should NOT include compact warning when source is undefined'
      );
    });

    it('handles empty stdin gracefully', async () => {
      const result = await runHook(null);

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        !result.stdout.includes('⚠️ CONTEXT COMPACTED'),
        'Should NOT include compact warning for empty stdin'
      );
    });

  });

  describe('Warning Content Validation', () => {

    it('warning contains all required guidance elements', async () => {
      const result = await runHook({ source: 'compact' });

      // Line 1: Header
      assert.ok(
        result.stdout.includes('⚠️ CONTEXT COMPACTED - APPROVAL STATE CHECK:'),
        'Should have proper header with colon'
      );

      // Line 2: Context about pending approval
      assert.ok(
        result.stdout.includes('waiting for user approval via AskUserQuestion'),
        'Should mention waiting for user approval'
      );
      assert.ok(
        result.stdout.includes('Step 4 review gate'),
        'Should mention Step 4 review gate as example'
      );

      // Line 3: Instruction
      assert.ok(
        result.stdout.includes('MUST re-confirm with the user before proceeding'),
        'Should include MUST re-confirm instruction'
      );
      assert.ok(
        result.stdout.includes('Do NOT assume approval was given'),
        'Should warn against assuming approval'
      );

      // Line 4: Action
      assert.ok(
        result.stdout.includes('Use AskUserQuestion to verify'),
        'Should instruct to use AskUserQuestion'
      );
      assert.ok(
        result.stdout.includes('Context was compacted. Please confirm approval to continue'),
        'Should include suggested question text'
      );
    });

  });

  describe('Session Context Output', () => {

    it('includes session source in output', async () => {
      const result = await runHook({ source: 'compact' });

      assert.ok(
        result.stdout.includes('Session compact'),
        'Should output "Session compact" at start'
      );
    });

    it('includes project detection context', async () => {
      const result = await runHook({ source: 'startup' });

      // Should include project type detection
      assert.ok(
        result.stdout.includes('Project:'),
        'Should include Project detection'
      );
    });

  });

  describe('Exit Code Behavior', () => {

    it('always exits with code 0 (non-blocking)', async () => {
      const sources = ['compact', 'startup', 'resume', 'clear', 'unknown'];

      for (const source of sources) {
        const result = await runHook({ source });
        assert.strictEqual(
          result.exitCode, 0,
          `source=${source} should exit with code 0`
        );
      }
    });

  });

  describe('Issue #291: Git Root Path Resolution', () => {

    it('does not show subdirectory warning when CWD equals git root', async () => {
      // Run from git root to test no warning appears
      const gitRoot = require('child_process')
        .execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();

      const result = await new Promise((resolve, reject) => {
        const proc = spawn('node', [HOOK_PATH], {
          cwd: gitRoot,  // Run from git root
          env: { ...process.env, CLAUDE_ENV_FILE: '' }
        });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });
        proc.stdin.write(JSON.stringify({ source: 'startup' }));
        proc.stdin.end();
        proc.on('close', (code) => { resolve({ stdout, stderr, exitCode: code }); });
        proc.on('error', reject);
        setTimeout(() => { proc.kill('SIGTERM'); reject(new Error('timeout')); }, 5000);
      });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        !result.stdout.includes('Running from subdirectory'),
        'Should NOT show subdirectory warning when at git root'
      );
    });

    it('shows subdirectory info when CWD differs from git root (Issue #327)', async () => {
      // Run from a subdirectory to test warning appears
      const gitRoot = require('child_process')
        .execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();

      // Use .claude/hooks as subdirectory (guaranteed to exist)
      const subdirPath = require('path').join(gitRoot, '.claude', 'hooks');

      const result = await new Promise((resolve, reject) => {
        const proc = spawn('node', [HOOK_PATH], {
          cwd: subdirPath,  // Run from subdirectory
          env: { ...process.env, CLAUDE_ENV_FILE: '' }
        });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });
        proc.stdin.write(JSON.stringify({ source: 'startup' }));
        proc.stdin.end();
        proc.on('close', (code) => { resolve({ stdout, stderr, exitCode: code }); });
        proc.on('error', reject);
        setTimeout(() => { proc.kill('SIGTERM'); reject(new Error('timeout')); }, 5000);
      });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      // Issue #327: Changed from warning to info - subdirectory mode now supported
      assert.ok(
        result.stdout.includes('Subdirectory mode'),
        'Should show subdirectory info when not at git root'
      );
      assert.ok(
        result.stdout.includes('Git root:'),
        'Should show git root for reference'
      );
    });

    it('context output includes project info', async () => {
      const result = await runHook({ source: 'startup' });

      assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
      assert.ok(
        result.stdout.includes('Project:'),
        'Should include Project in context'
      );
      assert.ok(
        result.stdout.includes('Plan naming:'),
        'Should include Plan naming in context'
      );
    });

  });

});
