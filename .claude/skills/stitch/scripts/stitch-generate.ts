/**
 * stitch-generate.ts — Generate UI designs from text prompts via Google Stitch SDK.
 *
 * Usage:
 *   npx tsx stitch-generate.ts "<prompt>" [--project <id>] [--device mobile|desktop|tablet] [--variants <count>]
 *
 * Env: STITCH_API_KEY (required), STITCH_PROJECT_ID (optional default)
 */

import { stitch } from "@google/stitch-sdk";
import fs from "fs";
import path from "path";
import os from "os";

// -- Quota helpers (inline to avoid cross-script import issues) --

const QUOTA_DIR = path.join(os.homedir(), ".claudekit");
const QUOTA_FILE = path.join(QUOTA_DIR, ".stitch-quota.json");
// Stitch free tier: 400 daily credits. No API to fetch real usage.
const DEFAULT_LIMIT = parseInt(process.env.STITCH_QUOTA_LIMIT || "400", 10);

interface QuotaState { date: string; count: number; limit: number; }

function todayUTC(): string { return new Date().toISOString().slice(0, 10); }

function loadQuota(): QuotaState {
  try {
    if (fs.existsSync(QUOTA_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUOTA_FILE, "utf-8"));
      if (data.date !== todayUTC()) return { date: todayUTC(), count: 0, limit: data.limit || DEFAULT_LIMIT };
      return data;
    }
  } catch { /* corrupted — start fresh */ }
  return { date: todayUTC(), count: 0, limit: DEFAULT_LIMIT };
}

function saveQuota(state: QuotaState): void {
  fs.mkdirSync(QUOTA_DIR, { recursive: true });
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(state, null, 2));
}

// -- Argument parsing (minimal, no deps) --

const args = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

// Extract positional args (skip flags and their values)
function getPositionalArgs(): string[] {
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      i++; // skip flag value
    } else {
      positional.push(args[i]);
    }
  }
  return positional;
}

const prompt = getPositionalArgs()[0];
const projectId =
  getFlag("project") || process.env.STITCH_PROJECT_ID || "claudekit-default";
// SDK expects uppercase device types: MOBILE, DESKTOP, TABLET, AGNOSTIC
const deviceFlag = getFlag("device");
const DEVICE_MAP: Record<string, "MOBILE" | "DESKTOP" | "TABLET"> = {
  mobile: "MOBILE", desktop: "DESKTOP", tablet: "TABLET",
};
const deviceType = deviceFlag
  ? DEVICE_MAP[deviceFlag.toLowerCase()] || (deviceFlag.toUpperCase() as "MOBILE" | "DESKTOP" | "TABLET")
  : undefined;
const variantCount = getFlag("variants") ? parseInt(getFlag("variants")!, 10) : 0;

if (!prompt) {
  console.error("Usage: npx tsx stitch-generate.ts <prompt> [--project <id>] [--device mobile|desktop|tablet] [--variants <count>]");
  process.exit(1);
}

if (!process.env.STITCH_API_KEY) {
  console.error("[X] STITCH_API_KEY not set. Get one at https://stitch.withgoogle.com/settings/api");
  process.exit(1);
}

// -- Main --

async function main() {
  try {
    // Pre-check quota — 1 credit per generate, 1 per variant
    const creditsNeeded = 1 + variantCount;
    const quota = loadQuota();
    const remaining = quota.limit - quota.count;
    if (remaining < creditsNeeded) {
      console.error(`[X] Not enough credits: need ${creditsNeeded}, have ${remaining}/${quota.limit}.`);
      console.error("[i] Use ck:ui-ux-pro-max as fallback, or wait until midnight UTC.");
      process.exit(2);
    }
    console.error(`[i] Credits: ${remaining}/${quota.limit} remaining (this run costs ${creditsNeeded})`);
    console.error(`[i] Prompt: "${prompt}"`);

    // Resolve project — use existing or create if "claudekit-default" doesn't exist
    const isDefaultProject = projectId === "claudekit-default";
    let resolvedProjectId = projectId;
    if (isDefaultProject) {
      const projects = await stitch.projects();
      const existing = projects.find(p => p.data?.title === "claudekit-default");
      if (existing) {
        resolvedProjectId = existing.id;
        console.error(`[i] Using project: ${resolvedProjectId}`);
      } else {
        console.error("[i] Creating default project 'claudekit-default'...");
        const created = await stitch.createProject("claudekit-default");
        resolvedProjectId = created.id;
        console.error(`[OK] Created project: ${resolvedProjectId}`);
      }
    } else {
      console.error(`[i] Using project: ${resolvedProjectId}`);
    }
    // Always use a fresh handle for generation
    const project = stitch.project(resolvedProjectId);

    // SDK signature: generate(prompt, deviceType?, modelId?)
    const screen = await project.generate(prompt!, deviceType);

    const imageUrl = await screen.getImage();

    const result: Record<string, unknown> = {
      screenId: screen.id,
      projectId: resolvedProjectId,
      imageUrl,
      prompt,
    };

    // Generate variants if requested
    if (variantCount > 0) {
      console.error(`[i] Generating ${variantCount} variant(s)...`);
      const variants = await screen.variants("Generate design variants", {
        variantCount,
        creativeRange: "medium",
      });

      result.variants = await Promise.all(
        variants.map(async (v) => ({
          screenId: v.id,
          imageUrl: await v.getImage(),
        }))
      );
    }

    // Auto-increment quota tracker
    const postQuota = loadQuota();
    postQuota.count += creditsNeeded;
    saveQuota(postQuota);
    const postRemaining = postQuota.limit - postQuota.count;
    console.error(`[OK] Quota updated: ${postQuota.count}/${postQuota.limit} used (${postRemaining} remaining)`);

    result.creditsUsed = creditsNeeded;
    result.creditsRemaining = postRemaining;

    // Output JSON to stdout (logs go to stderr)
    console.log(JSON.stringify(result, null, 2));
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "RATE_LIMITED") {
      // Auto-sync local tracker — API is the source of truth
      const q = loadQuota();
      q.count = q.limit;
      saveQuota(q);
      console.error("[X] Daily quota exceeded (local tracker synced). Try tomorrow or use ck:ui-ux-pro-max.");
    } else if (err.code === "AUTH_FAILED") {
      console.error("[X] Authentication failed. Check STITCH_API_KEY env var.");
    } else {
      console.error(`[X] Stitch error: ${err.message || error}`);
    }
    process.exit(1);
  }
}

main();
