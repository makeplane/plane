#!/usr/bin/env node
/**
 * PostToolUse hook — warns when plan.md uses filenames as link text instead of human-readable names.
 * Reads stdin JSON from Claude, checks file_path and content for bad link text patterns.
 * Always fail-open: returns { continue: true } on any error.
 */

'use strict';

const { createHookTimer, logHookCrash } = require('./lib/hook-logger.cjs');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  const timer = createHookTimer('plan-format-kanban', { event: 'PostToolUse' });
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';

    // Only check plan.md files
    if (!filePath.endsWith('/plan.md')) {
      timer.end({ tool: toolName, status: 'skip', exit: 0, note: 'non-plan-file' });
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    // Read the file and check for filename-as-link-text pattern
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      timer.end({ tool: toolName, status: 'skip', exit: 0, note: 'file-missing' });
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    // Matches: [phase-01a-some-name.md](./...) — filename used as link text
    const badPattern = /\|\s*\d+[a-z]?\s*\|\s*\[phase-\d+[a-z]?-[^\]]*\.md\]\(/gi;
    const matches = content.match(badPattern);

    const warnings = [];

    if (matches && matches.length > 0) {
      warnings.push(
        '[!] plan.md: Link text should be human-readable, not filenames.',
        `    Found ${matches.length} instance(s) using filename as link text.`,
        '    Bad:  [phase-01-setup.md](./phase-01-setup.md)',
        '    Good: [Setup Environment](./phase-01-setup.md)',
        '    Update link text to descriptive phase names for better readability.'
      );
    }

    // Check for direct status edits in phases table
    if (toolName === 'Edit' || toolName === 'Write') {
      const toolOutput = data.tool_input?.new_string || data.tool_input?.content || '';

      // M6: Only detect status edits in actual table rows (lines starting with |)
      // Avoids false positives from frontmatter or prose containing status words
      const lines = (toolOutput || '').split('\n');
      const editingTableStatus = lines.some(line => {
        // Must be a table row containing a phase ID AND a status keyword
        // Covers all values the shared normalizeStatus() recognizes
        return /^\|\s*\d+[a-z]?\s*\|/i.test(line) &&
               /\|\s*(Pending|In Progress|In-Progress|Completed|Complete|Done|Active|WIP)\s*\|/i.test(line);
      });

      // Only warn if editing a plan.md file's phases table
      if (editingTableStatus) {
        warnings.push(
          '\n[Plan Status Warning] Direct status edit detected in phases table.',
          'Canonical format: | Phase | Name | Status | (3-column table)',
          'Use CLI for deterministic status updates:',
          '  ck plan check <id>          # Mark completed',
          '  ck plan check <id> --start  # Mark in-progress',
          '  ck plan uncheck <id>        # Revert to pending',
          'Direct edits may break canonical format.'
        );
      }
    }

    if (warnings.length > 0) {
      timer.end({
        tool: toolName,
        status: 'warn',
        exit: 0,
        target: 'plan.md',
        note: `${warnings.length}-warning(s)`
      });
      process.stdout.write(JSON.stringify({ continue: true, additionalContext: warnings.join('\n') }));
      return;
    }

    timer.end({ tool: toolName, status: 'ok', exit: 0, target: 'plan.md' });
    process.stdout.write(JSON.stringify({ continue: true }));
  } catch (_err) {
    // Fail-open: never block on hook errors
    logHookCrash('plan-format-kanban', _err, { event: 'PostToolUse' });
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});
