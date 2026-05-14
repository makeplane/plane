# Frontend Integration Research — Capacity Detailed Export

**Date:** 2026-05-12  
**Scope:** FE wiring for split-button dropdown, service layer, toast + i18n, notifications, store integration.

---

## 1. Split-Button Dropdown Pattern — Menu + Primary Button

**Finding:** No true split-button component exists in codebase. Propel `Menu` is the pattern to use.

### Propel Menu Structure

- **Location:** `packages/propel/src/menu/menu.tsx`
- **Export:** `@plane/propel/menu` (subpath import)
- **Pattern:** Menu has a `customButton` prop accepting React elements

### Recommended Pattern for Capacity Export

```tsx
import { Menu } from "@plane/propel/menu";
import { Button } from "@plane/propel/button";
import { ChevronDown } from "lucide-react";

<Menu
  customButton={
    <div className="flex items-center gap-0">
      <Button variant="primary" size="sm" className="rounded-r-none">
        {t("export")}
      </Button>
      <Button variant="primary" size="sm" className="rounded-l-none px-2" icon={ChevronDown} />
    </div>
  }
  maxHeight="sm"
  noBorder
>
  <Menu.Item onClick={handleCapacitySummaryExport}>
    <div>
      <h5>{t("capacity.export.summary")}</h5>
      <p className="text-12 text-tertiary">{t("capacity.export.summary_desc")}</p>
    </div>
  </Menu.Item>
  <Menu.Item onClick={handleDetailedReportExport} disabled={isCrossWorkspace || !canExport}>
    <div>
      <h5>{t("capacity.export.detailed")}</h5>
      <p className="text-12 text-tertiary">{t("capacity.export.detailed_desc")}</p>
    </div>
  </Menu.Item>
</Menu>;
```

**Files for Reference:**

- `apps/web/core/components/cycles/quick-actions.tsx:142–182` — uses CustomMenu with MenuItem pattern
- `packages/propel/src/menu/menu.tsx` — Menu component implementation

**Rules:**

- Menu has `disabled` prop on individual items
- `menuItemsClassName` controls popup styling
- `noBorder` removes border; set `maxHeight` to control scrolling
- Import as `@plane/propel/menu`, NOT barrel

---

## 2. Capacity Dashboard Wiring

**Current Component:** `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx`

### Filter State (lines 42–53)

```tsx
const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
  from: undefined,
  to: undefined,
});
const [isCrossWorkspace, setIsCrossWorkspace] = useState(false);

const dateFrom = dateRange.from ? renderFormattedPayloadDate(dateRange.from) || "" : "";
const dateTo = dateRange.to ? renderFormattedPayloadDate(dateRange.to) || "" : "";
```

### Current Export Handler (lines 87–108)

```tsx
const handleExport = () => {
  if (!capacityData) return;
  const csvConfig = mkConfig({...});
  const exportData = capacityData.members.map((member) => ({...}));
  const csv = generateCsv(csvConfig)(exportData);
  download(csvConfig)(csv);
};
```

### Where to Add Menu

**Line 203–210:** Replace single button with Menu split-button. Reuse `dateFrom`, `dateTo`, `selectedMembers`, `isCrossWorkspace` directly.

### Payload Shape for API POST

```tsx
const exportPayload = {
  date_from: dateFrom,
  date_to: dateTo,
  member_ids: selectedMembers.length > 0 ? selectedMembers : null,
  cross_workspace: isCrossWorkspace,
  format: "xlsx", // backend choice
};
```

### Cross-Workspace Disable Logic

**Current:** Heatmap uses `isCrossWorkspace` prop (line 230).  
**For Export:** Disable detailed export when `isCrossWorkspace === true` (tooltip: "Cross-workspace mode not supported for detailed reports").

---

## 3. Service Layer for Capacity Exports

### Architecture Pattern

**File:** `apps/web/ce/services/project-worklog.service.ts` (existing CE service pattern)

**Service Class Structure:**

