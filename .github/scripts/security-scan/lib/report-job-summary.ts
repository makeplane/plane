import { appendFileSync } from "node:fs";
import { log } from "./log";

/**
 * Writes the report to the workflow run's summary page. A Baseline Scan has no
 * pull request to comment on, so this is its reporting surface.
 */
export function writeJobSummary(report: string): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (summaryPath === undefined || summaryPath.length === 0) {
    log.info(report);
    return;
  }

  appendFileSync(summaryPath, `${report}\n`, "utf-8");
  log.info("Wrote security scan results to the job summary.");
}
