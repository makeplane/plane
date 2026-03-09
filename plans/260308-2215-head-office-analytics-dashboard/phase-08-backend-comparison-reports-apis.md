# Phase 8: Backend Comparison + Reports APIs

## Context Links

- [Parent Plan](./plan.md)
- [Phase 1: Scope Resolution & Core APIs](./phase-01-backend-scope-resolution-core-apis.md)
- HeadOfficeBaseView: `apps/api/plane/app/views/workspace/head_office.py`
- Head office URLs: `apps/api/plane/app/urls/head_office.py`
- Export task pattern: `apps/api/plane/bgtasks/export_task.py`
- Export utilities: `apps/api/plane/bgtasks/export_utils.py` (upload_to_s3)
- Celery config: `apps/api/plane/celery_app.py`
- ExporterHistory model pattern: `apps/api/plane/db/models/exporter.py`
- Requirements: `apps/api/requirements/base.txt`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 6h
- **Description:** Add workspace comparison API (side-by-side metrics + 30d trend data for 2-3 workspaces) and async PDF report generation via Celery (4 report templates). Includes new HeadOfficeReport model for tracking report status.

## Key Insights

- Comparison: max 3 workspaces, all must be in managed scope. Daily trend = group completed issues by close date over 30 days.
- PDF generation: follow ExporterHistory pattern — create model record, enqueue Celery task, poll status.
- weasyprint converts HTML to PDF. Needs system deps (cairo, pango) — add to requirements and Dockerfile.
- S3 upload: reuse `upload_to_s3()` from `export_utils.py`.
- Celery `@shared_task` with `bind=True` for task instance access.
- Report types: executive (org overview), comparison (workspace compare), staff (staff metrics), project (project details).

## Requirements

### Functional

1. Comparison endpoint: side-by-side metrics for 2-3 workspaces + 30-day daily completion trend
2. Report generation: async Celery task, creates PDF from HTML template
3. Report status: poll endpoint to check generation status + download URL
4. 4 report templates: executive, comparison, staff, project

### Non-Functional

1. PDF generation must not block API response (async via Celery)
2. Report files stored in S3
3. Comparison trend data: max 30 data points (one per day)
4. HeadOfficeReport model tracks status: pending, generating, completed, failed

## Architecture

```
HeadOfficeCompareEndpoint(HeadOfficeBaseView)
  GET /head-office/compare/?workspace_ids=id1,id2,id3
  -> per-workspace metrics + daily_trend array

HeadOfficeReportGenerateEndpoint(HeadOfficeBaseView)
  POST /head-office/reports/generate/
  Body: {type, date_from, date_to, workspace_ids[]}
  -> create HeadOfficeReport, enqueue Celery task
  -> return {report_id, status: "pending"}

HeadOfficeReportStatusEndpoint(HeadOfficeBaseView)
  GET /head-office/reports/<report_id>/
  -> {report_id, status, file_url, created_at}

Celery: generate_head_office_report_task(report_id)
  -> render HTML template -> weasyprint -> PDF -> S3 upload -> update model
```

### HeadOfficeReport Model

```python
class HeadOfficeReport(BaseModel):
    REPORT_TYPE_CHOICES = [
        ("executive", "Executive Summary"),
        ("comparison", "Workspace Comparison"),
        ("staff", "Staff Report"),
        ("project", "Project Report"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("generating", "Generating"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    workspace = ForeignKey(Workspace, on_delete=CASCADE, related_name="head_office_reports")
    report_type = CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    params = JSONField(default=dict)  # {date_from, date_to, workspace_ids}
    file_url = URLField(null=True, blank=True)
    file_size = IntegerField(default=0)
    created_by = ForeignKey(User, on_delete=CASCADE)
    error_message = TextField(null=True, blank=True)

    class Meta:
        db_table = "head_office_reports"
        ordering = ["-created_at"]
```

## Related Code Files

### Files to Create

