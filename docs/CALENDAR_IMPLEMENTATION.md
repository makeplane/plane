# Calendar App Implementation Plan

## Overview

This document outlines the implementation path for adding a new **Calendar** app to Plane. The Calendar will be accessible via the App Rail (sidebar navigation) and at the route `/{workspaceSlug}/calendar`.

## Architecture Summary

Based on codebase analysis:

- **App Rail**: Defined in HOCs at `apps/web/ee/components/app-rail/app-rail-hoc.tsx`
- **Feature Flags**: Enum in `packages/constants/src/feature-flag.ts`, stores in `apps/web/ee/store/feature-flags/`
- **Routing**: React Router 7 file-based routing in `apps/web/app/routes/`
- **Workspace Paths**: Hook at `apps/web/core/hooks/use-workspace-paths.ts`

---

## Implementation Steps

### Step 1: Add Feature Flag

**File**: `packages/constants/src/feature-flag.ts`

Add new feature flag to the `E_FEATURE_FLAGS` enum:

```typescript
export enum E_FEATURE_FLAGS {
  // ... existing flags
  CALENDAR = "CALENDAR",
}
```

Optionally, map to a subscription plan if this is a paid feature:

```typescript
export const FEATURE_TO_BASE_PLAN_MAP = {
  // ... existing mappings
  [E_FEATURE_FLAGS.CALENDAR]: EProductSubscriptionEnum.PRO, // or BUSINESS, etc.
};
```

---

### Step 2: Add Calendar Path Detection

**File**: `apps/web/core/hooks/use-workspace-paths.ts`

Add path detection for the calendar route:

```typescript
export const useWorkspacePaths = () => {
  const pathname = usePathname();

  // ... existing path detections

  const isCalendarPath = pathname.includes("/calendar");

  return {
    // ... existing returns
    isCalendarPath,
  };
};
```

---

### Step 3: Update App Rail Helper

**File**: `apps/web/ee/helpers/app-rail.helper.ts`

Add calendar to the feature key mapping:

```typescript
const SidebarFeatureKeyToFeatureFlagMap: Record<string, E_FEATURE_FLAGS> = {
  // ... existing mappings
  wiki: E_FEATURE_FLAGS.WIKI,
  "pi-chat": E_FEATURE_FLAGS.AI_CHAT,
  calendar: E_FEATURE_FLAGS.CALENDAR,
};
```

Update `isAppRailFeatureEnabled()` function if needed to handle the calendar feature flag check.

---

### Step 4: Add Calendar to App Rail HOC

**File**: `apps/web/ee/components/app-rail/app-rail-hoc.tsx`

Add calendar dock item to the `dockItems` array:

```typescript
import { Calendar } from "lucide-react"; // or appropriate icon

const dockItems: TDockItem[] = [
  {
    label: "Projects",
    icon: <PlaneNewIcon className="size-5" />,
    href: `/${workspaceSlug}/`,
    isActive: isProjectPath,
    shouldRender: true,
  },
  {
    label: "Wiki",
    icon: <WikiIcon className="size-5" />,
    href: `/${workspaceSlug}/wiki`,
    isActive: isWikiPath,
    shouldRender: isAppRailFeatureEnabled("wiki"),
  },
  {
    label: "Calendar",
    icon: <Calendar className="size-5" />,
    href: `/${workspaceSlug}/calendar`,
    isActive: isCalendarPath,
    shouldRender: isAppRailFeatureEnabled("calendar"),
  },
  {
    label: "AI",
    icon: <PiIcon className="size-5" />,
    href: `/${workspaceSlug}/ai-chat`,
    isActive: isPiPath,
    shouldRender: isAppRailFeatureEnabled("pi-chat"),
  },
];
```

---

### Step 5: Create Calendar Route Structure

Create the following file structure:

```
apps/web/app/(all)/[workspaceSlug]/(calendar)/
├── layout.tsx          # Calendar app layout
└── calendar/
    └── page.tsx        # Calendar page component
```

