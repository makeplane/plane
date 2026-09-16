import assert from "node:assert/strict";
import test from "node:test";

// The Node test bundle preserves explicit TypeScript extensions.
// @ts-expect-error The production module is imported with its source extension for the test runner.
import * as calendarTime from "../calendar-time.ts";

type TCalendarTimeModule = typeof calendarTime & {
  formatCalendarIssueDateTime?: (startDate?: string | null, startTime?: string | null) => string;
};

const formatCalendarIssueDateTime = (calendarTime as TCalendarTimeModule).formatCalendarIssueDateTime;

test("calendar cards format their date and local start time", () => {
  const localStartTime = new Date(2026, 8, 17, 18, 27).toISOString();

  assert.equal(formatCalendarIssueDateTime?.("2026-09-17", localStartTime), "Sep 17 · 06:27 PM");
});

test("calendar cards retain the date when no valid start time exists", () => {
  assert.equal(formatCalendarIssueDateTime?.("2026-09-17", null), "Sep 17");
  assert.equal(formatCalendarIssueDateTime?.("2026-09-17", "not-a-time"), "Sep 17");
});
