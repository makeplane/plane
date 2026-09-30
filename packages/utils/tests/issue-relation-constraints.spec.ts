/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  isFinishAfterSatisfied,
  isFinishBeforeSatisfied,
  isStartAfterSatisfied,
  isStartBeforeSatisfied,
  isTimelineRelationSatisfied,
} from "../src/issue-relation-constraints";

describe("issue relation timeline constraints", () => {
  it("starts before allows equal and earlier starts", () => {
    expect(isStartBeforeSatisfied("2026-01-01", "2026-01-01")).toBe(true);
    expect(isStartBeforeSatisfied("2026-01-01", "2026-01-02")).toBe(true);
    expect(isStartBeforeSatisfied("2026-01-03", "2026-01-02")).toBe(false);
  });

  it("starts after requires related to have begun", () => {
    expect(isStartAfterSatisfied("2026-01-02", "2026-01-01")).toBe(true);
    expect(isStartAfterSatisfied("2026-01-01", "2026-01-01")).toBe(true);
    expect(isStartAfterSatisfied("2026-01-01", "2026-01-02")).toBe(false);
  });

  it("finishes before allows equal and earlier finishes", () => {
    expect(isFinishBeforeSatisfied("2026-02-01", "2026-02-01")).toBe(true);
    expect(isFinishBeforeSatisfied("2026-02-01", "2026-02-02")).toBe(true);
    expect(isFinishBeforeSatisfied("2026-02-03", "2026-02-02")).toBe(false);
  });

  it("finishes after requires related to be finished", () => {
    expect(isFinishAfterSatisfied("2026-02-02", "2026-02-01")).toBe(true);
    expect(isFinishAfterSatisfied("2026-02-01", "2026-02-01")).toBe(true);
    expect(isFinishAfterSatisfied("2026-02-01", "2026-02-02")).toBe(false);
  });

  it("treats missing dates as unconstrained", () => {
    expect(isStartBeforeSatisfied(null, "2026-01-01")).toBe(true);
    expect(isFinishAfterSatisfied(undefined, null)).toBe(true);
  });

  it("dispatches timeline relation checks", () => {
    const issue = { start_date: "2026-01-01", target_date: "2026-01-10" };
    const related = { start_date: "2026-01-02", target_date: "2026-01-12" };

    expect(isTimelineRelationSatisfied("start_before", issue, related)).toBe(true);
    expect(isTimelineRelationSatisfied("start_after", issue, related)).toBe(false);
    expect(isTimelineRelationSatisfied("finish_before", issue, related)).toBe(true);
    expect(isTimelineRelationSatisfied("finish_after", issue, related)).toBe(false);
  });
});
