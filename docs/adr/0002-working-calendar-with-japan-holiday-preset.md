# Working Calendar With Japan Holiday Preset

Status: proposed for a follow-up scheduling extension.

Dependency schedule propagation should eventually use a project’s effective working calendar, inherited from the workspace by default and overridable per project. This ADR records the intended follow-up direction for holiday-aware scheduling; it is not part of the first Plane-compatible date-range propagation PRD. The follow-up implementation includes editable working weekdays and non-working dates, plus a built-in Japan public holiday preset that can be imported by year.

**Considered Options**

- Calendar-day scheduling: simple, but produces unusable dates across weekends and holidays.
- External holiday API: less bundled data, but unreliable for self-hosted and offline environments.
- Built-in Japan holiday preset: requires maintaining data, but gives predictable local behavior for the target use case.

**Consequences**

- The first date-range propagation PRD keeps Plane's current calendar-day date model.
- In the follow-up Working Calendar implementation, schedule duration and precedence boundaries are calculated in working days.
- In the follow-up Working Calendar implementation, imported holidays become editable non-working dates in the working calendar.
- Additional country or region presets can be added later without changing the future Working Calendar propagation model.
- The Gantt chart continues to display calendar days; future working calendars affect scheduling calculations and non-working-day highlighting, not the timeline axis itself.
