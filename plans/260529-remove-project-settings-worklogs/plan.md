# Remove Unused Project Settings Worklogs Tab — Implementation Plan

**Date**: 2026-05-29  
**Type**: Cleanup & Refactoring  
**Scope**: Frontend — apps/web  
**Priority**: Medium

## Executive Summary

The worklogs tab in project settings (`/settings/projects/[projectId]/worklogs`) is no longer being used. This plan outlines the safe removal of this tab, its routes, and the associated code (files, components, store registration, hooks, and services) to keep the codebase clean and avoid dead code.

## Current State Analysis

Currently, the worklogs tab is defined as a settings key inside the constants and is registered as a grouped setting item under `GENERAL`. The route is configured in the extended router. A dedicated MobX store, service, and hook also exist specifically for this settings tab.

### Affected Components & Code

- **Constants Definition**: `packages/constants/src/settings/project.ts`
- **TypeScript Types**: `packages/types/src/settings.ts`
- **Routing Configuration**: `apps/web/app/routes/extended.ts`
- **Icon Mapping**: `apps/web/core/components/settings/project/sidebar/item-icon.tsx`
- **Folder to Delete**: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/`
- **MobX Store / Registration**: `apps/web/ce/store/root.store.ts` and `apps/web/ce/store/project/worklog.store.ts`
- **Custom Hook**: `apps/web/ce/hooks/store/use-project-worklog.ts`
- **Service Class**: `apps/web/ce/services/project-worklog.service.ts`

## Refactoring Strategy

1. **Remove Tab Definition**: Remove `worklogs` key from `PROJECT_SETTINGS` and `GROUPED_PROJECT_SETTINGS` in constants, and also from `TProjectSettingsTabs` and `PROJECT_SETTINGS_ICONS` map.
2. **De-register Route**: Remove the route mapping for the `worklogs` setting path in `extended.ts`.
3. **Store & Hook Cleanup**: Remove MobX registration of `projectWorklog` store in `root.store.ts` and delete the hook `use-project-worklog.ts`, the service `project-worklog.service.ts`, and the store `worklog.store.ts`.
4. **Directory Deletion**: Delete the settings page folder and files located under `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/`.

---

## Implementation Plan

### Phase 1: Constants & Navigation Cleanup (Est: 5 mins)

**Scope**: Remove worklogs from tabs, types, and icons.

1. [x] Edit `packages/constants/src/settings/project.ts` to:
   - Remove the `worklogs` object under `PROJECT_SETTINGS`.
   - Remove `PROJECT_SETTINGS["worklogs"]` from `GROUPED_PROJECT_SETTINGS`.
2. [x] Edit `packages/types/src/settings.ts` to remove `"worklogs"` from `TProjectSettingsTabs`.
3. [x] Edit `apps/web/core/components/settings/project/sidebar/item-icon.tsx` to remove `worklogs` icon mapping.

### Phase 2: Routing & Views Cleanup (Est: 5 mins)

**Scope**: Remove the routes and the actual settings views.

1. [x] Edit `apps/web/app/routes/extended.ts` to remove the route block for `worklogs`.
2. [x] Delete the directory `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/` and all its files:
   - `header.tsx`
   - `page.tsx`
   - `previous-downloads.tsx`

### Phase 3: Store, Service & Hook Cleanup (Est: 5 mins)

**Scope**: Remove custom service, store, hook, and its MobX root registration.

1. [x] Edit `apps/web/ce/store/root.store.ts` to:
   - Remove `import { ProjectWorklogStore } from "./project/worklog.store";`
   - Remove `projectWorklog: ProjectWorklogStore;` from class fields.
   - Remove `this.projectWorklog = new ProjectWorklogStore();` from constructor.
2. [x] Delete `apps/web/ce/hooks/store/use-project-worklog.ts`.
3. [x] Delete `apps/web/ce/store/project/worklog.store.ts`.
4. [x] Delete `apps/web/ce/services/project-worklog.service.ts`.

---

## Verification Plan

### Manual Verification

1. Open the project settings page (e.g., `http://localhost:3000/yesyes/settings/projects/ff8c18d3-b17d-4251-95ce-c30f4c43e225/`).
2. Verify that the "Worklogs" navigation link/tab is no longer displayed under "General" section.
3. Accessing the direct link `http://localhost:3000/yesyes/settings/projects/ff8c18d3-b17d-4251-95ce-c30f4c43e225/worklogs/` should now lead to a 404 page or redirect, confirming the route is successfully disabled.

### Automated Checks

1. Run ESLint: `pnpm check:lint`
2. Run Prettier check: `pnpm check:format`
3. Run test suites: `pnpm test` (or backend tests as appropriate)

---

## Risk Assessment

- **Risk**: A compile error or linting issue due to leftover references.
- **Mitigation**: Perform a full grep search for `worklogs` and `projectWorklog` to make sure all references are completely removed, and run `pnpm check:lint` before finalizing.

## TODO Checklist

- [x] Phase 1: Constants & Navigation Cleanup completed
- [x] Phase 2: Routing & Views Cleanup completed
- [x] Phase 3: Store, Service & Hook Cleanup completed
- [x] Run full workspace lint and format checks
- [x] Verify frontend build succeeds without type errors
