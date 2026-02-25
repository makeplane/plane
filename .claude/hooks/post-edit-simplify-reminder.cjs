#!/usr/bin/env node
/**
 * PostToolUse hook: Tracks file modifications and reminds to run code-simplifier
 *
 * This hook fires after Edit/Write/MultiEdit operations and:
 * 1. Tracks modified files in the session
 * 2. After significant edits, injects a reminder to run code-simplifier
 *
 * Auto-trigger behavior:
 * - Tracks edit count per session
 * - After 5+ file edits, reminds about code-simplifier
 * - Resets counter when simplifier is mentioned in conversation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('post-edit-simplify-reminder')) {
  process.exit(0);
}

// Session tracking file
const SESSION_TRACK_FILE = path.join(os.tmpdir(), 'ck-simplify-session.json');
const EDIT_THRESHOLD = 5; // Remind after this many edits

/**
 * Load or initialize session tracking data
 */
function loadSessionData() {
  try {
    if (fs.existsSync(SESSION_TRACK_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_TRACK_FILE, 'utf8'));
      // Reset if session is older than 2 hours
      if (Date.now() - data.startTime > 2 * 60 * 60 * 1000) {
        return initSessionData();
      }
      return data;
    }
  } catch (e) {
    // Ignore errors, reinitialize
  }
  return initSessionData();
}

/**
 * Initialize fresh session data
 */
function initSessionData() {
  return {
    startTime: Date.now(),
    editCount: 0,
    modifiedFiles: [],
    lastReminder: 0,
    simplifierRun: false
  };
}

/**
 * Save session tracking data
 */
function saveSessionData(data) {
  try {
    fs.writeFileSync(SESSION_TRACK_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    // Ignore write errors
  }
}

/**
 * Main hook logic
 */
function main() {
  try {
    // Read hook input from stdin
    let input = '';
    const stdin = fs.readFileSync(0, 'utf8');
    if (stdin) {
      input = stdin;
    }

    const hookData = JSON.parse(input || '{}');
    const toolName = hookData.tool_name || '';
    const toolInput = hookData.tool_input || {};

    // Only track edit operations
    const editTools = ['Edit', 'Write', 'MultiEdit'];
    if (!editTools.includes(toolName)) {
      // Pass through without modification
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // Load session data
    const session = loadSessionData();

    // Track the edit
    session.editCount++;
    const filePath = toolInput.file_path || toolInput.path || '';
    if (filePath && !session.modifiedFiles.includes(filePath)) {
      session.modifiedFiles.push(filePath);
    }

    // Check if we should remind about code-simplifier
    const shouldRemind =
      session.editCount >= EDIT_THRESHOLD &&
      !session.simplifierRun &&
      (Date.now() - session.lastReminder > 10 * 60 * 1000); // Don't remind more than every 10 min

    let additionalContext = '';
    if (shouldRemind) {
      session.lastReminder = Date.now();
      additionalContext = `\n\n[Code Simplification Reminder] You have modified ${session.modifiedFiles.length} files in this session. Consider using the \`code-simplifier\` agent to refine recent changes before proceeding to code review. This is a MANDATORY step in the workflow.`;
    }

    // Save updated session data
    saveSessionData(session);

    // Output hook result
    const result = {
      continue: true
    };

    if (additionalContext) {
      result.additionalContext = additionalContext;
    }

    console.log(JSON.stringify(result));

  } catch (e) {
    // On error, allow the operation to continue
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
