# Backend Research Report — Capacity Detailed Export (XLSX)

**Date:** 2026-05-12  
**Project:** Shinhan Workspace (SHWS)  
**Feature:** Async server-side XLSX export for capacity reports

---

## Executive Summary

All 10 required backend integration points are **present and well-established**. Plane already has:

- ✅ Worklog model with category FKs
- ✅ Async export infrastructure (Celery + S3/MinIO)
- ✅ Email + notification systems
- ✅ openpyxl dependency (`3.1.2`)
- ✅ Established permission patterns

**Key decision:** Model the new `CapacityExportJob` endpoint on the existing `ExportIssuesEndpoint` pattern (capacity.py view + ExporterHistory model + shared_task pattern).

---

## 1. Worklog Data Model

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/db/models/worklog.py`  
**Lines:** 11–40

### Structure

```python
class IssueWorkLog(ProjectBaseModel):  # inherits workspace + project FKs
    issue = FK(Issue, CASCADE, related_name="issue_worklogs")                # LINE 14–17
    logged_by = FK(User, CASCADE, related_name="worklogs")                   # LINE 19–22
    duration_minutes = PositiveIntegerField()                               # LINE 24 ← TIME FIELD
    description = TextField(blank=True, default="")                         # LINE 25
    logged_at = DateField()                                                 # LINE 26 ← LOG DATE
```

### Key Facts

- **Time unit:** `duration_minutes` (convert to hours: `minutes / 60`)
- **Workspace scoping:** Inherited from `ProjectBaseModel` (auto-set on save)
- **Date field:** `logged_at` (not datetime; per-date granularity)
- **FK chain:** `IssueWorkLog.issue → Issue → Project → Workspace`
- **Indexes:** `[("issue", "logged_by"), ("project", "logged_at")]` (LINE 33–35) — optimal for capacity queries

### Implication for Export Query

Use `.select_related("issue__project", "logged_by")` to avoid N+1. Use `.iterator(chunk_size=2000)` for large datasets (per brainstorm line 111).

---

## 2. Main / Sub Category Models

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/db/models/task_category.py`  
**Lines:** 12–88

### MainTaskCategory (Instance-level)

```python
class MainTaskCategory(BaseModel):  # LINE 12
    name = CharField(max_length=255)                     # LINE 15
    code = CharField(max_length=100, blank=True)         # LINE 16
    description = TextField(blank=True)                  # LINE 17
    sort_order = FloatField(default=65535)               # LINE 18
    is_active = BooleanField(default=True)               # LINE 19
    # NO direct FK to Workspace/Project — INSTANCE-LEVEL
```

### SubTaskCategory (Linked to Main)

```python
class SubTaskCategory(BaseModel):  # LINE 44
    main_category = FK(MainTaskCategory, CASCADE, related_name="sub_categories")  # LINE 47–50
    name = CharField(max_length=255)                     # LINE 52
    code = CharField(max_length=100, blank=True)         # LINE 53
    # ... sort_order, is_active, etc.
```

### Issue FK Links

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/db/models/issue.py`

```python
main_task_category = FK(MainTaskCategory, on_delete=SET_NULL, null=True, blank=True, ...)
sub_task_category = FK(SubTaskCategory, on_delete=SET_NULL, null=True, blank=True, ...)
```

### Critical Facts

- **Scope:** Instance-level (shared across ALL workspaces)
- **Linkage:** Issue → Main → Sub (one-to-many)
- **Nullability:** Both FKs **OPTIONAL** (null=True) — export must handle NULL → empty cell
- **UniqueConstraints:**
  - `MainTaskCategory`: unique `(name)` for active records (LINE 32–37)
  - `SubTaskCategory`: unique `(main_category, name)` per main (LINE 63–68)

### Implication for Export

```python
# JOIN chain:
Issue.main_task_category__name (nullable)
Issue.sub_task_category__name (nullable)
# SELECT:
COALESCE(main_cat.name, '') AS main_category,
COALESCE(sub_cat.name, '') AS sub_category
```

---

## 3. Capacity Report Endpoint (Current)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/app/views/workspace/time_tracking/workspace_capacity.py`  
**Lines:** 17–221

### Endpoint Signature

```python
class WorkspaceCapacityEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")  # LINE 27
    def get(self, request, slug):
        # GET /api/workspaces/<slug>/time-tracking/analytics/capacity/
```

### Request Parameters (Query String, LINE 38–39)

