#!/usr/bin/env node
/**
 * Plan Subagent Stop Hook - Cook Skill Reminder
 *
 * Fires when Plan subagent completes. Reminds to invoke /cook --auto before implementation.
 * Also outputs full absolute path so new sessions (after /clear) can find the plan in worktrees.
 *
 * Exit Codes:
 *   0 - Success (non-blocking)
 */

const fs = require('fs');
const path = require('path');
const { isHookEnabled, readSessionState } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('cook-after-plan-reminder')) {
  process.exit(0);
}

async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    // Get active plan path from session state
    const sessionId = process.env.CK_SESSION_ID;
    let planPath = null;

    if (sessionId) {
      const state = readSessionState(sessionId);
      if (state?.activePlan) {
        planPath = state.activePlan;
        // Ensure it's absolute
        if (!path.isAbsolute(planPath) && state.sessionOrigin) {
          planPath = path.resolve(state.sessionOrigin, planPath);
        }
      }
    }

    // Output reminder with full absolute path if available
    console.log('MUST invoke /cook --auto skill before implementing the plan');
    if (planPath) {
      const planMdPath = path.join(planPath, 'plan.md');
      console.log(`Best Practice: Run /clear then /cook ${planMdPath}`);
    } else {
      // Fallback when plan path unavailable
      console.log('Best Practice: Run /clear then /cook {full-absolute-path-to-plan.md}');
    }

    process.exit(0);
  } catch (error) {
    // Silent fail - non-blocking
    process.exit(0);
  }
}

main();
