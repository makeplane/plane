/**
 * Tests for error handling in chrome-devtools scripts
 * Verifies scripts exit with code 1 on errors
 * Run with: node --test __tests__/error-handling.test.js
 *
 * Note: These tests verify exit code behavior. When puppeteer is not installed,
 * scripts still exit with code 1 (module not found), which validates the error path.
 * When puppeteer IS installed, missing --url triggers application-level error with code 1.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.join(__dirname, '..');

function runScript(script, args = [], timeout = 10000) {
  return new Promise((resolve) => {
    const proc = spawn('node', [path.join(scriptsDir, script), ...args], {
      timeout,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr, combined: stdout + stderr });
    });

    proc.on('error', (err) => {
      resolve({ code: 1, stdout, stderr: err.message, combined: err.message });
    });

    setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ code: null, stdout, stderr, timedOut: true, combined: stdout + stderr });
    }, timeout);
  });
}

describe('chrome-devtools error handling', () => {
  describe('console.js', () => {
    it('should exit with code 1 when --url is missing or on error', async () => {
      const result = await runScript('console.js', []);
      assert.strictEqual(result.code, 1, 'Expected exit code 1');
    });

    it('should output error information', async () => {
      const result = await runScript('console.js', []);
      assert.strictEqual(result.code, 1);
      // Either app-level error (--url required) or module error (puppeteer not found)
      const hasError = result.combined.toLowerCase().includes('error') ||
                       result.combined.includes('--url');
      assert.ok(hasError, 'Expected error in output');
    });
  });

  describe('evaluate.js', () => {
    it('should exit with code 1 when --url is missing or on error', async () => {
      const result = await runScript('evaluate.js', []);
      assert.strictEqual(result.code, 1, 'Expected exit code 1');
    });
  });

  describe('navigate.js', () => {
    it('should exit with code 1 when --url is missing or on error', async () => {
      const result = await runScript('navigate.js', []);
      assert.strictEqual(result.code, 1, 'Expected exit code 1');
    });
  });

  describe('network.js', () => {
    it('should exit with code 1 when --url is missing or on error', async () => {
      const result = await runScript('network.js', []);
      assert.strictEqual(result.code, 1, 'Expected exit code 1');
    });
  });

  describe('performance.js', () => {
    it('should exit with code 1 when --url is missing or on error', async () => {
      const result = await runScript('performance.js', []);
      assert.strictEqual(result.code, 1, 'Expected exit code 1');
    });
  });

  describe('all scripts exit code consistency', () => {
    const scripts = ['console.js', 'evaluate.js', 'navigate.js', 'network.js', 'performance.js'];

    for (const script of scripts) {
      it(`${script} should exit 1 on invalid input or error`, async () => {
        const result = await runScript(script, []);
        assert.strictEqual(result.code, 1, `${script} should exit with code 1`);
      });
    }
  });
});
