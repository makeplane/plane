# Phase 12: Frontend Reports Tab + PDF Export

## Context Links

- [Parent Plan](./plan.md)
- [Phase 8: Backend Reports API](./phase-08-backend-comparison-reports-apis.md)
- [Phase 9: Tab Navigation](./phase-09-frontend-tab-navigation-workspace-drilldown.md)
- Head office store: `apps/web/ce/store/head-office.store.ts`
- Head office service: `apps/web/ce/services/head-office.service.ts`
- Head office components: `apps/web/core/components/head-office/`

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** 4h
- **Description:** Build the Reports tab: 4 template cards (Executive, Comparison, Staff, Project), date range picker, workspace selector, preview panel, and "Export PDF" button with async status polling + download.

## Key Insights

- Report generation is async: POST to create → poll GET for status → download when completed
- 4 report templates: executive (org overview), comparison (workspace compare), staff (staff metrics), project (project details)
- Polling interval: 3 seconds, max 60 attempts (3 minutes timeout)
- Date range: default last 30 days, selectable via date inputs
- Workspace selector: multi-select for comparison/project reports, single for executive/staff
- Preview panel: shows report type description + selected params (not actual PDF preview)

## Requirements

### Functional

1. Template cards: 4 cards with icon, title, description, select action
2. Report config: date range picker + workspace selector (varies by template)
3. Preview panel: shows selected template info + config summary
4. "Export PDF" button: triggers async generation
5. Status display: loading spinner + progress text during generation
6. Download: auto-download or download link when completed
7. Error handling: show error message if generation fails

### Non-Functional

1. Polling uses `setInterval` with cleanup on unmount
2. Button disabled during generation
3. Max 3-minute wait before timeout error
4. All components <150 lines, `observer()` wrapped

## Architecture

```
Tabs.Content "reports"
  -> HeadOfficeReportsTab
       -> HeadOfficeReportTemplates (4 cards grid)
       -> HeadOfficeReportPreview (config + preview panel)
            -> Date range picker
            -> Workspace selector
            -> HeadOfficeReportDownload (export button + status)
```

### Report Templates

| Type       | Description                                               | Workspace Selection     |
| ---------- | --------------------------------------------------------- | ----------------------- |
| Executive  | Organization overview: KPIs, health summary, staff counts | Auto (all managed)      |
| Comparison | Side-by-side workspace metrics + trends                   | Multi-select (2-3)      |
| Staff      | Staff metrics: workload, activity, department breakdown   | Auto (all managed)      |
| Project    | Project details: issue breakdown, completion, assignees   | Multi-select workspaces |

## Related Code Files

### Files to Create

- `apps/web/core/components/head-office/head-office-reports-tab.tsx` — Tab container
- `apps/web/core/components/head-office/head-office-report-templates.tsx` — Template cards
- `apps/web/core/components/head-office/head-office-report-preview.tsx` — Config + preview panel
- `apps/web/core/components/head-office/head-office-report-download.tsx` — Download button + status

### Files to Modify

<!-- Updated: Validation Session 2 - store split by domain, reports state in dedicated store -->

- `apps/web/ce/store/head-office-reports.store.ts` — New file: report type, date range, workspace selection, generation status
- `apps/web/ce/services/head-office.service.ts` — Add report methods
- `apps/web/core/components/head-office/head-office-tabs.tsx` — Replace Reports placeholder

## Implementation Steps

### Step 1: Extend service with report methods (0.5h)

1. Add interfaces:

   ```typescript
   export interface IReportGenerateRequest {
     type: "executive" | "comparison" | "staff" | "project";
     date_from: string; // YYYY-MM-DD
     date_to: string;
     workspace_ids: string[];
   }

   export interface IReportStatus {
     report_id: string;
     report_type: string;
     status: "pending" | "generating" | "completed" | "failed";
     file_url: string | null;
     file_size: number;
     created_at: string;
     error_message: string | null;
   }
   ```

2. Add methods:
   ```typescript
   async generateReport(slug: string, data: IReportGenerateRequest): Promise<{ report_id: string; status: string }>
   async fetchReportStatus(slug: string, reportId: string): Promise<IReportStatus>
   ```

### Step 2: Extend store with reports state (0.5h)

1. Add observables:
   ```typescript
   selectedReportType: string | null = null;
   reportDateRange: { from: string; to: string } = {
     from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
     to: format(new Date(), "yyyy-MM-dd"),
   };
   reportWorkspaceIds: string[] = [];
   currentReportId: string | null = null;
   currentReportStatus: IReportStatus | null = null;
   isReportGenerating: boolean = false;
   ```
2. Add actions:
   ```typescript
   setSelectedReportType: action;
   setReportDateRange: action;
   setReportWorkspaceIds: action;
   generateReport: action; // POST + start polling
   pollReportStatus: action; // called by interval
   clearReport: action; // reset state
   ```
3. `generateReport` implementation:
   ```typescript
   generateReport = async (slug: string) => {
     this.isReportGenerating = true;
     try {
       const res = await this.service.generateReport(slug, {
         type: this.selectedReportType!,
         date_from: this.reportDateRange.from,
         date_to: this.reportDateRange.to,
         workspace_ids: this.reportWorkspaceIds,
       });
       runInAction(() => {
         this.currentReportId = res.report_id;
       });
       // Start polling (handled by component interval)
     } catch (error) {
       runInAction(() => {
         this.isReportGenerating = false;
       });
       console.error("Failed to generate report", error);
     }
   };
   ```