**File**: `apps/web/app/(all)/[workspaceSlug]/(calendar)/layout.tsx`

```typescript
import { observer } from "mobx-react";
import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

const CalendarLayout = observer(({ params }: Route.ComponentProps) => {
  const { workspaceSlug } = params;

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Optional: Calendar-specific sidebar */}
      <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
        <Outlet />
      </main>
    </div>
  );
});

export default CalendarLayout;
```

**File**: `apps/web/app/(all)/[workspaceSlug]/(calendar)/calendar/page.tsx`

```typescript
import { observer } from "mobx-react";
import type { Route } from "./+types/page";

const CalendarPage = observer(({ params }: Route.ComponentProps) => {
  const { workspaceSlug } = params;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold text-custom-text-100">Calendar</h1>
      <p className="mt-2 text-custom-text-300">Workspace: {workspaceSlug}</p>
      {/* Calendar implementation will go here */}
    </div>
  );
});

export default CalendarPage;
```

---

### Step 6: Register Routes

**File**: `apps/web/app/routes/extended.ts`

Add calendar routes to the extended routes configuration:

```typescript
// Calendar routes
layout("./(all)/[workspaceSlug]/(calendar)/layout.tsx", [
  route(":workspaceSlug/calendar", "./(all)/[workspaceSlug]/(calendar)/calendar/page.tsx"),
]),
```

This should be added within the workspace layout children array, similar to how wiki and pi-chat routes are structured.

---

### Step 7: Backend Feature Flag (Optional)

If the calendar needs backend API protection:

**File**: `apps/api/plane/payment/flags/flag_decorator.py`

The existing `check_feature_flag` decorator can be used:

```python
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.utils.constants import FeatureFlag

class CalendarViewSet(BaseViewSet):
    @check_feature_flag(FeatureFlag.CALENDAR)
    def list(self, request, slug):
        # Calendar API logic
        pass
```

---

## File Changes Summary

| File                                                              | Change Type | Description                  |
| ----------------------------------------------------------------- | ----------- | ---------------------------- |
| `packages/constants/src/feature-flag.ts`                          | Modify      | Add `CALENDAR` to enum       |
| `apps/web/core/hooks/use-workspace-paths.ts`                      | Modify      | Add `isCalendarPath`         |
| `apps/web/ee/helpers/app-rail.helper.ts`                          | Modify      | Add calendar feature mapping |
| `apps/web/ee/components/app-rail/app-rail-hoc.tsx`                | Modify      | Add calendar dock item       |
| `apps/web/app/(all)/[workspaceSlug]/(calendar)/layout.tsx`        | Create      | Calendar layout              |
| `apps/web/app/(all)/[workspaceSlug]/(calendar)/calendar/page.tsx` | Create      | Calendar page                |
| `apps/web/app/routes/extended.ts`                                 | Modify      | Register calendar routes     |

---

## Testing Checklist

- [ ] Feature flag `CALENDAR` is recognized by the system
- [ ] Calendar icon appears in App Rail when feature is enabled
- [ ] Calendar icon is hidden when feature is disabled
- [ ] Navigating to `/{workspaceSlug}/calendar` renders the calendar page
- [ ] App Rail highlights Calendar when on calendar route
- [ ] Calendar route is protected by workspace authentication
- [ ] Navigation between Calendar and other apps works correctly

---

## Notes

1. **Icon Selection**: Using `lucide-react` Calendar icon. Consider creating a custom icon in `packages/ui/src/icons/` if needed.

2. **Feature Flag Default**: New feature flags typically default to `false`. Enable via the feature flag server or instance settings.

3. **Subscription Gating**: If Calendar is an EE-only feature, ensure the `FEATURE_TO_BASE_PLAN_MAP` mapping is correct.

4. **Route Ordering**: The calendar dock item position in the array determines its order in the App Rail.

5. **CE/EE Split**: Since this uses feature flags and is in the extended routes, it will only be available in Enterprise Edition. For CE, add to `apps/web/ce/components/app-rail/app-rail-hoc.tsx` if needed.
