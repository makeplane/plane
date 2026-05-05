#!/usr/bin/env node
/**
 * Tests for usage-quota-cache-refresh.cjs hook input classification
 * Run: node --test .claude/hooks/__tests__/usage-quota-cache-refresh.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { getUsageQuotaRefreshContext } = require('../usage-quota-cache-refresh.cjs');

describe('usage-quota-cache-refresh.cjs', () => {
  it('treats startup source as SessionStart and prompt-like', () => {
    const context = getUsageQuotaRefreshContext({ source: 'startup' });
    assert.strictEqual(context.event, 'SessionStart');
    assert.strictEqual(context.isPromptLike, true);
    assert.strictEqual(context.source, 'startup');
  });

  it('treats resume source as SessionStart and prompt-like', () => {
    const context = getUsageQuotaRefreshContext({ source: 'resume' });
    assert.strictEqual(context.event, 'SessionStart');
    assert.strictEqual(context.isPromptLike, true);
    assert.strictEqual(context.source, 'resume');
  });

  it('treats explicit UserPromptSubmit events as prompt-like without requiring prompt text', () => {
    const context = getUsageQuotaRefreshContext({ hook_event_name: 'UserPromptSubmit' });
    assert.strictEqual(context.event, 'UserPromptSubmit');
    assert.strictEqual(context.isPromptLike, true);
  });

  it('keeps PostToolUse as the default non-prompt path', () => {
    const context = getUsageQuotaRefreshContext({ hook_event_name: 'PostToolUse', tool_name: 'Bash' });
    assert.strictEqual(context.event, 'PostToolUse');
    assert.strictEqual(context.isPromptLike, false);
    assert.strictEqual(context.tool, 'Bash');
  });
});
