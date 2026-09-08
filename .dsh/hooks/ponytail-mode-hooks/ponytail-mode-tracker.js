#!/usr/bin/env node
// ponytail-mode-hooks — UserPromptSubmit hook (standalone bundle)
// Inspects user input for /ponytail commands and writes mode to flag file.

const { getDefaultMode, isDeactivationCommand } = require('./ponytail-config');
const { clearMode, setMode, writeHookOutput } = require('./ponytail-runtime');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    // Strip UTF-8 BOM some shells prepend when piping (breaks JSON.parse)
    const data = JSON.parse(input.replace(/^﻿/, ''));
    const prompt = (data.prompt || '').trim().toLowerCase();

    if (/^\/ponytail/.test(prompt)) {
      const parts = prompt.split(/\s+/);
      const cmd = parts[0];
      const arg = parts[1] || '';

      let mode = null;

      if (cmd === '/ponytail-review') {
        mode = 'review';
      } else if (cmd === '/ponytail') {
        if (arg === 'lite') mode = 'lite';
        else if (arg === 'full') mode = 'full';
        else if (arg === 'ultra') mode = 'ultra';
        else if (arg === 'off') mode = 'off';
        else mode = getDefaultMode();
      }

      if (mode && mode !== 'off') {
        setMode(mode);
        writeHookOutput('UserPromptSubmit', mode, 'PONYTAIL MODE CHANGED — level: ' + mode);
      } else if (mode === 'off') {
        clearMode();
        writeHookOutput('UserPromptSubmit', 'off', 'PONYTAIL MODE OFF');
      }
    }

    if (isDeactivationCommand(prompt)) {
      clearMode();
      writeHookOutput('UserPromptSubmit', 'off', 'PONYTAIL MODE OFF');
    }
  } catch (e) {
    // Silent fail
  }
});
