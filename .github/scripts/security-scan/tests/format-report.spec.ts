import { describe, expect, it } from "vitest";
import { formatReport, STICKY_MARKER } from "../lib/format-report";
import type { CheckResult } from "../types";

function result(overrides: Partial<CheckResult> = {}): CheckResult {
  return {
    checkId: "multi_tenancy_isolation",
    status: "ok",
    findings: [],
    errors: [],
    skippedPaths: [],
    ...overrides,
  };
}

describe("formatReport", () => {
  it("embeds the sticky marker so the comment can be found and updated", () => {
    expect(formatReport([])).toContain(STICKY_MARKER);
  });

  it("confirms a clean scan rather than staying silent", () => {
    const report = formatReport([result()]);

    expect(report).toContain("No issues found");
  });

  it("lists a finding with its file, line range, and description", () => {
    const report = formatReport([
      result({
        findings: [
          {
            checkId: "multi_tenancy_isolation",
            file: "apps/api/plane/app/views/member.py",
            lineStart: 12,
            lineEnd: 14,
            description: "member_id is never checked against the workspace.",
            confidence: "high",
            severity: "high",
          },
        ],
      }),
    ]);

    expect(report).toContain("apps/api/plane/app/views/member.py:12-14");
    expect(report).toContain("member_id is never checked against the workspace.");
  });

  it("states explicitly when a check was skipped for exceeding the size cap", () => {
    const report = formatReport([result({ status: "skipped_too_large" })]);

    expect(report).toContain("too large");
  });

  it("does not mention a check that had no matching files", () => {
    const report = formatReport([result({ status: "skipped_no_matching_files" })]);

    expect(report).not.toContain("multi_tenancy_isolation");
  });

  it("surfaces an errored check instead of reporting it as clean", () => {
    const report = formatReport([result({ status: "errored", errors: ["network down"] })]);

    expect(report).toContain("could not be completed");
    expect(report).not.toContain("No issues found");
  });

  it("notes individually oversized files that were skipped", () => {
    const report = formatReport([result({ skippedPaths: ["apps/api/plane/app/views/huge.py"] })]);

    expect(report).toContain("apps/api/plane/app/views/huge.py");
  });

  it("states that the scan is advisory and does not block merge", () => {
    expect(formatReport([result()])).toContain("never blocks merge");
  });

  it("reports a whole-run failure without claiming the scan was clean", () => {
    const report = formatReport([], "git diff failed");

    expect(report).toContain("git diff failed");
    expect(report).not.toContain("No issues found");
  });
});
