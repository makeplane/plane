---
last_researched: 2026-06-29
dimension: pitfalls
---

# Project Research - Pitfalls

## Pitfall: Partial Project Creation

If frontend creates project first and then creates states/labels/modules/cycles/issues with separate calls, users can end up with a half-applied template.

Prevention:

- Apply template server-side inside `transaction.atomic()`.
- Return a single success or validation failure.

Phase implication: backend integration must come before final UI wiring.

## Pitfall: Breaking Existing Default Project Creation

The current API always creates `DEFAULT_STATES` after creating a project. Template support can accidentally duplicate default states or remove defaults for non-template projects.

Prevention:

- If no `template_id`, run the current default-state creation path unchanged.
- If `template_id`, skip `DEFAULT_STATES` and create template states.
- Add tests for both paths.

Source: `apps/api/plane/app/views/project/base.py`, `apps/api/plane/db/models/state.py`.

## Pitfall: Ambiguous Permissions

Existing project creation allows workspace Admin and Member. User requirement says custom template management should be owner/admin. Plane's role enum exposes Admin, Member, Guest.

Prevention:

- Treat `ROLE.ADMIN` workspace members as template managers in v1.
- Let existing project creation permissions remain unchanged.
- Only gate create/edit/delete custom templates, not selecting a visible template to create a project.

## Pitfall: Reference Mapping For Starter Issues

Starter issues may reference states, labels, modules, and cycles before those rows exist in the new project.

Prevention:

- Require stable temporary keys in template payload sections.
- Build maps as each section is created.
- Resolve references when creating issues and join rows.
- Validate references before creating anything, or validate early inside the transaction.

## Pitfall: Label Hierarchies

Labels can have parent labels. Creating children before parents can fail or lose hierarchy.

Prevention:

- v1 can either support flat labels only or create labels in parent-first order.
- Requirements should state which behavior is in scope.

Recommendation: v1 supports flat labels in built-ins; custom template editor can add parent support later unless explicitly required.

## Pitfall: Date Semantics For Cycles

Cycles require start/end dates in the project timezone. Template cycles should not ship stale absolute dates.

Prevention:

- Store relative cycle offsets/durations in templates, not fixed historical dates.
- Resolve actual dates at project creation time.
- For v1, allow cycles with no dates if date semantics would slow the implementation.

## Pitfall: UI Scope Creep

Template management can become a full builder for states, labels, modules, cycles, and issues.

Prevention:

- First implement selection and built-ins.
- Then implement a basic custom template CRUD/editor with structured sections.
- Avoid a polished visual workflow builder in v1.

## Pitfall: Missing Test Coverage

This feature touches creation, permissions, and multiple generated object types.

Prevention:

- Backend tests should cover default create, system template create, custom template CRUD permissions, and template project creation.
- Frontend checks should cover type/lint/build and targeted component behavior where the existing test stack supports it.

