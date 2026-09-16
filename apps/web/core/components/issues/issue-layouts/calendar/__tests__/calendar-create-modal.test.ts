import assert from "node:assert/strict";
import test from "node:test";
import type { TIssue } from "@plane/types";

// The Node test bundle preserves explicit TypeScript extensions.
// @ts-expect-error The production module is imported with its source extension for the test runner.
import { openCalendarCreateModal } from "../calendar-create-modal.ts";

test("new calendar work items open the create modal with the selected date", () => {
  let modalData: Partial<TIssue> | undefined;
  let onOpenCount = 0;

  openCalendarCreateModal(
    { start_date: "2026-09-17" },
    (data) => {
      modalData = data;
    },
    () => {
      onOpenCount += 1;
    }
  );

  assert.deepEqual(modalData, { start_date: "2026-09-17" });
  assert.equal(onOpenCount, 1);
});
