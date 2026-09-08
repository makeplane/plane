// graphify-nudge.js — PreToolUse nudge (never blocks, always fails open).
// If the project has a graphify graph (graphify-out/graph.json) and Claude is
// about to search or read raw source files, inject a context reminder to
// orient via `graphify query` first. No graph -> no output, no effect.
'use strict';
const fs = require('fs');

const SRC_EXTS = new Set([
  '.py', '.js', '.ts', '.tsx', '.jsx', '.astro', '.vue', '.svelte', '.go',
  '.rs', '.java', '.rb', '.c', '.h', '.cpp', '.hpp', '.cc', '.cs', '.kt',
  '.swift', '.php', '.scala', '.lua', '.sh', '.ps1', '.md', '.rst', '.txt', '.mdx',
]);

const MSG =
  'graphify-out/graph.json exists in this project. Orient via the knowledge ' +
  'graph before broad searching or file-by-file reading: run ' +
  'graphify query "<question>" or graphify explain "<symbol>" (offline, ' +
  'instant), then open the specific files/lines it returns. Going straight ' +
  'to raw files is fine once you already know which lines you need.';

let raw = '';
process.stdin.on('data', (d) => { raw += d; });
process.stdin.on('end', () => {
  // NOTE: no process.exit() after writing — exiting with pending pipe output
  // truncates it on Windows. Let the event loop drain naturally.
  try {
    if (!fs.existsSync('graphify-out/graph.json')) return;
    const data = JSON.parse(raw.trim()); // trim() also strips a BOM (PS 5.1 pipes add one)
    const tool = data.tool_name || '';
    const ti = data.tool_input || {};
    let hit = false;

    if (tool === 'Bash') {
      const cmd = String(ti.command || '');
      hit = /(^|[\s|;&(])(grep|rg|ripgrep|ack|ag|fd|find|Select-String)(\.exe)?\s/i.test(cmd);
    } else if (tool === 'Read' || tool === 'Glob' || tool === 'Grep') {
      const vals = [ti.file_path, ti.pattern, ti.path].filter(Boolean).map(String);
      const joined = vals.join(' ').toLowerCase().replace(/\\/g, '/');
      if (!joined.includes('graphify-out/')) {
        hit = vals.some((v) => {
          const tail = v.toLowerCase().replace(/\\/g, '/').split('/').pop();
          const dot = tail.lastIndexOf('.');
          return dot > -1 && SRC_EXTS.has(tail.slice(dot));
        });
      }
    }

    if (hit) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: MSG },
      }));
    }
  } catch (_) { /* fail open */ }
  process.exitCode = 0;
});
