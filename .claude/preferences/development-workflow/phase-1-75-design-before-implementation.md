---
type: preference
topic: development-workflow
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-08-11
---

# Phase 1.75 — Design before implementation (UI/front-end projects)

For any project that has, or is planned to eventually have, a UI/front-end,
insert a design phase after planning and before coding:

1. Create the plan ([Phase 1](phase-1-spec-and-scope.md)) and sub-plans as normal.
2. Create the design and iterate on it until confirmed — no coding starts before this is settled.
3. Re-review the plan and sub-plans against the confirmed design; adjust either side if they've drifted apart.
4. Only once plan and design agree, proceed to execution ([Phase 2 — TDD implementation](phase-2-tdd-implementation.md)).

Rationale: plan-then-subplan alone tends to miss UI details or diverge from
the User's visual intent on front-end-heavy work; confirming the design
before coding starts closes that gap.
