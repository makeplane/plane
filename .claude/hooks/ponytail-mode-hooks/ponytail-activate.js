#!/usr/bin/env node
// ponytail-mode-hooks — SessionStart hook (standalone bundle)
//
// Runs on every session start: writes the active-mode flag file and emits
// the ponytail ladder as hidden SessionStart context, so the ladder is in
// context every turn without the user invoking a skill manually.
//
// Unlike the upstream plugin's activate hook, this does NOT also nudge the
// user to set up a statusline badge — that feature read two more bundled
// script files (ponytail-statusline.sh/.ps1) purely for an optional UI
// convenience, which would re-introduce a multi-file dependency this
// standalone package is built to avoid. Skipped: statusline nudge,
// add it back (copy the two statusline scripts in) if you want the badge.

const { getDefaultMode } = require('./ponytail-config');
const { clearMode, setMode, writeHookOutput } = require('./ponytail-runtime');
const { getPonytailInstructions } = require('./ponytail-instructions');

const mode = getDefaultMode();

if (mode === 'off') {
  clearMode();
  process.exit(0);
}

try {
  setMode(mode);
} catch (e) {
  // Silent fail — flag is best-effort, don't block the hook
}

try {
  writeHookOutput('SessionStart', mode, getPonytailInstructions(mode));
} catch (e) {
  // Silent fail — stdout closed/EPIPE at hook exit must not surface as a hook failure
}
