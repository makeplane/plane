# PRD: Timeline Dependency Date-Range Propagation

## Problem Statement

Plane's Timeline/Gantt experience can show and create precedence dependencies between Work Items, but moving a scheduled Work Item currently changes only that one Work Item's `start_date` and `target_date`. When that move crosses a Precedence Boundary, connected Work Items do not move with it, leaving the visible schedule inconsistent with the dependency graph and forcing users to manually repair downstream or upstream dates one item at a time.

This is especially confusing because Plane's upstream Timeline dependency behavior implies that dependent tasks should adjust automatically when a connected task moves. Users need a Plane-compatible dependency schedule propagation behavior that keeps the existing date-range model, preserves predictable direct manipulation in the Timeline, and avoids silently breaking dependencies that are not currently loaded in the browser.

## Solution

Add Dependency Schedule Propagation for Timeline Work Item move drags. When a user moves a complete scheduled Work Item in the Gantt chart, Plane should preserve Precedence Boundaries by moving connected Work Items only when necessary and only in the direction of the drag.

The first implementation stays close to Plane's current date-range model: Work Items are scheduled by `start_date` and `target_date`, and propagation preserves those date ranges using calendar-day date math. Working Calendar, Japan holiday presets, and planned working-day duration are valuable follow-up work, but they are not required for this first Plane-compatible propagation implementation.

The server is authoritative. The client may preview propagation for Work Items already loaded in the Gantt chart during drag, but the server resolves the full same-project precedence graph, validates the schedule change all-or-nothing, and returns the actual updated Work Item dates. Failed propagation must return a clear reason code and message so the UI can explain why no schedule change was applied.

## Scope Boundary

This PRD implements the first Plane-compatible date-range propagation slice. It uses Plane's current scheduling model: `start_date` and `target_date` define the Work Item's Timeline range, and date movement is calculated in calendar days.

ADR 0001 is in scope and binding for this PRD. The server must be authoritative, resolve the full same-project precedence graph, apply changes all-or-nothing, and return explicit failure reasons.

ADR 0002 is acknowledged as a proposed follow-up scheduling extension. Working Calendar, Japan holiday presets, and planned working-day duration should shape future extensibility, but they must not be implemented as part of this PRD.

The practical implementation constraint is: build the graph traversal and propagation API so that date math can later be swapped from calendar-day calculations to Working Calendar calculations without changing the API's core intent or the server-authoritative ownership model.

## User Stories

1. As a project member, I want moving a Work Item in the Timeline to preserve its precedence dependencies, so that my schedule remains coherent.
2. As a project member, I want a small move that does not cross a Precedence Boundary to move only the Work Item I dragged, so that harmless adjustments do not disturb the rest of the plan.
3. As a project member, I want a move that crosses a predecessor boundary to move the affected predecessors, so that the dragged Work Item does not start before its required predecessors can finish.
4. As a project member, I want a move that crosses a successor boundary to move the affected successors, so that downstream Work Items do not start before the dragged Work Item can finish.
5. As a project member, I want propagation to move only the Work Items needed to preserve boundaries, so that unrelated dates remain unchanged.
6. As a project member, I want propagation to preserve existing schedule gaps where possible, so that intentional buffers in the plan are not compressed unexpectedly.
7. As a project member, I want propagation to follow dependencies transitively, so that a chain of connected Work Items remains valid after a drag.
8. As a project member, I want propagation to handle split dependency paths, so that all affected downstream branches remain valid.
9. As a project member, I want propagation to handle merge dependency paths, so that all affected upstream branches remain valid.
10. As a project member, I want rightward drags to affect successors only, so that predecessor gaps simply grow instead of moving unnecessarily.
11. As a project member, I want leftward drags to affect predecessors only, so that successor gaps simply grow instead of moving unnecessarily.
12. As a project member, I want exact boundary contact to be treated as valid, so that Work Items can be adjacent without an artificial extra gap.
13. As a project member, I want the dragged Work Item's date range duration to be preserved when it moves, so that moving is distinct from resizing.
14. As a project member, I want propagated Work Items' date range durations to be preserved, so that dependency repair does not change task lengths.
15. As a project member, I want resize behavior to remain unchanged in the first version, so that move propagation does not introduce ambiguous resize rules.
16. As a project member, I want only precedence relationships to propagate schedules, so that non-ordering relationships do not unexpectedly change dates.
17. As a project member, I want `relates_to` relationships to remain informational, so that related work is not moved without a precedence meaning.
18. As a project member, I want duplicate relationships to remain informational, so that duplicate tracking does not affect scheduling.
19. As a project member, I want incomplete scheduled Work Items to block propagation with a clear error, so that Plane does not invent missing dates.
20. As a project member, I want cross-project dependency paths to fail rather than move another project's Work Items, so that hidden cross-project side effects do not occur.
21. As a project member, I want propagation to be all-or-nothing, so that a failed move does not leave the schedule partially changed.
22. As a project member, I want clear error messages when propagation fails, so that I know whether to fix a cycle, missing dates, permissions, or stale data.
23. As a project member, I want the browser to preview loaded affected Work Items during drag, so that I can see the likely schedule movement before dropping.
24. As a project member, I want the final saved result to match the server's response, so that hidden dependencies are handled correctly even if they were not loaded in my browser.
25. As a project member, I want Plane to tell me when more Work Items were updated than were visible in the preview, so that I understand why dates changed outside the current viewport.
26. As a project member, I want propagation failures to revert the local preview, so that the Timeline returns to a trustworthy state.
27. As a project member, I want stale schedule data to fail instead of overwriting newer changes, so that another user's edits are not silently lost.
28. As a project member, I want circular precedence dependencies to prevent propagation, so that Plane does not create arbitrary or infinite schedule movement.
29. As a project member, I want propagation to have a safe update limit, so that one drag cannot unexpectedly update an excessive number of Work Items.
30. As a project member, I want propagation within the safe limit to save without a confirmation dialog, so that Timeline dragging remains direct and efficient.
31. As a project admin, I want propagation to respect existing project permissions, so that only authorized users can change Work Item dates.
32. As a project admin, I want propagation activity to be auditable through normal Work Item date changes, so that schedule changes remain traceable.
33. As a developer, I want the propagation algorithm isolated in a testable domain module, so that complex graph and date behavior can be validated without a browser.
34. As a developer, I want the server to normalize `blocking` and `blocked_by` into a single precedence direction, so that propagation logic is not duplicated for mirrored relation names.
35. As a developer, I want the client to send movement intent rather than a precomputed update list, so that the server remains the source of truth for hidden dependencies.
36. As a developer, I want success responses to return all updated Work Item dates, so that the client can update stores without guessing.
37. As a developer, I want failure responses to use stable error codes, so that UI messages and tests do not depend on fragile text.
38. As a QA engineer, I want propagation scenarios covered with graph-focused tests, so that chain, branch, merge, and error behavior are reliable.
39. As a QA engineer, I want at least one end-to-end Timeline propagation path, so that the integration between drag, API, store update, and rendering is covered.
40. As a future planner, I want Working Calendar and planned working-day duration captured as follow-up work, so that Japanese holiday-aware scheduling can be added later without blocking this Plane-compatible version.

