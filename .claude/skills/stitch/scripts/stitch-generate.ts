/**
 * stitch-generate.ts — Generate UI designs from text prompts via Google Stitch SDK.
 *
 * Usage:
 *   npx tsx stitch-generate.ts "<prompt>" [--project <id>] [--project-name <title>] [--device mobile|desktop|tablet] [--variants <count>]
 *
 * Env: STITCH_API_KEY (required), STITCH_PROJECT_ID (optional default)
 *
 * Project resolution priority:
 *   1. --project <id>          direct Stitch project ID
 *   2. --project-name <title>  title-based lookup-or-create
 *   3. STITCH_PROJECT_ID env   user's global override (direct ID)
 *   4. auto-detect             git repo name from remote, or CWD basename
 *   5. "claudekit-default"     last resort fallback
 */

import { stitch } from "@google/stitch-sdk";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

// -- Quota helpers (inline to avoid cross-script import issues) --

const QUOTA_DIR = path.join(os.homedir(), ".claudekit");
const QUOTA_FILE = path.join(QUOTA_DIR, ".stitch-quota.json");
// Stitch free tier: 400 daily credits. No API to fetch real usage.
const DEFAULT_LIMIT = parseInt(process.env.STITCH_QUOTA_LIMIT || "400", 10);

interface QuotaState {
  date: string;
  count: number;
  limit: number;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadQuota(): QuotaState {
  try {
    if (fs.existsSync(QUOTA_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUOTA_FILE, "utf-8"));
      if (data.date !== todayUTC()) return { date: todayUTC(), count: 0, limit: data.limit || DEFAULT_LIMIT };
      return data;
    }
  } catch {
    /* corrupted — start fresh */
  }
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

// -- Project name auto-detection --

/**
 * Detect project name from git remote origin (repo name) or CWD basename.
 * Returns empty string if neither is available.
 * Truncated to 50 chars to stay within Stitch title length limits.
 */
function autoDetectProjectName(): string {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    // Extract repo name from SSH (git@github.com:org/repo.git) or HTTPS (https://github.com/org/repo.git)
    const repoName =
      remoteUrl
        .replace(/\.git$/, "")
        .split(/[/:}]/)
        .pop() || "";
    if (repoName) return repoName.slice(0, 50);
  } catch {
    /* not a git repo or no remote */
  }
  const cwdName = path.basename(process.cwd());
  return cwdName ? cwdName.slice(0, 50) : "";
}

const prompt = getPositionalArgs()[0];

// Resolve project identity per priority order
const directProjectId = getFlag("project") || process.env.STITCH_PROJECT_ID;
const projectNameFlag = getFlag("project-name");

// Determine if we use a direct ID (no lookup) or a title (lookup-or-create)
let projectId: string;
let isNameBasedProject = false;
let resolvedProjectName: string;

if (directProjectId) {
  // Priority 1 & 3: direct ID — no lookup needed
  projectId = directProjectId;
  resolvedProjectName = directProjectId;
  console.error(`[i] Project: ${projectId} (direct ID)`);
} else if (projectNameFlag) {
  // Priority 2: explicit --project-name flag
  projectId = projectNameFlag.slice(0, 50);
  resolvedProjectName = projectId;
  isNameBasedProject = true;
  console.error(`[i] Project name: "${projectId}" (--project-name flag)`);
} else {
  // Priority 4 & 5: auto-detect or fallback
  const detected = autoDetectProjectName();
  projectId = detected || "claudekit-default";
  resolvedProjectName = projectId;
  isNameBasedProject = true;
  if (detected) {
    console.error(`[i] Project name: "${projectId}" (auto-detected from git/CWD)`);
  } else {
    console.error(`[i] Project name: "${projectId}" (fallback default)`);
  }
}

// SDK expects uppercase device types: MOBILE, DESKTOP, TABLET, AGNOSTIC
const deviceFlag = getFlag("device");
const DEVICE_MAP: Record<string, "MOBILE" | "DESKTOP" | "TABLET"> = {
  mobile: "MOBILE",
  desktop: "DESKTOP",
  tablet: "TABLET",
};
const deviceType = deviceFlag
  ? DEVICE_MAP[deviceFlag.toLowerCase()] || (deviceFlag.toUpperCase() as "MOBILE" | "DESKTOP" | "TABLET")
  : undefined;
const variantCount = getFlag("variants") ? parseInt(getFlag("variants")!, 10) : 0;

if (!prompt) {
  console.error(
    "Usage: npx tsx stitch-generate.ts <prompt> [--project <id>] [--project-name <title>] [--device mobile|desktop|tablet] [--variants <count>]"
  );
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

    // Resolve project — name-based projects use lookup-or-create; direct IDs are used as-is
    let resolvedProjectId = projectId;
    if (isNameBasedProject) {
      const projects = await stitch.projects();
      const existing = projects.find((p) => p.data?.title === resolvedProjectName);
      if (existing) {
        resolvedProjectId = existing.id;
        console.error(`[i] Using existing project: "${resolvedProjectName}" (${resolvedProjectId})`);
      } else {
        console.error(`[i] Creating project "${resolvedProjectName}"...`);
        const created = await stitch.createProject(resolvedProjectName);
        resolvedProjectId = created.id;
        console.error(`[OK] Created project: "${resolvedProjectName}" (${resolvedProjectId})`);
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
