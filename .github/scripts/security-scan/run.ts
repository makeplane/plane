import { execFileSync } from "node:child_process";
import { createClaudeClient } from "./lib/claude-client";
import { parseDiff } from "./lib/diff";
import { formatReport } from "./lib/format-report";
import { listTrackedFiles, readContentItems, selectFilesForChecks } from "./lib/gather";
import { log } from "./lib/log";
import { writeJobSummary } from "./lib/report-job-summary";
import { postStickyComment } from "./lib/report-pr-comment";
import { runScan } from "./lib/scan";
import { checks } from "./registry";
import type { ContentItem, ScanMode } from "./types";

const DEFAULT_BASE_REF = "origin/preview";

interface Options {
  readonly mode: ScanMode;
  readonly base: string;
  readonly dryRun: boolean;
}

function parseOptions(argv: readonly string[]): Options {
  const flag = (name: string): string | undefined =>
    argv
      .find((arg) => arg.startsWith(`--${name}=`))
      ?.split("=")
      .slice(1)
      .join("=");

  const mode = flag("mode") ?? "pr";
  if (mode !== "pr" && mode !== "full") {
    throw new Error(`unknown --mode "${mode}" (expected "pr" or "full")`);
  }

  return {
    mode,
    base: flag("base") ?? DEFAULT_BASE_REF,
    dryRun: argv.includes("--dry-run"),
  };
}

function gatherPrContent(base: string): ContentItem[] {
  const diff = execFileSync("git", ["diff", "--merge-base", base, "HEAD"], {
    encoding: "utf-8",
    maxBuffer: 256 * 1024 * 1024,
  });
  return parseDiff(diff);
}

function gatherFullContent(): ContentItem[] {
  return readContentItems(selectFilesForChecks(listTrackedFiles(), checks));
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey.length === 0) {
    if (options.mode === "full") {
      // Nobody triggers a baseline scan by accident, so silently doing nothing
      // here would just look like a scan that found no problems.
      throw new Error("ANTHROPIC_API_KEY is not set — cannot run a baseline scan.");
    }
    // Fork PRs never receive repository secrets (see ADR-0002). Skipping quietly
    // is the designed behaviour there, so this is not an error.
    log.info("ANTHROPIC_API_KEY is not set — skipping scan.");
    return;
  }

  const items = options.mode === "pr" ? gatherPrContent(options.base) : gatherFullContent();

  const results = await runScan({
    client: createClaudeClient(apiKey),
    checks,
    items,
    mode: options.mode,
  });

  const report = formatReport(results);

  if (options.dryRun) {
    log.info(report);
    return;
  }

  await publish(report, options.mode);
}

function resolvePrNumber(): number | null {
  const fromFlag = process.env.PR_NUMBER;
  const parsed = Number.parseInt(fromFlag ?? "", 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function publish(report: string, mode: ScanMode): Promise<void> {
  if (mode === "full") {
    writeJobSummary(report);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const prNumber = resolvePrNumber();

  if (token === undefined || repository === undefined || prNumber === null) {
    log.info("Not running against a pull request — printing report instead of commenting.");
    log.info(report);
    return;
  }

  await postStickyComment({ token, repository, prNumber }, report);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  log.error(formatReport([], message));

  // A pull request scan is advisory only and must never fail its check (ADR-0001),
  // so it reports the failure and still exits 0. A baseline scan is triggered by
  // hand and gates nothing, so there a failure is allowed to surface as one.
  // Read from argv rather than parsed options: parsing itself may be what failed.
  const isBaselineRun = process.argv.includes("--mode=full");
  process.exitCode = isBaselineRun ? 1 : 0;
});
