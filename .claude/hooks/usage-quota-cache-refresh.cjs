#!/usr/bin/env node
/**
 * Usage Quota Cache Refresh Hook
 *
 * Keeps the cosmetic 5h / wk usage cache warm for the statusline.
 * Prompt injection remains gated separately in context-builder.cjs.
 */

'use strict';

const fs = require('fs');
const { createHookTimer, logHookCrash } = require('./lib/hook-logger.cjs');
const {
  getCacheAgeMs,
  refreshUsageCache,
  readUsageCache
} = require('./lib/usage-limits-cache.cjs');

const FETCH_INTERVAL_MS = 300000; // 5 minutes for PostToolUse
const FETCH_INTERVAL_PROMPT_MS = 60000; // 1 minute for UserPromptSubmit / SessionStart

function shouldFetch(isPromptLike = false) {
  const interval = isPromptLike ? FETCH_INTERVAL_PROMPT_MS : FETCH_INTERVAL_MS;
  const cache = readUsageCache();
  return getCacheAgeMs(cache) >= interval;
}

function getUsageQuotaRefreshContext(input = {}) {
  const eventName = typeof input.hook_event_name === 'string' ? input.hook_event_name : '';
  const source = input.source === 'startup' || input.source === 'resume' ? input.source : '';
  const tool = typeof input.tool_name === 'string' ? input.tool_name : '';
  const isSessionStart = source !== '' || eventName === 'SessionStart';
  const isPromptLike = typeof input.prompt === 'string' || eventName === 'UserPromptSubmit' || isSessionStart;
  const event = isSessionStart
    ? 'SessionStart'
    : eventName || (typeof input.prompt === 'string' ? 'UserPromptSubmit' : 'PostToolUse');

  return { event, isPromptLike, source, tool };
}

async function runUsageQuotaCacheRefreshHook({
  hookName = 'usage-quota-cache-refresh',
  userAgent = 'claudekit-engineer/usage-quota-cache-refresh'
} = {}) {
  let lastHookEvent = 'PostToolUse';
  let lastToolName = '';

  try {
    const timer = createHookTimer(hookName);
    let inputStr = '';

    try {
      inputStr = fs.readFileSync(0, 'utf-8');
    } catch {}

    const input = JSON.parse(inputStr || '{}');
    const context = getUsageQuotaRefreshContext(input);
    lastHookEvent = context.event;
    lastToolName = context.tool;

    if (shouldFetch(context.isPromptLike)) {
      const fetchResult = await refreshUsageCache({
        fetchTimeoutMs: 5000,
        userAgent
      });
      timer.end({
        event: context.event,
        tool: context.tool,
        status: fetchResult.ok ? 'ok' : 'warn',
        exit: 0,
        note: fetchResult.note
      });
    } else {
      timer.end({
        event: context.event,
        tool: context.tool,
        status: 'skip',
        exit: 0,
        note: 'throttled'
      });
    }
  } catch (error) {
    logHookCrash(hookName, error, { event: lastHookEvent, tool: lastToolName });
  }

  console.log(JSON.stringify({ continue: true }));
}

if (require.main === module) {
  runUsageQuotaCacheRefreshHook().catch((error) => {
    logHookCrash('usage-quota-cache-refresh', error || 'main-catch');
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  });
}

module.exports = {
  runUsageQuotaCacheRefreshHook,
  getUsageQuotaRefreshContext
};
