# Plane Work Item Planning

This context describes scheduling language for work items on Plane's Gantt chart.

## Language

**Work Item**:
A schedulable unit of project work.
_Avoid_: issue when discussing user-facing planning behavior.

**Precedence Dependency**:
A directional relationship where one **Work Item** must come before another in the schedule.
_Avoid_: relation, link, association when the relationship does not impose ordering.

**Dependency Schedule Propagation**:
The automatic movement of related **Work Items** only as needed when a dragged **Work Item** would otherwise violate a precedence boundary.
_Avoid_: bulk move, cascade drag when the propagation rule is not being discussed.

**Precedence Boundary**:
The schedule limit where a successor starts no earlier than the next valid schedule day after its predecessor ends.
_Avoid_: collision, overlap when discussing the intended schedule rule.

**Working Calendar**:
The calendar that defines working days, weekends, holidays, and organization-specific non-working days for schedule planning.
_Avoid_: user calendar, local calendar.

**Holiday Preset**:
A built-in set of public holidays that can be imported into a **Working Calendar**.
_Avoid_: external holiday API when discussing the first Working Calendar implementation.

## Relationships

- A **Work Item** may have zero or more **Precedence Dependencies** before it.
- A **Work Item** may have zero or more **Precedence Dependencies** after it.
- **Dependency Schedule Propagation** applies to **Precedence Dependencies**, not to non-ordering relationships.
- **Dependency Schedule Propagation** moves only the work items needed to preserve **Precedence Boundaries**.
- **Dependency Schedule Propagation** preserves existing schedule gaps between propagated work items rather than compressing them.
- **Dependency Schedule Propagation** applies transitively through connected **Precedence Dependencies** in the propagation direction.
- **Dependency Schedule Propagation** covers every affected branch in the precedence graph, including split and merge paths.
- **Dependency Schedule Propagation** applies to moving a complete work item schedule, not to resizing its start or end date.
- **Dependency Schedule Propagation** stops at work items without a complete start and target date.
- **Dependency Schedule Propagation** is based on the full precedence graph, not only the work items currently visible in the Gantt chart.
- **Dependency Schedule Propagation** succeeds or fails as a single schedule change; partial propagation is not a valid outcome.
- Failed **Dependency Schedule Propagation** must explain why the schedule change could not be applied.
- During drag, **Dependency Schedule Propagation** should be previewed for loaded work items before the server confirms the full schedule change.
- The date-range propagation PRD uses Plane's current calendar-day date model.
- A future scheduling extension may use a **Working Calendar** to decide valid schedule days.

## Future Scheduling Extension

- A **Working Calendar** belongs to a workspace by default and may be overridden by a project.
- A project uses its effective **Working Calendar** for holiday-aware **Dependency Schedule Propagation**.
- A project **Working Calendar** override stores differences from the workspace default rather than a full copied calendar.
- A **Holiday Preset** adds non-working days to a **Working Calendar** and may be edited after import.
- The first **Holiday Preset** is Japan public holidays imported by year.
- A non-working date records whether it came from manual entry or a **Holiday Preset**.
- The Gantt chart displays calendar days while future schedule calculations may use the effective **Working Calendar**.

## Example Dialogue

> **Dev:** "Should a related item move when this work item is dragged?"
> **Domain expert:** "Only if the relation is a precedence dependency; a general relationship should not affect the schedule."

## Flagged Ambiguities

- "dependency" can mean any work item relation in the UI, but scheduling propagation only applies to **Precedence Dependencies**.
