import { chunkContent, DEFAULT_MAX_CHUNK_CHARS } from "./chunk";
import { callCheck, type MinimalAnthropicClient } from "./claude-client";
import { matchesCheck } from "../registry";
import type { Check, CheckResult, ContentItem, Finding, ScanMode } from "../types";

const MODE_PREAMBLE: Record<ScanMode, string> = {
  pr: "The following are diff hunks from a pull request. Each section is one changed file. Review the added and changed lines, using the surrounding context to judge them.",
  full: "The following are the complete contents of one or more files. Review each file in its entirety.",
};

function buildContent(mode: ScanMode, items: readonly ContentItem[]): string {
  const sections = items.map((item) => `--- FILE: ${item.path} ---\n${item.content}`);
  return `${MODE_PREAMBLE[mode]}\n\n${sections.join("\n\n")}`;
}

export interface RunScanParams {
  readonly client: MinimalAnthropicClient;
  readonly checks: readonly Check[];
  readonly items: readonly ContentItem[];
  readonly mode: ScanMode;
  readonly maxChars?: number;
}

function emptyResult(checkId: string, status: CheckResult["status"]): CheckResult {
  return { checkId, status, findings: [], errors: [], skippedPaths: [] };
}

async function runCheck(
  client: MinimalAnthropicClient,
  check: Check,
  items: readonly ContentItem[],
  mode: ScanMode,
  maxChars: number
): Promise<CheckResult> {
  const matched = items.filter((item) => matchesCheck(check, item.path));
  if (matched.length === 0) {
    return emptyResult(check.id, "skipped_no_matching_files");
  }

  const chunks = chunkContent(matched, maxChars);

  // In PR mode a check is one batched call; content too large to fit is reported
  // as skipped rather than truncated or split (see SPEC.md size guardrail).
  if (mode === "pr" && (chunks.length > 1 || chunks[0]?.overCap === true)) {
    return emptyResult(check.id, "skipped_too_large");
  }

  const findings: Finding[] = [];
  const errors: string[] = [];
  const skippedPaths: string[] = [];

  for (const chunk of chunks) {
    if (chunk.overCap) {
      skippedPaths.push(...chunk.items.map((item) => item.path));
      continue;
    }

    // Deliberately sequential: a Baseline run can produce an unbounded number of
    // chunks, and firing them all at once would burst the API rate limit.
    // oxlint-disable-next-line no-await-in-loop
    const result = await callCheck(client, {
      checkId: check.id,
      prompt: check.prompt,
      content: buildContent(mode, chunk.items),
    });

    findings.push(...result.findings);
    if (result.error !== null) {
      errors.push(result.error);
    }
  }

  const status = errors.length > 0 && findings.length === 0 ? "errored" : "ok";
  return { checkId: check.id, status, findings, errors, skippedPaths };
}

export async function runScan(params: RunScanParams): Promise<CheckResult[]> {
  const maxChars = params.maxChars ?? DEFAULT_MAX_CHUNK_CHARS;

  // Checks are independent of one another, so they run concurrently. A failure in
  // one is contained here so it can never take down the rest of the scan (ADR-0001).
  return Promise.all(
    params.checks.map(async (check) => {
      try {
        return await runCheck(params.client, check, params.items, params.mode, maxChars);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          checkId: check.id,
          status: "errored" as const,
          findings: [],
          errors: [`check failed unexpectedly: ${message}`],
          skippedPaths: [],
        };
      }
    })
  );
}
