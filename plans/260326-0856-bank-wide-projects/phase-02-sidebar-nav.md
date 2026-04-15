# Phase 2 — Sidebar Navigation Item

**Plan**: [plan.md](./plan.md)
**Depends on**: Phase 3 (route must exist before nav item is useful, but can be parallel)
**Status**: completed | **Effort**: 1h

## Context

Add "Bank-wide Projects" as a static sidebar item below "HO". Follows the exact same pattern as the HO menu implementation.

## Related Code Files

- `packages/constants/src/workspace.ts` — Static nav item definitions (lines 282-294)
- `apps/web/ce/components/workspace/sidebar/sidebar-item.tsx` — CE wrapper with HO guard (line 23)
- `apps/web/ce/components/workspace/sidebar/helper.tsx` — Icon switch (add new case)
- `packages/i18n/src/` — Translation keys (find en.json or similar)

## Implementation Steps

### 1. Add constant: `packages/constants/src/workspace.ts`

After the `ho` entry (~line 288), add:

```typescript
"bank-wide-projects": {
  key: "bank-wide-projects",
  labelTranslationKey: "bank_wide_projects.sidebar_label",
  href: `/bank-wide-projects/`,
  access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  highlight: (pathname: string, url: string) => pathname.includes(url),
},
```

In `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` (~line 291), add after `ho`:

```typescript
WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["bank-wide-projects"],
```

### 2. Add conditional guard: `apps/web/ce/components/workspace/sidebar/sidebar-item.tsx`

After the HO guard (line 23), add:

```typescript
if (item.key === "bank-wide-projects" && !currentWorkspace?.is_board_of_director_workspace) return null;
```

Also update `additionalStaticItems` prop:

```typescript
return <SidebarItemBase item={resolvedItem} additionalStaticItems={["ho", "bank-wide-projects"]} />;
```

### 3. Add icon: `apps/web/ce/components/workspace/sidebar/helper.tsx`

After the `ho` case:

```typescript
case "bank-wide-projects":
  return <Globe className={cn("size-4 flex-shrink-0", className)} />;
```

Add `Globe` to the lucide-react import at the top:

```typescript
import { Building2, Globe } from "lucide-react";
```

> Alternative icons: `LayoutGrid`, `Layers`, `Network` — pick what fits best visually.

### 4. Add translation key

Find the en.json (or equivalent) under `packages/i18n/src/` and add:

```json
"bank_wide_projects": {
  "sidebar_label": "Bank-wide Projects"
}
```

## Todo

- [ ] Add `bank-wide-projects` to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS` in constants
- [ ] Add to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` array
- [ ] Add guard in `ce/components/workspace/sidebar/sidebar-item.tsx`
- [ ] Update `additionalStaticItems` prop
- [ ] Add icon case in `helper.tsx`
- [ ] Add translation key to en.json

## Success Criteria

- Menu appears below HO when `is_board_of_director_workspace=true`
- Menu not visible in other workspaces
- Icon renders correctly
- Correct highlight state when on `/bank-wide-projects/` route

## Risk Assessment

- **Low** — direct pattern copy from HO
- Translation key must match exactly what `useTranslation` looks up
