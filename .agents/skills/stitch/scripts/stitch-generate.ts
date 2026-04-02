/**
 * stitch-generate.ts — Generate UI designs from text prompts via Google Stitch SDK.
 *
 * Usage:
 *   npx tsx stitch-generate.ts "<prompt>" [--project <id>] [--device mobile|desktop|tablet] [--variants <count>]
 *
 * Env: STITCH_API_KEY (required), STITCH_PROJECT_ID (optional default)
 */

import { stitch } from "@google/stitch-sdk";

// -- Argument parsing (minimal, no deps) --

const args = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
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
const deviceType = (getFlag("device") as "mobile" | "desktop" | "tablet") || undefined;
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
    console.error(`[i] Generating design for project: ${projectId}`);
    console.error(`[i] Prompt: "${prompt}"`);

    const project = await stitch.project(projectId);
    const generateOptions = deviceType ? { deviceType } : undefined;
    const screen = await project.generate(prompt!, generateOptions);

    const imageUrl = await screen.getImage();

    const result: Record<string, unknown> = {
      screenId: screen.id,
      projectId,
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

    // Output JSON to stdout (logs go to stderr)
    console.log(JSON.stringify(result, null, 2));
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "RATE_LIMITED") {
      console.error("[X] Daily quota exceeded. Try again tomorrow or use ck:ui-ux-pro-max fallback.");
    } else if (err.code === "AUTH_FAILED") {
      console.error("[X] Authentication failed. Check STITCH_API_KEY env var.");
    } else {
      console.error(`[X] Stitch error: ${err.message || error}`);
    }
    process.exit(1);
  }
}

main();