- `apps/api/plane/db/models/head_office.py` — HeadOfficeReport model
- `apps/api/plane/bgtasks/head_office_report_task.py` — Celery task for PDF generation
- `apps/api/plane/db/migrations/XXXX_head_office_report.py` — Migration (auto-generated)

### Files to Modify

<!-- Updated: Validation Session 2 - domain split, reports endpoints in dedicated file -->

- `apps/api/plane/app/views/workspace/head_office_reports.py` — Add 3 endpoints (new file, imports HeadOfficeBaseView from head_office_core.py)
- `apps/api/plane/app/urls/head_office.py` — Add URL patterns
- `apps/api/plane/db/models/__init__.py` — Export HeadOfficeReport
- `apps/api/requirements/base.txt` — Add weasyprint

## Implementation Steps

### Step 1: Create HeadOfficeReport model (1h)

1. Create `apps/api/plane/db/models/head_office.py`:
   - Import BaseModel from `plane.db.models.base`
   - Define HeadOfficeReport with fields above
   - Add `__str__` method: `f"{self.report_type} - {self.status}"`
2. Export in `apps/api/plane/db/models/__init__.py`
3. Run `python manage.py makemigrations` to generate migration
4. Add `weasyprint` to `apps/api/requirements/base.txt`

### Step 2: Implement Comparison endpoint (2h)

1. `HeadOfficeCompareEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Parse `workspace_ids` from query params (comma-separated UUIDs, max 3)
   - Validate all are in managed scope
   - Per-workspace metrics (reuse workspaces endpoint logic):
     ```python
     for ws_id in workspace_ids:
         metrics[ws_id] = {
             "workspace": {"id": ws_id, "name": ws.name, "slug": ws.slug},
             "total_projects": ...,
             "open_issues": ...,
             "closed_issues_30d": ...,
             "completion_rate": ...,
             "active_members": ...,
             "active_cycles": ...,
         }
     ```
   - 30-day daily trend:
     ```python
     thirty_days_ago = timezone.now() - timedelta(days=30)
     daily_completions = (
         Issue.objects.filter(
             workspace_id__in=workspace_ids,
             state__group="completed",
             completed_at__gte=thirty_days_ago,
         )
         .values("workspace_id", date=TruncDate("completed_at"))
         .annotate(completed_count=Count("id"))
         .order_by("date")
     )
     ```
   - Build daily_trend array: `[{date, ws1_completed, ws2_completed, ...}]`
   - Fill missing dates with 0
   - Return `{workspaces: metrics, daily_trend: [...]}`

### Step 3: Implement Report Generation endpoint (1h)

1. `HeadOfficeReportGenerateEndpoint(HeadOfficeBaseView)`:
2. `POST` method:
   - Parse body: `type`, `date_from`, `date_to`, `workspace_ids`
   - Validate type in allowed choices
   - Validate workspace_ids in managed scope
   - Create HeadOfficeReport:
     ```python
     report = HeadOfficeReport.objects.create(
         workspace=current_workspace,
         report_type=request.data["type"],
         status="pending",
         params={
             "date_from": request.data.get("date_from"),
             "date_to": request.data.get("date_to"),
             "workspace_ids": request.data.get("workspace_ids", []),
         },
         created_by=request.user,
     )
     ```
   - Enqueue Celery task:
     ```python
     generate_head_office_report_task.delay(str(report.id))
     ```
   - Return `{"report_id": str(report.id), "status": "pending"}`

### Step 4: Implement Report Status endpoint (0.5h)

1. `HeadOfficeReportStatusEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Lookup `HeadOfficeReport.objects.get(id=report_id, created_by=request.user)`
   - Return: `{report_id, report_type, status, file_url, file_size, created_at, error_message}`

### Step 5: Create Celery task (1h)

