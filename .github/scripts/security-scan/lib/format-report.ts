import type { CheckResult, Finding } from "../types";

export const STICKY_MARKER = "<!-- plane-security-scan -->";

const TITLE = "## 🔍 Security scan";
const ADVISORY_FOOTER = "_Advisory only — this scan never blocks merge._";

const SEVERITY_ICON: Record<Finding["severity"], string> = {
  high: "🔴",
  medium: "🟠",
  low: "🟡",
};

function humanizeCheckId(checkId: string): string {
  return checkId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatFinding(finding: Finding): string {
  const location = `${finding.file}:${finding.lineStart}-${finding.lineEnd}`;
  const meta = `${finding.severity} severity · ${finding.confidence} confidence`;
  return [`${SEVERITY_ICON[finding.severity]} **\`${location}\`** — ${meta}`, "", `> ${finding.description}`].join(
    "\n"
  );
}

function formatCheck(result: CheckResult): string | null {
  if (result.status === "skipped_no_matching_files") {
    return null;
  }

  const heading = `### ${humanizeCheckId(result.checkId)}`;

  if (result.status === "skipped_too_large") {
    return `${heading}\n\n⏭️ Skipped — the matching changes are too large to scan in one pass.`;
  }

  if (result.status === "errored") {
    const detail = result.errors.join("; ");
    return `${heading}\n\n⚠️ This check could not be completed: ${detail}`;
  }

  const sections: string[] = [heading, ""];

  if (result.findings.length === 0) {
    sections.push("✅ No issues found.");
  } else {
    sections.push(result.findings.map(formatFinding).join("\n\n"));
  }

  if (result.skippedPaths.length > 0) {
    const list = result.skippedPaths.map((path) => `\`${path}\``).join(", ");
    sections.push("", `⏭️ Skipped (individually too large to scan): ${list}`);
  }

  return sections.join("\n");
}

export function formatReport(results: readonly CheckResult[], runError?: string): string {
  const parts: string[] = [STICKY_MARKER, TITLE, ""];

  if (runError !== undefined) {
    parts.push(`⚠️ The scan could not be completed: ${runError}`, "", "---", ADVISORY_FOOTER);
    return parts.join("\n");
  }

  const sections = results.map(formatCheck).filter((section): section is string => section !== null);

  if (sections.length === 0) {
    parts.push("✅ No issues found. Nothing in this change matched an active check.");
  } else {
    parts.push(sections.join("\n\n"));
  }

  parts.push("", "---", ADVISORY_FOOTER);
  return parts.join("\n");
}
