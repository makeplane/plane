import assert from "node:assert/strict";
import test from "node:test";

// The Node test bundle preserves explicit TypeScript extensions.
// @ts-expect-error The production module is imported with its source extension for the test runner.
import { buildCreateIssueSuccessToast } from "../create-issue-success-toast.ts";

test("the create-event success toast has no follow-up action", () => {
  const toast = buildCreateIssueSuccessToast("Success", "Work item created successfully ");

  assert.deepEqual(toast, {
    type: "success",
    title: "Success",
    message: "Work item created successfully ",
  });
  assert.equal("actionItems" in toast, false);
});
