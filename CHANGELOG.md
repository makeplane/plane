# Changelog

All notable changes to Questimus are documented in this file.

## [1.0.1] - 2026-09-12

### Fixed

- Work item property dropdowns are selectable again: State, Priority, Labels, Assignees, and Start/Due dates open at their field and clicking an option now saves it. A headlessui modal-inert leak had left options visible but unclickable, and the date/assignee panels opened at the top-left of the page.
- The date calendar opens leftward from the sidebar and stays fully on screen on narrower windows.
- Work item pages no longer get stuck in a 429 reload loop after rebuilds: the static asset rate limit was raised from 300 to 3000 requests/min per IP.
- 13 pre-existing TypeScript errors resolved; the web app now passes the type gate.

### Changed

- Deployed skill and agent documentation refreshed from Arsenal.

## [1.0.0] - 2026-09-11

### Added

- **Move work items between projects.** A "Move to project" action moves a work item â€” together with its entire sub-tree â€” into another project. The item is re-keyed to the next sequence number in the destination, and its state, labels, assignees, and issue type are remapped to the destination's setup. Source-project labels travel along as destination clones; cycle/module memberships and cross-project relations are cleaned up.
- "Move to project" is available in the work-item detail menu (before "Make a copy") and in list, board, calendar, and spreadsheet layouts (between "Edit" and "Make a copy"). A destination-project picker is filtered by your permissions, and the move lands you on the item's new URL. Moves are recorded as activity entries and version snapshots, watchers are notified, and concurrent moves are serialized safely.
- New `design` and `ship` skill bundles for the toolchain (style assets, charting, PR/review workflow references).

### Changed

- Repository planning, ticketing, and handoff documentation moved onto the built-in Questimus tracker; deployed skills, agents, and manifests refreshed.
