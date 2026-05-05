#!/usr/bin/env node
/**
 * GitNexus Stale-Check — PostToolUse hook
 *
 * Fires after a Bash tool call. If the command was a successful `git commit`,
 * compares .gitnexus/meta.json#lastCommit vs current HEAD. If different,
 * outputs a hint so the agent re-indexes via `./scripts/gitnexus.sh reindex-bg`.
 *
 * Non-blocking: always exits 0 so the agent's flow is never interrupted.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

(function main() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf-8");
  } catch {
    return;
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }

  const toolName = event?.tool_name || event?.tool || "";
  if (!/Bash/i.test(toolName)) return;

  const cmd = event?.tool_input?.command || event?.input?.command || "";
  if (!/\bgit\s+commit\b/.test(cmd)) return;

  const repoRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const metaPath = path.join(repoRoot, ".gitnexus", "meta.json");
  if (!fs.existsSync(metaPath)) return;

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return;
  }
  if (!meta?.lastCommit) return;

  let head;
  try {
    head = execSync("git rev-parse HEAD", { cwd: repoRoot }).toString().trim();
  } catch {
    return;
  }

  if (head === meta.lastCommit) return;

  const indexed = meta.lastCommit.slice(0, 8);
  const current = head.slice(0, 8);
  process.stdout.write(
    `[gitnexus] Index is stale (indexed: ${indexed}, HEAD: ${current}). ` +
      `Re-index with: ./scripts/gitnexus.sh reindex-bg\n`
  );
})();
