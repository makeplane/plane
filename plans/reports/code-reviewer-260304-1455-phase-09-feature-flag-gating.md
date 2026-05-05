# Code Review: Phase 09 — Feature Flag Gating (Time Tracking)

**Date:** 2026-03-04
**Branch:** develop
**Scope:** 8 files changed — type, sidebar nav, route layout, issue sidebar, peek overview, activity root, i18n (EN/VI/KO), constants, settings type, icons

---

## Overall Assessment

Implementation is coherent and follows established patterns (Cycles/Modules). All gating points are covered: sidebar nav, route layout, issue sidebar, peek overview, and activity log button. No critical security issues. Two medium-priority bugs and one low-priority inconsistency.

---

## Critical Issues

None.

---

## High Priority

### 1. Route layout guard fires on `undefined` — flash risk during initial load

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/layout.tsx` line 50

```ts
if (currentProjectDetails?.is_time_tracking_enabled === false)
```

When the page first loads, `currentProjectDetails` is `undefined` (data not yet fetched). The guard correctly skips rendering (because `undefined === false` is `false`), so the layout renders. But if the project data arrives and the feature is disabled, there will be a flash of the full layout before the empty state replaces it.

Compare: `cycles/(list)/page.tsx` uses the same pattern but also has a `loader` check (`if (loader) return <CycleModuleListLayoutLoader />`) after the feature flag guard. The time-tracking layout has no loader guard, so users on slow connections may see the full tabbed UI briefly before it collapses into the empty state.

**Fix:** Add a loader/skeleton guard before the feature flag check:

```ts
const { currentProjectDetails, loader } = useProject();
if (loader) return <LayoutLoader />;
if (currentProjectDetails?.is_time_tracking_enabled === false) return <...EmptyState />;
```

---

## Medium Priority

### 2. Inconsistent guard expression in sidebar vs. layout

**Sidebar nav** (`project-navigation-root.tsx`):

```ts
shouldRender: !!project?.is_time_tracking_enabled;
```

Treats `undefined` as disabled — menu item hidden while project data loads.

**Issue sidebar / peek overview** (`sidebar.tsx`, `properties.tsx`):

```ts
{projectDetails?.is_time_tracking_enabled !== false && ( ... )}
```

Treats `undefined` as enabled — worklog property shows while project data loads.

**Activity root** (`root.tsx`):

```ts
const isTimeTrackingEnabled = project?.is_time_tracking_enabled !== false;
```

Same as above — "enabled by default" when `undefined`.

These two patterns give opposite behaviors during loading. The `!== false` style is semantically correct for inline properties (show by default until confirmed disabled) but differs from the sidebar's stricter `!!` check. This inconsistency is not a runtime bug, but it can cause the sidebar item to disappear while project data loads, making the nav flicker.

**Recommendation:** Pick one semantic and apply it consistently. The `!== false` style ("enabled unless explicitly disabled") matches the backend model's `default=True`, so prefer it everywhere:

```ts
// sidebar: should match the same "show unless disabled" semantics
shouldRender: project?.is_time_tracking_enabled !== false,
```

### 3. `useNavigate` imported but used only for tab switching — `useAppRouter` imported just for the empty state redirect

**File:** `layout.tsx` lines 7, 21, 35–36

Both `useNavigate` (from react-router, for tab navigation) and `useAppRouter` (for the empty-state `router.push`) are imported and used. This is not wrong — the pattern is fine — but it is worth noting that the empty-state redirect URL goes to `/settings/projects/${projectId}/features` (without `/time-tracking` suffix), landing the user on the generic features page, not directly on the time-tracking toggle. Cycles does the same (`/features`), so this is consistent behavior, not a bug. Just noting it.

---

## Low Priority

### 4. `assetPath` not provided to `DetailedEmptyState` in layout

**File:** `layout.tsx` lines 52–64

The `DetailedEmptyState` component accepts an optional `assetPath` for an illustration image. All existing uses (cycles, modules, pages, views, intake) pass a theme-resolved image asset. The time-tracking guard omits it, resulting in a text-only empty state with no illustration.

```tsx
// cycles pattern includes:
const resolvedEmptyState = resolvedTheme === "light" ? lightEmptyState : darkEmptyState;
<DetailedEmptyState assetPath={resolvedEmptyState} ... />
```

Since the field is optional (line 27 of `detailed-empty-state-root.tsx`: `assetPath?: string`) this is not a bug, but the UI will look inconsistent with peer feature pages. Add a time-tracking illustration asset and pass it.

---

## Positive Observations

- `IPartialProject` is the correct interface to extend — `is_time_tracking_enabled` belongs there alongside `cycle_view`, `module_view`, etc.
- `TProjectSettingsTabs` union type updated in sync with the constant map — no stranded keys.
- `PROJECT_SETTINGS_ICONS` extended with the new tabs — sidebar icons will render correctly.
- `project_settings.worklogs.label` and `project_settings.features.time_tracking.short_title` i18n keys exist and match what the constants reference.
- `disabled_project.empty_state.time_tracking` strings follow the exact shape of existing peers (inbox/cycle/module/page/view) with title + description + primary_button.text only.
- All three locales (EN/VI/KO) are in sync — no missing keys.
- Activity root is `observer()`-wrapped and uses `getProjectById` correctly; no reactivity issues.
- `canManageFeatures` uses `EUserProjectRoles.ADMIN` — correct; matches cycles' `hasAdminLevelPermission`.
- `fetchAllWorkspaces` in admin store is a clean pagination loop — unrelated to this phase but no issues.

---

## Recommended Actions

1. **[High]** Add a loader/skeleton guard in `time-tracking/layout.tsx` before the feature flag check to prevent flash-of-content on slow loads.
2. **[Medium]** Align sidebar `shouldRender` to use `project?.is_time_tracking_enabled !== false` for consistent "enabled by default" semantics with the rest of the guards.
3. **[Low]** Add a theme-resolved `assetPath` illustration to the `DetailedEmptyState` in the layout, matching cycles/modules pattern.

---

## Unresolved Questions

- Is there a time-tracking illustration asset available in the static assets already, or does one need to be added? (Affects item 3 above.)
- The backend model has `default=True`, which means existing projects without the field set will have it enabled. Confirm the API serializer always returns `is_time_tracking_enabled` in the project payload so the frontend never sees `undefined` for existing projects.
