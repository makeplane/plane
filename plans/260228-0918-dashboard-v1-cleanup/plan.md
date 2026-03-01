# Plan: Dashboard V1 Complete Cleanup

**Date:** 2026-02-28 | **Branch:** develop
**Goal:** Remove ALL V1 (Analytics Dashboard Pro) code + DB tables. V2 100% independent.
**Report:** `plans/reports/inventory-260228-0854-dashboard-v1-cleanup.md`

---

## Phases

| #   | Phase                                                                | Status      | Files          |
| --- | -------------------------------------------------------------------- | ----------- | -------------- |
| 1   | [Tag + Delete V1 files](./phase-01-delete-v1-files.md)               | ✅ Complete | 22 files       |
| 2   | [DROP V1 DB tables](./phase-02-drop-v1-db-tables.md)                 | ✅ Complete | 1 migration    |
| 3   | [Rename V1-named active components](./phase-03-rename-components.md) | ✅ Complete | 7 files        |
| 4   | [Clean registrations + fix refs](./phase-04-clean-registrations.md)  | ✅ Complete | ~10 locations  |
| 5   | [Verify + Commit](./phase-05-verify-commit.md)                       | ✅ Complete | compile + lint |

## Dependencies

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (sequential)

## Recovery

- `git tag dashboard-v1-archive` created before any changes
- Restore: `git checkout dashboard-v1-archive -- <file>`