```typescript
import { APIService } from "@/services/api.service";
import { API_BASE_URL } from "@plane/constants";

export class CECapacityExportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async initiateDetailedExport(
    workspaceSlug: string,
    payload: {
      date_from: string;
      date_to: string;
      member_ids?: string[] | null;
      cross_workspace: boolean;
    }
  ): Promise<{ job_id: string; message: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/capacity/exports/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getExportHistory(workspaceSlug: string): Promise<ICapacityExportJob[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/capacity/exports/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

**File Location:** `apps/web/ce/services/capacity-export.service.ts`

### Comparison: Existing CE Service

- `apps/web/ce/services/project-worklog.service.ts:36–47` — `triggerExport()` method
  - Returns `{ message, export_id }`
  - Uses POST to similar endpoint pattern
  - Same error handling pattern with `.catch((err) => { throw err?.response?.data; })`

---

## 4. Toast + i18n Usage Pattern

### Current Implementation in Capacity Dashboard

- **i18n:** `useTranslation()` imported (line 9)
- **Toast:** NOT yet used in this component (but needed for export feedback)

### Toast Import & Usage

```typescript
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";

const { t } = useTranslation();

// On successful POST (202 Accepted)
setToast({
  type: TOAST_TYPE.INFO,
  title: t("capacity.export.queued_title"),
  message: t("capacity.export.queued_message"),
});

// On error
setToast({
  type: TOAST_TYPE.ERROR,
  title: t("capacity.export.failed_title"),
  message: t("capacity.export.failed_message"),
});
```

### i18n Namespace & Keys to Add

**Path:** `packages/i18n/src/locales/en/translations.ts`

Add under existing `capacity` object:

```typescript
capacity: {
  // ... existing keys (lines 410–440)
  export: {
    menu: "Export",
    summary: "Capacity summary",
    summary_desc: "CSV with member × daily totals",
    detailed: "Detailed work-item report",
    detailed_desc: "XLSX with per-entry breakdown",
    queued_title: "Export queued",
    queued_message: "We'll email you when ready",
    failed_title: "Export failed",
    failed_message: "Please try again",
    cross_workspace_disabled: "Not available in cross-workspace mode",
    col: {
      member: "Member",
      date: "Date",
      main_category: "Main Category",
      sub_category: "Sub Category",
      work_item: "Work Item",
      time_spent_hours: "Time Spent (h)",
    },
  },
}
```

**Same keys needed in:** `ko/translations.ts`, `vi/translations.ts` (can use English as placeholder for now).

**Reference:** Line 410–440 in `en/translations.ts` shows existing capacity namespace structure.

---

## 5. In-App Notification Inbox

### Notification Store Structure

**Location:** `apps/web/core/store/notifications/notification.ts` (lines 1–100)

**Notification Model:**

```typescript
interface INotification {
  id: string;
  title?: string;
  entity_identifier?: string;
  entity_name?: string;
  message_html?: string;
  triggered_by?: string;
  triggered_by_details?: IUserLite;
  read_at?: string;
  archived_at?: string;
  snoozed_till?: string;
  workspace: string;
  project?: string;
  created_at: string;
  updated_at: string;
}
```

### Notification UI Display

**Location:** `apps/web/core/components/workspace-notifications/sidebar/root.tsx`

- Displayed in right sidebar (width controlled by `w-3/12` on line 62)
- Uses tabs (NOTIFICATION_TABS from @plane/constants)
- Store: `useWorkspaceNotifications()` hook (line 19)
- Tracks `currentSelectedNotificationId`, `unreadNotificationsCount`, `notificationIdsByWorkspaceId`

### Backend Notification Creation (Reference)

When capacity export is ready (Celery task completes):

1. Create `Notification` model with:
   - `title` = "Capacity export ready"
   - `entity_identifier` = `capacity_export`
   - `message_html` = HTML with download link + expiry
   - `triggered_by` = workspace admin / system user
   - `workspace` = current workspace
   - `receiver` = requester user

2. Signal via WebSocket (if configured) to trigger UI refresh
3. Notification appears in sidebar automatically via MobX store reactivity

**No FE code required for basic in-app notification** — backend creates, store syncs, UI renders.

---

## 6. "My Exports" List UI — Layout & Routing

### Directory Structure for New Page

```
apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/
├── exports/
│   ├── layout.tsx          ← new
│   └── page.tsx            ← new ("My exports" list)
```

### Routing Integration

**File:** `apps/web/app/routes/extended.ts` (CE routes only, never modify core.ts)

```typescript
route(":workspaceSlug/time-tracking/exports", "./(all)/[workspaceSlug]/(projects)/time-tracking/exports/page.tsx");
```

### Tab Navigation (Current Pattern)

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/layout.tsx:23–26`

