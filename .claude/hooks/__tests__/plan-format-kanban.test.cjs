#!/usr/bin/env node
/**
 * Tests for plan-format-kanban.cjs hook
 * Run: node .claude/hooks/__tests__/plan-format-kanban.test.cjs
 *
 * Tests:
 * - Non-plan.md file path → pass-through
 * - Clean plan.md → no warning
 * - Filename-as-link-text → warns with correction
 * - Edit tool writing status in table row → warns to use CLI
 * - Write tool writing status in table row → warns to use CLI
 * - Edit to non-table content (frontmatter, prose) → no false positive
 * - File doesn't exist → fail-open
 * - Malformed JSON → fail-open
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOOK_PATH = path.join(__dirname, '..', 'plan-format-kanban.cjs');

// ─── Helper: run hook with stdin JSON ─────────────────────────────────────────

/**
 * Spawn hook process with given JSON stdin, capture stdout
 * @param {string|null} inputJson - Raw JSON string to send to stdin
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, output: Object|null}>}
 */
function runHook(inputJson) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    if (inputJson !== null) {
      proc.stdin.write(inputJson);
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      let output = null;
      try { output = JSON.parse(stdout); } catch (_) { /* non-JSON is fine */ }
      resolve({ stdout, stderr, exitCode: code, output });
    });

    proc.on('error', reject);

    // 10 second timeout
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Hook timed out'));
    }, 10000);
  });
}

/**
 * Build JSON payload simulating Claude tool call
 */
function makePayload({ toolName = 'Read', filePath = '', newString = '', content = '' } = {}) {
  return JSON.stringify({
    tool_name: toolName,
    tool_input: {
      file_path: filePath,
      new_string: newString,
      content
    }
  });
}

// ─── Temp directory with plan files ──────────────────────────────────────────

let tmpDir;

const CLEAN_PLAN_CONTENT = `---
title: My Plan
status: pending
---

# My Plan

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Setup Environment](./phase-01-setup-environment.md) | Pending |
| 2 | [Implement API](./phase-02-implement-api.md) | Pending |
`;

const BAD_LINK_TEXT_CONTENT = `---
title: My Plan
status: pending
---

# My Plan

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [phase-01-setup-environment.md](./phase-01-setup-environment.md) | Pending |
| 2 | [phase-02-implement-api.md](./phase-02-implement-api.md) | Pending |
`;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ck-kanban-test-'));
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Create a plan.md in a unique subdirectory and return its path.
 * The hook checks endsWith('/plan.md'), so the file must be named plan.md.
 */
function makePlanFile(subdirName, content) {
  const dir = path.join(tmpDir, subdirName);
  fs.mkdirSync(dir, { recursive: true });
  const planFile = path.join(dir, 'plan.md');
  fs.writeFileSync(planFile, content, 'utf8');
  return planFile;
}

// ─── Test suites ──────────────────────────────────────────────────────────────

