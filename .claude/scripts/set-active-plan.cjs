#!/usr/bin/env node
/**
 * Update session state with new active plan
 *
 * Usage: node .claude/scripts/set-active-plan.cjs <plan-path>
 *
 * This script updates the session temp file with the new active plan path,
 * allowing subagents to receive the latest plan context via SubagentStart hook.
 *
 * The session temp file (/tmp/ck-session-{id}.json) is the source of truth
 * for plan context within a session. Env vars ($CK_ACTIVE_PLAN) are just
 * the initial snapshot from session start.
 */

const path = require('path');
const { writeSessionState, readSessionState } = require('../hooks/lib/ck-config-utils.cjs');

const sessionId = process.env.CK_SESSION_ID;
const newPlan = process.argv[2];

if (!newPlan) {
  console.error('Error: Plan path required');
  console.log('Usage: node .claude/scripts/set-active-plan.cjs <plan-path>');
  console.log('Example: node .claude/scripts/set-active-plan.cjs plans/251207-1030-feature-name');
  process.exit(1);
}

// Issue #335: Resolve to absolute path to support brownfield/subdirectory workflows
// When agent navigates away from session origin, relative paths become invalid
const absolutePlan = path.resolve(newPlan);

if (!sessionId) {
  console.warn('Warning: CK_SESSION_ID not set - session state will not persist');
  console.log(`Would set active plan to: ${absolutePlan}`);
  process.exit(0);
}

const current = readSessionState(sessionId) || {};
const success = writeSessionState(sessionId, {
  ...current,
  activePlan: absolutePlan,
  timestamp: Date.now()
});

if (success) {
  console.log(`Active plan set to: ${absolutePlan}`);
} else {
  console.error('Failed to update session state');
  process.exit(1);
}
