/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: decision register (apps/api/plane/liviere/decisions). Shapes of the app endpoints
// /api/workspaces/<slug>/projects/<id>/liviere/decisions/… as serialised by decisions/serialize.py (codes of
// errors: decisions/rules.py ERROR_CODES).
// Only `import type` may point here from model.ts and map-geometry.ts: those run under `node --test`.

export const DECISION_STATUSES = ["proposed", "active", "deferred", "done", "superseded", "revoked"] as const;
export type TDecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_KINDS = ["product", "architecture", "process", "operations"] as const;
export type TDecisionKind = (typeof DECISION_KINDS)[number];

export type TDecisionAuthor = "user" | "agent" | "unknown";

export const DECISION_QUEUES = ["confirm", "review", "rollout", "proposed", "imported"] as const;
export type TDecisionQueue = (typeof DECISION_QUEUES)[number];

// Fields an import may mark as estimated
export type TEstimatedField = "decided_on" | "decided_by" | "review_on";

export type TDecisionPerson = { id: string; display_name: string } | null;

export type TDecisionIssue = {
  identifier: string;
  // false: the reader cannot see the work item (other project, deleted); then no id, name or archived
  visible: boolean;
  id?: string;
  name?: string;
  archived?: boolean;
};

export type TDecisionRollout = {
  reason: "created" | "accepted" | "supersedes" | "revoked" | "deferred" | "resumed" | "corrected" | string;
  at: string;
  by: TDecisionPerson;
  channel: "app" | "api";
} | null;

export type TDecision = {
  id: number;
  number: number;
  identifier: string; // e.g. DEMO-D2
  title: string;
  rationale: string | null;
  rejected: string | null;
  area: string; // area key
  mechanism: string | null; // mechanism key within the area
  area2: string | null;
  kind: TDecisionKind;
  status: TDecisionStatus;
  decided_by: TDecisionAuthor;
  confirmed: boolean;
  decided_on: string | null; // YYYY-MM-DD
  review_on: string | null;
  review_condition: string | null;
  issues: TDecisionIssue[];
  sources: string[];
  supersedes: number | null;
  superseded_by: number[];
  related: number[]; // symmetric
  pending_rollout: boolean;
  rollout: TDecisionRollout;
  needs_review: boolean;
  estimated: string[];
  note: string | null;
  // Queues the decision is in, computed by the server
  queues: TDecisionQueue[];
  created_by: TDecisionPerson;
  created_at: string;
  updated_at: string;
};

export const DECISION_EVENT_KINDS = [
  "created",
  "proposed",
  "accepted",
  "confirmed",
  "deferred",
  "resumed",
  "done",
  "revoked",
  "rejected",
  "reviewed",
  "import_reviewed",
  "edited",
  "linked",
  "superseded",
  "rollout_ack",
  "imported",
] as const;
export type TDecisionEventKind = (typeof DECISION_EVENT_KINDS)[number];

// Fields the history may name in `changes` (with a label in liviere.decisions.fields)
export const DECISION_FIELDS = [
  "title",
  "rationale",
  "rejected",
  "note",
  "area",
  "mechanism",
  "area2",
  "kind",
  "status",
  "decided_by",
  "confirmed",
  "decided_on",
  "review_on",
  "review_condition",
  "issues",
  "sources",
  "related",
  "supersedes",
  "superseded_by",
  "pending_rollout",
  "needs_review",
  "estimated",
] as const;

export type TDecisionEvent = {
  id: number;
  occurred_at: string; // ISO date-time
  kind: TDecisionEventKind | string;
  channel: "app" | "api";
  actor: TDecisionPerson;
  // {field: [old, new]}; dates as YYYY-MM-DD, areas as keys, issues as identifier lists
  changes: Record<string, [unknown, unknown]>;
  note: string | null;
};

export type TDecisionChainItem = {
  number: number;
  identifier: string;
  title: string;
  status: TDecisionStatus;
  decided_on: string | null;
  supersedes: number | null;
};

export type TDecisionDetail = TDecision & {
  history: TDecisionEvent[];
  // previous: oldest first; next: every successor (also after a split), by number
  chain: { previous: TDecisionChainItem[]; next: TDecisionChainItem[] };
};

export type TDecisionMechanism = { id: number; key: string; name: string; sort_order: number };
export type TDecisionArea = TDecisionMechanism & { mechanisms: TDecisionMechanism[] };

export type TDecisionQueueCounts = Record<TDecisionQueue, number> & { today: string };

export type TDecisionSettings = { enabled: boolean; last_number: number };

export type TDecisionListPage = {
  results: TDecision[];
  next_cursor: string;
  next_page_results: boolean;
  total_count: number;
};

export type TDecisionSearchResult = { total: number; limit: number; has_more: boolean; results: TDecision[] };

export type TDecisionSupersedeResult = { superseded: TDecision; created: TDecision[] };

// Error of the decision endpoints: 400 {error, code, field, number}, 404 decisions_disabled {error, code},
// 409 conflict {error, code}
export type TDecisionErrorCode =
  | "validation_error"
  | "unknown_field"
  | "operation_field"
  | "invalid_transition"
  | "already_superseded"
  | "already_confirmed"
  | "not_pending_rollout"
  | "not_needs_review"
  | "author_required"
  | "nothing_to_change"
  | "unknown_area"
  | "unknown_mechanism"
  | "area_exists"
  | "issue_not_found"
  | "decision_not_found"
  | "import_rejected"
  | "decisions_disabled"
  // 409: two requests changed the decision at once; trying again helps
  | "conflict";

export type TDecisionError = {
  status: number | null;
  error: string | null;
  code: TDecisionErrorCode | string | null;
  field: string | null;
  number: number | null;
};

// Bodies of the actions (POST <number>/<action>/)
export type TDecisionNewVersion = { title: string; rationale?: string };
export type TDecisionActionBody = {
  accept: { title?: string; rationale?: string };
  confirm: Record<string, never>;
  defer: { review_on?: string | null; review_condition?: string | null };
  resume: Record<string, never>;
  done: Record<string, never>;
  revoke: { reason?: string };
  review: { review_on?: string | null; review_condition?: string | null };
  "import-review": {
    decided_by?: "user" | "agent";
    decided_on?: string | null;
    status?: TDecisionStatus;
    // Only for a decision active or deferred after the correction; one of them is required when it becomes deferred
    review_on?: string | null;
    review_condition?: string | null;
  };
};
export type TDecisionAction = keyof TDecisionActionBody;
