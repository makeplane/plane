feat(web): Work Item approval UI — badge, approve/reject, activity (spec §23.3, §21, §30 P1.2)

Wires the merged §17.3 approval runtime (RD-461 / #103) into the Work Item detail
surface. Nothing here invents a contract: every read and write is one of the
endpoints the approvals backend already ships.

Added

- `IssueWorkflowService` — `GET /issues/:id/workflow/actions/`,
  `GET /issues/:id/approvals/:aid/`, and the approve/reject POSTs. Every method
  throws the response _body_ so the §17.3 envelope (`{ code, detail, ... }`)
  reaches the UI intact, which is what §23.5 requires. The decide call sends the
  caller's `Idempotency-Key` (§11.5).
- `IssueApprovalStore` on the issue-detail store — the actions payload, the
  approval read (approver snapshot + §7.10 decisions) and the decision call.
- `apps/web/core/components/issue-approval/` — the header badge + approve/reject
  with an optional decision comment, and the approval record rendered in Work
  Item activity.
- `@plane/ui` `WorkflowApprovalBar` + Storybook story — the reusable, purely
  presentational §23.3 surface.
- `packages/types/src/workflow.ts` — approval runtime payloads; the actions
  response's `approval` field was typed `null` and is now the real block.

§23.3 eligibility
The badge, the destinations and the controls all come off the server's
`approval.can_decide`, which is true only for a member of the approval's
_snapshotted_ approver list (§11.2, §18.2). The UI never re-derives eligibility
from project membership, and the member store is only queried to resolve names
for an eligible approver — a non-approver sees that the item is waiting without
the membership data behind it.

Note a wording conflict: this issue's done-when reads "pending approval badge
visible to eligible approvers only", but spec §23.3 bullet 3 requires
non-approvers to see _who/what role is pending_, and §29.7 lists "pending badge
visible" and "approval buttons visible only when eligible" as two separate
cases. Implemented per spec: badge for everyone, buttons for `can_decide` only.
Flipping to the literal reading is a one-line `if (!isEligible) return null` in
`issue-approval/root.tsx`.

No optimistic flip
A decision is never applied locally. The POST returns the resulting state and
any chained `next_approval`; the store then re-reads the item, the actions and
the approval. A second decision that loses the §11.4 race answers 409
`WORKFLOW_APPROVAL_ALREADY_RESOLVED`; that message is rendered verbatim
(§23.5) and the re-read leaves the UI on the state the server actually holds.
The buttons freeze while a decision is in flight, and the idempotency key is
kept per attempt so a retry replays instead of applying twice.

§23.3 / §23.4 state selector
The detail and peek state pickers now list only the current state plus the
transitions `compute_allowed_actions` reports as `allowed`. With no workflow
bound the hook returns `undefined` and the dropdown takes the full project state
list exactly as before. While an approval is pending the source state exposes no
transition flows, so the picker offers just the current state — the item can
then only move through Approve / Reject.

Backend gaps to flag (not worked around)

1. `GET /issues/:id/workflow/actions/` returns `approver_user_ids` to every
   viewer, while `_approval_block_for`'s own docstring says the list is for
   admins only. The UI hides it from non-approvers, but the API still leaks it.
2. There is no "list this item's approvals" endpoint, and `ApprovalService`
   writes no `IssueActivity` rows. The §21 record is therefore built from the
   approval read endpoint: it is complete while an approval is pending and for
   a decision made in the current session, but a decision someone else made
   earlier is not recoverable after a reload until a per-issue list endpoint or
   activity rows exist. Emitting `IssueActivity` rows would also let these
   entries interleave chronologically with the existing feed instead of sitting
   above it.
3. Neither the actions block nor the approval detail carries
   `reject_state_name`; the reject destination name is resolved client-side from
   the project states the picker already holds.

Verification

- `pnpm --filter=web check:types` — 188 errors, byte-identical to the `master`
  baseline (verified by stashing this change and diffing the error set). All of
  them are pre-existing: `@plane/editor` does not build on `master` either, plus
  RD-448's dashboard tests and the missing `@/helpers/workspace-dashboards-access`.
- `pnpm --filter=web check:lint` — 0 errors (733 pre-existing warnings, none in
  the touched files). `@plane/ui`, `@plane/types`, `@plane/i18n` — 0 errors.
- `pnpm --filter=web check:format` + `pnpm --filter=@plane/ui check:format` — clean.
- `pnpm --filter=web test` — 344 passed, +16 new in
  `tests/issues/workflow-approval.test.ts`. The 9 failures are pre-existing on
  `master` (RD-448 `workspace-dashboard-v3.smoke.test.tsx`) — confirmed by
  re-running that file with this change stashed.
