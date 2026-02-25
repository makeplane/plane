#!/usr/bin/env node
/**
 * Tests for descriptive-name.cjs hook - language-aware file naming guidance
 * Run: node --test .claude/hooks/__tests__/descriptive-name.test.cjs
 *
 * Issue #440: Hook should respect language-specific naming conventions
 * - JS/TS/Python/shell: kebab-case preferred
 * - C#/Java/Kotlin/Swift: PascalCase (language convention)
 * - Go/Rust: snake_case (language convention)
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOK_PATH = path.join(__dirname, '..', 'descriptive-name.cjs');

/**
 * Execute descriptive-name.cjs and return stdout
 * @param {Object} [env] - Additional environment variables
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, parsed: Object|null}>}
 */
function runHook(env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      cwd: process.cwd(),
      env: { ...process.env, ...env }
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.stdin.end();

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill('SIGTERM');
        reject(new Error('Hook execution timed out'));
      }
    }, 5000);

    proc.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);

      let parsed = null;
      try {
        if (stdout.trim()) {
          parsed = JSON.parse(stdout.trim());
        }
      } catch (e) {
        // Not JSON, leave as null
      }
      resolve({ stdout, stderr, exitCode: code, parsed });
    });

    proc.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

describe('descriptive-name.cjs', () => {
  describe('Hook output structure', () => {
    it('returns valid JSON with hookSpecificOutput', async () => {
      const { parsed, exitCode } = await runHook();

      assert.strictEqual(exitCode, 0, 'Hook should exit with code 0');
      assert.ok(parsed, 'Output should be valid JSON');
      assert.ok(parsed.hookSpecificOutput, 'Should have hookSpecificOutput');
    });

    it('has correct hookEventName', async () => {
      const { parsed } = await runHook();

      assert.strictEqual(
        parsed.hookSpecificOutput.hookEventName,
        'PreToolUse',
        'hookEventName should be PreToolUse'
      );
    });

    it('always allows operation (permissionDecision: allow)', async () => {
      const { parsed } = await runHook();

      assert.strictEqual(
        parsed.hookSpecificOutput.permissionDecision,
        'allow',
        'Should always allow Write operations'
      );
    });

    it('includes additionalContext with guidance', async () => {
      const { parsed } = await runHook();

      assert.ok(
        parsed.hookSpecificOutput.additionalContext,
        'Should include additionalContext'
      );
      assert.ok(
        parsed.hookSpecificOutput.additionalContext.length > 0,
        'additionalContext should not be empty'
      );
    });
  });

  describe('Language-aware guidance content (Issue #440)', () => {
    it('mentions kebab-case preference for JS/TS/Python/shell', async () => {
      const { parsed } = await runHook();
      const context = parsed.hookSpecificOutput.additionalContext;

      assert.ok(
        context.includes('kebab-case') && context.includes('JS/TS/Python'),
        'Should mention kebab-case for JS/TS/Python/shell'
      );
      assert.ok(
        context.includes('.sh'),
        'Should mention .sh extension for shell scripts'
      );
    });

    it('respects C#/Java/Kotlin/Swift PascalCase convention', async () => {
      const { parsed } = await runHook();
      const context = parsed.hookSpecificOutput.additionalContext;

      assert.ok(
        context.includes('PascalCase'),
        'Should mention PascalCase for C#/Java/Kotlin/Swift'
      );
      assert.ok(
        context.includes('.cs'),
        'Should mention .cs extension for C#'
      );
      assert.ok(
        context.includes('.java'),
        'Should mention .java extension for Java'
      );
      assert.ok(
        context.includes('.kt'),
        'Should mention .kt extension for Kotlin'
      );
      assert.ok(
        context.includes('.swift'),
        'Should mention .swift extension for Swift'
      );
    });

    it('respects Go/Rust snake_case convention', async () => {
      const { parsed } = await runHook();
      const context = parsed.hookSpecificOutput.additionalContext;

      assert.ok(
        context.includes('snake_case'),
        'Should mention snake_case for Go/Rust'
      );
      assert.ok(
        context.includes('.go') || context.includes('Go'),
        'Should mention Go extension or language'
      );
      assert.ok(
        context.includes('.rs') || context.includes('Rust'),
        'Should mention Rust extension or language'
      );
    });

    it('does NOT use strict MUST language', async () => {
      const { parsed } = await runHook();
      const context = parsed.hookSpecificOutput.additionalContext.toLowerCase();

      // The old implementation used "MUST use kebab-case" which caused issues
      assert.ok(
        !context.includes('must use kebab'),
        'Should NOT use strict "MUST use kebab-case" language'
      );
    });

    it('uses soft "prefer" language for kebab-case', async () => {
      const { parsed } = await runHook();
      const context = parsed.hookSpecificOutput.additionalContext.toLowerCase();

      assert.ok(
        context.includes('prefer'),
        'Should use soft "prefer" language for kebab-case'
      );
    });

    it('mentions LLM tool discoverability goal', async () => {
      const { parsed } = await runHook();
      const context = parsed.hookSpecificOutput.additionalContext;

      assert.ok(
        context.includes('Grep') || context.includes('Glob') || context.includes('Search'),
        'Should mention LLM tools (Grep, Glob, Search) for discoverability'
      );
    });
  });

  describe('Hook disable functionality', () => {
    let tempDir;
    let originalCwd;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'descriptive-name-test-'));
      originalCwd = process.cwd();
    });

    afterEach(() => {
      process.chdir(originalCwd);
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors (Windows file locks)
      }
    });

    it('exits silently when disabled via .ck.json', async () => {
      // Create .claude/.ck.json with hook disabled
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, '.ck.json'),
        JSON.stringify({ hooks: { 'descriptive-name': false } })
      );

      // Copy hook and its dependencies to temp dir
      const hooksDir = path.join(claudeDir, 'hooks');
      const libDir = path.join(hooksDir, 'lib');
      fs.mkdirSync(libDir, { recursive: true });

      // Copy required files
      fs.copyFileSync(HOOK_PATH, path.join(hooksDir, 'descriptive-name.cjs'));
      fs.copyFileSync(
        path.join(__dirname, '..', 'lib', 'ck-config-utils.cjs'),
        path.join(libDir, 'ck-config-utils.cjs')
      );

      // Run from temp dir
      const { stdout, exitCode } = await new Promise((resolve, reject) => {
        const proc = spawn('node', [path.join(hooksDir, 'descriptive-name.cjs')], {
          cwd: tempDir,
          env: process.env
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });
        proc.stdin.end();

        proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code }));
        proc.on('error', reject);

        setTimeout(() => {
          proc.kill('SIGTERM');
          reject(new Error('Hook execution timed out'));
        }, 5000);
      });

      assert.strictEqual(exitCode, 0, 'Should exit with code 0 when disabled');
      assert.strictEqual(stdout.trim(), '', 'Should output nothing when disabled');
    });
  });

  describe('Error handling', () => {
    it('fails open on unexpected errors (exit 0)', async () => {
      // The hook has try-catch that fails open
      // We can't easily trigger an error, but we verify the pattern exists
      const hookContent = fs.readFileSync(HOOK_PATH, 'utf-8');

      assert.ok(
        hookContent.includes('catch (error)'),
        'Hook should have error handling'
      );
      assert.ok(
        hookContent.includes('process.exit(0)'),
        'Hook should fail open (exit 0) on errors'
      );
    });
  });
});