## Implementation Decisions

- This PRD uses the domain terms from `CONTEXT.md`: Work Item, Precedence Dependency, Dependency Schedule Propagation, and Precedence Boundary.
- This PRD follows the server-authoritative decision in ADR 0001.
- This PRD acknowledges ADR 0002 as a future scheduling direction, but keeps Working Calendar behavior out of the first implementation.
- Dependency Schedule Propagation applies only to precedence relationships represented by `blocking` and `blocked_by`.
- Dependency Schedule Propagation does not apply to non-ordering relationships such as `relates_to` or `duplicate`.
- The first implementation applies only to move drag operations on complete scheduled Work Items.
- Left and right resize propagation are out of scope for this PRD.
- A complete scheduled Work Item has both `start_date` and `target_date`.
- The first implementation uses Plane's existing date-range model; it does not introduce a scheduling duration field.
- Calendar-day date math is used for this PRD. Working-day calculation is deferred.
- The Precedence Boundary for the first implementation is date-range adjacency: a successor must start no earlier than the calendar day after its predecessor ends.
- If a move does not violate any Precedence Boundary, only the dragged Work Item is updated.
- If a rightward move violates successor boundaries, the server moves only affected successors by the minimum amount required.
- If a leftward move violates predecessor boundaries, the server moves only affected predecessors by the minimum amount required.
- Propagation is transitive through connected precedence paths.
- Split and merge paths are included; every affected branch is considered.
- Existing gaps between propagated Work Items are preserved unless a boundary violation requires movement.
- The server resolves the full same-project precedence graph rather than trusting the browser's loaded graph.
- Cross-project propagation is not supported in the first implementation. Reaching a Work Item outside the current project fails the entire propagation request.
- Propagation is all-or-nothing. Partial schedule changes are not valid.
- The server enforces a maximum of 100 updated Work Items per propagation request.
- Propagation uses a dedicated server-side service module with a stable interface that accepts move intent and returns either updated date ranges or a typed failure.
- The propagation service is a deep module: graph traversal, direction normalization, date-range movement, limit enforcement, and error selection are encapsulated behind a small interface.
- A separate precedence graph loader normalizes stored issue relations into predecessor-to-successor edges for the current project.
- A small date-range scheduling helper handles duration preservation, boundary checks, and minimum movement calculations.
- The API should accept user intent: requested Work Item, original schedule/version information, requested `start_date`, requested `target_date`, and operation type `move`.
- The API should not require the client to send a complete list of propagated updates.
- The API should return every Work Item actually updated, including `id`, `start_date`, `target_date`, and `updated_at`.
- The API should return propagation metadata such as requested Work Item id, total updated count, and client preview count when available.
- Failure responses should return a stable error object with `code` and `message`.
- Initial failure codes are `DEPENDENCY_CYCLE`, `PROJECT_BOUNDARY_EXCEEDED`, `INCOMPLETE_SCHEDULE`, `PROPAGATION_LIMIT_EXCEEDED`, `SCHEDULE_CHANGED`, `PERMISSION_DENIED`, and `INVALID_DATE_RANGE`.
- The server should compare the client's drag-start schedule/version information with current server data and fail stale requests.
- Date updates should update `updated_at` consistently so clients can detect stale schedules.
- The client may preview propagation for the loaded graph during drag, but this preview is advisory.
- The final client state must be based on the server response.
- If the server returns more updated Work Items than the client previewed, the UI should communicate that additional hidden Work Items were updated.
- If propagation fails, the client reverts all local preview changes and displays the server-provided reason.
- Existing bulk date update behavior should remain available for non-propagating date changes.
- A dedicated propagation endpoint is preferred over overloading the existing bulk date update endpoint, because the new behavior has different validation, response, and failure semantics.
- Existing Timeline dependency creation and line rendering remain separate from this PRD except where relation data is needed for propagation.
- The existing relation creation cycle guard remains useful for immediate feedback, but the propagation service must still guard against cycles server-side.
- The first implementation does not add a dedicated Undo feature.
- The first implementation does not show a confirmation dialog for propagation within the safe update limit.