describe('plan-format-kanban.cjs', () => {

  describe('Fail-open behavior', () => {

    it('malformed JSON input → { continue: true }', async () => {
      const result = await runHook('NOT_VALID_JSON{{{');
      assert.ok(result.output, 'Should return JSON output');
      assert.strictEqual(result.output.continue, true, 'Should continue on malformed input');
      assert.ok(!result.output.additionalContext, 'Should not have additionalContext on error');
    });

    it('empty stdin → { continue: true }', async () => {
      const result = await runHook('');
      assert.ok(result.output, 'Should return JSON output');
      assert.strictEqual(result.output.continue, true, 'Should continue on empty input');
    });

    it('file_path pointing to non-existent plan.md → { continue: true }', async () => {
      const result = await runHook(makePayload({
        filePath: path.join(tmpDir, 'nonexistent-subdir', 'plan.md')
        // Directory and file do not exist
      }));
      assert.strictEqual(result.output.continue, true, 'Should fail-open when file missing');
      assert.ok(!result.output.additionalContext, 'Should not warn when file missing');
    });

  });

  describe('Non-plan.md paths', () => {

    it('file_path not ending in plan.md → pass through without check', async () => {
      const result = await runHook(makePayload({
        filePath: '/some/path/phase-01-setup.md'
      }));
      assert.strictEqual(result.output.continue, true);
      assert.ok(!result.output.additionalContext, 'Should not warn for non-plan.md files');
    });

    it('file_path for regular .md → no warning', async () => {
      const result = await runHook(makePayload({
        filePath: '/path/to/README.md'
      }));
      assert.strictEqual(result.output.continue, true);
      assert.ok(!result.output.additionalContext);
    });

    it('empty file_path → pass through', async () => {
      const result = await runHook(makePayload({ filePath: '' }));
      assert.strictEqual(result.output.continue, true);
      assert.ok(!result.output.additionalContext);
    });

  });

  describe('Clean plan.md', () => {

    it('human-readable link text → no warning', async () => {
      const planFile = makePlanFile('clean', CLEAN_PLAN_CONTENT);

      const result = await runHook(makePayload({ filePath: planFile }));
      assert.strictEqual(result.output.continue, true);
      assert.ok(!result.output.additionalContext, `Expected no warning but got: ${result.output.additionalContext}`);
    });

  });

  describe('Filename-as-link-text detection', () => {

    it('plan.md with filename as link text → warns with correction', async () => {
      const planFile = makePlanFile('bad-links', BAD_LINK_TEXT_CONTENT);

      const result = await runHook(makePayload({ filePath: planFile }));
      assert.strictEqual(result.output.continue, true, 'Should always continue');
      assert.ok(result.output.additionalContext, 'Should have additionalContext warning');
      assert.ok(
        result.output.additionalContext.includes('human-readable'),
        `Warning should mention human-readable, got: ${result.output.additionalContext}`
      );
    });

    it('warning includes good/bad example', async () => {
      const planFile = makePlanFile('bad-links-example', BAD_LINK_TEXT_CONTENT);

      const result = await runHook(makePayload({ filePath: planFile }));
      assert.ok(
        result.output.additionalContext &&
        (result.output.additionalContext.includes('Good:') || result.output.additionalContext.includes('Good')),
        'Should show corrected example'
      );
    });

  });

  describe('Direct status edit detection (Edit tool)', () => {

    it('Edit tool with status value in table row → warns to use CLI', async () => {
      const planFile = makePlanFile('edit-status', CLEAN_PLAN_CONTENT);

      const result = await runHook(makePayload({
        toolName: 'Edit',
        filePath: planFile,
        newString: '| 1 | [Setup Environment](./phase-01-setup-environment.md) | Completed |'
      }));

      assert.strictEqual(result.output.continue, true, 'Should always continue');
      assert.ok(result.output.additionalContext, 'Should warn about direct status edit');
      assert.ok(
        result.output.additionalContext.includes('ck plan'),
        `Should mention ck plan CLI, got: ${result.output.additionalContext}`
      );
    });

    it('Edit tool with In Progress in table row → warns to use CLI', async () => {
      const planFile = makePlanFile('edit-inprogress', CLEAN_PLAN_CONTENT);

      const result = await runHook(makePayload({
        toolName: 'Edit',
        filePath: planFile,
        newString: '| 2 | [Implement API](./phase-02-implement-api.md) | In Progress |'
      }));

      assert.strictEqual(result.output.continue, true);
      assert.ok(result.output.additionalContext, 'Should warn about direct status edit');
      assert.ok(result.output.additionalContext.includes('ck plan'));
    });

  });

  describe('Direct status edit detection (Write tool)', () => {

    it('Write tool with status values in table rows → warns to use CLI', async () => {
      const planFile = makePlanFile('write-status', CLEAN_PLAN_CONTENT);

      const writeContent = `---
title: My Plan
status: in-progress
---

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Setup Environment](./phase-01-setup-environment.md) | Completed |
| 2 | [Implement API](./phase-02-implement-api.md) | Pending |
`;

      const result = await runHook(makePayload({
        toolName: 'Write',
        filePath: planFile,
        content: writeContent
      }));

      assert.strictEqual(result.output.continue, true);
      assert.ok(result.output.additionalContext, 'Should warn about direct status edit via Write');
      assert.ok(result.output.additionalContext.includes('ck plan'));
    });

  });

  describe('False positive prevention', () => {

    it('Edit to frontmatter with status word → no false positive', async () => {
      const planFile = makePlanFile('frontmatter-edit', CLEAN_PLAN_CONTENT);

      // Editing frontmatter (not a table row) with status word
      const result = await runHook(makePayload({
        toolName: 'Edit',
        filePath: planFile,
        newString: 'status: in-progress'
      }));

      assert.strictEqual(result.output.continue, true);
      // Frontmatter edit should NOT trigger the "direct status edit" warning
      // (it's not a table row — no leading | with phase ID pattern)
      assert.ok(
        !result.output.additionalContext || !result.output.additionalContext.includes('Direct status edit'),
        'Should not warn about frontmatter status update'
      );
    });

    it('Edit to prose containing Pending word → no false positive', async () => {
      const planFile = makePlanFile('prose-edit', CLEAN_PLAN_CONTENT);

      const result = await runHook(makePayload({
        toolName: 'Edit',
        filePath: planFile,
        newString: 'This task is Pending review from the team.'
      }));

      assert.strictEqual(result.output.continue, true);
      assert.ok(
        !result.output.additionalContext || !result.output.additionalContext.includes('Direct status edit'),
        'Should not warn for prose containing status-like words'
      );
    });

    it('Edit to non-table markdown → no false positive', async () => {
      const planFile = makePlanFile('prose2-edit', CLEAN_PLAN_CONTENT);

      const result = await runHook(makePayload({
        toolName: 'Edit',
        filePath: planFile,
        newString: '## Overview\n\nWork is Completed for the initial phase.'
      }));

      assert.strictEqual(result.output.continue, true);
      assert.ok(
        !result.output.additionalContext || !result.output.additionalContext.includes('Direct status edit'),
        'Prose edits with status words should not trigger table status warning'
      );
    });

  });

  describe('CLI command syntax in warnings', () => {

    it('warning includes ck plan check <id> exact syntax', async () => {
      const planFile = makePlanFile('cli-syntax', CLEAN_PLAN_CONTENT);

      const result = await runHook(makePayload({
        toolName: 'Edit',
        filePath: planFile,
        newString: '| 1 | [Setup](./phase-01-setup-environment.md) | Completed |'
      }));

      const ctx = result.output.additionalContext || '';
      assert.ok(ctx.includes('ck plan check'), 'Warning must mention ck plan check');
      assert.ok(ctx.includes('--start'), 'Warning must include --start flag for in-progress');
      assert.ok(ctx.includes('ck plan uncheck'), 'Warning must mention ck plan uncheck');
    });

  });

});