Current tabs:

```typescript
const ALL_TAB_ITEMS = [
  { key: "my_timesheet", labelKey: "my_timesheet", path: "", icon: User, adminOnly: false },
  { key: "analytics", labelKey: "project_analytics", path: "analytics", icon: BarChart2, adminOnly: true },
  { key: "capacity", labelKey: "capacity", path: "capacity", icon: Users, adminOnly: true },
];
```

**To Add "My Exports":**

```typescript
{ key: "exports", labelKey: "capacity.exports", path: "exports", icon: Download, adminOnly: true }
```

### Page Layout Pattern

Reuse from `/capacity/page.tsx`:

```typescript
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";

export default function ExportsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHead title={t("capacity.exports")} />
      <div className="h-full w-full">{/* Exports table/list here */}</div>
    </>
  );
}
```

**Header:** Reuse `WorkspaceTimeTrackingHeader` from parent layout (line 50).

---

## 7. MobX Store Integration — Capacity Export Slice

### Location

**File:** `apps/web/ce/store/worklog.store.ts` (extends CEWorklogStore)

### Store Structure to Add

```typescript
export interface ICEWorklogStore extends IWorklogStore {
  // ... existing analytics fields

  // Capacity exports
  exportJobs: Record<string, ICapacityExportJob>;
  isExportJobsLoading: boolean;

  // Actions
  initiateDetailedExport(
    workspaceSlug: string,
    payload: { date_from; date_to; member_ids?; cross_workspace }
  ): Promise<void>;
  fetchExportHistory(workspaceSlug: string): Promise<void>;
}
```

### Store Class Implementation

```typescript
export class CEWorklogStore extends WorklogStore implements ICEWorklogStore {
  exportJobs: Record<string, ICapacityExportJob> = {};
  isExportJobsLoading = false;
  private exportService = new CECapacityExportService();

  constructor() {
    super();
    makeObservable(this, {
      exportJobs: observable,
      isExportJobsLoading: observable,
      initiateDetailedExport: action,
      fetchExportHistory: action,
    });
  }

  initiateDetailedExport = async (
    workspaceSlug: string,
    payload: { date_from; date_to; member_ids?; cross_workspace }
  ) => {
    try {
      const response = await this.exportService.initiateDetailedExport(workspaceSlug, payload);
      runInAction(() => {
        // Store job_id for tracking or optional polling
      });
    } catch (error) {
      throw error;
    }
  };

  fetchExportHistory = async (workspaceSlug: string) => {
    this.isExportJobsLoading = true;
    try {
      const jobs = await this.exportService.getExportHistory(workspaceSlug);
      runInAction(() => {
        jobs.forEach((job) => set(this.exportJobs, job.id, job));
      });
    } finally {
      runInAction(() => {
        this.isExportJobsLoading = false;
      });
    }
  };
}
```

### Hook Registration (Existing)

**File:** `apps/web/core/hooks/store/use-worklog.ts`

Already exports `useWorklog()` (returns `ICEWorklogStore`). No changes needed.

### Usage in Component

```typescript
const worklogStore = useWorklog();

const handleDetailedExportClick = async () => {
  try {
    await worklogStore.initiateDetailedExport(workspaceSlug, {
      date_from: dateFrom,
      date_to: dateTo,
      member_ids: selectedMembers.length > 0 ? selectedMembers : null,
      cross_workspace: isCrossWorkspace,
    });
    setToast({ type: TOAST_TYPE.INFO, title: t("capacity.export.queued_title") });
  } catch (error) {
    setToast({ type: TOAST_TYPE.ERROR, title: t("capacity.export.failed_title") });
  }
};
```

---

## 8. Cross-Workspace Mode Disable State

### Current Pattern in Heatmap

**File:** `apps/web/ce/components/time-tracking/capacity/capacity-heatmap.tsx:124–127`

```tsx
<Tooltip
  tooltipContent={cellInfo.tooltipKey ? t(cellInfo.tooltipKey) : undefined}
  disabled={!cellInfo.tooltipKey}
>
```

Tooltip is conditionally shown based on a `disabled` prop and tooltipContent.

### Disabled State for Menu Item