### Step 3: Create Reports Tab container (0.25h)

1. `head-office-reports-tab.tsx` (~35 lines):
   ```typescript
   export const HeadOfficeReportsTab = observer(() => {
     const { headOffice } = useStore();
     return (
       <div className="flex flex-col gap-6">
         <HeadOfficeReportTemplates />
         {headOffice.selectedReportType && <HeadOfficeReportPreview />}
       </div>
     );
   });
   ```

### Step 4: Create Template Cards (0.75h)

1. `head-office-report-templates.tsx` (~100 lines):
   - 4-card grid (2x2 on desktop, 1 col on mobile)
   - Each card:
     - Icon (FileText, GitCompare, Users, FolderKanban from lucide-react)
     - Title + description
     - Selected state (border highlight)
     - onClick: `headOffice.setSelectedReportType(type)`
   - Templates data:
     ```typescript
     const TEMPLATES = [
       {
         type: "executive",
         title: "Executive Summary",
         icon: FileText,
         description: "Organization overview with KPIs, workspace health, and staff counts",
       },
       {
         type: "comparison",
         title: "Workspace Comparison",
         icon: GitCompare,
         description: "Side-by-side metrics and trends for selected workspaces",
       },
       {
         type: "staff",
         title: "Staff Report",
         icon: Users,
         description: "Staff workload, activity breakdown, and department metrics",
       },
       {
         type: "project",
         title: "Project Report",
         icon: FolderKanban,
         description: "Project issue breakdown, completion rates, and assignee details",
       },
     ];
     ```

### Step 5: Create Preview + Config panel (1h)

1. `head-office-report-preview.tsx` (~120 lines):
   - Template info header (icon + title + description)
   - Date range picker:
     - Two date inputs (from / to)
     - Bind to `headOffice.reportDateRange`
   - Workspace selector (conditional):
     - If type = "comparison" or "project": multi-select from managed workspaces
     - If type = "executive" or "staff": auto (all managed), show info text
     - Bind to `headOffice.reportWorkspaceIds`
   - Config summary: "Executive report for Mar 1-30, 2026 across 5 workspaces"
   - `<HeadOfficeReportDownload />` at bottom

### Step 6: Create Download + Status component (1h)

1. `head-office-report-download.tsx` (~100 lines):
   - "Export PDF" button: calls `headOffice.generateReport(workspaceSlug)`
   - Disabled states: no template selected, generating in progress, missing required workspace selection
   - After generate: start polling interval (3s):
     ```typescript
     useEffect(() => {
       if (!headOffice.currentReportId) return;
       const interval = setInterval(async () => {
         const status = await headOffice.pollReportStatus(workspaceSlug);
         if (status === "completed" || status === "failed") {
           clearInterval(interval);
         }
       }, 3000);
       // Timeout after 3 minutes
       const timeout = setTimeout(() => clearInterval(interval), 180000);
       return () => {
         clearInterval(interval);
         clearTimeout(timeout);
       };
     }, [headOffice.currentReportId]);
     ```
   - Status display:
     - pending/generating: spinner + "Generating report..."
     - completed: download link + file size
     - failed: error message + "Retry" button
   - Download: `<a href={file_url} download>` or `window.open(file_url)`
   - "Generate Another" button to reset state

## Todo List

- [ ] Add report interfaces + methods to HeadOfficeService
- [ ] Add report observables + actions to HeadOfficeStore
- [ ] Create `head-office-reports-tab.tsx` container
- [ ] Create `head-office-report-templates.tsx` template cards
- [ ] Create `head-office-report-preview.tsx` config + preview panel
- [ ] Create `head-office-report-download.tsx` download + status
- [ ] Update `head-office-tabs.tsx` to render ReportsTab instead of placeholder
- [ ] Test: selecting template shows preview panel
- [ ] Test: date range picker updates store
- [ ] Test: workspace selector appears for comparison/project types
- [ ] Test: "Export PDF" triggers API call + starts polling
- [ ] Test: polling stops on completion and shows download link
- [ ] Test: failed report shows error + retry
- [ ] Verify all components <150 lines

## Success Criteria

- 4 template cards render with selection state
- Date range and workspace selection configurable per template type
- "Export PDF" creates report and starts polling
- Polling displays status updates (generating → completed/failed)
- Completed report shows download link with file size
- Failed report shows error message and retry option
- All components use `observer()`, <150 lines each

## Risk Assessment

| Risk                              | Probability | Impact | Mitigation                                     |
| --------------------------------- | ----------- | ------ | ---------------------------------------------- |
| Polling race condition on unmount | Medium      | Low    | Cleanup interval + timeout in useEffect return |
| Report generation takes >3 min    | Low         | Medium | Show timeout message, link to check back later |
| S3 signed URL expiration          | Medium      | Medium | Backend returns fresh URL on status check      |
| Large PDF download fails          | Low         | Medium | Show file size, retry download option          |
| Date picker browser compatibility | Low         | Low    | Use native date inputs, widely supported       |

## Security Considerations

- Report generation POST validated by backend (scope + permissions)
- Report download URL from backend (S3 signed URL if applicable)
- Report only accessible by creator (backend enforces `created_by` check)
- No sensitive data stored in browser (polling state in MobX memory)
- Download triggers browser download, no data processed client-side

## Next Steps

- Enhance HTML report templates on backend for better PDF output
- Add report history list (past generated reports)
- Consider email delivery option for completed reports