## Testing Decisions

- Good tests should assert external scheduling behavior: input graph, requested move, persisted updates, response payload, and visible client state.
- Tests should not assert private traversal order, intermediate data structures, or implementation-specific helper names.
- The backend propagation service should receive the broadest test coverage because it owns the authoritative schedule decision.
- Backend service tests should cover a no-violation move where only the dragged Work Item changes.
- Backend service tests should cover rightward propagation to one successor.
- Backend service tests should cover leftward propagation to one predecessor.
- Backend service tests should cover a transitive chain.
- Backend service tests should cover split successor branches.
- Backend service tests should cover merge predecessor branches.
- Backend service tests should cover gap preservation.
- Backend service tests should cover exact boundary adjacency.
- Backend service tests should cover incomplete scheduled Work Items.
- Backend service tests should cover cross-project dependency paths.
- Backend service tests should cover cycle detection.
- Backend service tests should cover the 100 Work Item update limit.
- Backend service tests should cover stale schedule/version rejection.
- Backend service tests should cover invalid requested date ranges.
- Backend service tests should cover permission rejection at the API layer.
- API tests should verify all-or-nothing persistence: on any failure, no Work Item dates are updated.
- API tests should verify success responses include all updated Work Item dates and `updated_at` values.
- API tests should verify failure responses include stable error codes and user-readable messages.
- Frontend store tests should verify loaded-graph preview behavior for simple, chain, and branch cases.
- Frontend store tests should verify preview rollback after failure.
- Frontend integration tests should verify server-returned updates replace preview state.
- Frontend tests should verify the hidden-update notification when the server updates more Work Items than the preview knew about.
- End-to-end tests should cover one happy path where dragging a Work Item causes a dependent Work Item to move and persist.
- End-to-end tests should cover one failure path where the drag is rejected and the UI returns to the original schedule.
- Existing Playwright Timeline dependency tests are prior art for authenticated workspace setup, Work Item creation, and Gantt interactions.
- Existing API contract tests are prior art for endpoint-level permission, validation, and response behavior.
- Where possible, graph/date propagation should be tested without browser automation first, then covered by a smaller number of E2E tests.

## Out of Scope

- Working Calendar support is out of scope for this PRD.
- Japan holiday presets are out of scope for this PRD.
- Planned working-day duration, such as `planned_duration_working_days`, is out of scope for this PRD.
- Automatically calculating `target_date` from `start_date + planned duration` is out of scope for this PRD.
- Skipping weekends or holidays during propagation is out of scope for this PRD.
- Changing the Gantt axis to hide non-working days is out of scope for this PRD.
- Resize propagation from left or right handles is out of scope for this PRD.
- Cross-project propagation is out of scope for this PRD.
- A dedicated Undo action for propagated schedule changes is out of scope for this PRD.
- Confirmation dialogs for in-limit propagation are out of scope for this PRD.
- Reworking Plane's estimate points or time estimate model is out of scope for this PRD.
- Fixing unrelated Timeline console warnings is out of scope unless they directly block propagation behavior.
- Replacing the existing dependency creation UI is out of scope.

## Further Notes

- Plane's current Timeline model appears date-range based: Work Items have explicit start and target dates, and Gantt bars are rendered from those dates.
- Plane estimates are useful for work sizing, but they are not currently a scheduling duration engine for Timeline date calculation.
- The deferred Working Calendar and planned duration work is captured separately as follow-up work. That follow-up remains important for practical Japanese project planning, but it should not block the first Plane-compatible dependency propagation implementation.
- The client-side loaded-graph preview must be treated as a visual affordance, not as the source of truth.
- The server-side propagation service should be designed so that a future Working Calendar implementation can replace calendar-day date math without rewriting graph traversal or API semantics.
- The implementation should preserve existing non-propagating date update behavior for other UI paths.
- The feature should prioritize correctness and explainable failure over silently applying partial updates.
