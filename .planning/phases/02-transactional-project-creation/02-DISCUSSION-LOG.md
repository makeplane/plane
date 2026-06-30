# Phase 2: Transactional Project Creation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 2-Transactional Project Creation
**Areas discussed:** template_id validation and permissions, transaction boundary, generated content mapping, relative dates and ownership

---

## template_id validation and permissions

| Question                                         | Option                                           | Description                                                                                                | Selected |
| ------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------- |
| Who may use a template during Project creation?  | Admin + member                                   | Workspace admins and members may use available templates because this follows Project creation permission. | yes      |
| Who may use a template during Project creation?  | Admin only                                       | Stricter for custom templates, but blocks members who can otherwise create Projects.                       |          |
| Who may use a template during Project creation?  | Agent decides                                    | Planner chooses based on existing permission patterns.                                                     |          |
| How should invalid template_id respond?          | Generic 404                                      | Same response for missing, inactive, or foreign-workspace templates.                                       | yes      |
| How should invalid template_id respond?          | Detailed 400 validation error                    | More client-visible detail, but may expose availability.                                                   |          |
| How should invalid template_id respond?          | 403/404 split                                    | Clearer permission distinction, but enables probing and adds complexity.                                   |          |
| How should omitted/null/empty values behave?     | Omitted/null = no-template; empty string = error | Preserves the old path while catching malformed form payloads.                                             | yes      |
| How should omitted/null/empty values behave?     | Omitted/null/empty = no-template                 | More tolerant, but may hide payload bugs.                                                                  |          |
| How should omitted/null/empty values behave?     | Only omitted = no-template                       | Strictest, but may reject harmless null form state.                                                        |          |
| Should saved payloads be validated before apply? | Validate again before apply                      | Protects against stale, corrupted, or directly modified payloads.                                          | yes      |
| Should saved payloads be validated before apply? | Trust saved data                                 | Less duplicate validation, but weaker safety.                                                              |          |
| Should saved payloads be validated before apply? | Agent decides                                    | Planner chooses the smallest safe pattern.                                                                 |          |

**User's choice:** Admin/member can use templates; invalid unavailable templates return generic 404; omitted/null means no-template; empty string errors; payloads are re-validated before apply.
**Notes:** This area intentionally separates using templates during Project creation from managing template records.

---

## transaction boundary

| Question                                         | Option                              | Description                                                                             | Selected |
| ------------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| What should the template transaction include?    | Whole create flow                   | Project, identifier, memberships, generated contents, and join rows roll back together. | yes      |
| What should the template transaction include?    | Project plus template contents      | Smaller scope, but may leave side effects.                                              |          |
| What should the template transaction include?    | Template contents after Project     | Least invasive, but risks partial Project creation.                                     |          |
| Should no-template creation also be atomic?      | Atomic for no-template too          | Same successful behavior, cleaner rollback on failure.                                  | yes      |
| Should no-template creation also be atomic?      | Only template path atomic           | Less behavior change, but uneven safety.                                                |          |
| Should no-template creation also be atomic?      | Agent decides                       | Planner weighs implementation risk.                                                     |          |
| What happens to DEFAULT_STATES with template?    | Do not create DEFAULT_STATES        | Template states are the only generated states.                                          | yes      |
| What happens to DEFAULT_STATES with template?    | Create defaults and template states | Preserves old path but violates generated-state requirements.                           |          |
| What happens to DEFAULT_STATES with template?    | Create then replace defaults        | More complex and unnecessary.                                                           |          |
| Should async activity failure roll back Project? | Do not roll back                    | Activity is not core Project data.                                                      | yes      |
| Should async activity failure roll back Project? | Roll back on enqueue failure        | Strict, but makes Project creation depend on logging.                                   |          |
| Should async activity failure roll back Project? | Agent decides                       | Planner follows existing Plane activity patterns.                                       |          |

**User's choice:** Use atomic transactions for template and no-template create paths; template path skips DEFAULT_STATES; async activity failure does not roll back core Project data.
**Notes:** The transaction boundary is about database consistency, not auxiliary asynchronous activity.

