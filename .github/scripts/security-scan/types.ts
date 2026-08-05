export type Confidence = "low" | "medium" | "high";
export type Severity = "low" | "medium" | "high";
export type ScanMode = "pr" | "full";

export interface Check {
  readonly id: string;
  readonly description: string;
  readonly targetGlobs: readonly string[];
  readonly prompt: string;
}

export interface Finding {
  readonly checkId: string;
  readonly file: string;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly description: string;
  readonly confidence: Confidence;
  readonly severity: Severity;
}

export interface ContentItem {
  readonly path: string;
  readonly content: string;
}

export interface Chunk {
  readonly items: readonly ContentItem[];
  readonly overCap: boolean;
}

export interface FileHunk {
  readonly path: string;
  readonly hunk: string;
}

export type CheckStatus = "ok" | "skipped_no_matching_files" | "skipped_too_large" | "errored";

export interface CheckResult {
  readonly checkId: string;
  readonly status: CheckStatus;
  readonly findings: readonly Finding[];
  /** API or validation failures encountered while running this check. */
  readonly errors: readonly string[];
  /** Files skipped because they exceed the per-call size cap on their own. */
  readonly skippedPaths: readonly string[];
}