| Param             | Type                       | Example          | Default             |
| ----------------- | -------------------------- | ---------------- | ------------------- |
| `date_from`       | str (YYYY-MM-DD)           | `2026-01-01`     | Current week Monday |
| `date_to`         | str (YYYY-MM-DD)           | `2026-12-31`     | Current week Sunday |
| `member_id`       | str (UUID list, comma-sep) | `user1,user2`    | All active members  |
| `cross_workspace` | bool                       | `true` / `false` | `false`             |

### Filter Logic (LINE 78–122)

```python
# Admin: all workspace worklogs
if is_admin:
    worklog_filter = {"workspace__slug": slug, ...}

# Non-admin: only projects they're in
else:
    worklog_filter = {
        "workspace__slug": slug,
        "project_id__in": [user's project IDs],
        ...
    }

# cross_workspace=true: time from ALL workspaces (same member)
if cross_workspace and member_map:
    worklog_filter = {"logged_by__in": member_ids}  # drop workspace scope
```

### Response Shape (LINE 209–220)

```json
{
  "date_from": "2026-01-01",
  "date_to": "2026-12-31",
  "members": [
    {
      "member_id": "uuid",
      "display_name": "John Doe",
      "avatar_url": "...",
      "total_logged_minutes": 1200,
      "days": {
        "2026-01-01": 480,
        "2026-01-02": 300
      }
    }
  ],
  "total_logged": 5000,
  "daily_totals": {...}
}
```

### Mirror for Detailed Export

Use **identical** `date_from`, `date_to`, `member_id`, `cross_workspace` logic. Response will be **one XLSX sheet per member** (not JSON).

---

## 4. Existing Async Export Precedent

### A. Worklog Export Task

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/bgtasks/worklog_export_task.py`  
**Lines:** 16–84

```python
@shared_task
def worklog_export_task(provider, workspace_id, project_id, token_id, slug, filters=None):
    try:
        exporter = ExporterHistory.objects.get(token=token_id)
        exporter.status = "processing"  # LINE 28–29
        exporter.save(update_fields=["status"])

        # Query with filters (LINE 31–57)
        queryset = IssueWorkLog.objects.filter(...).select_related(...)
        if filters:
            member_id = filters.get("member_id")
            date_from = parse_date(filters.get("date_from"))
            date_to = parse_date(filters.get("date_to"))

        # Create exporter (LINE 60–66)
        exporter = DataExporter(WorklogExportSerializer, format_type=provider)
        filename, content = exporter.export(export_filename, queryset)

        # Upload to S3 (LINE 72–73)
        zip_buffer = create_zip_file([(filename, content)])
        upload_to_s3(zip_buffer, workspace_id, token_id, slug)

    except Exception as e:
        exporter.status = "failed"
        exporter.reason = str(e)
        exporter.save(update_fields=["status", "reason"])
        log_exception(e)
```

### Key Pattern

1. Task decorated with `@shared_task` (standard Celery)
2. Status tracking: `queued → processing → completed/failed`
3. Error handling: catch exceptions, update DB status, log
4. Query uses `.select_related()` + filters (no N+1)

### B. Export Utilities (Shared)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/bgtasks/export_utils.py`  
**Lines:** 41–120

```python
def upload_to_s3(zip_file, workspace_id, token_id, slug):
    file_name = f"{workspace_id}/export-{slug}-{token_id[:6]}-{str(timezone.now().date())}.zip"
    expires_in = 7 * 24 * 60 * 60  # LINE 44: 7 DAYS

    # MinIO path (LINE 46–78)
    if settings.USE_MINIO:
        # Upload + presign with 7-day TTL
        presigned_url = presign_s3.generate_presigned_url(
            "get_object",
            ExpiresIn=expires_in,  # LINE 77
        )
    # AWS S3 path (LINE 80–108)
    else:
        s3 = boto3.client(...)
        presigned_url = s3.generate_presigned_url("get_object", ExpiresIn=expires_in)

    exporter_instance = ExporterHistory.objects.get(token=token_id)
    if presigned_url:
        exporter.url = presigned_url
        exporter.status = "completed"
        exporter.key = file_name
    else:
        exporter.status = "failed"
    exporter.save(...)  # LINE 119
```

### Key Facts

- **S3 key format:** `{workspace_id}/export-{slug}-{token[:6]}-{date}.zip`
- **Presigned URL TTL:** 7 days (configurable via `ExpiresIn`)
- **Backend:** MinIO (via `settings.USE_MINIO`) or AWS S3
- **Storage settings:** `settings.AWS_S3_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`

