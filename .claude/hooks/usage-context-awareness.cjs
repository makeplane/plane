#!/usr/bin/env node
/**
 * Legacy semantic wrapper for prompt-awareness-related usage behavior.
 *
 * Keep this hook name aligned with the config meaning:
 * it is gated by `usage-context-awareness`.
 *
 * Cosmetic statusline cache warming now lives in:
 * - usage-quota-cache-refresh.cjs
 */

'use strict';

try {
  const { isHookEnabled } = require('./lib/ck-config-utils.cjs');
  const { logHookCrash } = require('./lib/hook-logger.cjs');
  const { runUsageQuotaCacheRefreshHook } = require('./usage-quota-cache-refresh.cjs');

  if (!isHookEnabled('usage-context-awareness')) {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  runUsageQuotaCacheRefreshHook({
    hookName: 'usage-context-awareness',
    userAgent: 'claudekit-engineer/usage-context-awareness'
  }).catch((error) => {
    logHookCrash('usage-context-awareness', error || 'main-catch');
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  });
} catch (error) {
  try {
    const { logHookCrash } = require('./lib/hook-logger.cjs');
    logHookCrash('usage-context-awareness', error);
  } catch {}
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}
