/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, test } from "vitest";
import type { IWorkflowFlow, IWorkflowRevision, IWorkflowState } from "@plane/types";
import {
  canPublishRevision,
  getAssignedIssueTypeIds,
  getDraftRevision,
  getEditableRevision,
  getPublishedRevision,
  groupFlowsBySourceState,
  validateRevisionForPublish,
} from "@/utils/workflow";

// -- fixtures ---------------------------------------------------------------

const state = (over: Partial<IWorkflowState> = {}): IWorkflowState => ({
  id: `ws-${over.state_id ?? "1"}`,
  state_id: "s-1",
  state_name: "Submitted",
  state_group: "backlog",
  sequence: 65535,
  allow_new_work_items: true,
  ...over,
});

const flow = (over: Partial<IWorkflowFlow> = {}): IWorkflowFlow => ({
  id: "f-1",
  flow_type: "transition",
  source_state_id: "s-1",
  source_state_name: "Submitted",
  target_state_id: "s-2",
  target_state_name: "Manager Approval",
  reject_state_id: null,
  sequence: 65535,
  is_active: true,
  ...over,
});

const revision = (over: Partial<IWorkflowRevision> = {}): IWorkflowRevision => ({
  id: "rev-1",
  workflow: "w-1",
  version: 1,
  status: "draft",
  published_at: null,
  published_by: null,
  created_at: "",
  updated_at: "",
  states: [
    state(),
    state({ id: "ws-2", state_id: "s-2", state_name: "Manager Approval", allow_new_work_items: false }),
  ],
  flows: [flow()],
  ...over,
});

// -- §24.2 publish checklist ------------------------------------------------

describe("validateRevisionForPublish (§24.2)", () => {
  test("a revision with states, a creation state and valid flows publishes clean", () => {
    expect(validateRevisionForPublish(revision())).toEqual([]);
    expect(canPublishRevision(revision())).toBe(true);
  });

  test("blocks a revision with no included states", () => {
    const issues = validateRevisionForPublish(revision({ states: [], flows: [] }));
    expect(issues).toContain("Revision has no included states.");
    expect(canPublishRevision(revision({ states: [], flows: [] }))).toBe(false);
  });

  test("blocks a revision where no state allows new work items", () => {
    const issues = validateRevisionForPublish(revision({ states: [state({ allow_new_work_items: false })] }));
    expect(issues).toContain("Revision has no state flagged allow_new_work_items.");
  });

  test("blocks a flow whose target state is not included in the revision", () => {
    const issues = validateRevisionForPublish(revision({ flows: [flow({ target_state_id: "s-9" })] }));
    expect(issues.some((issue) => issue.includes("target state not in this revision"))).toBe(true);
  });

  test("blocks a transition flow that declares a reject state (§7.5)", () => {
    const issues = validateRevisionForPublish(revision({ flows: [flow({ reject_state_id: "s-2" })] }));
    expect(issues.some((issue) => issue.includes("must not declare a reject state"))).toBe(true);
  });

  test("blocks an approval flow without a reject state (§7.5)", () => {
    const issues = validateRevisionForPublish(
      revision({ flows: [flow({ flow_type: "approval", reject_state_id: null })] })
    );
    expect(issues.some((issue) => issue.includes("must declare a reject state"))).toBe(true);
  });

  test("accepts an approval flow with a reject state that is included", () => {
    const rev = revision({ flows: [flow({ flow_type: "approval", reject_state_id: "s-2" })] });
    expect(validateRevisionForPublish(rev)).toEqual([]);
  });

  test("blocks mixed flow types out of one source state (§7.5)", () => {
    const rev = revision({
      flows: [flow({ id: "f-1" }), flow({ id: "f-2", flow_type: "approval", reject_state_id: "s-2" })],
    });
    expect(validateRevisionForPublish(rev)).toContain('Active flows from "Submitted" must all be the same type.');
  });

  test("ignores inactive flows in the mixed-flow-type check", () => {
    const rev = revision({
      flows: [
        flow({ id: "f-1" }),
        flow({ id: "f-2", is_active: false, flow_type: "approval", reject_state_id: "s-2" }),
      ],
    });
    expect(validateRevisionForPublish(rev)).toEqual([]);
  });
});

// -- revision selectors -----------------------------------------------------

describe("revision selectors", () => {
  test("picks the draft over the published revision", () => {
    const revisions = [
      revision({ id: "r2", version: 2, status: "draft" }),
      revision({ id: "r1", version: 1, status: "published" }),
      revision({ id: "r0", version: 0, status: "retired" }),
    ];
    expect(getDraftRevision(revisions)?.id).toBe("r2");
    expect(getPublishedRevision(revisions)?.id).toBe("r1");
    expect(getEditableRevision(revisions)?.id).toBe("r2");
  });

  test("falls back to the published revision when no draft is open", () => {
    const revisions = [revision({ id: "r1", version: 1, status: "published" })];
    expect(getDraftRevision(revisions)).toBeUndefined();
    expect(getEditableRevision(revisions)?.id).toBe("r1");
  });

  test("tolerates an undefined revision list", () => {
    expect(getDraftRevision(undefined)).toBeUndefined();
    expect(getEditableRevision(undefined)).toBeUndefined();
  });
});

// -- §23.2 grouping ---------------------------------------------------------

describe("groupFlowsBySourceState", () => {
  test("returns one entry per state, in revision order, with its outgoing flows", () => {
    const groups = groupFlowsBySourceState(
      revision({
        flows: [flow({ id: "f-2", source_state_id: "s-2", target_state_id: "s-1" }), flow({ id: "f-1" })],
      })
    );
    expect(groups.map((g) => g.state.state_id)).toEqual(["s-1", "s-2"]);
    expect(groups[0].flows.map((f) => f.id)).toEqual(["f-1"]);
    expect(groups[1].flows.map((f) => f.id)).toEqual(["f-2"]);
  });

  test("returns an empty list for an absent revision", () => {
    expect(groupFlowsBySourceState(undefined)).toEqual([]);
  });
});

// -- §23.1 type assignment --------------------------------------------------

describe("getAssignedIssueTypeIds", () => {
  test("returns only the types assigned to the given workflow", () => {
    const assignments = [
      { workflow: "w-1", issue_type: "t-1" },
      { workflow: "w-1", issue_type: "t-2" },
      { workflow: "w-2", issue_type: "t-3" },
    ];
    expect(getAssignedIssueTypeIds(assignments, "w-1")).toEqual(["t-1", "t-2"]);
    expect(getAssignedIssueTypeIds(assignments, "w-2")).toEqual(["t-3"]);
    expect(getAssignedIssueTypeIds(assignments, "w-3")).toEqual([]);
    expect(getAssignedIssueTypeIds(undefined, "w-1")).toEqual([]);
  });
});
