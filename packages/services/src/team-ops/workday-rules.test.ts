/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  MAX_FILES,
  buildHeatGrid,
  checkInPhase,
  fileLimitError,
  finishBlocker,
  formatHm,
  heatLevel,
  weeklyChart,
} from "./workday-rules";

const complete = {
  summary: "Fixed the redirect",
  documentText: "",
  noDocument: true,
  fileCount: 0,
  needsAttention: false,
  attentionMessage: "",
};

describe("finishBlocker", () => {
  it("lets complete work finish, with or without a document", () => {
    expect(finishBlocker(complete)).toBeNull();
    expect(finishBlocker({ ...complete, noDocument: false, documentText: "notes" })).toBeNull();
    expect(finishBlocker({ ...complete, noDocument: false, fileCount: 1 })).toBeNull();
  });

  it("requires the report", () => {
    expect(finishBlocker({ ...complete, summary: "   " })).toBe("Write what you did.");
  });

  it("requires a document or the explicit confirmation that there is none", () => {
    expect(finishBlocker({ ...complete, noDocument: false })).toBe("Add a document, or confirm that there is none.");
    expect(finishBlocker({ ...complete, noDocument: false, documentText: "  " })).toBe(
      "Add a document, or confirm that there is none."
    );
  });

  it("requires a message when others are asked to look", () => {
    expect(finishBlocker({ ...complete, needsAttention: true })).toBe("Say what needs attention.");
    expect(finishBlocker({ ...complete, needsAttention: true, attentionMessage: "Please test" })).toBeNull();
  });
});

describe("fileLimitError", () => {
  it("accepts a few small files", () => {
    expect(fileLimitError([{ size: 10 }, { size: 2048 }])).toBeNull();
  });

  it("refuses too many files and files over the size limit", () => {
    expect(fileLimitError(Array.from({ length: MAX_FILES + 1 }, () => ({ size: 1 })))).toMatch(/At most/);
    expect(fileLimitError([{ size: 21 * 1024 * 1024 }])).toMatch(/at most 20 MB/);
  });
});

describe("checkInPhase", () => {
  const due = "2027-01-04T10:30:00Z";

  it("has nothing to ask while paused", () => {
    expect(checkInPhase(null, 300, "2027-01-04T10:00:00Z", 0)).toEqual({ phase: "none" });
  });

  it("counts down to the question, using the server's clock", () => {
    expect(checkInPhase(due, 300, "2027-01-04T10:20:00Z", 0)).toEqual({ phase: "waiting", secondsToDue: 600 });
    expect(checkInPhase(due, 300, "2027-01-04T10:20:00Z", 540)).toEqual({ phase: "waiting", secondsToDue: 60 });
  });

  it("asks once it is due and counts down the time to answer", () => {
    expect(checkInPhase(due, 300, "2027-01-04T10:30:00Z", 0)).toEqual({ phase: "due", secondsLeft: 300 });
    expect(checkInPhase(due, 300, "2027-01-04T10:30:00Z", 100)).toEqual({ phase: "due", secondsLeft: 200 });
    expect(checkInPhase(due, 300, "2027-01-04T10:40:00Z", 0)).toEqual({ phase: "due", secondsLeft: 0 });
  });
});

describe("formatHm", () => {
  it("shows minutes, or hours and padded minutes", () => {
    expect(formatHm(0)).toBe("0m");
    expect(formatHm(59 * 60)).toBe("59m");
    expect(formatHm(65 * 60)).toBe("1h 05m");
    expect(formatHm(-5)).toBe("0m");
  });
});

describe("heatLevel", () => {
  it("steps up with the number of tasks", () => {
    const level = (tasks: number) => heatLevel("tasks", { tasks, seconds: 0 });
    expect([0, 1, 2, 3, 4, 5, 9].map(level)).toEqual([0, 1, 2, 3, 3, 4, 4]);
  });

  it("steps up with the hours", () => {
    const level = (hours: number) => heatLevel("hours", { tasks: 0, seconds: hours * 3600 });
    expect([0, 0.5, 1, 2.9, 3, 5].map(level)).toEqual([0, 1, 2, 2, 3, 4]);
    expect(heatLevel("hours", undefined)).toBe(0);
  });
});

describe("buildHeatGrid", () => {
  // 2027-01-04 is a Monday; the week before it began on Saturday 2026-12-26.
  const grid = buildHeatGrid(
    "2027-01-04",
    "2027-01-10",
    [{ date: "2027-01-06", sessions: 2, tasks: 2, seconds: 5400 }],
    "tasks"
  );

  it("puts weeks in columns starting on Saturday, padding the first week", () => {
    expect(grid).toHaveLength(2);
    expect(grid[0].map((cell) => cell?.date ?? null)).toEqual([
      null,
      null,
      "2027-01-04",
      "2027-01-05",
      "2027-01-06",
      "2027-01-07",
      "2027-01-08",
    ]);
    expect(grid[1].map((cell) => cell?.date ?? null)).toEqual([
      "2027-01-09",
      "2027-01-10",
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("colours the days that have work and leaves the rest empty", () => {
    expect(grid[0][4]).toMatchObject({ date: "2027-01-06", level: 2, tasks: 2 });
    expect(grid[0][2]?.level).toBe(0);
  });
});

describe("weeklyChart", () => {
  const at = (day: number, hour: number, minute = 0) => new Date(2027, 0, day, hour, minute).toISOString();
  const sessions = [
    { started_at: at(2, 9), finished_at: at(2, 11), duration_seconds: 7200, location: "ONSITE" },
    { started_at: at(2, 15), finished_at: at(2, 16), duration_seconds: 3600, location: "REMOTE" },
    { started_at: at(4, 8), finished_at: at(4, 10), duration_seconds: 7200, location: "REMOTE" },
  ];

  it("totals each day of the week from Saturday", () => {
    const week = weeklyChart(sessions, "2027-01-02");
    expect(week.map((day) => day.date)[0]).toBe("2027-01-02");
    expect(week.map((day) => day.seconds)).toEqual([10800, 0, 7200, 0, 0, 0, 0]);
  });

  it("filters by place", () => {
    expect(weeklyChart(sessions, "2027-01-02", { place: "ONSITE" })[0].seconds).toBe(7200);
    expect(weeklyChart(sessions, "2027-01-02", { place: "REMOTE" })[0].seconds).toBe(3600);
  });

  it("filters by hours of the day, counting the part inside the window", () => {
    const working = weeklyChart(sessions, "2027-01-02", { fromHour: 9, toHour: 17 });
    expect(working.map((day) => day.seconds)).toEqual([10800, 0, 3600, 0, 0, 0, 0]);
    expect(weeklyChart(sessions, "2027-01-02", { fromHour: 10, toHour: 12 })[0].seconds).toBe(3600);
  });
});