1. Create `apps/api/plane/bgtasks/head_office_report_task.py`:

   ```python
   @shared_task(bind=True)
   def generate_head_office_report_task(self, report_id):
       report = HeadOfficeReport.objects.get(id=report_id)
       try:
           report.status = "generating"
           report.save(update_fields=["status"])

           # Gather data based on report.report_type and report.params
           data = gather_report_data(report)

           # Render HTML template
           html = render_to_string(
               f"reports/head_office_{report.report_type}.html",
               {"data": data, "report": report}
           )

           # Convert to PDF
           pdf = weasyprint.HTML(string=html).write_pdf()

           # Upload to S3
           file_name = f"head-office-reports/{report.id}.pdf"
           file_url = upload_to_s3(pdf, file_name, "application/pdf")

           report.status = "completed"
           report.file_url = file_url
           report.file_size = len(pdf)
           report.save(update_fields=["status", "file_url", "file_size"])
       except Exception as e:
           report.status = "failed"
           report.error_message = str(e)
           report.save(update_fields=["status", "error_message"])
   ```

2. `gather_report_data()`: switch on report_type, query relevant data using scope resolution

### Step 6: Register URLs (0.5h)

1. Add to `apps/api/plane/app/urls/head_office.py`:
   ```python
   path("workspaces/<str:slug>/head-office/compare/",
        HeadOfficeCompareEndpoint.as_view(), name="head-office-compare"),
   path("workspaces/<str:slug>/head-office/reports/generate/",
        HeadOfficeReportGenerateEndpoint.as_view(), name="head-office-report-generate"),
   path("workspaces/<str:slug>/head-office/reports/<uuid:report_id>/",
        HeadOfficeReportStatusEndpoint.as_view(), name="head-office-report-status"),
   ```

## Todo List

- [ ] Create HeadOfficeReport model in `apps/api/plane/db/models/head_office.py`
- [ ] Export model in `__init__.py`
- [ ] Generate and apply migration
- [ ] Add weasyprint to `requirements/base.txt`
- [ ] Implement HeadOfficeCompareEndpoint with daily trend
- [ ] Implement HeadOfficeReportGenerateEndpoint
- [ ] Implement HeadOfficeReportStatusEndpoint
- [ ] Create Celery task `generate_head_office_report_task`
- [ ] Create HTML templates for 4 report types (basic)
- [ ] Test: comparison with 2-3 workspaces returns correct metrics
- [ ] Test: comparison rejects workspace outside scope
- [ ] Test: report generation creates model + enqueues task
- [ ] Test: report status returns correct status + URL after completion
- [ ] Test: Celery task generates PDF and uploads to S3

## Success Criteria

- Comparison endpoint returns per-workspace metrics + 30-day daily trend
- Max 3 workspaces enforced, all validated in scope
- Report generation creates HeadOfficeReport and enqueues Celery task
- Celery task: renders HTML -> PDF -> S3 upload -> updates model status
- Report status endpoint returns file_url when completed
- Failed reports have error_message set

## Risk Assessment

| Risk                               | Probability | Impact | Mitigation                                          |
| ---------------------------------- | ----------- | ------ | --------------------------------------------------- |
| weasyprint system deps missing     | Medium      | High   | Document cairo/pango deps in Dockerfile, test in CI |
| S3 upload fails                    | Low         | Medium | Retry logic in Celery task, error status on model   |
| Large PDF generation timeout       | Low         | Medium | Set Celery task time limit, paginate data if needed |
| Daily trend query slow             | Medium      | Medium | Index on completed_at, limit to 30 days             |
| Comparison with 3 large workspaces | Low         | Medium | Aggregate queries, not N+1 per workspace            |

## Security Considerations

- All workspace_ids validated in managed scope before comparison
- Report accessible only by creator (`created_by=request.user`)
- S3 URL: use signed URL with expiration (if applicable)
- Report params stored as JSON — validate input types
- No arbitrary HTML injection in report templates (use Django template escaping)
- POST endpoint requires CSRF (handled by DRF session auth)

## Next Steps

- Phase 11 consumes comparison API for frontend comparison view
- Phase 12 consumes report APIs for frontend reports tab
- HTML report templates can be enhanced iteratively after MVP
