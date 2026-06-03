# Journal — Remove Unused Project Settings Worklogs Tab

**Date:** 2026-05-29
**Plan:** `260529-remove-project-settings-worklogs`
**Branch:** `ngoc-feat/categories`
**Commit:** `ab570715a`

## Summary

Removed the unused and dead-code project settings worklogs tab, its routes, and associated frontend services, hooks, and stores (net deletion of ~880 lines across 14 files). The refactoring eliminates unused navigation, dead types, and stale assets, improving codebase maintainability and keeping the repository compliant with YAGNI principles. Zero compile, formatting, or linting regressions were introduced.

## What was removed

- **Views & UI Components (`apps/web`):**
  - Deleted directory `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/` and all its files:
    - `header.tsx`: View header.
    - `page.tsx`: Worklog entries table and setup page.
    - `previous-downloads.tsx`: Exports and download log table.
    - `worklog-filters-toolbar.tsx`: Worklog filtering controls.
    - `worklog-pagination-footer.tsx`: Pagination navigation components.
    - `worklog-table-columns.tsx`: Data table columns configuration.
- **Routing & Navigation:**
  - Removed route definition for `/settings/projects/[projectId]/worklogs` in `apps/web/app/routes/extended.ts`.
  - Removed `worklogs` icon mapping from `apps/web/core/components/settings/project/sidebar/item-icon.tsx`.
- **Global Constants & Types (`packages`):**
  - Removed the `worklogs` object and its `GENERAL` grouping entry in `packages/constants/src/settings/project.ts`.
  - Removed `"worklogs"` literal type from the `TProjectSettingsTabs` union in `packages/types/src/settings.ts`.
- **MobX State Management & Hooks:**
  - Deregistered the `projectWorklog` store fields and constructor instantiation inside `apps/web/ce/store/root.store.ts`.
  - Deleted MobX store implementation: `apps/web/ce/store/project/worklog.store.ts`.
  - Deleted custom React hook wrapper: `apps/web/ce/hooks/store/use-project-worklog.ts`.
  - Deleted client-side API communication class: `apps/web/ce/services/project-worklog.service.ts`.

## Decisions & Reflection

**Decision 1: Full-Scope Deletion (KISS & YAGNI Compliance)**
Rather than just masking the tab visually and leaving the underlying files/stores registered, we executed a complete deletion of all associated assets, services, and hooks. This significantly reduces future maintenance overhead (saving ~880 LOC) and avoids any bundle-size or type-safety drift.

**Decision 2: Defensive Audit & Verification**
A comprehensive workspace-wide grep search for `worklogs` and `projectWorklog` was performed before refactoring to guarantee no stray imports or references remained. This verified that the cleanup does not affect the main Worklogs feature or other workspace-level settings pages.

## Verification & Impact

- **Build / Type Safety:** The frontend workspace compiles without typescript errors.
- **Linting & Formatting:** `pnpm check:lint` and `pnpm check:format` passed successfully with zero warnings.
- **Zero Regression:** The main project settings views operate perfectly. Attempting to directly navigate to `/worklogs` now triggers standard fallback 404/redirect behavior.

---

**Status:** DONE
**Summary:** Wrote the technical journal entry for the removal of the unused project settings worklogs tab and associated frontend cleanup.
