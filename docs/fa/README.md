# Plane-FA: Persian (Jalali) Calendar Support

This folder contains documentation for all Farsi/Persian localization features added to the Plane-FA fork.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Files Modified](#files-modified)
- [How to Add New Features](#how-to-add-new-features)

---

## Overview

Plane-FA extends the upstream Plane project with full Jalali (Shamsi/Persian) calendar support. The key design principles are:

1. **Internal dates stay Gregorian**: All API payloads, database storage, and `Date` objects remain in Gregorian format. Only the display layer changes.
2. **Calendar system ≠ UI language**: Selecting Jalali calendar does not change the UI language. In English mode, Jalali month names display in English ("Farvardin", not "فروردین").
3. **All custom code is marked**: Every FA customization is tagged with `// [FA-CUSTOM]` comments for easy identification and upstream merge conflict resolution.
4. **Settings-driven**: Users choose their calendar system in Profile → Preferences → Calendar System.

---

## Features

### 1. Jalali Calendar System Setting

Users can switch between Gregorian and Jalali calendar systems in their profile preferences.

- **Setting location**: Profile → Preferences → Calendar System
- **Stored in**: `user.profile.calendar_system` (`"gregorian"` | `"jalali"`)
- **API field**: `calendar_system` on the user profile model
- **Migration**: `0121_profile_calendar_system.py`

### 2. Shamsi Date Picker

A custom date picker component based on `react-multi-date-picker` with the `persian` calendar and `persian_en` (English) locale.

- **Component**: [`apps/web/core/components/fa/shamsi-calendar.tsx`](../../apps/web/core/components/fa/shamsi-calendar.tsx)
- **CSS**: [`apps/web/core/components/fa/shamsi-calendar.css`](../../apps/web/core/components/fa/shamsi-calendar.css)
- **Used in**: Date dropdowns, date filter modals
- **Locale**: `persian_en` — Jalali calendar with English month names

### 3. Gantt Chart: Jalali Day Numbers

In Jalali mode, the Gantt chart header shows Jalali day numbers instead of Gregorian.

- **Week view**: Shows Jalali day number (e.g., "6" for 6 Esfand, not "24")
- **Month view**: Week range shows Jalali start/end day numbers

### 4. Calendar View: Full Jalali Support

The issue calendar layout (month/week views) fully supports Jalali mode:

- **Day tiles**: Show Jalali day numbers
- **Month header**: Shows Jalali month name + Jalali year (e.g., "Esfand 1404")
- **Month picker**: Shows Jalali months for selection
- **Navigation**: Previous/Next buttons navigate Jalali months correctly
- **Today**: Jumps to current Jalali month/week
- **Mobile view**: Shows Jalali date

---

## Architecture

### Key Utility: `getCalendarSystem()`

```typescript
import { getCalendarSystem } from "@plane/utils";
// Returns "gregorian" | "jalali"
const isJalali = getCalendarSystem() === "jalali";
```

This module-level function reads the calendar system preference synchronously. Use it anywhere display logic branches between Gregorian and Jalali.

**Implementation**: [`packages/utils/src/calendar.ts`](../../packages/utils/src/calendar.ts)

### Hook: `useCalendarSystem()`

```typescript
import { useCalendarSystem } from "@/hooks/fa/use-calendar-system";
const { isJalali } = useCalendarSystem();
```

A React hook version for components that need to react to calendar system changes via MobX.

**Implementation**: [`apps/web/core/hooks/fa/use-calendar-system.ts`](../../apps/web/core/hooks/fa/use-calendar-system.ts)

### Calendar Data Generation

The `generateCalendarData()` utility automatically generates either Gregorian or Jalali calendar data based on the user's setting.

**Implementation**: [`packages/utils/src/datetime.ts`](../../packages/utils/src/datetime.ts)

### Jalali Date Functions

All Jalali date calculations use `date-fns-jalali`, a drop-in replacement for `date-fns` with Jalali calendar support:

```typescript
import {
  getYear,
  getMonth,
  getDate,
  startOfMonth,
  addMonths,
  subMonths,
  addYears,
  subYears,
  setMonth,
} from "date-fns-jalali";
```

### Month Name Constants

```typescript
// Gregorian (existing)
import { MONTHS_LIST } from "@/constants/calendar";

// Jalali (added by FA)
import { JALALI_MONTHS_LIST } from "@/constants/calendar";
// Keys: 1=Farvardin, 2=Ordibehesht, ... 12=Esfand
```

---

## Files Modified

### Backend (API)

| File                                                           | Change                                             |
| -------------------------------------------------------------- | -------------------------------------------------- |
| `apps/api/plane/db/models/user.py`                             | Added `calendar_system` field to UserProfile model |
| `apps/api/plane/db/migrations/0121_profile_calendar_system.py` | Migration for calendar_system field                |
| `apps/api/plane/settings/storage.py`                           | Storage settings update                            |

### Packages

| File                             | Change                                         |
| -------------------------------- | ---------------------------------------------- |
| `packages/types/src/users.ts`    | Added `calendar_system` to `IUserProfile` type |
| `packages/utils/src/calendar.ts` | Added `getCalendarSystem()` utility            |
| `packages/utils/src/datetime.ts` | Jalali-aware `generateCalendarData()`          |

### Web App — New Files

| File                                              | Description                               |
| ------------------------------------------------- | ----------------------------------------- |
| `apps/web/core/components/fa/shamsi-calendar.tsx` | Shamsi date picker component              |
| `apps/web/core/components/fa/shamsi-calendar.css` | Styles for date picker                    |
| `apps/web/core/hooks/fa/use-calendar-system.ts`   | React hook for calendar system            |
| `apps/web/app/types/react-multi-date-picker.d.ts` | Type declarations for date picker library |

### Web App — Modified Files

| File                                                                                                 | Change                                       |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `apps/web/core/constants/calendar.ts`                                                                | Added `JALALI_MONTHS_LIST` constant          |
| `apps/web/core/store/user/profile.store.ts`                                                          | Handle `calendar_system` in profile store    |
| `apps/web/core/lib/wrappers/store-wrapper.tsx`                                                       | Initialize calendar system from user profile |
| `apps/web/core/components/settings/profile/content/pages/preferences/language-and-timezone-list.tsx` | Calendar system setting UI                   |
| `apps/web/core/components/dropdowns/date.tsx`                                                        | Use Shamsi date picker when in Jalali mode   |
| `apps/web/core/components/dropdowns/date-range.tsx`                                                  | Use Shamsi date picker for date ranges       |
| `apps/web/core/components/core/filters/date-filter-modal.tsx`                                        | Jalali-aware filter dates                    |
| `apps/web/styles/globals.css`                                                                        | Import shamsi-calendar.css                   |

### Gantt Chart

| File                                                         | Change                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `apps/web/core/components/gantt-chart/data/index.ts`         | Jalali month/quarter names in English                      |
| `apps/web/core/components/gantt-chart/views/week-view.ts`    | Added `dayNumber`, `startDayNumber`, `endDayNumber` fields |
| `apps/web/core/components/gantt-chart/views/month-view.ts`   | Jalali month blocks                                        |
| `apps/web/core/components/gantt-chart/views/quarter-view.ts` | Jalali quarter view                                        |
| `apps/web/core/components/gantt-chart/chart/views/week.tsx`  | Use `dayNumber` instead of `getDate()`                     |
| `apps/web/core/components/gantt-chart/chart/views/month.tsx` | Use `startDayNumber`/`endDayNumber`                        |

### Calendar View (Issue Layouts)

| File                                                                                   | Change                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/web/core/store/issue/issue_calendar_view.store.ts`                               | Jalali-aware payload lookup + calendar_system reaction |
| `apps/web/core/components/issues/issue-layouts/calendar/calendar.tsx`                  | Jalali mobile date display                             |
| `apps/web/core/components/issues/issue-layouts/calendar/day-tile.tsx`                  | Jalali day numbers                                     |
| `apps/web/core/components/issues/issue-layouts/calendar/header.tsx`                    | Jalali month navigation                                |
| `apps/web/core/components/issues/issue-layouts/calendar/dropdowns/months-dropdown.tsx` | Jalali month picker + header                           |

### Space App

| File                                     | Change                           |
| ---------------------------------------- | -------------------------------- |
| `apps/space/helpers/date-time.helper.ts` | Jalali date helpers              |
| `apps/space/package.json`                | Added date-fns-jalali dependency |

---

## How to Add New Features

### Pattern: Display-only Jalali

```typescript
import { getCalendarSystem } from "@plane/utils";
import { getYear, getMonth, getDate } from "date-fns-jalali";

const isJalali = getCalendarSystem() === "jalali";

// Display year
const year = isJalali ? getYear(date) : date.getFullYear();

// Display month name
import { MONTHS_LIST, JALALI_MONTHS_LIST } from "@/constants/calendar";
const monthList = isJalali ? JALALI_MONTHS_LIST : MONTHS_LIST;
const monthName = monthList[month + 1].title; // month is 0-indexed
```

### Pattern: Jalali Month Navigation

```typescript
import { addMonths, subMonths } from "date-fns-jalali";

// Navigate to next/previous month (returns Gregorian Date object)
const nextMonth = isJalali ? addMonths(currentDate, 1) : new Date(y, m + 1, 1);
```

### Pattern: React with Calendar Changes (MobX)

```typescript
import { reaction } from "mobx";

// In MobX store constructor:
reaction(
  () => this.rootStore.user.userProfile.data?.calendar_system,
  () => {
    this.regenerateData(); // Re-render when calendar system changes
  }
);
```

### Code Convention

- Always add `// [FA-CUSTOM]` comment on FA-specific lines/blocks
- Never change internal date storage format (always Gregorian `Date` objects)
- Test both Gregorian and Jalali modes after any calendar-related changes

---

## Verification Checklist

When testing Jalali calendar support:

- [ ] **Profile settings**: Profile → Preferences → Calendar System → "Jalali" saves correctly
- [ ] **Date picker**: Shows Jalali calendar with English month names ("Farvardin" not "فروردین")
- [ ] **Date range picker**: Shows Jalali calendar for both start and end dates
- [ ] **Gantt week view**: Day numbers in header show Jalali day (e.g., "6" for 6 Esfand)
- [ ] **Gantt month view**: Week ranges show Jalali day numbers
- [ ] **Calendar month view**: Grid shows Jalali day numbers, header shows "Esfand 1404"
- [ ] **Calendar month navigation**: Prev/Next buttons navigate Jalali months
- [ ] **Calendar month picker**: Month popup shows Jalali months
- [ ] **Calendar week view**: Week header shows correct Jalali date range
- [ ] **Calendar today**: Clicking "Today" jumps to current Jalali month
- [ ] **Switch back**: Setting to "Gregorian" reverts everything immediately
- [ ] **API payloads**: Network tab → all dates remain `yyyy-MM-dd` Gregorian format

---

## Dependencies

- `date-fns-jalali`: Jalali calendar arithmetic (same API as `date-fns`)
- `react-multi-date-picker`: Date picker with multi-calendar support
- `react-date-object`: Calendar system definitions (used by react-multi-date-picker)
