#!/usr/bin/env node
/**
 * Tests for session temp-state locking in ck-config-utils.cjs
 * Run: node --test .claude/hooks/__tests__/session-state-lock.test.cjs
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const LIB_PATH = path.join(__dirname, '..', 'lib', 'ck-config-utils.cjs');
const { writeSessionState, readSessionState, getSessionTempPath } = require(LIB_PATH);

const cleanupPaths = new Set();

function track(filePath) {
  cleanupPaths.add(filePath);
  return filePath;
}

afterEach(() => {
  for (const filePath of cleanupPaths) {
    try { fs.rmSync(filePath, { recursive: true, force: true }); } catch {}
  }
  cleanupPaths.clear();
});

function runUpdater(sessionId, field, barrierPath) {
  return new Promise((resolve, reject) => {
    const script = `
      const fs = require('fs');
      const { updateSessionState } = require(${JSON.stringify(LIB_PATH)});
      const sessionId = ${JSON.stringify(sessionId)};
      const field = ${JSON.stringify(field)};
      const barrierPath = ${JSON.stringify(barrierPath)};
      const sleep = (ms) => {
        const signal = new Int32Array(new SharedArrayBuffer(4));
        Atomics.wait(signal, 0, 0, ms);
      };
      while (!fs.existsSync(barrierPath)) sleep(10);
      const ok = updateSessionState(sessionId, (current) => {
        const waitUntil = Date.now() + 120;
        while (Date.now() < waitUntil) {}
        return { ...current, [field]: true };
      });
      process.exit(ok ? 0 : 1);
    `;

    const proc = spawn(process.execPath, ['-e', script], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code));
    proc.on('error', reject);
  });
}

describe('ck-config-utils session state locking', () => {
  it('serializes overlapping updateSessionState calls', async () => {
    const sessionId = `session-state-lock-${Date.now()}`;
    const sessionPath = track(getSessionTempPath(sessionId));
    track(`${sessionPath}.lock`);
    const barrierPath = track(path.join(os.tmpdir(), `${sessionId}.barrier`));

    assert.strictEqual(writeSessionState(sessionId, { base: true }), true, 'Initial session state should be written');

    const alpha = runUpdater(sessionId, 'alpha', barrierPath);
    const beta = runUpdater(sessionId, 'beta', barrierPath);

    await new Promise((resolve) => setTimeout(resolve, 50));
    fs.writeFileSync(barrierPath, 'go');

    const [alphaCode, betaCode] = await Promise.all([alpha, beta]);
    assert.strictEqual(alphaCode, 0, 'First concurrent updater should succeed');
    assert.strictEqual(betaCode, 0, 'Second concurrent updater should succeed');

    const state = readSessionState(sessionId);
    assert.strictEqual(state.base, true, 'Original state should be preserved');
    assert.strictEqual(state.alpha, true, 'Alpha update should be preserved');
    assert.strictEqual(state.beta, true, 'Beta update should be preserved');
  });
});
