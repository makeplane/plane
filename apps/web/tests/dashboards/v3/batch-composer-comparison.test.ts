import { describe, expect, test } from "vitest";
import { buildDashboardBatchRequest } from "@/components/dashboards/v3/batch-composer";

describe("batch-composer — comparison block wired from scope", () => {
  test("scope.comparison='none' → every card query has comparison.type='none'", () => {
    const req = buildDashboardBatchRequest(
      {},
      {
        timePreset: "this_month",
        dateBasis: "lifecycle_overlap",
        filters: {},
        projectIds: [],
        comparison: "none",
      }
    );
    for (const q of req.queries) {
      expect((q as { comparison: { type: string } }).comparison).toEqual({ type: "none" });
    }
  });

  test("scope.comparison='previous_week' → every card query has comparison.type='previous_week'", () => {
    const req = buildDashboardBatchRequest(
      {},
      {
        timePreset: "this_month",
        dateBasis: "lifecycle_overlap",
        filters: {},
        projectIds: [],
        comparison: "previous_week",
      }
    );
    for (const q of req.queries) {
      expect((q as { comparison: { type: string } }).comparison).toEqual({ type: "previous_week" });
    }
  });

  test("scope.comparison='previous_quarter' propagates", () => {
    const req = buildDashboardBatchRequest(
      {},
      {
        timePreset: "this_month",
        dateBasis: "lifecycle_overlap",
        filters: {},
        projectIds: [],
        comparison: "previous_quarter",
      }
    );
    for (const q of req.queries) {
      expect((q as { comparison: { type: string } }).comparison).toEqual({ type: "previous_quarter" });
    }
  });
});
