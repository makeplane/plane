/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, test } from "vitest";
import {
  getWorkflowErrorCode,
  getWorkflowErrorMessage,
  getWorkflowValidationIssues,
  isWorkflowErrorPayload,
} from "@/utils/workflow-error";

const FALLBACK = "Something went wrong.";

describe("getWorkflowErrorMessage (§23.5)", () => {
  test("returns the §17.3 `detail` verbatim from a transition-path error", () => {
    const error = {
      code: "WORKFLOW_TRANSITION_NOT_ALLOWED",
      detail: "No workflow transition is configured from A to B.",
      source_state_id: "a",
      target_state_id: "b",
      allowed_target_ids: ["c"],
    };
    expect(getWorkflowErrorMessage(error, FALLBACK)).toBe("No workflow transition is configured from A to B.");
  });

  test("unwraps the DRF ValidationError envelope the PATCH issue path returns", () => {
    // IssueUpdateSerializer raises `serializers.ValidationError(exc.to_payload())`,
    // so the workflow envelope arrives under `non_field_errors`.
    const error = {
      non_field_errors: [
        {
          code: "WORKFLOW_APPROVAL_BLOCKS_TRANSITION",
          detail: "A pending approval blocks ordinary transitions from this state.",
        },
      ],
    };
    expect(getWorkflowErrorMessage(error, FALLBACK)).toBe(
      "A pending approval blocks ordinary transitions from this state."
    );
  });

  test("unwraps a nested `non_field_errors` object that carries only `error`", () => {
    const error = { non_field_errors: [{ error: "target_state_id is required." }] };
    expect(getWorkflowErrorMessage(error, FALLBACK)).toBe("target_state_id is required.");
  });

  test("prefers `detail` over `error` when a payload carries both", () => {
    expect(getWorkflowErrorMessage({ detail: "detail wins", error: "error loses" }, FALLBACK)).toBe("detail wins");
  });

  test("reads DRF field errors and takes the first message", () => {
    const error = { name: ["A workflow with this name already exists in the project."] };
    expect(getWorkflowErrorMessage(error, FALLBACK)).toBe("A workflow with this name already exists in the project.");
  });

  test('reads the plain `{"error": ...}` shape the admin 404s use', () => {
    expect(getWorkflowErrorMessage({ error: "Workflow not found." }, FALLBACK)).toBe("Workflow not found.");
  });

  test("ignores axios bookkeeping keys that carry no message", () => {
    const error = { request: {}, config: {}, status: 500, data: undefined };
    expect(getWorkflowErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  test("falls back for a non-JSON 5xx body rather than rendering an HTML error page", () => {
    expect(getWorkflowErrorMessage("<html><h1>Server Error</h1></html>", FALLBACK)).toBe(FALLBACK);
    expect(getWorkflowErrorMessage({ data: "<html>Server Error</html>" }, FALLBACK)).toBe(FALLBACK);
    expect(getWorkflowErrorMessage({ detail: "  <html>500</html>" }, FALLBACK)).toBe(FALLBACK);
  });

  test("falls back for null, undefined and empty payloads", () => {
    expect(getWorkflowErrorMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(getWorkflowErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(getWorkflowErrorMessage({ detail: "   " }, FALLBACK)).toBe(FALLBACK);
  });
});

describe("isWorkflowErrorPayload", () => {
  test("detects a bare §17.3 envelope", () => {
    expect(isWorkflowErrorPayload({ code: "WORKFLOW_DISABLED", detail: "x" })).toBe(true);
  });

  test("rejects a non-workflow payload and a DRF error object", () => {
    expect(isWorkflowErrorPayload({ error: "Workflow not found." })).toBe(false);
    expect(isWorkflowErrorPayload(null)).toBe(false);
    expect(isWorkflowErrorPayload("code=WORKFLOW_DISABLED")).toBe(false);
  });
});

describe("getWorkflowErrorCode", () => {
  test("reads a flat code", () => {
    expect(getWorkflowErrorCode({ code: "WORKFLOW_DISABLED", detail: "x" })).toBe("WORKFLOW_DISABLED");
  });

  test("reads through the DRF wrapper", () => {
    expect(getWorkflowErrorCode({ non_field_errors: [{ code: "WORKFLOW_NO_EFFECTIVE_WORKFLOW", detail: "x" }] })).toBe(
      "WORKFLOW_NO_EFFECTIVE_WORKFLOW"
    );
  });

  test("returns undefined when there is no code", () => {
    expect(getWorkflowErrorCode({ error: "Workflow not found." })).toBeUndefined();
  });
});

describe("getWorkflowValidationIssues", () => {
  test("reads the §24 issues list when the server delivers it", () => {
    const issues = [{ code: "WORKFLOW_NO_STATES", detail: "Revision has no included states." }];
    expect(getWorkflowValidationIssues({ code: "WORKFLOW_REVISION_PUBLISH_INVALID", detail: "x", issues })).toEqual(
      issues
    );
  });

  test("reads the issues list through the DRF wrapper", () => {
    const issues = [{ code: "WORKFLOW_NO_STATES", detail: "Revision has no included states." }];
    expect(getWorkflowValidationIssues({ non_field_errors: [{ detail: "x", issues }] })).toEqual(issues);
  });

  test("returns an empty list when the payload carries no issues (the current 500 case)", () => {
    expect(getWorkflowValidationIssues("<html>Server Error</html>")).toEqual([]);
    expect(getWorkflowValidationIssues({ detail: "boom" })).toEqual([]);
    expect(getWorkflowValidationIssues(null)).toEqual([]);
  });
});
