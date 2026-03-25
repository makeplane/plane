# Phase 2: Frontend — Daily Logtime Circular Progress Component

**Priority**: High | **Status**: Pending | **Effort**: Medium

## Overview

Create a modern circular progress ring component showing today's total logged time. Max = 12 hours (720 minutes). SVG-based, compact enough for the header (32x32px).

## Key Insights

- Header uses `size-5` icons (20px) and `size-8` containers (32px)
- Must match visual weight of InboxIcon and other header items
- Use SVG `stroke-dasharray` / `stroke-dashoffset` for circular progress — no external deps
- Color transitions: green (0-8h) → yellow (8-10h) → red (10-12h)

## Architecture

```
DailyLogtimeIndicator (ce/components/navigations/)
├── SWR fetch: GET /api/users/me/daily-worklog-total/
├── SVG circular progress ring (28px diameter)
├── Center text: "Xh" or "XhYm"
└── Tooltip: "Today: Xh Ym / 12h"
```

## Related Code Files

**Create:**
- `apps/web/ce/components/navigations/daily-logtime-indicator.tsx` — main component

**Create:**
- `apps/web/ce/services/worklog.service.ts` — new CE service with `getUserDailyTotal()` method

<!-- Updated: Validation Session 2 - CE pattern: create ce/services/worklog.service.ts, do NOT modify core/services/ -->

**Reference:**
- `apps/web/ce/components/navigations/top-navigation-root.tsx` — insertion point
- `@plane/propel/tooltip` — Tooltip component

## Type Definition

Add to `packages/types/src/worklog.ts`:
```typescript
export interface IUserDailyWorklogTotal {
  total_minutes: number;
  date: string;
}
```

## Implementation Steps

### 1. Create `apps/web/ce/services/worklog.service.ts`

<!-- Updated: Validation Session 1 - pass ?tz= query param with user's browser timezone -->
```typescript
async getUserDailyTotal(): Promise<IUserDailyWorklogTotal> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    this.get(`/api/users/me/daily-worklog-total/?tz=${encodeURIComponent(tz)}`) as Promise<{ data: IUserDailyWorklogTotal }>
  ).then(getData).catch((error) => { throw error?.response?.data; });
}
```

### 2. Add type to `packages/types/src/worklog.ts`

```typescript
export interface IUserDailyWorklogTotal {
  total_minutes: number;
  date: string;
}
```

### 3. Create `daily-logtime-indicator.tsx`

Component specs:
- **Size**: 28px SVG ring, fits in 32px container
- **Progress**: `stroke-dashoffset` based on `totalMinutes / 720`
- **Center text**: Hours only if >= 1h (e.g., "3h"), else minutes ("45m")
- **Colors**:
  - Track: `stroke-custom-border-200` (light gray)
  - Progress: green → amber → red based on percentage
- **Tooltip**: "Today: 3h 25m / 12h"
- **SWR key**: `USER_DAILY_WORKLOG_TOTAL`, refresh every 60s
- **Empty state**: Show "0h" with empty ring

SVG approach:
```tsx
<svg viewBox="0 0 36 36" className="size-7">
  {/* Background track */}
  <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
    className="stroke-custom-border-200" />
  {/* Progress arc */}
  <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
    strokeDasharray="97.4" strokeDashoffset={offset}
    strokeLinecap="round" transform="rotate(-90 18 18)"
    style={{ stroke: progressColor, transition: "stroke-dashoffset 0.5s ease" }} />
  {/* Center text */}
  <text x="18" y="18" textAnchor="middle" dominantBaseline="central"
    className="fill-custom-text-200 text-[8px] font-medium">
    {label}
  </text>
</svg>
```

## Todo

- [ ] Add `IUserDailyWorklogTotal` type
- [ ] Add `getUserDailyTotal()` to WorklogService
- [ ] Create `daily-logtime-indicator.tsx` component
- [ ] Test with 0, mid, max values

## Success Criteria

- Renders circular progress with correct percentage
- Shows time label in center
- Color changes based on hours logged
- Auto-refreshes every 60s via SWR
- Matches header visual style (compact, unobtrusive)
