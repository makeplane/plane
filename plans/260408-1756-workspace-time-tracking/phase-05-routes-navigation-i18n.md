# Phase 05 — Routes, Navigation, i18n

## Context Links

- Extended routes: `apps/web/app/routes/extended.ts`
- Sidebar constants: `packages/constants/src/workspace.ts`
- Sidebar icon helper: `apps/web/ce/components/workspace/sidebar/helper.tsx`
- Extended sidebar: `apps/web/app/(all)/[workspaceSlug]/(projects)/extended-sidebar.tsx`
- i18n en: `packages/i18n/src/locales/en/translations.ts`
- i18n ko: `packages/i18n/src/locales/ko/translations.ts`
- i18n vi: `packages/i18n/src/locales/vi/translations.ts`

## Overview

- **Priority**: P1
- **Status**: Pending
- **Description**: Register workspace time-tracking routes in `extended.ts`, add sidebar nav entry, add i18n keys.

## Key Insights

- Routes must nest inside `(projects)/layout.tsx` wrapper (provides sidebar shell)
- Sidebar uses `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS` record + `_LINKS` array
- Icon mapping is in CE `helper.tsx` via switch statement
- Extended sidebar reads from `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS`

## Related Code Files

### Modify

- `apps/web/app/routes/extended.ts` — add 3 routes
- `packages/constants/src/workspace.ts` — add `time-tracking` to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS` + `_LINKS`
- `apps/web/ce/components/workspace/sidebar/helper.tsx` — add Timer icon case
- `packages/i18n/src/locales/en/translations.ts` — add keys
- `packages/i18n/src/locales/ko/translations.ts` — add keys
- `packages/i18n/src/locales/vi/translations.ts` — add keys

## Implementation Steps

### 1. Routes (`extended.ts`)

Add inside the existing `layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [...])` block:

```typescript
layout("./(all)/[workspaceSlug]/(projects)/time-tracking/layout.tsx", [
  route("time-tracking", "./(all)/[workspaceSlug]/(projects)/time-tracking/page.tsx"),
  route(
    "time-tracking/analytics",
    "./(all)/[workspaceSlug]/(projects)/time-tracking/analytics/page.tsx"
  ),
  route(
    "time-tracking/capacity",
    "./(all)/[workspaceSlug]/(projects)/time-tracking/capacity/page.tsx"
  ),
]),
```

**NOTE:** Use `"time-tracking"` NOT `":workspaceSlug/time-tracking"` — the parent layout already provides `workspaceSlug` (fixes RT-1).

This nests inside `(all)/layout.tsx` > `[workspaceSlug]/layout.tsx` > `(projects)/layout.tsx` — same as `bank-wide-projects`.

### 2. Sidebar nav constant (`workspace.ts`)

Add to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`:

```typescript
"time-tracking": {
  key: "time-tracking",
  labelTranslationKey: "time_tracking",
  href: `/${workspaceSlug}/time-tracking/`,  // Absolute path (fixes RT-19)
  access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  highlight: (pathname: string, url: string) => pathname.startsWith(url + "/"),  // Segment-boundary matching (fixes RT-18)
},
```

Add to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` array:

```typescript
WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["time-tracking"],
```

### 3. Sidebar icon (`helper.tsx`)

Add case before the closing of the switch:

```typescript
case "time-tracking":
  return <Timer className={cn("size-4 flex-shrink-0", className)} />;
```

Import `Timer` from `lucide-react` (already imported in project header, not yet in helper).

### 4. i18n keys

Add to all 3 translation files (en as source, ko/vi use English placeholders):

```typescript
// Keys to add (flat, near existing time_tracking key)
workspace_analytics: "Workspace Analytics",
workspace_time_tracking: "Time Tracking",  // sidebar label (reuse time_tracking if it exists)
```

Check if `time_tracking` key already exists — if yes, reuse it for sidebar `labelTranslationKey`. Only add `workspace_analytics` if needed for the analytics tab title.

## Todo List

- [ ] Add 3 workspace time-tracking routes to `extended.ts`
- [ ] Add `time-tracking` entry to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`
- [ ] Add to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` array
- [ ] Add `Timer` icon case to `helper.tsx`
- [ ] Add i18n keys to en/ko/vi translations
- [ ] Run `pnpm check:lint` to verify no import/route errors

## Success Criteria

- `/:ws/time-tracking/` accessible and renders layout
- `/:ws/time-tracking/analytics` and `/capacity` routes work
- Sidebar shows "Time Tracking" with Timer icon
- Clicking sidebar item navigates to `/:ws/time-tracking/`
- All text uses `t()` — no hardcoded strings

## Risk Assessment

- **Medium**: Route path `/time-tracking/` might conflict with future top-level routes — mitigated by using `RESTRICTED_URLS` check (already doesn't include `time-tracking`)
- **Low**: Sidebar ordering — new item appears at bottom by default, users can reorder via drag
- **Low**: `highlight` function uses `pathname.includes(url)` — `/time-tracking/` is specific enough to avoid false positives with other routes

---

## Red Team Findings — Phase 05

### Finding RT-1 (Critical): Route path `:workspaceSlug/time-tracking` — DOUBLE-SLUG BUG

- **Severity:** Critical
- **Location:** Phase 05, section "Routes (`extended.ts`)"
- **Flaw:** `route(":workspaceSlug/time-tracking", ...)` nested inside `layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [...])` causes URL `/:ws/:ws/time-tracking` — never matches. React Router v7 forbids re-defining captured params in child routes.
- **Fix:** Change ALL three route definitions from `":workspaceSlug/time-tracking"` to `"time-tracking"`.
- **Status:** Apply in Phase 05 — this is the single most breaking bug in the plan.

### Finding RT-18 (Medium): `highlight` false positives — `pathname.includes(url)`

- **Severity:** Medium
- **Location:** Phase 05, sidebar nav constant `highlight` function
- **Flaw:** `pathname.includes("/time-tracking/")` matches any path containing the string — e.g., `/settings/time-tracking-integrations/`. Future routes with similar names cause incorrect active state.
- **Fix:** Use `pathname.startsWith(url + "/")` or segment-boundary matching. At minimum use `startsWith` not `includes`.
- **Status:** Apply in Phase 05.

### Finding RT-19 (Medium): Sidebar `href` is relative — workspace prefix may be missing

- **Severity:** Medium
- **Location:** Phase 05, sidebar nav constant `href`
- **Flaw:** `href: "/time-tracking/"` is relative. When sidebar renders at `/:ws/projects/P1/issues`, clicking it navigates to `/:ws/projects/P1/time-tracking` (404).
- **Fix:** Verify how other sidebar nav items construct hrefs. If they use absolute paths with workspace prefix, match that pattern. If the sidebar shell auto-prepends workspaceSlug, document it.
- **Status:** Verify in Phase 05 — compare with existing sidebar nav item href patterns.