### C. ExporterHistory Model

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/db/models/exporter.py`

```python
class ExporterHistory(BaseModel):
    name = CharField(max_length=255, null=True, blank=True)
    type = CharField(max_length=50, choices=[("issue_exports", ...), ("issue_worklogs", ...)])
    workspace = FK(Workspace, CASCADE, related_name="workspace_exporters")
    project = ArrayField(UUIDField)
    provider = CharField(choices=[("json", ...), ("csv", ...), ("xlsx", ...)])
    status = CharField(choices=[("queued", ...), ("processing", ...), ("completed", ...), ("failed", ...)])
    initiated_by = FK(User, CASCADE)
    token = CharField()  # unique identifier for presigned URL
    url = TextField(null=True)  # presigned download URL
    key = CharField(null=True)  # S3 object key
    reason = TextField(null=True)  # error message if failed
```

**Note:** The proposed `CapacityExportJob` model should **mirror** this structure.

### D. ExporterHistory Endpoint (Template)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/app/views/exporter/base.py`  
**Lines:** 18–65

```python
class ExportIssuesEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        provider = request.data.get("provider", False)
        project_ids = request.data.get("project", [])

        # Create exporter record (LINE 41–46)
        exporter = ExporterHistory.objects.create(
            workspace=workspace,
            project=project_ids,
            initiated_by=request.user,
            provider=provider,
            type="issue_exports",
        )

        # Enqueue Celery task (LINE 49–56)
        issue_export_task.delay(
            provider=exporter.provider,
            workspace_id=workspace.id,
            project_ids=project_ids,
            token_id=exporter.token,
            slug=slug,
        )
        return Response(
            {"message": "Once the export is ready you will be able to download it"},
            status=status.HTTP_200_OK,
        )
```

### Implication: New Endpoint Pattern

```
POST /api/workspaces/<slug>/capacity/exports/
Body: {
  "date_from": "2026-01-01",
  "date_to": "2026-12-31",
  "member_ids": ["uuid1", "uuid2"],
  "cross_workspace": false,
  "format": "xlsx"
}
Response: 202 ACCEPTED
{ "job_id": "...", "message": "Export queued. We'll email you when ready." }
```

---

## 5. FileAsset / S3 Layer

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/db/models/asset.py`  
**Lines:** 28–101

### FileAsset Model

```python
class FileAsset(BaseModel):
    class EntityTypeContext(TextChoices):
        ISSUE_ATTACHMENT = "ISSUE_ATTACHMENT"
        ISSUE_DESCRIPTION = "ISSUE_DESCRIPTION"
        # ... etc. (14+ entity types)

    attributes = JSONField(default=dict)
    asset = FileField(upload_to=get_upload_path, max_length=800)
    user = FK(User, CASCADE, null=True)
    workspace = FK(Workspace, CASCADE, null=True)
    entity_type = CharField(max_length=255, null=True, blank=True)
    entity_identifier = CharField(max_length=255, null=True, blank=True)
    size = FloatField(default=0)
    is_uploaded = BooleanField(default=False)
    storage_metadata = JSONField(default=dict, null=True, blank=True)
```

### Key Insight

**FileAsset is designed for user-uploaded attachments (via Django FileField), NOT for server-generated exports.**

**For XLSX exports, reuse the S3 pattern from `export_utils.py`** (direct boto3 upload, presigned URL):

- Do **NOT** create a FileAsset row
- Upload directly to S3 with `upload_to_s3()` function
- Store metadata (file_path, expires_at) in `CapacityExportJob` model
- Generate presigned URL with 7-day TTL

### Storage Backend Detection

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/bgtasks/export_utils.py`  
**Lines:** 46–108

```python
if settings.USE_MINIO:
    # MinIO endpoint (local docker or external)
    upload_s3 = boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )
    external_endpoint = getattr(settings, "MINIO_EXTERNAL_ENDPOINT", None) or settings.AWS_S3_ENDPOINT_URL
else:
    # AWS S3 or compatible
    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_REGION,  # or endpoint_url if provided
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
```

### Implication

Use `export_utils.upload_to_s3()` or copy its logic. The settings already handle both MinIO (dev/docker) and AWS S3.

---

## 6. Email Infrastructure

