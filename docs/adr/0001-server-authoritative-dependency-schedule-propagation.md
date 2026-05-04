# Server-Authoritative Dependency Schedule Propagation

Dependency schedule propagation is calculated authoritatively on the server, not from only the Gantt chart state loaded in the browser. The client may preview propagation for loaded work items during drag, but the server resolves the full same-project precedence graph, applies the change all-or-nothing, and returns the actual updated work item dates. This avoids silently breaking dependencies that are not visible in the current paginated Gantt view while preserving responsive drag feedback for the work items the user can see.

**Considered Options**

- Client-only propagation over loaded work items: simpler, but can miss hidden dependencies.
- Server-side propagation over the full graph: more implementation work, but gives one source of truth for schedule validity.

**Consequences**

- Propagation requests must carry user intent, not a precomputed full update list.
- Failure responses must include a reason code and message so the UI can explain why no schedule change was applied.
- Cross-project propagation is out of scope for the first implementation; same-project propagation is the supported boundary.