```tsx
<Menu.Item disabled={isCrossWorkspace} onClick={handleDetailedExportClick}>
  <div className="flex items-center justify-between w-full">
    <div>
      <h5>{t("capacity.export.detailed")}</h5>
      <p className="text-12 text-tertiary">{t("capacity.export.detailed_desc")}</p>
    </div>
    {isCrossWorkspace && (
      <Tooltip tooltipContent={t("capacity.export.cross_workspace_disabled")}>
        <InfoIcon size={14} className="text-placeholder" />
      </Tooltip>
    )}
  </div>
</Menu.Item>
```

**Reference:** `apps/web/ce/components/time-tracking/capacity/capacity-heatmap.tsx:124–127` shows disabled tooltip pattern.

---

## Summary of File Locations & Dependencies

| Component              | File                                                                                 | Key Details                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Capacity Dashboard** | `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx`               | Replace export button (line 204–210) with Menu split-button         |
| **Service Layer**      | `apps/web/ce/services/capacity-export.service.ts` (new)                              | POSTs to `/api/workspaces/{slug}/capacity/exports/`                 |
| **Store Extension**    | `apps/web/ce/store/worklog.store.ts`                                                 | Add `exportJobs`, `isExportJobsLoading`, `initiateDetailedExport()` |
| **Notifications**      | `apps/web/core/store/notifications/notification.ts`                                  | No FE changes; backend creates via Celery                           |
| **i18n Keys**          | `packages/i18n/src/locales/[en/ko/vi]/translations.ts`                               | Add `capacity.export.*` namespace                                   |
| **Toast UI**           | `@plane/propel/toast`                                                                | `setToast()` after API call (202 or error)                          |
| **Menu Component**     | `@plane/propel/menu`                                                                 | Reuse existing split-button pattern                                 |
| **Exports List Page**  | `apps/web/app/(all)/[workspaceSlug]/(projects)/time-tracking/exports/page.tsx` (new) | Defer to v2; optional in v1                                         |

---

## Key Integration Points

1. **Dashboard → Service → Store Chain:**
   - Click menu item → call `worklogStore.initiateDetailedExport()`
   - Service POSTs to backend, gets `{ job_id, message }`
   - Show toast (i18n'd) with job queued message

2. **Filter Inheritance:**
   - Read from existing state: `dateFrom`, `dateTo`, `selectedMembers`, `isCrossWorkspace`
   - Pass directly in API payload (no new pickers needed)

3. **Cross-Workspace Safety:**
   - Disable detailed export when `isCrossWorkspace === true`
   - Show tooltip explaining why
   - Current CSV export remains enabled (small data, client-side)

4. **Notification Delivery:**
   - No FE changes required
   - Backend Celery task creates `Notification` row when export completes
   - Sidebar auto-syncs via store, displays bell icon + unread count
   - User clicks notification → sees download link + expiry

5. **My Exports Page (v2):**
   - Add tab to time-tracking layout
   - Fetch from `GET /api/workspaces/{slug}/capacity/exports/`
   - Show table: Status, Date Range, Member Count, File Size, Actions (Download, Delete)
   - Can defer; not blocking v1

---

## Unresolved Questions

1. **Optional summary sheet in XLSX:** Include a totals sheet at index 0, or just per-member sheets? (Brainstorm deferred, spec says "nice-to-have.")
2. **Date format in cells:** ISO `YYYY-MM-DD` or locale-aware? (Recommend ISO for consistency.)
3. **Polling for export readiness:** Should FE poll backend for job status, or rely entirely on email + in-app notification? (Recommend notification-only for v1; add status page in v2.)
4. **Rate limiting:** Should we debounce the button client-side (30s) in addition to backend rate limits? (Recommend yes, to prevent accidental double-clicks.)
5. **Sub-category NULL handling:** Cells render empty, not string "null"? (Confirm with brainstorm owner.)
6. **Toast position/duration:** Default props for `setToast()` in Propel, or custom? (Check existing usage for pattern.)

---

**Status:** DONE

**Summary:** FE integration is straightforward: Menu split-button in dashboard → POST to new service endpoint → store mutation + toast feedback. Notifications handled server-side; "My exports" page deferred to v2. All patterns (Menu, service, store, i18n, toast) already established in codebase; no new component library needed.