### Transactional Email Task Pattern

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/bgtasks/user_activation_email_task.py`  
**Lines:** 22–69

```python
@shared_task
def user_activation_email(current_site, user_id):
    try:
        user = User.objects.get(id=user_id)
        subject = f"{user.first_name or user.display_name} activated"

        context = {
            "email": str(user.email),
            "profile_url": current_site + "/profile",
            "logo_url": get_email_logo_url(),
        }

        # Render HTML template (LINE 32)
        html_content = render_to_string("emails/user/user_activation.html", context)

        # Generate plain-text fallback (LINE 34)
        text_content = generate_plain_text_from_html(html_content)

        # Get email config from database (LINE 36–44)
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        # Create connection + send (LINE 46–64)
        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[user.email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return
    except Exception as e:
        log_exception(e)
        return
```

### Key Facts

- **Pattern:** `@shared_task` → query user → `render_to_string()` + template
- **Email config:** Dynamically loaded from DB via `get_email_configuration()` (instance-level settings)
- **Imports:**
  - `from django.core.mail import EmailMultiAlternatives, get_connection`
  - `from django.template.loader import render_to_string`
  - `from plane.utils.email import generate_plain_text_from_html, get_email_logo_url`
- **Error handling:** catch, log, return (silent fail)

### Email Configuration Source

**Module:** `plane.license.utils.instance_value.get_email_configuration()`

Returns tuple: `(EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, EMAIL_PORT, EMAIL_USE_TLS, EMAIL_USE_SSL, EMAIL_FROM)`

Queries `InstanceConfiguration` model for SMTP settings.

### For Capacity Export Email

Create a new task `generate_capacity_export_email()` that:

1. Receives `job_id` (CapacityExportJob PK)
2. Queries the job row: recipient, date range, file URL, member count, row count
3. Renders template: `emails/capacity/export_ready.html` with context
4. Sends to `job.requested_by.email`

### Email Template Location

Templates are in `apps/api/plane/templates/emails/`. Create:  
`/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/templates/emails/capacity/export_ready.html`

---

## 7. In-App Notification System

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/db/models/notification.py`  
**Lines:** 13–70

### Notification Model

```python
class Notification(BaseModel):
    workspace = FK(Workspace, CASCADE, related_name="notifications")
    project = FK(Project, CASCADE, null=True, related_name="notifications")
    data = JSONField(null=True)
    entity_identifier = UUIDField(null=True)  # e.g., issue ID or export job ID
    entity_name = CharField(max_length=255)    # e.g., "capacity_export"
    title = TextField()
    message = JSONField(null=True)
    message_html = TextField(blank=True, default="<p></p>")
    message_stripped = TextField(blank=True, null=True)
    sender = CharField(max_length=255)  # e.g., "system" or "bot"
    triggered_by = FK(User, SET_NULL, null=True, related_name="triggered_notifications")
    receiver = FK(User, CASCADE, related_name="received_notifications")  # recipient
    read_at = DateTimeField(null=True)
    snoozed_till = DateTimeField(null=True)
    archived_at = DateTimeField(null=True)
```

### Creation Pattern

From Celery task (after S3 upload succeeds):

```python
from plane.db.models import Notification

Notification.objects.create(
    workspace_id=job.workspace_id,
    project=None,
    entity_identifier=job.id,  # CapacityExportJob UUID
    entity_name="capacity_export",
    title="Capacity export ready",
    message_html="<p>Your capacity report is ready. <a href='...'>Download</a></p>",
    sender="system",
    triggered_by=None,  # system-generated
    receiver=job.requested_by,
)
```

### When to Create

After successful S3 upload + presigned URL generation (in Celery task, LINE 120 equivalent).

### Indexes (LINE 40–62)

Optimized for: `(receiver, workspace, read_at, created_at)` — frontend notification feed queries

---

## 8. Celery Setup & Beat Schedule

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/celery.py`  
**Lines:** 1–107

### Task Registration Pattern

```python
@shared_task
def generate_capacity_xlsx_export(job_id: str):
    """Async task to generate capacity XLSX and email link."""
    try:
        job = CapacityExportJob.objects.get(id=job_id)
        # ... implementation
    except Exception as e:
        log_exception(e)
        # Update job.status = "failed"
```

**Auto-discovered:** Celery scans `plane/bgtasks/*.py` at startup (LINE 105: `app.autodiscover_tasks()`).

No manual registration needed; just create the file in `/plane/bgtasks/` with `@shared_task` decorator.

### Beat Schedule Entry (For Cleanup)

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/celery.py`  
**Lines:** 29–84

Example:

```python
app.conf.beat_schedule = {
    "check-every-day-to-delete-exporter-history": {
        "task": "plane.bgtasks.exporter_expired_task.delete_old_s3_link",
        "schedule": crontab(hour=3, minute=45),  # UTC 03:45
    },
}
```

### For Capacity Export Cleanup

Add a beat task to delete expired files (older than 7 days):

```python
"check-every-day-to-delete-expired-capacity-exports": {
    "task": "plane.bgtasks.capacity_export_cleanup.cleanup_expired_exports",
    "schedule": crontab(hour=4, minute=0),  # UTC 04:00 (after other cleanups)
},
```

### Celery Configuration

**From Django settings (loaded via `app.config_from_object("django.conf:settings", namespace="CELERY")`):**

```python
CELERY_BROKER_URL = "redis://..."  # or rabbitmq://
CELERY_RESULT_BACKEND = "redis://..."
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 600  # 10 min hard limit (per task config)
CELERY_TASK_SOFT_TIME_LIMIT = 300  # 5 min soft limit (SIGTERM)
```

### Time Limits for Capacity Export Task

From brainstorm (line 158): _"set Celery soft/hard time limits (5/10 min)"_

Set in task decorator:

```python
@shared_task(soft_time_limit=300, time_limit=600)  # 5 min warn, 10 min kill
def generate_capacity_xlsx_export(job_id):
    ...
```

Or in task body:

```python
@shared_task
def generate_capacity_xlsx_export(job_id):
    try:
        # Use job.timeout or settings to configure
        ...
    except SoftTimeLimitExceeded:
        log_exception("Export timed out, save partial progress")
        job.status = "timeout"
        job.save()
```

---

## 9. openpyxl Dependency

**File:** `/Users/ngoctran/Documents/Shinhan/plane/apps/api/requirements/base.txt`  
**Line:** `openpyxl==3.1.2` ✅ **Already installed**

### Usage Pattern (Write-Only Mode)

From brainstorm (line 110):

> Use `openpyxl` `write_only=True` mode (bounded memory).

```python
from openpyxl import Workbook

wb = Workbook(write_only=True)

# Per member, create a sheet
for member_id in member_ids:
    ws = wb.create_sheet(title=sanitize_sheet_name(member_name))
    ws.append(["Member", "Date", "Main Category", "Sub Category", "Work Item", "Time Spent (h)"])

    # Stream rows (no in-memory list)
    for worklog in worklogs.iterator(chunk_size=2000):
        ws.append([
            worklog.member.display_name,
            worklog.logged_at.isoformat(),
            worklog.issue.main_task_category.name if worklog.issue.main_task_category else "",
            worklog.issue.sub_task_category.name if worklog.issue.sub_task_category else "",
            worklog.issue.name,
            worklog.duration_minutes / 60,  # hours
        ])

# Save to bytes buffer
buffer = io.BytesIO()
wb.save(buffer)
buffer.seek(0)
return buffer.getvalue()
```

### Key Constraint

- **write_only=True** → memory efficient, but **cannot modify sheets after rows added**
- Must write headers before data
- Cannot go back and adjust column widths (set via openpyxl if needed, or accept Excel default)

---

## 10. Workspace-Level Permissions

**Pattern:** `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`

### Role Constants

**File:** `plane/app/permissions.py`

```python
class ROLE:
    ADMIN = 20     # Workspace admin
    MEMBER = 10    # Workspace member
    GUEST = 5      # Guest (read-only)
```

### Permission Decorator

```python
from plane.app.permissions import allow_permission, ROLE

@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
def post(self, request, slug, ...):
    # Check:
    # 1. User is in workspace
    # 2. User has one of the allowed roles
    # Returns 403 Forbidden if not permitted
```

### For Capacity Export Endpoint

**Recommendation:** `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`

Rationale:

- Admin: can export all members' data
- Member: can export their own + visible members' data (per capacity view permissions)
- Guest: would see read-only capacity data but should probably not trigger exports (or allow with restrictions)

**Current capacity endpoints use:** `[ROLE.ADMIN, ROLE.MEMBER]` (LINE 27 in workspace_capacity.py)

---

## Implementation Checklist

### Models (NEW)

- [ ] Create `CapacityExportJob` model in `plane/db/models/` (mirror ExporterHistory)
  - Fields: `workspace`, `requested_by`, `date_from`, `date_to`, `member_ids` (JSON), `cross_workspace`, `status`, `file_path`, `file_size`, `error_message`, `expires_at`, `created_at`, `completed_at`
  - Indexes: `(workspace, status)`, `(requested_by, created_at)`, `(expires_at)`

### Views (NEW)

- [ ] Create endpoint `POST /api/workspaces/<slug>/capacity/exports/`
  - File: `plane/app/views/capacity.py` (add to existing)
  - Pattern: Mirror `ExportIssuesEndpoint` logic
  - Return 202 + `job_id` + "Email coming" message

### Celery Tasks (NEW)

- [ ] Create `generate_capacity_xlsx_export(job_id)` in `plane/bgtasks/capacity_export_task.py`
  - Query worklogs + categories
  - Generate XLSX with openpyxl write_only
  - Upload to S3 via `export_utils.upload_to_s3()`
  - Create Notification record
  - Send email via `generate_capacity_export_email(job_id)`
- [ ] Create `generate_capacity_export_email(job_id)` in `plane/bgtasks/capacity_export_email_task.py`
  - Query CapacityExportJob
  - Render template + send (pattern: `user_activation_email_task.py`)
- [ ] Create `cleanup_expired_capacity_exports()` in `plane/bgtasks/capacity_export_cleanup.py`
  - Delete files from S3 older than 7 days
  - Mark jobs as `expired`

### Email Template (NEW)

- [ ] Create `apps/api/plane/templates/emails/capacity/export_ready.html`
  - Subject: "Your capacity report is ready ({from} – {to})"
  - Body: range, member count, row count, Download button, expiry notice

### URLs (UPDATE)

- [ ] Register endpoint in `plane/app/urls/workspace.py`
  - Path: `workspaces/<str:slug>/capacity/exports/`
  - View: `CapacityExportEndpoint.as_view()`

### Registration (UPDATE)

- [ ] Add to `__init__.py` files:
  - `plane/db/models/__init__.py` → CapacityExportJob
  - `plane/app/views/__init__.py` → CapacityExportEndpoint
  - `plane/app/serializers/__init__.py` → CapacityExportJobSerializer (if needed)

### Beat Schedule (UPDATE)

- [ ] Add cleanup task to `plane/celery.py` beat_schedule (LINE 29–84)

### Frontend i18n (FE TEAM)

- [ ] Add i18n keys (en/ko/vi):
  - `capacity.export.menu`
  - `capacity.export.summary`
  - `capacity.export.detailed`
  - `capacity.export.col.*` (6 column headers)

---

## Unresolved Questions

1. **Email recipient for failures:** Should failure email go to requester only, or also CC workspace admin?
2. **Sheet-name collision handling:** Sanitize + dedupe suffix (e.g., `John Doe-2`) — implemented or configurable?
3. **Date format in XLSX cells:** Locale-aware or ISO `YYYY-MM-DD`? (Recommend: ISO for consistency)
4. **Rate limiting:** Should we cap exports per user per hour (e.g., max 5/hour)?
5. **In-app "My exports" page:** Defer to v2, or implement lightweight retrieval endpoint in v1?
6. **Notification object scope:** Should `Notification.project` be NULL (workspace-level) or optional?
7. **Cross-workspace export safety:** Brainstorm disables detailed export in cross-workspace mode — is this enforced at API level or FE?

---

## Summary Table

| Component         | Location                                                         | Key Takeaway                                                            |
| ----------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Worklog model     | `db/models/worklog.py:11–40`                                     | FK to Issue + User, `duration_minutes`, `logged_at` DATE field          |
| Categories        | `db/models/task_category.py:12–88`                               | Instance-level, nullable FK on Issue, handle NULL → empty cell          |
| Capacity endpoint | `app/views/workspace/time_tracking/workspace_capacity.py:17–221` | Mirror filters (`date_from`, `date_to`, `member_id`, `cross_workspace`) |
| Async pattern     | `bgtasks/worklog_export_task.py:16–84`                           | `@shared_task` → status update → query → upload → update status         |
| S3 upload         | `bgtasks/export_utils.py:41–120`                                 | Use `upload_to_s3()`, handles MinIO + AWS S3, 7-day presigned TTL       |
| Email             | `bgtasks/user_activation_email_task.py:22–69`                    | `@shared_task` → `render_to_string()` → `EmailMultiAlternatives` → send |
| Notification      | `db/models/notification.py:13–70`                                | Create after success, set `entity_identifier` to job ID                 |
| Celery            | `celery.py:1–107`                                                | Beat schedule at LINE 29–84, auto-discover in `bgtasks/`                |
| openpyxl          | `requirements/base.txt`                                          | `3.1.2` ✅, use `write_only=True` for memory efficiency                 |
| Permissions       | `app/views/exporter/base.py:22`                                  | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`       |

---

**Status:** DONE

All 10 research points covered with file paths, line numbers, and actionable implementation guidance.