---

## generated content mapping

| Question                                         | Option                                | Description                                                 | Selected |
| ------------------------------------------------ | ------------------------------------- | ----------------------------------------------------------- | -------- |
| How should state sequence/default apply?         | Preserve payload exactly              | Template is the source of truth; avoid save hook overrides. | yes      |
| How should state sequence/default apply?         | Relative order only                   | Simpler, but weaker mirroring.                              |          |
| How should state sequence/default apply?         | Agent decides                         | Planner chooses based on model hooks.                       |          |
| How should labels/modules/cycles preserve order? | Preserve template order/sort metadata | Stable generated content ordering.                          | yes      |
| How should labels/modules/cycles preserve order? | Let save hooks assign                 | Less code, but order may drift.                             |          |
| How should labels/modules/cycles preserve order? | No guarantee                          | Simplest, but weak for previews and expectations.           |          |
| How should starter issues be created?            | Explicit state and join rows          | Resolve state/label/module/cycle keys to generated objects. | yes      |
| How should starter issues be created?            | Let default state fill in             | Easier, but can violate GEN-06.                             |          |
| How should starter issues be created?            | Issues only, no links                 | Does not meet Phase 2 scope.                                |          |
| What if a reference cannot resolve?              | Fail hard and rollback                | Prevents incomplete template-created Projects.              | yes      |
| What if a reference cannot resolve?              | Skip failed link                      | Soft failure, but generated Project is wrong.               |          |
| What if a reference cannot resolve?              | Log and continue                      | Hard to detect bad data.                                    |          |

**User's choice:** Mirror template ordering/defaults, create explicit starter issue links, and roll back on any unresolved reference.
**Notes:** Phase 1 stable reference keys are mandatory inputs for Phase 2 mapping.

---

## relative dates and ownership

| Question                                                         | Option                        | Description                                                | Selected |
| ---------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------- | -------- |
| What base date should offsets use?                               | Project creation date         | Simple and available in the current create flow.           | yes      |
| What base date should offsets use?                               | Project start date            | More flexible, but current create flow may not have it.    |          |
| What base date should offsets use?                               | Do not apply offsets          | Simpler, but ignores Phase 1 metadata.                     |          |
| Which wins when target_offset_days and duration_days both exist? | Prefer target_offset_days     | Explicit target wins; duration is fallback.                | yes      |
| Which wins when target_offset_days and duration_days both exist? | Prefer duration_days          | Keeps duration consistent, but may ignore explicit target. |          |
| Which wins when target_offset_days and duration_days both exist? | Error if both exist           | Strict, but Phase 1 may allow both.                        |          |
| Which user owns/audits generated records?                        | Project creator               | Use request.user for created_by and Cycle.owned_by.        | yes      |
| Which user owns/audits generated records?                        | Project lead fallback creator | Business-oriented, but lead may not be actor.              |          |
| Which user owns/audits generated records?                        | Required fields only          | Avoids extra policy, but Cycle requires owner.             |          |
| Should starter issues get assignees/subscribers?                 | Leave empty in Phase 2        | Avoids user-reference scope not locked in Phase 1.         | yes      |
| Should starter issues get assignees/subscribers?                 | Assign creator                | Convenient, but creates noise and adds behavior.           |          |
| Should starter issues get assignees/subscribers?                 | Assign project lead           | Plausible, but out of current scope.                       |          |

**User's choice:** Use Project creation date for offsets, prefer explicit target offsets, use creator for ownership/audit, and leave starter issue assignees/subscribers empty.
**Notes:** User-reference mapping is deferred by omission from Phase 1 payload decisions.

---

## The Agent's Discretion

- Planner may choose exact helper/service boundaries for applying templates.
- Planner may choose exact validation placement between serializer and view as long as the decisions in CONTEXT.md are enforced.
- Planner may choose exact rollback test mechanics.

## Deferred Ideas

None.
