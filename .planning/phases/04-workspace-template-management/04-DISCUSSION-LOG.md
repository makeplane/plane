# Phase 4: Workspace Template Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 4-Workspace Template Management
**Areas discussed:** Nav placement & entry, List layout & provenance, Editor surface & save model, Editor section depth

---

## Nav placement & entry

| Option               | Description                                                                            | Selected |
| -------------------- | -------------------------------------------------------------------------------------- | -------- |
| Administration group | In settings Administration alongside Members/Billing/Exports; admin-only setup surface | ✓        |
| Features group       | Frame as a workspace capability toggle                                                 |          |

**User's choice:** Administration group.

| Option            | Description                    | Selected |
| ----------------- | ------------------------------ | -------- |
| Project Templates | Explicit, matches feature name | ✓        |
| Templates         | Shorter, risks ambiguity       |          |

**User's choice:** "Project Templates" sidebar label.

---

## List layout & provenance

| Option             | Description                                                     | Selected |
| ------------------ | --------------------------------------------------------------- | -------- |
| Grouped sections   | Two labeled sections: System (read-only) then Custom (editable) | ✓        |
| Flat list + badges | Single list with System/Custom badges                           |          |
| Tabs               | Tabs to switch between System and Custom                        |          |

**User's choice:** Grouped sections.

| Option                 | Description                                                                    | Selected |
| ---------------------- | ------------------------------------------------------------------------------ | -------- |
| Hidden, filter to show | Deactivated hidden by default; "Show deactivated" toggle reveals + reactivates | ✓        |
| Always shown, dimmed   | Deactivated shown inline, dimmed                                               |          |
| Not shown at all       | No reactivation path                                                           |          |

**User's choice:** Hidden, filter to show.

| Option     | Description                            | Selected                              |
| ---------- | -------------------------------------- | ------------------------------------- |
| Edit       | Open structured editor                 | ✓                                     |
| Deactivate | Soft-deactivate                        | ✓ (relocated to overflow — see below) |
| Duplicate  | Copy into new editable custom template | ✓                                     |

**User's choice (custom row actions):** Edit + Duplicate selected; Deactivate initially unselected.

| Option                       | Description                                                | Selected |
| ---------------------------- | ---------------------------------------------------------- | -------- |
| Duplicate (+ read-only view) | Duplicate into editable custom copy plus read-only preview | ✓        |
| Duplicate only               | No preview                                                 |          |

**User's choice (built-in row actions):** Duplicate (+ read-only view).

**Reconciliation follow-up (deactivation is a phase success criterion):**

| Option                  | Description                                                         | Selected |
| ----------------------- | ------------------------------------------------------------------- | -------- |
| In overflow menu        | Deactivate lives in a secondary ⋮ menu; Edit/Duplicate stay primary | ✓        |
| Inside the editor       | Deactivate is a control on the edit screen                          |          |
| Drop it from this phase | Would contradict success criterion 2 / UI-05                        |          |

**User's choice:** In overflow menu.
**Notes:** Flagged that dropping Edit-only would contradict the phase's deactivation success criterion and the "hidden, filter to show" choice which presupposes deactivation exists. Resolved by keeping Deactivate as a secondary overflow action, with Reactivate surfaced via the "Show deactivated" filter.

---

## Editor surface & save model

| Option           | Description                                | Selected |
| ---------------- | ------------------------------------------ | -------- |
| Full-page route  | Dedicated route, full width, deep-linkable | ✓        |
| Slide-over panel | Panel over the list                        |          |
| Modal dialog     | Centered modal (cramped for 5 sections)    |          |

**User's choice:** Full-page route.

| Option                  | Description                                              | Selected |
| ----------------------- | -------------------------------------------------------- | -------- |
| Atomic single save      | One Save submits the whole template payload              | ✓        |
| Section-by-section save | Independent per-section persistence (no backend support) |          |

**User's choice:** Atomic single save.

---

## Editor section depth

| Option                   | Description                                                    | Selected |
| ------------------------ | -------------------------------------------------------------- | -------- |
| Inline reorderable lists | Add/edit/remove rows with drag-to-reorder, like project-states | ✓        |
| Add/remove rows only     | Simple rows, implicit order, no drag                           |          |

**User's choice:** Inline reorderable lists.

| Option                  | Description                                                 | Selected |
| ----------------------- | ----------------------------------------------------------- | -------- |
| Auto-generated, hidden  | Keys slugified from names, uniqueness enforced, never shown | ✓        |
| User-visible & editable | Keys as editable fields                                     |          |

**User's choice:** Auto-generated, hidden.

| Option                       | Description                                                   | Selected |
| ---------------------------- | ------------------------------------------------------------- | -------- |
| Dropdowns from defined items | Starter-issue refs pick from sections above, resolved to keys | ✓        |
| Free-text keys               | Free-text ref entry (risk of dangling refs)                   |          |

**User's choice:** Dropdowns from defined items.

---

## Claude's Discretion

- Exact Lucide icon and route segment names.
- Form library choice for the editor (react-hook-form preferred) and color-picker primitive.
- Inline surfacing of backend validation errors + which deterministic rules to enforce client-side.
- Copy for confirmations, empty states, and loading skeletons.
- Duplicate flow shape (name prompt vs pre-filled editor).
- Read-only built-in preview presentation.

## Deferred Ideas

None — discussion stayed within Phase 4 scope. Duplicating an existing Project into a template, import/export, version history, and a visual workflow builder remain explicitly v2 / out of scope per REQUIREMENTS.md.
