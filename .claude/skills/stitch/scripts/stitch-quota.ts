/**
 * stitch-quota.ts — Local quota tracker for Google Stitch daily credits.
 *
 * Usage:
 *   npx tsx stitch-quota.ts check       # Show remaining credits
 *   npx tsx stitch-quota.ts increment   # Bump count after generation
 *   npx tsx stitch-quota.ts reset       # Force reset counter
 *
 * Tracks usage in ~/.claudekit/.stitch-quota.json.
 * Auto-resets when date changes (UTC midnight).
 */

import fs from "fs";
import path from "path";
import os from "os";

// -- Config --

const QUOTA_DIR = path.join(os.homedir(), ".claudekit");
const QUOTA_FILE = path.join(QUOTA_DIR, ".stitch-quota.json");
// Stitch free tier: 400 daily credits (generate), 15 redesign credits (edit)
// Source: stitch.withgoogle.com dashboard. No API to fetch real usage.
const DEFAULT_LIMIT = parseInt(process.env.STITCH_QUOTA_LIMIT || "400", 10);
const WARN_THRESHOLD = 0.2; // Warn when <20% remaining

interface QuotaState {
  date: string;
  count: number;
  limit: number;
}

// -- Helpers --

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadQuota(): QuotaState {
  try {
    if (fs.existsSync(QUOTA_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUOTA_FILE, "utf-8"));
      // Auto-reset if date changed
      if (data.date !== todayUTC()) {
        return { date: todayUTC(), count: 0, limit: data.limit || DEFAULT_LIMIT };
      }
      return data;
    }
  } catch {
    // Corrupted file — start fresh
  }
  return { date: todayUTC(), count: 0, limit: DEFAULT_LIMIT };
}

function saveQuota(state: QuotaState): void {
  fs.mkdirSync(QUOTA_DIR, { recursive: true });
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(state, null, 2));
}

// -- Commands --

function check(): void {
  const state = loadQuota();
  saveQuota(state); // Persist auto-reset if date changed
  const remaining = state.limit - state.count;
  const pct = remaining / state.limit;

  console.log(JSON.stringify({
    date: state.date,
    used: state.count,
    remaining,
    limit: state.limit,
    percentRemaining: Math.round(pct * 100),
  }, null, 2));

  if (remaining <= 0) {
    console.error("[X] Daily quota exhausted. Use ck:ui-ux-pro-max as fallback.");
    process.exit(2);
  } else if (pct < WARN_THRESHOLD) {
    console.error(`[!] Low quota: ${remaining}/${state.limit} credits remaining (${Math.round(pct * 100)}%)`);
  } else {
    console.error(`[OK] ${remaining}/${state.limit} credits remaining`);
  }
}

function increment(): void {
  const state = loadQuota();
  state.count += 1;
  saveQuota(state);

  const remaining = state.limit - state.count;
  console.error(`[OK] Quota updated: ${state.count}/${state.limit} used (${remaining} remaining)`);

  if (remaining <= 0) {
    console.error("[!] Daily quota now exhausted.");
  } else if (remaining / state.limit < WARN_THRESHOLD) {
    console.error(`[!] Low quota warning: ${remaining} credits remaining`);
  }
}

function reset(): void {
  const state: QuotaState = { date: todayUTC(), count: 0, limit: DEFAULT_LIMIT };
  saveQuota(state);
  console.error(`[OK] Quota reset: 0/${state.limit} used`);
}

// -- Main --

const command = process.argv[2];

switch (command) {
  case "check":
    check();
    break;
  case "increment":
    increment();
    break;
  case "reset":
    reset();
    break;
  default:
    console.error("Usage: npx tsx stitch-quota.ts <check|increment|reset>");
    process.exit(1);
}
