# Timeline Dependency Follow-up Tasks

## Deferred: Working Calendar and Planned Duration

Plane's current model is date-range based: work items have `start_date` and `target_date`, and Timeline bars are rendered from those dates. The first dependency propagation implementation should stay close to that model.

Follow-up task:

- [ ] Add scheduling support for working calendars and planned working-day duration.

Scope notes:

- Add a **Working Calendar** model with workspace default and project-level difference overrides.
- Support editable working weekdays and non-working dates.
- Add a built-in Japan public holiday preset for 2024-2030, imported by year into the working calendar.
- Track non-working date source, such as `manual` or `jp_holiday_preset`.
- Add a work item scheduling duration, such as `planned_duration_working_days`, without conflating it with Plane's existing estimate points/time estimates.
- Calculate `target_date` from `start_date + planned working duration` using the effective project working calendar.
- Preserve planned working duration when dependency schedule propagation moves work items.
- Keep the Gantt axis calendar-day based; use the working calendar for date calculation and non-working-day highlighting.

Reason for deferral:

This is a scheduling-engine extension beyond Plane's current Timeline model. It is valuable for Japanese practical project planning, but it should not block the first Plane-compatible dependency propagation implementation.
