#!/usr/bin/env node
/**
 * Development Rules Reminder - UserPromptSubmit Hook (Optimized)
 *
 * Injects context: session info, rules, modularization reminders, and Plan Context.
 * Static env info (Node, Python, OS) now comes from SessionStart env vars.
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 *
 * Core logic extracted to lib/context-builder.cjs for OpenCode plugin reuse.
 */

const fs = require('fs');

// Import shared context building logic
const {
  buildReminderContext,
  wasRecentlyInjected
} = require('./lib/context-builder.cjs');
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('dev-rules-reminder')) {
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin);
    if (wasRecentlyInjected(payload.transcript_path)) process.exit(0);

    // Get session ID from hook input or env var
    const sessionId = payload.session_id || process.env.CK_SESSION_ID || null;

    // Issue #327: Use CWD as base for subdirectory workflow support
    // The baseDir is passed to buildReminderContext for absolute path resolution
    const baseDir = process.cwd();

    // Use shared context builder with baseDir for absolute paths
    const { content } = buildReminderContext({ sessionId, baseDir });

    console.log(content);
    process.exit(0);
  } catch (error) {
    console.error(`Dev rules hook error: ${error.message}`);
    process.exit(0);
  }
}

main();
