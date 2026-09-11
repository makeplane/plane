# Changelog

All notable changes to Questimus are documented in this file.

## [1.0.0] - 2026-09-11

### Added

- **Move work items between projects.** A "Move to project" action moves a work item — together with its entire sub-tree — into another project. The item is re-keyed to the next sequence number in the destination, and its state, labels, assignees, and issue type are remapped to the destination's setup. Source-project labels travel along as destination clones; cycle/module memberships and cross-project relations are cleaned up.
- "Move to project" is available in the work-item detail menu (before "Make a copy") and in list, board, calendar, and spreadsheet layouts (between "Edit" and "Make a copy"). A destination-project picker is filtered by your permissions, and the move lands you on the item's new URL. Moves are recorded as activity entries and version snapshots, watchers are notified, and concurrent moves are serialized safely.
- New `design` and `ship` skill bundles for the toolchain (style assets, charting, PR/review workflow references).

### Changed

- Repository planning, ticketing, and handoff documentation moved onto the built-in Questimus tracker; deployed skills, agents, and manifests refreshed.
