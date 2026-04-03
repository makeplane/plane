#!/usr/bin/env node
/**
 * Session State Hook - Persist/restore session progress across sessions
 *
 * Fires on: SessionStart (load+compact), Stop (persist+archive), SubagentStop (append)
 * Purpose: Eliminate context loss between sessions and across compactions
 *
 * Exit Codes:
 *   0 - Always (fail-open, non-blocking)
 */

// Crash wrapper
try {
  const fs = require('fs');
  const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

  if (!isHookEnabled('session-state')) process.exit(0);

  const { loadState, persistState } = require('./lib/session-state-manager.cjs');

  const stdin = fs.readFileSync(0, 'utf-8').trim();
  const data = stdin ? JSON.parse(stdin) : {};
  const eventType = data.hook_event_name || null;

  // --- Stop / SubagentStop: persist state ---
  if (eventType === 'Stop' || eventType === 'SubagentStop') {
    persistState(data, { eventType });
    process.exit(0);
  }

  // --- SessionStart: load previous state ---
  // SessionStart stdin has `source` field, not hook_event_name
  if (!eventType) {
    const isCompact = data.source === 'compact';
    // Only inject on startup or compact (skip resume/clear)
    if (data.source && data.source !== 'startup' && !isCompact) process.exit(0);

    const state = loadState(process.cwd());
    if (state) {
      if (isCompact) {
        console.log('\n--- Session State (Post-Compaction Recovery) ---');
        console.log(state);
        console.log('--- End Session State ---\n');
        console.log('Context was compacted. Above is your last saved progress. Resume from where you left off.');
        console.log('IMPORTANT: Re-read active plan files and todo list. Do NOT re-do completed work.');
      } else {
        console.log('\n--- Previous Session State ---');
        console.log(state);
        console.log('--- End Session State ---\n');
        console.log('Review above state from your last session. Continue where you left off or start fresh.');
      }
    }
    process.exit(0);
  }

  process.exit(0);
} catch (e) {
  // Minimal crash logging (zero deps — only Node builtins)
  try {
    const fs = require('fs');
    const p = require('path');
    const logDir = p.join(__dirname, '.logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(p.join(logDir, 'hook-log.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), hook: 'session-state', status: 'crash', error: e.message }) + '\n');
  } catch (_) {}
  process.exit(0); // fail-open
}
