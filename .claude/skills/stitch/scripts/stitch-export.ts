/**
 * stitch-export.ts — Export Stitch designs as HTML, image, or DESIGN.md.
 *
 * Usage:
 *   npx tsx stitch-export.ts <screen-id> [--project <id>] [--project-name <title>] [--format html|image|all] [--output <dir>]
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
import { execSync } from "child_process";

// -- Argument parsing --

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

const screenId = getPositionalArgs()[0];

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

const format = getFlag("format") || "all";
const outputDir = getFlag("output") || "./stitch-exports";

if (!screenId) {
  console.error(
    "Usage: npx tsx stitch-export.ts <screen-id> [--project <id>] [--project-name <title>] [--format html|image|all] [--output <dir>]"
  );
  process.exit(1);
}

if (!process.env.STITCH_API_KEY) {
  console.error("[X] STITCH_API_KEY not set. Get one at https://stitch.withgoogle.com/settings/api");
  process.exit(1);
}

// -- Helpers --

async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

/**
 * Generate a DESIGN.md from HTML content by extracting Tailwind classes,
 * color values, typography patterns, and component structure.
 */
function generateDesignMd(html: string): string {
  const lines: string[] = ["# Design System", "", "Auto-generated from Google Stitch export.", ""];

  // Extract colors from Tailwind classes and inline styles
  const colorMatches = html.match(/(?:bg|text|border)-(?:\w+)-(\d+)/g) || [];
  const uniqueColors = [...new Set(colorMatches)].slice(0, 20);
  if (uniqueColors.length > 0) {
    lines.push("## Colors", "");
    uniqueColors.forEach((c) => lines.push(`- \`${c}\``));
    lines.push("");
  }

  // Extract typography classes
  const textMatches =
    html.match(
      /(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)|font-(?:thin|light|normal|medium|semibold|bold|extrabold))/g
    ) || [];
  const uniqueText = [...new Set(textMatches)].slice(0, 15);
  if (uniqueText.length > 0) {
    lines.push("## Typography", "");
    uniqueText.forEach((t) => lines.push(`- \`${t}\``));
    lines.push("");
  }

  // Extract spacing patterns
  const spacingMatches = html.match(/(?:p|m|gap|space)-(?:x|y)?-?\d+/g) || [];
  const uniqueSpacing = [...new Set(spacingMatches)].slice(0, 15);
  if (uniqueSpacing.length > 0) {
    lines.push("## Spacing", "");
    uniqueSpacing.forEach((s) => lines.push(`- \`${s}\``));
    lines.push("");
  }

  // Extract component-level structure from HTML tags
  const componentMatches =
    html.match(/<(section|nav|header|footer|main|aside|form|button|input|table|dialog)[^>]*>/gi) || [];
  const uniqueComponents = [...new Set(componentMatches.map((c) => c.match(/<(\w+)/)?.[1] || ""))].filter(Boolean);
  if (uniqueComponents.length > 0) {
    lines.push("## Components", "");
    uniqueComponents.forEach((c) => lines.push(`- \`<${c}>\``));
    lines.push("");
  }

  lines.push(
    "## Notes",
    "",
    "- Generated by Google Stitch AI",
    "- Tailwind CSS utility classes used throughout",
    "- Review and customize colors/typography for brand alignment"
  );

  return lines.join("\n");
}

// -- Main --

async function main() {
  try {
    fs.mkdirSync(outputDir, { recursive: true });

    console.error(`[i] Exporting screen ${screenId} from project "${resolvedProjectName}"`);
    // Resolve project handle — name-based projects look up by title first; direct IDs used as-is
    let project;
    if (isNameBasedProject) {
      const projects = await stitch.projects();
      const found = projects.find((p) => p.data?.title === resolvedProjectName);
      if (found) {
        console.error(`[i] Using existing project: "${resolvedProjectName}" (${found.id})`);
        project = stitch.project(found.id);
      } else {
        // Project doesn't exist — use the name as a fallback handle (will likely 404 on getScreen)
        console.error(`[!] Project "${resolvedProjectName}" not found; proceeding with name as ID`);
        project = stitch.project(projectId);
      }
    } else {
      project = stitch.project(projectId);
    }
    const screen = await project.getScreen(screenId!);

    const exported: Record<string, string> = {};

    // Export HTML
    if (format === "html" || format === "all") {
      const htmlUrl = await screen.getHtml();
      const htmlPath = path.join(outputDir, "design.html");
      await downloadFile(htmlUrl, htmlPath);
      exported.html = htmlPath;
      console.error(`[OK] HTML exported: ${htmlPath}`);

      // Generate DESIGN.md from HTML
      if (format === "all") {
        const htmlContent = fs.readFileSync(htmlPath, "utf-8");
        const designMd = generateDesignMd(htmlContent);
        const designPath = path.join(outputDir, "DESIGN.md");
        fs.writeFileSync(designPath, designMd);
        exported.designMd = designPath;
        console.error(`[OK] DESIGN.md generated: ${designPath}`);
      }
    }

    // Export image
    if (format === "image" || format === "all") {
      const imageUrl = await screen.getImage();
      const imagePath = path.join(outputDir, "design.png");
      await downloadFile(imageUrl, imagePath);
      exported.image = imagePath;
      console.error(`[OK] Image exported: ${imagePath}`);
    }

    // Output result JSON to stdout
    console.log(JSON.stringify({ screenId, projectId, format, exported }, null, 2));
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "NOT_FOUND") {
      console.error(`[X] Screen "${screenId}" not found in project "${projectId}".`);
    } else if (err.code === "AUTH_FAILED") {
      console.error("[X] Authentication failed. Check STITCH_API_KEY env var.");
    } else {
      console.error(`[X] Export error: ${err.message || error}`);
    }
    process.exit(1);
  }
}

main();
