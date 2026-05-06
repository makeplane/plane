# Weekend Working-Day Duration for Work Items

## Status

Approved design for implementation planning.

## Context

ADR 0002 defines the eventual Working Calendar direction: projects inherit an
effective calendar, holidays can be imported, and scheduling calculations use
working days while the Gantt chart still displays calendar days.

This design is the preceding slice. It gives each Work Item a stored planned
working-day duration and calculates the displayed `target_date` from
`start_date` plus that duration while treating Saturday and Sunday as
non-working days. It does not add editable calendars, workspace/project calendar
inheritance, holiday imports, or Japan public holiday presets.

The existing Timeline dependency propagation code already isolates date math in
small scheduling helpers. This slice should extend that direction without
rewriting the dependency graph or Gantt timeline model.

## Goals

- Store a per-Work Item planned duration in working days.
- Let users extend or shrink a Work Item by changing that day count.
- Recalculate `target_date` from `start_date` and planned duration while
  skipping Saturdays and Sundays.
- Keep `start_date` and `target_date` as the public Timeline/Gantt date range.
- Preserve direct date editing: when a user changes `target_date` directly, the
  stored working-day duration should update to match the new range.
- Keep the implementation narrow enough that ADR 0002 can replace the
  weekend-only calendar with a project effective Working Calendar later.

## Non-Goals

- No Japan holiday preset in this slice.
- No editable working weekdays or non-working date model in this slice.
- No workspace default or project override Working Calendar in this slice.
- No Gantt axis compression; weekends remain visible on the calendar-day axis.
- No replacement of Plane estimates. Planned duration is scheduling data, not
  estimate points or time tracking.

## Domain Rules

- Add `planned_duration_working_days` to Work Items.
- `planned_duration_working_days` is nullable so existing Work Items keep their
  current explicit date ranges until users opt into duration-managed scheduling.
- Valid planned duration values are integers from 1 through 366.
- Monday through Friday are working days. Saturday and Sunday are non-working
  days.
- The `start_date` counts as working day 1 when it falls on a weekday.
- If `start_date` falls on a weekend, the first counted working day is the next
  Monday. The stored `start_date` itself is not silently changed.
- `target_date` is the date of the final counted working day.
- Examples:
  - Friday start, duration 1 -> Friday target.
  - Friday start, duration 2 -> Monday target.
  - Thursday start, duration 3 -> Monday target.
  - Saturday start, duration 1 -> Monday target.
- If `start_date` is null, duration can be stored but `target_date` is not
  derived.
- If duration is cleared, `target_date` returns to explicit date behavior.

## Mutation Rules

When the API receives `planned_duration_working_days` with a non-null
`start_date`, the server recalculates `target_date` from the weekend-only
calendar. This rule applies to create and update paths that persist Work Item
dates.

When the API receives a new `start_date` for a Work Item that already has a
planned duration, the server recalculates `target_date` from the stored
duration.

When the API receives a direct `target_date` change and does not also receive an
explicit planned duration, the server recalculates `planned_duration_working_days`
from `start_date` and `target_date`. This keeps manual resizing and direct date
editing compatible with duration-managed scheduling.

When the API receives both `target_date` and `planned_duration_working_days` in
the same request, planned duration wins and the server derives `target_date`.

Invalid ranges such as `target_date` before `start_date`, or a non-positive
duration, are rejected by the existing serializer validation surface for the
relevant endpoint.

## Architecture

### Backend Model

Add a nullable integer field to `Issue`:

`planned_duration_working_days`

The field is serialized in Issue list/detail responses and accepted in Issue
create/update payloads where other mutable Issue properties are accepted.

### Scheduling Helpers

Create a small weekend calendar helper near the existing timeline scheduling
code. The helper owns:

- `is_weekend(date)`
- `is_working_day(date)`
- `add_working_days(start, duration)`
- `count_working_days(start, target)`

These helpers should be pure Python and independently unit tested. They are the
future replacement point for ADR 0002's effective Working Calendar.

### Issue Persistence

Issue create/update serializers or service paths should normalize schedule
fields before save:

1. Validate the supplied schedule values.
2. Derive `target_date` from `start_date + planned_duration_working_days` when
   duration is authoritative.
3. Derive `planned_duration_working_days` from `start_date..target_date` when a
   user directly edits the target date.
4. Persist the normalized fields through the existing Issue write path.

Bulk date updates used by Gantt resizing should also preserve this invariant.

### Timeline Dependency Propagation

The first integration is conservative:

- If a propagated Work Item has no planned duration, existing calendar-day
  propagation remains unchanged.
- If a propagated Work Item has planned duration, moving its start date should
  derive its target date from that planned duration using the weekend-only
  helper.
- Propagation graph traversal, failure codes, permissions, stale checks, and the
  all-or-nothing server authority model remain unchanged.

This keeps the graph algorithm stable while changing only the schedule math for
duration-managed Work Items.

### Frontend Types and UI

Add `planned_duration_working_days` to the shared Issue types.

Expose the field in the Work Item detail property UI as a compact numeric input
or existing property control. The control should:

- Accept positive integer day counts.
- Send `planned_duration_working_days` through the existing Issue update action.
- Let the server response update `target_date`.
- Show normal date fields as before.

Gantt bars continue to render from `start_date` and `target_date`.

## Error Handling

- Non-integer or out-of-range durations fail validation.
- A duration without `start_date` is allowed but cannot derive `target_date`.
- A direct `target_date` before `start_date` remains invalid.
- Existing propagation errors remain stable. This slice should not add new
  timeline propagation error codes.

## Testing

Backend unit tests should cover:

- Friday + 1 working day -> Friday.
- Friday + 2 working days -> Monday.
- Thursday + 3 working days -> Monday.
- Saturday + 1 working day -> Monday.
- Counting working days across a weekend.
- Direct target-date edit recalculates planned duration.
- Start-date edit with stored duration recalculates target date.
- Clearing duration returns to explicit target-date behavior.
- Timeline propagation preserves existing behavior for items without planned
  duration.
- Timeline propagation derives target date for items with planned duration.

Frontend tests should cover:

- Issue type accepts `planned_duration_working_days`.
- Duration update sends the field through the existing update action.
- Server-returned `target_date` is rendered in the Gantt block and detail date
  fields.

## Rollout

Existing Work Items start with `planned_duration_working_days = null`; no
backfill is required. Users opt in by setting a duration. Because `target_date`
remains persisted, existing filters, Gantt rendering, calendar rendering,
exports, and reminders continue to work from the date range already used by
Plane.

## Open Decisions Resolved

- Planned duration is stored separately from estimates.
- Weekend-only scheduling is the first calendar implementation.
- Duration is inclusive of the first working day.
- The Gantt axis remains calendar-day based.
- ADR 0002 remains the future extension path for holidays and editable working
  calendars.
