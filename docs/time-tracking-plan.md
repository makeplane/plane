# Time Tracking - Implementation Plan

|              |                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**   | Ready for implementation                                                                                                                                          |
| **Prepared** | 2026-10-07                                                                                                                                                        |
| **Codebase** | This fork of Plane, branch `v1.4.2-base`                                                                                                                          |
| **Scope**    | Timers, manual time entries, project-level time, admin logging on behalf of others, billable flag, timesheet, entries list, and a full reporting / analytics page |

---

## 0. How to use this document

- Sections 1-12 are the **specification**: what to build and the rules it must follow.
- Section 13 is the **task list**. Each task has an ID, dependencies, files to touch and acceptance criteria. Work through the phases in order. Tasks within a phase can usually run in parallel.
- Appendices hold reference material: the duration-input grammar, date presets, a file inventory and a manual QA script.
- Code snippets here are **specifications**, not finished code. Match the surrounding code's style when implementing.
- If something here conflicts with what you find in the code, the code wins. Note the discrepancy in your PR.

---

## 1. Goal and scope

### 1.1 What users must be able to do

1. **Start a timer** on a work item, or on a project without a work item, and **stop** it when done.
2. **Log time manually** against a work item or a project: either a duration on a date, or a start and end time.
3. **Edit and delete** their own entries.
4. **Admins log, edit and delete time on someone else's behalf.**
5. Mark time as **billable / non-billable**.
6. See **time logged on a work item** (total, per person, list of entries).
7. Use a **weekly timesheet** to review and fill in their week.
8. Use a **full analytics page** with rich filtering, grouping, charts, a pivot table, drill-down and export.

### 1.2 Out of scope for v1 (see section 14)

Hourly rates and invoicing, approval or locking of past weeks, idle detection, the external REST API (`/api/v1/`), webhooks, rounding rules, sub-work-item roll-ups, estimate-vs-actual, and saved reports (shareable URLs cover sharing).

---

## 2. Decisions

### 2.1 Confirmed by the product owner

| #   | Decision                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------ |
| D1  | **Everyone sees everyone's time.** No "my entries only" privacy mode. See A1/A2 for how "everyone" is interpreted. |
| D2  | **There is a billable flag** on every entry.                                                                       |
| D3  | **Every project has time tracking.** There is no per-project on/off switch.                                        |
| D4  | **Admins can log time on someone else's behalf**, and edit or delete anyone's entries in projects they administer. |
| D5  | **Limits:** a single entry is at most **24 hours**. A running timer is **automatically stopped after 12 hours**.   |

### 2.2 Engineering decisions

| #   | Decision                                                                                                                                                                                                                                                  | Why                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | The backend lives in a **new Django app, `plane.time_tracking`, with its own migrations folder**.                                                                                                                                                         | This fork rebases onto upstream releases. Upstream keeps adding migrations to `plane/db/migrations`, and we have already had to renumber fork migrations once (commit `cbf063afb1`). A separate app's migration history never collides with upstream's. |
| E2  | Name things **`TimeEntry` / `time_entries` / `time-entries`**, never "worklog".                                                                                                                                                                           | Upstream's paid edition has a "worklogs" feature; there are already `issue_worklogs` strings and choices in this codebase. Distinct names avoid table and URL collisions if upstream ever open-sources it.                                              |
| E3  | **One table for timers and manual entries.** A running timer is an entry with `started_at` set and `ended_at` empty.                                                                                                                                      | One query path for lists, totals and reports.                                                                                                                                                                                                           |
| E4  | Store **`spent_on` (a date in the owner's timezone)** separately from the timestamps.                                                                                                                                                                     | All day, week and month grouping uses `spent_on`, so reports never shift because of server or viewer timezone. Duration-only manual entries ("2h on Tuesday") don't need made-up start times.                                                           |
| E5  | **Ignore the existing `Project.is_time_tracking_enabled` column.** It came from upstream migration 0070 and is unused in this edition.                                                                                                                    | Per D3, time tracking is always on. Leave the column untouched, add no UI for it and don't gate anything on it.                                                                                                                                         |
| E6  | **A dedicated workspace page** at `/:workspaceSlug/time-tracking/{timesheet,entries,reports}`, not a new tab on the existing Analytics page.                                                                                                              | The existing Analytics header has one shared filter bar (project and duration only). Time reports need far richer filters. A separate page also leaves upstream's analytics files untouched.                                                            |
| E7  | **Frontend: the running timer lives in a MobX store; all other fetched data uses SWR hooks** with shared cache keys and a single "revalidate everything time-related" helper.                                                                             | The timer is global, live-updating state, which suits MobX. Lists and aggregates are request-shaped, which suits SWR. This mirrors the fork's own `useIssuePageLinks` pattern (`apps/web/core/hooks/use-issue-page-links.ts`).                          |
| E8  | **One filter definition** (`TimeEntryFilterSet`) drives the list, summary, report, timesheet and export endpoints.                                                                                                                                        | The table, the charts and the export always agree.                                                                                                                                                                                                      |
| E9  | Date presets ("this week", "last month", …) are **resolved to explicit dates on the client**, using the viewer's timezone and week-start setting. The API only receives `date_from` / `date_to`.                                                          | The server never has to guess the viewer's timezone.                                                                                                                                                                                                    |
| E10 | **Edit upstream files only at small hook points**, listed in 4.1. Put everything else in new files.                                                                                                                                                       | Keeps future upstream rebases cheap.                                                                                                                                                                                                                    |
| E11 | **No new upstream database migrations.** The one upstream model change (a new nav-preference key) only touches a `TextChoices` class used by a field that has no `choices=` set, so Django generates no migration. Confirm with `makemigrations --check`. | Same as E1.                                                                                                                                                                                                                                             |

### 2.3 Assumptions (confirm or flip; each is isolated in one place)

| #   | Assumption                                                                                                                                                                                                                                                             | Where it lives                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| A1  | "Everyone" means every **workspace Admin and Member**. **Workspace Guests** (usually external people) can neither see nor log time.                                                                                                                                    | `TimeTrackingAccess.can_view()`               |
| A2  | Time in **Secret projects** (`Project.network == 0`) is visible only to that project's members and workspace admins, so we don't leak secret work-item names. Time in Public projects is visible to all workspace Admins and Members, even non-members of the project. | `TimeTrackingAccess.visible_entries()`        |
| A3  | A project's default for "billable" is **off** until a project admin turns it on in the project's Time tracking settings.                                                                                                                                               | `ProjectTimeSetting.default_billable` default |
| A4  | A timer stopped after **less than 60 seconds is discarded** (an accidental start/stop).                                                                                                                                                                                | `TIMER_MIN_SECONDS`                           |
| A5  | A timer that runs past midnight is attributed entirely to the **day it started**.                                                                                                                                                                                      | `services.stop_timer()`                       |
| A6  | Admins log on behalf of others with **manual entries only**. You cannot run a timer for someone else.                                                                                                                                                                  | Serializer and UI                             |
| A7  | A bare number typed into a duration field means **hours** (`1.5` → 1h 30m). A decimal comma is accepted (`1,5`).                                                                                                                                                       | `parseDurationInput()`                        |

---

## 3. Glossary

| Term                              | Meaning                                                                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry**                         | One row in `time_entries`: a block of time by one person on one project, optionally on one work item.                                                                              |
| **Timer**                         | An entry created by "start" whose end time is not yet set.                                                                                                                         |
| **Running**                       | `started_at IS NOT NULL AND ended_at IS NULL` (and not deleted).                                                                                                                   |
| **Manual entry**                  | An entry created through the "Log time" form, either duration-only or with start and end.                                                                                          |
| **Project time**                  | An entry with no work item (`issue_id IS NULL`).                                                                                                                                   |
| **Owner**                         | The `user` the time belongs to. This can differ from `created_by` when an admin logged it on the owner's behalf.                                                                   |
| **Loggable project**              | A project the actor may create entries in: not archived and not deleted, and the actor is an active project Admin or Member. Workspace admins can log _for others_ in any project. |
| **`spent_on`**                    | The calendar date the work counts towards, in the owner's timezone.                                                                                                                |
| **Workspace role / project role** | Plane roles: Admin = 20, Member = 15, Guest = 5 (`apps/api/plane/app/permissions/base.py:13`).                                                                                     |

---

## 4. Architecture overview

```
┌────────────────────────────── apps/web (React Router + MobX + SWR) ───────────────────────────────┐
│ Top nav: TimerWidget ─┐   Work item sidebar/peek: TimeProperty   Quick actions / Power K / Activity │
│                       ▼                                                                             │
│   TimerStore (MobX) ──┴──► TimeTrackingService (axios) ◄── SWR hooks (entries, totals, report, …)  │
│   /:ws/time-tracking/{timesheet|entries|reports}  ← filters live in the URL query string           │
└───────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                            │ /api/workspaces/<slug>/...
┌───────────────────────────────────────────▼──────────── apps/api ─────────────────────────────────┐
│ plane.time_tracking                                                                                │
│   urls.py → views/ (timer, entries, work_item, reports, timesheet, export, settings)               │
│   access.py (TimeTrackingAccess)   filters.py (TimeEntryFilterSet)   reports.py (aggregation)       │
│   services.py (start/stop/create/update rules)   serializers.py   export.py (ExportSchema)          │
│   tasks.py (auto-stop, activity)   signals.py (member removed / project archived)                  │
│   models.py (TimeEntry, ProjectTimeSetting)   migrations/0001_initial.py → depends on db.0124       │
│ Reuses: plane.db.models (Project, Issue, ProjectBaseModel, IssueActivity), BaseAPIView/BaseViewSet, │
│         BasePaginator, plane.utils.exporters, plane.utils.filters.filterset.BaseFilterSet            │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Upstream files touched (hook points only)

Keep every change in these files as small as possible. This is the list to re-check when rebasing onto a new upstream release.

| File                                                                                                                | Change                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/plane/settings/common.py` (INSTALLED_APPS, ~line 97)                                                      | Add `"plane.time_tracking"`.                                                                                                                            |
| `apps/api/plane/urls.py` (~line 19)                                                                                 | Add `path("api/", include("plane.time_tracking.urls"))` after the `plane.app.urls` include.                                                             |
| `apps/api/plane/celery.py` (`beat_schedule`, ~line 44)                                                              | Add the `stop-stale-timers` entry.                                                                                                                      |
| `apps/api/plane/db/models/workspace.py` (`UserPreferenceKeys`, ~line 420)                                           | Add `TIME_TRACKING = "time_tracking", "Time tracking"` so the sidebar nav item gets a preference row (no migration; see E11).                           |
| `apps/web/app/routes/extended.ts`                                                                                   | Register the time-tracking page, its redirect, and the project settings page. The file is empty today and `mergeRoutes` merges it into the core routes. |
| `apps/web/core/store/root.store.ts`                                                                                 | Add `timer: ITimerStore` and construct it in both the `constructor` and `resetOnSignOut`.                                                               |
| `apps/web/core/components/navigation/top-navigation-root.tsx`                                                       | Render `<TimerWidget />` before the Inbox button (~line 63).                                                                                            |
| `apps/web/core/components/issues/issue-detail/sidebar.tsx`                                                          | Add `<WorkItemTimeProperty />` after the Estimate row (~line 187).                                                                                      |
| `apps/web/core/components/issues/peek-overview/properties.tsx`                                                      | Same, near the Page property (~line 245).                                                                                                               |
| `apps/web/core/components/issues/issue-layouts/quick-action-dropdowns/helper.tsx` and the menu files in that folder | Add "Start/Stop timer" and "Log time…" menu items.                                                                                                      |
| `apps/web/core/components/issues/issue-detail/issue-activity/activity/activity-list.tsx`                            | Add a `case "time_entry"` that renders the new activity component.                                                                                      |
| `apps/web/core/components/issues/issue-layouts/utils.tsx`, `…/spreadsheet/columns/index.ts`                         | Register the "Time logged" spreadsheet column, following the fork's Page column (commit `590c736ba6`).                                                  |
| `packages/constants/src/issue/common.ts`, `packages/types/src/view-props.ts`                                        | Add the `time_logged` display property, exactly as `page` was added.                                                                                    |
| `packages/constants/src/workspace.ts` (~lines 201-229)                                                              | Add the `time_tracking` sidebar nav item to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS` and `_LINKS`.                                                  |
| `apps/web/core/components/workspace/sidebar/helper.tsx`                                                             | Add an icon `case "time_tracking"`.                                                                                                                     |
| `packages/constants/src/settings/project.ts`                                                                        | Add `features_time_tracking` to `PROJECT_SETTINGS` and to the FEATURES group of `GROUPED_PROJECT_SETTINGS`.                                             |
| `apps/web/core/components/settings/project/sidebar/item-icon.tsx`                                                   | Add an icon for `features_time_tracking`.                                                                                                               |
| `apps/web/core/components/power-k/config/commands.ts`                                                               | Register the time-tracking command group.                                                                                                               |
| `packages/types/src/index.ts`, `packages/constants/src/index.ts`, `packages/utils/src/index.ts`                     | Re-export the new modules.                                                                                                                              |
| `packages/i18n/src/constants/namespaces.ts`                                                                         | Add the `"time-tracking"` namespace.                                                                                                                    |
| `packages/utils/package.json`                                                                                       | Add `vitest` (from the pnpm catalog) and a `test` script.                                                                                               |

### 4.2 Conventions to follow

- **File headers:** every new `.py`, `.ts` and `.tsx` file starts with the same AGPL copyright header as its neighbours (see `COPYRIGHT_CHECK.md`). Migrations are exempt.
- **Backend views** extend `BaseAPIView` / `BaseViewSet` from `plane.app.views.base`. That gives session auth, user-timezone activation (`TimezoneMixin`), error handling and pagination.
- **Pagination:** `self.paginate(request=..., queryset=..., on_results=lambda rows: Serializer(rows, many=True).data, default_per_page=50, max_per_page=200)`. See `apps/api/plane/app/views/workspace/sticky.py:47`.
- **Frontend services** extend `APIService` and rethrow `err?.response?.data`, as in `apps/web/core/services/sticky.service.ts`.
- **Components** go under `apps/web/core/components/time-tracking/`. The fork puts feature components in `apps/web`, not `@plane/ui`.
- **UI strings** use `useTranslation()` with keys in the new `time-tracking` namespace (section 9.6).
- **Formatting:** the checkout uses CRLF line endings, which makes `oxfmt --check` report false failures (see `docs/deploying-from-source.md`). The real typecheck is the Docker image build.

---

## 5. Data model (`apps/api/plane/time_tracking/models.py`)

### 5.1 `TimeEntry`

Extends `plane.db.models.project.ProjectBaseModel`, which provides `id`, `project`, `workspace` (auto-set from the project), `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` and soft delete.

| Field              | Type                                                                      | Null | Notes                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`             | FK → `settings.AUTH_USER_MODEL`, `CASCADE`, `related_name="time_entries"` | no   | Owner of the time.                                                                                                                                                                        |
| `issue`            | FK → `db.Issue`, **`SET_NULL`**, `related_name="time_entries"`            | yes  | Empty means project time. `SET_NULL` keeps the hours when a work item is deleted. The soft-delete task already nulls `SET_NULL` relations (`apps/api/plane/bgtasks/deletion_task.py:50`). |
| `spent_on`         | `DateField`                                                               | no   | See 6.4.                                                                                                                                                                                  |
| `started_at`       | `DateTimeField`                                                           | yes  | Set for timers, and for manual entries in start/end mode.                                                                                                                                 |
| `ended_at`         | `DateTimeField`                                                           | yes  | Empty while running, and for duration-only manual entries.                                                                                                                                |
| `duration_seconds` | `PositiveIntegerField`                                                    | yes  | Empty only while running.                                                                                                                                                                 |
| `description`      | `TextField(blank=True, default="")`                                       | no   | Max 2,000 characters, enforced in the serializer.                                                                                                                                         |
| `is_billable`      | `BooleanField(default=False)`                                             | no   |                                                                                                                                                                                           |
| `source`           | `CharField(max_length=16, choices=Source)`                                | no   | `timer` or `manual`.                                                                                                                                                                      |
| `auto_stopped`     | `BooleanField(default=False)`                                             | no   | Set by the auto-stop job and lifecycle signals. Cleared when the owner edits or confirms the entry. Drives the "needs review" badge.                                                      |

`Meta`:

```python
db_table = "time_entries"
verbose_name = "Time Entry"
verbose_name_plural = "Time Entries"
ordering = ("-spent_on", "-started_at", "-created_at")
constraints = [
    # at most one running timer per person per workspace
    models.UniqueConstraint(
        fields=["workspace", "user"],
        condition=Q(started_at__isnull=False, ended_at__isnull=True, deleted_at__isnull=True),
        name="time_entry_one_running_timer_per_user",
    ),
    # a duration is required unless the entry is running
    models.CheckConstraint(
        condition=Q(duration_seconds__isnull=False) | Q(started_at__isnull=False, ended_at__isnull=True),
        name="time_entry_duration_unless_running",
    ),
    # a running entry has no duration yet
    models.CheckConstraint(
        condition=~Q(started_at__isnull=False, ended_at__isnull=True, duration_seconds__isnull=False),
        name="time_entry_running_has_no_duration",
    ),
    # an end needs a start, and must come after it
    models.CheckConstraint(
        condition=Q(ended_at__isnull=True) | Q(started_at__isnull=False, ended_at__gt=F("started_at")),
        name="time_entry_end_after_start",
    ),
    # 1 second .. 24 hours (the 60 second minimum for manual entries is an app-level rule)
    models.CheckConstraint(
        condition=Q(duration_seconds__isnull=True) | Q(duration_seconds__gte=1, duration_seconds__lte=86400),
        name="time_entry_duration_range",
    ),
]
indexes = [
    models.Index(fields=["workspace", "spent_on"], name="time_entry_ws_spent_on_idx"),
    models.Index(fields=["project", "spent_on"], name="time_entry_proj_spent_on_idx"),
    models.Index(fields=["user", "spent_on"], name="time_entry_user_spent_on_idx"),
]
```

(Django already indexes the `issue` and `user` foreign keys.) The API runs Django 5.2, so `CheckConstraint` takes `condition=`; the old `check=` argument is deprecated.

### 5.2 `ProjectTimeSetting`

One row per project, created lazily by the settings GET endpoint (`get_or_create`).

| Field              | Type                          | Notes                                                               |
| ------------------ | ----------------------------- | ------------------------------------------------------------------- |
| `default_billable` | `BooleanField(default=False)` | Pre-fills the billable toggle for new entries in this project (A3). |

`Meta`: `db_table = "project_time_settings"`, plus `UniqueConstraint(fields=["project"], condition=Q(deleted_at__isnull=True), name="project_time_setting_unique_project_when_deleted_at_null")`.

### 5.3 Migration

- `apps/api/plane/time_tracking/migrations/0001_initial.py`, generated with `python manage.py makemigrations time_tracking` inside the API container.
- Dependencies: `("db", "0124_issuepage_single_page_per_issue")` and `migrations.swappable_dependency(settings.AUTH_USER_MODEL)`.
- No data migration (E5).
- Note: pytest runs with `--nomigrations` (`apps/api/pytest.ini`), so tests build tables straight from the models. Check the real migration separately with `makemigrations --check` and by applying it to a copy of production data (section 12).

---

## 6. Business rules

### 6.1 Roles and permissions

"Project admin" means an active `ProjectMember` with role 20. "Workspace admin" means an active `WorkspaceMember` with role 20.

| Action                                        | Workspace Guest | Workspace Member, not in project | Project Guest           | Project Member | Project Admin     | Workspace Admin                  |
| --------------------------------------------- | --------------- | -------------------------------- | ----------------------- | -------------- | ----------------- | -------------------------------- |
| See the time-tracking UI and nav item         | ✗               | ✓                                | ✓ (if workspace Member) | ✓              | ✓                 | ✓                                |
| View entries, timesheets and reports          | ✗               | ✓ Public projects only (A2)      | ✓                       | ✓              | ✓                 | ✓ everything                     |
| Start a timer / log own time in the project   | ✗               | ✗                                | ✗                       | ✓              | ✓                 | ✓ only if a project Admin/Member |
| Log time **for someone else** in the project  | ✗               | ✗                                | ✗                       | ✗              | ✓                 | ✓ (any project)                  |
| Edit / delete **own** entries                 | ✗               | ✗ (read-only once removed)       | ✗                       | ✓              | ✓                 | ✓                                |
| Edit / delete **others'** entries             | ✗               | ✗                                | ✗                       | ✗              | ✓ in that project | ✓                                |
| Change an entry's owner (`user`)              | ✗               | ✗                                | ✗                       | ✗              | ✓ in that project | ✓                                |
| Edit project time settings (default billable) | ✗               | ✗                                | ✗                       | ✗              | ✓                 | ✓                                |
| Export                                        | ✗               | same scope as View               |                         |                |                   |                                  |

**Target-user rule for logging on behalf:** the owner must be an active project Admin or Member of the entry's project.

**Running timers:** only the owner can edit, stop or discard their running timer. Admins can delete it. The auto-stop job is the backstop for forgotten timers.

### 6.2 Visibility (one function, used by every read endpoint)

Implement `TimeTrackingAccess` in `plane/time_tracking/access.py`. Build it once per request and cache the role lookups.

```python
class TimeTrackingAccess:
    def __init__(self, user, slug): ...
    # cached: workspace role, {project_id: project_role} for the user's active memberships
    def can_view(self) -> bool                # workspace role in (Admin, Member)            (A1)
    def visible_entries(self) -> QuerySet     # TimeEntry.objects in workspace, project not deleted, and:
                                              #   workspace admin → everything
                                              #   else → project.network == 2 (Public) OR user is an active project member  (A2)
    def can_log_own(self, project) -> bool    # active project role in (Admin, Member), project not archived
    def can_log_for(self, project, target_user) -> bool  # (project admin or workspace admin) and target is an active Admin/Member of the project
    def can_edit(self, entry) -> bool         # owner and can_log_own(entry.project), or project admin of entry.project, or workspace admin
    def can_manage_settings(self, project) -> bool
```

Every response that lists entries includes `can_edit` per row, computed from this object, so the UI never re-implements the rules.

Archived projects stay visible in reports. History matters, and they're shown with an "Archived" marker. Deleted projects disappear because their entries are soft-deleted along with them.

### 6.3 Timer lifecycle

```
           start (no timer running)                     stop (elapsed ≥ 60 s)
 (idle) ───────────────────────────────► RUNNING ─────────────────────────────► COMPLETED (source=timer)
   ▲      start (a timer is running):        │  stop (elapsed < 60 s) → entry deleted, response says "discarded"
   │      the current one stops first, then  │  elapsed reaches 12 h (job / stop / signal) → ended_at = started_at + 12 h,
   │      the new one starts (one transaction)│                                              auto_stopped = true
   └──────────────────────────────────────────┘  discard (owner) → soft delete
```

- **Start:** inside `transaction.atomic()`:
  1. Lock any running entry for (workspace, user) with `select_for_update()` and stop it using the stop rules.
  2. Create the new entry: `source=timer`, `started_at=now`, `spent_on` = the owner's local date at `now`, `is_billable` = the request value or else the project's `default_billable`.
  - If the unique constraint still fires (a race), return **409 `TIMER_CONFLICT`**. The client re-fetches.
- **Stop:**
  1. `elapsed = now - started_at`.
  2. If `elapsed > 12 h`: set `ended_at = started_at + 12 h`, `auto_stopped = True`.
  3. Otherwise, if `elapsed < 60 s`: soft-delete the entry and return `discarded: true` (A4).
  4. Otherwise: set `ended_at = now` and `duration_seconds = floor(elapsed)`. `spent_on` stays the start date (A5).
  5. Optionally set `description` from the request.
- **Edit while running** (owner only): `description`, `issue_id`, `project_id`, `is_billable`, `started_at`. A new `started_at` must satisfy `now − 12 h ≤ started_at ≤ now`; this is for "I forgot to start it 10 minutes ago". Changing `started_at` recomputes `spent_on`.
- **Discard** (owner only): soft-deletes the running entry.

### 6.4 `spent_on` derivation

| Case                   | `spent_on`                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Timer                  | The local date of `started_at` in the **owner's** `user_timezone` at creation.                      |
| Manual, start/end mode | The local date of `started_at` in the **owner's** timezone. Ignore any `spent_on` the client sends. |
| Manual, duration mode  | Taken from the request as given.                                                                    |

`spent_on` never changes when the owner later changes timezone.

### 6.5 Manual entries

Exactly one of two modes:

- **Duration mode:** `spent_on` + `duration_seconds`. `started_at` and `ended_at` stay empty.
- **Start/end mode:** `started_at` + `ended_at`. `duration_seconds = ended_at - started_at`. The UI only offers same-day start/end; use duration mode for work that crosses midnight.

**PATCH semantics:**

| Patched field(s)                        | Result                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| `duration_seconds` on a start/end entry | Keep `started_at`, recompute `ended_at = started_at + duration`.      |
| `started_at` / `ended_at`               | Recompute `duration_seconds` and `spent_on`.                          |
| `spent_on` on an entry that has times   | Rejected with `SPENT_ON_DERIVED`; move the start time instead.        |
| Any field edited by the owner           | Clears `auto_stopped`.                                                |
| `{ "confirm": true }` from the owner    | Clears `auto_stopped` without changing anything else ("Looks right"). |

### 6.6 Validation rules and error codes

All errors return `{"error": "<human message>", "code": "<CODE>", "field": "<optional field name>"}`.

| Code                             | HTTP | Rule                                                                                                                                                                                                                                                                        |
| -------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FORBIDDEN`                      | 403  | Fails the `TimeTrackingAccess` check for this action.                                                                                                                                                                                                                       |
| `PROJECT_NOT_LOGGABLE`           | 403  | The project is archived or deleted, or the actor (or target) isn't an active project Admin/Member.                                                                                                                                                                          |
| `TARGET_USER_NOT_PROJECT_MEMBER` | 400  | `user_id` isn't an active Admin/Member of the project.                                                                                                                                                                                                                      |
| `ISSUE_NOT_IN_PROJECT`           | 400  | The work item doesn't belong to `project_id`. If only `issue_id` is sent, the project is taken from the issue.                                                                                                                                                              |
| `ISSUE_NOT_LOGGABLE`             | 400  | The work item is archived, a draft, in triage/intake, or deleted. Check with `Issue.issue_objects`, which excludes all of these (`db/models/issue.py:~97`). It only applies when _setting_ or _changing_ the issue; existing entries on later-archived items stay editable. |
| `AMBIGUOUS_ENTRY_MODE`           | 400  | Both or neither of {`duration_seconds`} and {`started_at`, `ended_at`} were sent on create.                                                                                                                                                                                 |
| `DURATION_OUT_OF_RANGE`          | 400  | Manual: below 60 s or above 86,400 s. Start/end mode: the computed duration is out of range.                                                                                                                                                                                |
| `INVALID_TIME_RANGE`             | 400  | `ended_at <= started_at`.                                                                                                                                                                                                                                                   |
| `FUTURE_TIME`                    | 400  | `spent_on` is after the owner's local today, or `ended_at > now + 60 s`, or a running timer's `started_at > now`.                                                                                                                                                           |
| `SPENT_ON_DERIVED`               | 400  | See 6.5.                                                                                                                                                                                                                                                                    |
| `DESCRIPTION_TOO_LONG`           | 400  | Over 2,000 characters.                                                                                                                                                                                                                                                      |
| `TIMER_NOT_RUNNING`              | 404  | Stop/patch/discard was called with no running timer.                                                                                                                                                                                                                        |
| `TIMER_CONFLICT`                 | 409  | Lost the race on the unique constraint.                                                                                                                                                                                                                                     |
| `NOT_RUNNING_ENTRY`              | 400  | A timer-only operation was attempted on a completed entry.                                                                                                                                                                                                                  |
| `BULK_LIMIT`                     | 400  | More than 500 IDs in a bulk request.                                                                                                                                                                                                                                        |
| `EXPORT_TOO_LARGE`               | 400  | The export would exceed 50,000 rows.                                                                                                                                                                                                                                        |

No overlap validation in v1: overlapping entries are allowed. A later enhancement can show a warning.

### 6.7 Constants (one place on each side)

| Name                      | Value  | Backend                      | Frontend                        |
| ------------------------- | ------ | ---------------------------- | ------------------------------- |
| `TIME_ENTRY_MAX_SECONDS`  | 86,400 | `time_tracking/constants.py` | `@plane/constants`              |
| `TIMER_AUTO_STOP_SECONDS` | 43,200 | ✓                            | ✓ (the widget warns after 10 h) |
| `TIMER_MIN_SECONDS`       | 60     | ✓                            | ✓                               |
| `MANUAL_MIN_SECONDS`      | 60     | ✓                            | ✓                               |
| `DESCRIPTION_MAX_LENGTH`  | 2,000  | ✓                            | ✓                               |
| `TIME_ENTRIES_PER_PAGE`   | 50     | ✓                            | ✓                               |
| `BULK_MAX_IDS`            | 500    | ✓                            | ✓                               |
| `EXPORT_MAX_ROWS`         | 50,000 | ✓                            | –                               |
| `REPORT_MAX_GROUPS`       | 500    | ✓                            | –                               |

### 6.8 Lifecycle side effects (`time_tracking/signals.py`, connected in `AppConfig.ready()`)

| Trigger                                                 | Effect                                                                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post_save` on `ProjectMember` with `is_active=False`   | Stop that member's running timer if it's in that project (`auto_stopped=True`).                                                                                                                             |
| `post_save` on `WorkspaceMember` with `is_active=False` | Stop that member's running timer in that workspace. Needed because workspace removal deactivates project memberships with a bulk `.update()`, which fires no signal (`app/views/workspace/member.py:~145`). |
| `post_save` on `Project` with `archived_at` set         | Stop all running timers in that project.                                                                                                                                                                    |
| `Issue` soft-deleted                                    | Nothing to code: the existing deletion task sets `time_entries.issue_id` to empty (`SET_NULL`).                                                                                                             |
| `Project` soft-deleted                                  | Nothing to code: the deletion task soft-deletes its entries (`CASCADE`).                                                                                                                                    |

All of these use one domain function, `services.stop_timer(entry, at=now, auto=True)`. The 60 s discard and 12 h cap rules apply.

---

## 7. Backend API

### 7.1 Conventions

- Base path: `/api/workspaces/<slug>/…`. All endpoints use session auth.
- IDs are UUID strings. Datetimes are ISO-8601 UTC. Dates are `YYYY-MM-DD`.
- Every endpoint first checks `access.can_view()` (403 `FORBIDDEN` for Guests and non-members).
- List endpoints use `BasePaginator` cursors (`?cursor=…&per_page=…`) and return Plane's usual `{results, next_cursor, prev_cursor, next_page_results, prev_page_results, total_pages, count, …}` shape.

### 7.2 Endpoint list

| #   | Method & path                                               | Purpose                                               | Permission                 |
| --- | ----------------------------------------------------------- | ----------------------------------------------------- | -------------------------- |
| 1   | `GET time-entries/timer/`                                   | My running timer                                      | view                       |
| 2   | `POST time-entries/timer/start/`                            | Start (stops the current one first)                   | log own                    |
| 3   | `POST time-entries/timer/stop/`                             | Stop                                                  | owner                      |
| 4   | `PATCH time-entries/timer/`                                 | Edit my running timer                                 | owner                      |
| 5   | `DELETE time-entries/timer/`                                | Discard my running timer                              | owner                      |
| 6   | `GET time-entries/`                                         | List with filters                                     | view                       |
| 7   | `POST time-entries/`                                        | Create a manual entry (optional `user_id` for admins) | log own / log for          |
| 8   | `GET time-entries/<id>/`                                    | Retrieve                                              | view (visible)             |
| 9   | `PATCH time-entries/<id>/`                                  | Update                                                | `can_edit`                 |
| 10  | `DELETE time-entries/<id>/`                                 | Soft delete                                           | `can_edit`                 |
| 11  | `POST time-entries/bulk/`                                   | Bulk delete or set billable                           | `can_edit` on **every** ID |
| 12  | `GET time-entries/summary/`                                 | Headline numbers                                      | view                       |
| 13  | `GET time-entries/report/`                                  | Grouped aggregates                                    | view                       |
| 14  | `GET time-entries/timesheet/`                               | Week grid for one person                              | view                       |
| 15  | `GET time-entries/export/`                                  | CSV / XLSX download                                   | view                       |
| 16  | `GET projects/<project_id>/time-entries/issue-totals/`      | `{issue_id: seconds}` for the spreadsheet column      | view                       |
| 17  | `GET projects/<project_id>/issues/<issue_id>/time-entries/` | Work item time panel                                  | view                       |
| 18  | `GET projects/<project_id>/time-settings/`                  | Project defaults (`get_or_create`)                    | view                       |
| 19  | `PATCH projects/<project_id>/time-settings/`                | Update project defaults                               | manage settings            |

Register the routes in `plane/time_tracking/urls.py` with `name=` values prefixed `time-tracking-…` (for `reverse()` in tests). Declare the fixed paths (`timer/`, `bulk/`, `summary/`, `report/`, `timesheet/`, `export/`) **before** `time-entries/<uuid:pk>/`.

### 7.3 Shapes

**TimeEntry (read).** Returned everywhere an entry appears.

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "project_id": "uuid",
  "issue_id": "uuid | null",
  "user_id": "uuid",
  "spent_on": "2026-10-07",
  "started_at": "2026-10-07T08:00:00Z | null",
  "ended_at": "2026-10-07T09:30:00Z | null",
  "duration_seconds": 5400,
  "description": "Code review",
  "is_billable": true,
  "source": "timer",
  "auto_stopped": false,
  "is_running": false,
  "created_by_id": "uuid",
  "created_at": "…",
  "updated_at": "…",
  "issue_detail": {
    "id": "uuid",
    "sequence_id": 42,
    "name": "Fix login",
    "project_identifier": "WEB",
    "state_group": "started",
    "is_archived": false
  },
  "can_edit": true
}
```

`issue_detail` is `null` for project time. Use `select_related("issue", "issue__state", "project")` so lists don't trigger extra queries per row.

**1. `GET time-entries/timer/`**

```json
{ "timer": "TimeEntry | null", "server_now": "2026-10-07T10:15:03Z", "needs_review_count": 1 }
```

`needs_review_count` counts the requester's entries with `auto_stopped=true`.

**2. `POST time-entries/timer/start/`**

Request:

```json
{ "project_id": "uuid (optional if issue_id given)", "issue_id": "uuid | null", "description": "", "is_billable": null }
```

`is_billable: null` means "use the project default". Response **201**:

```json
{ "timer": "TimeEntry", "stopped": "TimeEntry | null", "stopped_discarded": false, "server_now": "…" }
```

**3. `POST time-entries/timer/stop/`**

Request: `{ "description": "optional" }`. Response **200**:

```json
{ "entry": "TimeEntry | null", "discarded": false, "server_now": "…" }
```

Returns 404 `TIMER_NOT_RUNNING` if no timer is running.

**4. `PATCH time-entries/timer/`**

Request: any of `description`, `issue_id`, `project_id`, `is_billable`, `started_at`. Returns `{ "timer": "TimeEntry" }`.

**5. `DELETE time-entries/timer/`**

Returns 204.

**7. `POST time-entries/`**

Request:

```json
{
  "project_id": "uuid",
  "issue_id": "uuid | null",
  "user_id": "uuid (optional; admins only; defaults to requester)",
  "spent_on": "2026-10-06",
  "duration_seconds": 5400,
  "started_at": null,
  "ended_at": null,
  "description": "…",
  "is_billable": null
}
```

Returns **201** with a TimeEntry. `created_by` is always the requester.

**9. `PATCH time-entries/<id>/`**

Accepts any subset of `project_id`, `issue_id`, `user_id` (admins only), `spent_on`, `duration_seconds`, `started_at`, `ended_at`, `description`, `is_billable`, `confirm` (owner only; clears `auto_stopped`). Changing `project_id` without `issue_id` clears `issue_id` unless the existing issue belongs to the new project.

**11. `POST time-entries/bulk/`**

Request:

```json
{ "action": "delete | set_billable", "ids": ["uuid", "…"], "is_billable": true }
```

All-or-nothing: if any ID is invisible or not editable, return 403 and change nothing. Response: `{ "updated": 12 }`.

**12. `GET time-entries/summary/?<filters>`**

```json
{
  "total_seconds": 360000,
  "billable_seconds": 250000,
  "non_billable_seconds": 110000,
  "entry_count": 140,
  "user_count": 6,
  "project_count": 4,
  "issue_count": 57,
  "no_issue_seconds": 18000,
  "active_days": 22,
  "avg_seconds_per_user_day": 24500,
  "running_count": 2,
  "auto_stopped_count": 1,
  "previous": { "date_from": "…", "date_to": "…", "total_seconds": 300000, "billable_seconds": 200000 }
}
```

- `previous` is filled only when both `date_from` and `date_to` are given. It covers an equally long window ending the day before `date_from`, with the same other filters.
- `avg_seconds_per_user_day` = total ÷ number of distinct (user, `spent_on`) pairs.
- Everything except `running_count` and `auto_stopped_count` **excludes running entries**.

**13. `GET time-entries/report/?group_by=…&sub_group_by=…&interval=…&week_start=…&<filters>`**

See 7.5 for the dimensions. Response:

```json
{
  "group_by": "project",
  "sub_group_by": "user",
  "interval": null,
  "multi_valued": false,
  "total_seconds": 360000,
  "billable_seconds": 250000,
  "groups": [
    {
      "key": "uuid | null | 2026-10-05 | high | true",
      "label": "Website",
      "total_seconds": 120000,
      "billable_seconds": 90000,
      "entry_count": 37,
      "sub_groups": [
        { "key": "uuid", "label": "Ana Silva", "total_seconds": 60000, "billable_seconds": 50000, "entry_count": 20 }
      ]
    }
  ]
}
```

- Groups are sorted by `total_seconds` descending, except the `date` dimension, which is sorted ascending.
- If `group_by=date` and both dates are given, empty buckets are filled in with zeros so charts have a continuous axis.
- `multi_valued=true` when either dimension is many-to-many (label, module, assignee). An entry then counts toward each of its values, so group totals can add up to more than `total_seconds`, which is always the true total.
- Running entries are excluded.

**14. `GET time-entries/timesheet/?week_start_date=2026-10-05&user_id=<uuid>`**

`user_id` defaults to the requester. `week_start_date` must be a date. The client sends the first day of the week according to the viewer's start-of-week setting. Response:

```json
{
  "user_id": "uuid",
  "week_start_date": "2026-10-05",
  "days": ["2026-10-05", "…7 dates…"],
  "rows": [
    {
      "project_id": "uuid",
      "issue_id": "uuid | null",
      "issue_detail": "{…} | null",
      "total_seconds": 27000,
      "cells": {
        "2026-10-05": {
          "total_seconds": 5400,
          "entries": [
            {
              "id": "uuid",
              "duration_seconds": 5400,
              "source": "manual",
              "has_times": false,
              "is_running": false,
              "description": "…",
              "can_edit": true
            }
          ]
        }
      }
    }
  ],
  "day_totals": { "2026-10-05": 28800 },
  "total_seconds": 144000,
  "running_entry_id": "uuid | null"
}
```

Rows are grouped by (project, issue) and sorted by project name, then issue `sequence_id`, with project-time rows first within each project. A running entry appears in its cell with `is_running=true` and `duration_seconds=null`; the client adds the live elapsed time.

**15. `GET time-entries/export/?format=csv|xlsx&<filters>`**

- Responds with `Content-Disposition: attachment; filename="time-entries-<slug>-<from>-<to>.<ext>"`.
- Built with `plane.utils.exporters.Exporter(format_type=…, schema_class=TimeEntryExportSchema)`.
- Columns, in order: Date, Person, Person email, Project, Project identifier, Work item ID (`WEB-42`), Work item title, Description, Start (owner's local time), End, Duration (h:mm), Duration (decimal hours, 2 dp), Billable, Source, Logged by, Created at.
- Running entries are excluded.
- If more than `EXPORT_MAX_ROWS`, return 400 `EXPORT_TOO_LARGE`.

**16. `GET projects/<pid>/time-entries/issue-totals/`**

Returns `{ "<issue_id>": 5400, … }`, covering only work items with completed time.

**17. `GET projects/<pid>/issues/<iid>/time-entries/`**

```json
{
  "total_seconds": 27000,
  "billable_seconds": 20000,
  "entry_count": 9,
  "by_user": [{ "user_id": "uuid", "total_seconds": 18000 }],
  "entries": ["TimeEntry (latest 50, including a running one at the top)"],
  "running": ["TimeEntry (all running timers on this item, any user)"]
}
```

**18/19. `GET` / `PATCH projects/<pid>/time-settings/`**

Body and response: `{ "project_id": "uuid", "default_billable": false }`.

### 7.4 Filters (query parameters, identical on endpoints 6 and 12-15)

Implement as `TimeEntryFilterSet(BaseFilterSet)` in `time_tracking/filters.py` (base class: `apps/api/plane/utils/filters/filterset.py:33`). Apply it with `TimeEntryFilterSet(request.GET, queryset=access.visible_entries()).qs`.

| Param                          | Type                                                                                                                | Matches                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `date_from`, `date_to`         | date                                                                                                                | `spent_on` range, inclusive                                                                                                           |
| `user_ids`                     | csv UUIDs                                                                                                           | `user_id__in`                                                                                                                         |
| `logged_by_ids`                | csv UUIDs                                                                                                           | `created_by_id__in`                                                                                                                   |
| `project_ids`                  | csv UUIDs                                                                                                           | `project_id__in`                                                                                                                      |
| `issue_ids`                    | csv UUIDs                                                                                                           | `issue_id__in`                                                                                                                        |
| `has_issue`                    | `true`/`false`                                                                                                      | `issue__isnull` (negated)                                                                                                             |
| `label_ids`                    | csv UUIDs                                                                                                           | Work item has any of the labels (live `IssueLabel` rows)                                                                              |
| `state_ids`                    | csv UUIDs                                                                                                           | `issue__state_id__in`                                                                                                                 |
| `state_groups`                 | csv                                                                                                                 | `issue__state__group__in`                                                                                                             |
| `cycle_ids`                    | csv UUIDs                                                                                                           | Work item is in any of the cycles (live `CycleIssue` rows)                                                                            |
| `module_ids`                   | csv UUIDs                                                                                                           | Work item is in any of the modules (live `ModuleIssue` rows)                                                                          |
| `priorities`                   | csv                                                                                                                 | `issue__priority__in`                                                                                                                 |
| `assignee_ids`                 | csv UUIDs                                                                                                           | Work item assigned to any of them (live `IssueAssignee` rows)                                                                         |
| `is_billable`                  | `true`/`false`                                                                                                      |                                                                                                                                       |
| `source`                       | `timer`/`manual`                                                                                                    |                                                                                                                                       |
| `needs_review`                 | `true`                                                                                                              | `auto_stopped=True`                                                                                                                   |
| `include_running`              | `true`/`false`                                                                                                      | List endpoint only. Default `true` for the list, always `false` for aggregates.                                                       |
| `min_duration`, `max_duration` | int seconds                                                                                                         | `duration_seconds` range                                                                                                              |
| `search`                       | string                                                                                                              | `description__icontains` OR `issue__name__icontains` OR a work item key like `WEB-42` (split into project identifier + `sequence_id`) |
| `order_by` (list only)         | one of `-spent_on` (default), `spent_on`, `-duration_seconds`, `duration_seconds`, `user`, `project`, `-created_at` | Ties are broken by `-started_at, -created_at`.                                                                                        |

Many-to-many filters must use `.filter(id__in=Subquery(...))` or `Exists(...)` to avoid duplicate rows, and must ignore soft-deleted link rows (`deleted_at__isnull=True`).

### 7.5 Report dimensions (`time_tracking/reports.py`)

| `group_by`    | Group key                            | Label                                 | Many-to-many | Label for empty values |
| ------------- | ------------------------------------ | ------------------------------------- | ------------ | ---------------------- |
| `user`        | `user_id`                            | `user.display_name`                   | no           | –                      |
| `project`     | `project_id`                         | `project.name`                        | no           | –                      |
| `issue`       | `issue_id`                           | `"{identifier}-{sequence_id} {name}"` | no           | "No work item"         |
| `label`       | `issue.label_issue.label_id`\*       | label name                            | **yes**      | "No label"             |
| `state`       | `issue.state_id`                     | state name                            | no           | "No work item"         |
| `state_group` | `issue.state.group`                  | group name                            | no           | "No work item"         |
| `cycle`       | `issue.issue_cycle.cycle_id`\*       | cycle name                            | no\*\*       | "No cycle"             |
| `module`      | `issue.issue_module.module_id`\*     | module name                           | **yes**      | "No module"            |
| `priority`    | `issue.priority`                     | priority                              | no           | "No work item"         |
| `assignee`    | `issue.issue_assignee.assignee_id`\* | display name                          | **yes**      | "Unassigned"           |
| `billable`    | `is_billable`                        | "Billable" / "Non-billable"           | no           | –                      |
| `source`      | `source`                             | "Timer" / "Manual"                    | no           | –                      |
| `date`        | bucket of `spent_on` (see below)     | ISO date                              | no           | –                      |

\* Join through `FilteredRelation(..., condition=Q(...deleted_at__isnull=True))` so that soft-deleted links are ignored **and** entries with no link still show up (LEFT JOIN) in the "No …" bucket. `apps/api/plane/utils/build_chart.py` uses the same `deleted_at` conditions, but as plain filters; a plain filter would drop the "No …" bucket, which is why this needs `FilteredRelation`.
\*\* A work item belongs to at most one live cycle.

**Date buckets:**

| `interval` | Bucket                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `day`      | `spent_on`                                                                                                                                                                                                                                                                                                                                               |
| `month`    | `TruncMonth("spent_on")`                                                                                                                                                                                                                                                                                                                                 |
| `week`     | The week start for `week_start ∈ 0..6` (0 = Sunday, same as `Profile.START_OF_THE_WEEK_CHOICES` and Postgres `EXTRACT(DOW)`), computed as `spent_on - ((EXTRACT(DOW FROM spent_on)::int - week_start + 7) % 7)`. Implement as a small `Func`/`RawSQL` expression and unit-test it. `week_start` defaults to the requester's `profile.start_of_the_week`. |

`sub_group_by` takes any dimension except the one used for `group_by`. Aggregate with `.values(<group key>, <sub key>).annotate(total=Sum("duration_seconds"), billable=Sum("duration_seconds", filter=Q(is_billable=True)), count=Count("id", distinct=True))`, then nest the rows in Python. Resolve labels in one extra query per dimension, not per row.

---

## 8. Background jobs and activity

### 8.1 Auto-stop job

- Task: `plane.time_tracking.tasks.stop_stale_timers`. Discovered automatically: `celery.py` calls `app.autodiscover_tasks()`.
- Schedule: add to `app.conf.beat_schedule` in `apps/api/plane/celery.py`:

  ```python
  "stop-stale-timers": {"task": "plane.time_tracking.tasks.stop_stale_timers", "schedule": crontab(minute="*/15")}
  ```

- Logic: for every running entry with `started_at <= now - 12h`, set `ended_at = started_at + 12h`, `duration_seconds = 43200`, `auto_stopped = True`. Use `bulk_update` in chunks, then record the work-item activity (8.2).
- Because the end time is exactly start + 12 h, the result is the same no matter when the job runs. The stop endpoint applies the same cap, so a broken scheduler can't create entries longer than 12 h.

### 8.2 Work item activity

- Task: `plane.time_tracking.tasks.record_time_entry_activity(entry_id, verb, actor_id, old_seconds, new_seconds, old_issue_id, epoch)`.
- It creates `plane.db.models.IssueActivity` rows **directly**, so upstream's `issue_activities_task.py` stays untouched. No notifications are sent.
- Record activity when:
  - an entry **with a duration** and an issue is created (manual create or timer stop) → `verb="created"`
  - its duration or issue changes → `"updated"`; if the issue changed, write `"deleted"` on the old issue and `"created"` on the new one
  - it's deleted → `"deleted"`
- Running timers record nothing until they stop. Project-time entries record nothing.
- Row fields:

| Field                                    | Value                                                   |
| ---------------------------------------- | ------------------------------------------------------- |
| `issue_id`, `project_id`, `workspace_id` | From the entry                                          |
| `actor_id`                               | Who did it (the admin, when acting on someone's behalf) |
| `verb`                                   | `created`, `updated` or `deleted`                       |
| `field`                                  | `"time_entry"`                                          |
| `old_value` / `new_value`                | Durations in seconds, as strings                        |
| `new_identifier`                         | Entry ID                                                |
| `old_identifier`                         | Owner user ID                                           |
| `comment`                                | English fallback text, e.g. `"logged 1h 30m"`           |
| `epoch`                                  | Event time                                              |

### 8.3 Sidebar navigation preference

Adding `TIME_TRACKING` to `WorkspaceUserPreference.UserPreferenceKeys` makes the existing preferences endpoint (`app/views/workspace/user_preference.py:33`) create the row for each user on their next load. It's **not pinned** by default, same as Analytics.

---

## 9. Frontend

### 9.1 Shared packages

**`packages/types/src/time-tracking.ts`** (export from `packages/types/src/index.ts`):

```ts
export type TTimeEntrySource = "timer" | "manual";
export type TTimeEntryIssueDetail = {
  id: string;
  sequence_id: number;
  name: string;
  project_identifier: string;
  state_group: TStateGroups;
  is_archived: boolean;
};
export type TTimeEntry = {
  id;
  workspace_id;
  project_id;
  issue_id: string | null;
  user_id;
  spent_on: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  description: string;
  is_billable: boolean;
  source: TTimeEntrySource;
  auto_stopped: boolean;
  is_running: boolean;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  issue_detail: TTimeEntryIssueDetail | null;
  can_edit: boolean;
};
export type TTimerResponse = { timer: TTimeEntry | null; server_now: string; needs_review_count: number };
export type TStartTimerPayload = {
  project_id?: string;
  issue_id?: string | null;
  description?: string;
  is_billable?: boolean | null;
};
export type TStartTimerResponse = {
  timer: TTimeEntry;
  stopped: TTimeEntry | null;
  stopped_discarded: boolean;
  server_now: string;
};
export type TStopTimerResponse = { entry: TTimeEntry | null; discarded: boolean; server_now: string };
export type TTimeEntryCreatePayload = {
  project_id: string;
  issue_id?: string | null;
  user_id?: string;
  description?: string;
  is_billable?: boolean | null;
} & ({ spent_on: string; duration_seconds: number } | { started_at: string; ended_at: string });
export type TTimeEntryUpdatePayload = Partial<{ /* fields per 7.3 #9 */ confirm: boolean }>;
export type TTimeEntryFilters = {
  date_from?;
  date_to?;
  user_ids?: string[];
  logged_by_ids?;
  project_ids?;
  issue_ids?;
  has_issue?: boolean;
  label_ids?;
  state_ids?;
  state_groups?;
  cycle_ids?;
  module_ids?;
  priorities?;
  assignee_ids?;
  is_billable?: boolean;
  source?: TTimeEntrySource;
  needs_review?: boolean;
  min_duration?: number;
  max_duration?: number;
  search?: string;
  order_by?: TTimeEntryOrderBy;
};
export type TTimeReportDimension =
  | "user"
  | "project"
  | "issue"
  | "label"
  | "state"
  | "state_group"
  | "cycle"
  | "module"
  | "priority"
  | "assignee"
  | "billable"
  | "source"
  | "date";
export type TTimeReportInterval = "day" | "week" | "month";
export type TTimeReportGroup = {
  key: string | null;
  label: string;
  total_seconds: number;
  billable_seconds: number;
  entry_count: number;
  sub_groups?: TTimeReportGroup[];
};
export type TTimeReport = {
  group_by;
  sub_group_by: TTimeReportDimension | null;
  interval: TTimeReportInterval | null;
  multi_valued: boolean;
  total_seconds;
  billable_seconds;
  groups: TTimeReportGroup[];
};
export type TTimeSummary = {
  /* per 7.3 #12 */
};
export type TTimesheet = {
  /* per 7.3 #14 */
};
export type TWorkItemTime = {
  /* per 7.3 #17 */
};
export type TProjectTimeSettings = { project_id: string; default_billable: boolean };
export type TTimeDatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "custom";
```

Also add `time_logged?: boolean` to `IIssueDisplayProperties` in `packages/types/src/view-props.ts`.

**`packages/constants/src/time-tracking.ts`** (export from the index):

- The limits from 6.7.
- `TIME_DATE_PRESETS`: key + i18n key, in menu order.
- `TIME_REPORT_DIMENSIONS`: key, i18n key, `multiValued`, and `requiresIssue`, which greys the option out when the "no work item" filter is on.
- `TIME_REPORT_INTERVALS`.
- `TIME_ENTRY_ORDER_BY_OPTIONS`.
- `TIME_TRACKING_TABS = ["timesheet", "entries", "reports"]`.

Also update `packages/constants/src/issue/common.ts`: add `time_logged` to `ISSUE_DISPLAY_PROPERTIES_KEYS`, `ISSUE_DISPLAY_PROPERTIES` (`titleTranslationKey: "time-tracking.display_property"`), `SPREADSHEET_PROPERTY_LIST` and `SPREADSHEET_PROPERTY_DETAILS` (`disableSorting: true`, icon `"TimerIcon"`). This mirrors how `page` was added in `590c736ba6`.

**`packages/utils/src/time-tracking.ts`** (export from the index; see Appendix A/B):

- `parseDurationInput(input: string): number | null` returns seconds, rounded to the minute, or `null` if invalid or out of range.
- `formatDuration(seconds: number, style: "short" | "clock" | "decimal" = "short"): string`:
  - `"short"` → `1h 30m`, `45m`, `0m`
  - `"clock"` → `1:30`
  - `"decimal"` → `1.50`
- `formatElapsed(seconds): string` → `1:23:45`, for running timers.
- `getDatePresetRange(preset, { today: Date, startOfWeek: number }): { from: string; to: string }`
- `getWeekStartDate(date: Date, startOfWeek: number): string` and `getWeekDays(weekStartDate: string): string[]`
- `getElapsedSeconds(startedAtIso: string, nowMs: number, clockOffsetMs: number): number`

Add `vitest` to `packages/utils` (`devDependencies: { "vitest": "catalog:" }`, `"test": "vitest run"`) and write `src/time-tracking.test.ts`. The repo already has a turbo `test` task (`turbo.json:88`), and `apps/live` has a vitest config to copy.

### 9.2 Service, state and data hooks (`apps/web/core`)

**Service: `services/time-tracking.service.ts`**

`TimeTrackingService extends APIService`, with one method per endpoint in 7.2:

`getTimer`, `startTimer`, `stopTimer`, `updateTimer`, `discardTimer`, `listEntries(params)`, `createEntry`, `getEntry`, `updateEntry`, `deleteEntry`, `bulk`, `getSummary`, `getReport`, `getTimesheet`, `getProjectIssueTotals`, `getWorkItemTime`, `getProjectTimeSettings`, `updateProjectTimeSettings`, `getExportUrl(params)`.

Serialize arrays as comma-separated strings. Export works as a plain link (`window.location` / `<a download>`), relying on the session cookie.

**MobX timer store: `store/time-tracking/timer.store.ts`**

```ts
export interface ITimerStore {
  runningTimer: TTimeEntry | null;
  clockOffsetMs: number; // server_now - Date.now() at fetch time
  needsReviewCount: number;
  isFetching: boolean;
  isRunningOnIssue: (issueId: string) => boolean; // computedFn
  fetchTimer: (workspaceSlug: string) => Promise<void>;
  startTimer: (workspaceSlug: string, payload: TStartTimerPayload) => Promise<TStartTimerResponse>;
  stopTimer: (workspaceSlug: string, description?: string) => Promise<TStopTimerResponse>;
  updateTimer: (workspaceSlug: string, payload: Partial<TStartTimerPayload> & { started_at?: string }) => Promise<void>;
  discardTimer: (workspaceSlug: string) => Promise<void>;
}
```

- Register it as `timer` in `CoreRootStore`, in both the constructor **and** `resetOnSignOut`.
- Hook: `hooks/store/use-timer.ts`, following `hooks/store/use-analytics.ts`.
- Every mutating action ends with `revalidateTimeTracking(workspaceSlug)`.
- On `TIMER_NOT_RUNNING` or `TIMER_CONFLICT`: call `fetchTimer` and show an info toast ("Timer was already stopped elsewhere").
- Re-fetch on window `focus` and `visibilitychange`, so a tab picks up changes made in another tab or device.

**SWR hooks: `hooks/time-tracking/`**

- Cache keys all start with `TIME_TRACKING_`.
- One helper, `revalidateTimeTracking(workspaceSlug)`, runs `mutate(key => typeof key === "string" && key.startsWith(`TIME*TRACKING*${workspaceSlug}`))`. Call it after every write.
- Hooks:
  - `useWorkItemTime(ws, projectId, issueId)`
  - `useProjectIssueTimeTotals(ws, projectId)`, with the same shape as `useIssuePageLinks`: `getTotalByIssueId`
  - `useTimeEntries(ws, filters)`, using `useSWRInfinite` with the cursor
  - `useTimeSummary(ws, filters)`
  - `useTimeReport(ws, filters, { groupBy, subGroupBy, interval, weekStart })`
  - `useTimesheet(ws, userId, weekStartDate)`
  - `useProjectTimeSettings(ws, projectId)`
  - `useLoggableProjects()`: derived from the project store and project roles, so dropdowns only offer projects the user can log in
  - `useTimeTrackingPermissions()`: mirrors 6.1 for _hiding_ UI. The server's `can_edit` stays authoritative for rows.

### 9.3 Routes and navigation

**`apps/web/app/routes/extended.ts`**

Nest the new routes under the same layout files as the core routes, so `mergeRoutes` deep-merges them (`apps/web/app/routes/helper.ts`):

```ts
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(projects)/time-tracking/[tabId]/layout.tsx", [
          route(
            ":workspaceSlug/time-tracking/:tabId",
            "./(all)/[workspaceSlug]/(projects)/time-tracking/[tabId]/page.tsx"
          ),
        ]),
      ]),
      layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
          layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/layout.tsx", [
            route(
              ":workspaceSlug/settings/projects/:projectId/features/time-tracking",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/time-tracking/page.tsx"
            ),
          ]),
        ]),
      ]),
    ]),
  ]),
  // redirect /:workspaceSlug/time-tracking → /:workspaceSlug/time-tracking/timesheet/
  route(":workspaceSlug/time-tracking", "routes/redirects/extended/time-tracking.tsx"),
];
```

- Copy the redirect file from `apps/web/app/routes/redirects/core/analytics.tsx`.
- Copy the page's `layout.tsx` / `header.tsx` from `app/(all)/[workspaceSlug]/(projects)/analytics/[tabId]/`.
- After adding routes, run the React Router typegen (it runs as part of `dev` / `build`) so `./+types/page` exists.
- Check: `/:ws/time-tracking/entries` loads, `/:ws/time-tracking` redirects, and existing routes still work.

**Sidebar nav item:** `time_tracking` in `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`:

```ts
time_tracking: {
  key: "time_tracking",
  labelTranslationKey: "time-tracking.nav",
  href: `/time-tracking/`,
  access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  highlight: (pathname, url) => pathname.includes(url),
}
```

Add it to `_LINKS` after `analytics`, and add the icon case in `components/workspace/sidebar/helper.tsx` (use lucide `Timer`, as the activity helper does). Check that it can be pinned and reordered in the Customize navigation dialog (`components/navigation/customize-navigation-dialog.tsx`).

**Project entry point:** add a "Time tracking" item to the project header's overflow menu that opens `/:ws/time-tracking/reports?project_ids=<id>`. Optional; task FE-15.

### 9.4 UI specifications

#### 9.4.1 Timer widget (top navigation)

File: `components/time-tracking/timer/timer-widget.tsx`. Rendered in `top-navigation-root.tsx` before Inbox. Hidden for workspace Guests.

**Idle state:**

- Stopwatch icon button with the tooltip "Start timer". A small amber dot appears when `needsReviewCount > 0`.
- Clicking opens the **Start timer popover**:
  - **Project:** `ProjectDropdown`, limited to `useLoggableProjects()`. Defaults to the current route's project, if any.
  - **Work item:** `WorkItemSelect` (9.4.7), optional; shows "No work item (project time)" when empty. Defaults to the current route's work item, if any.
  - **Description:** single-line input.
  - **Billable:** toggle, pre-filled from the project's `default_billable` and reset when the project changes.
  - **Start** button (Enter submits).
  - **Recent:** up to 5 distinct (project, work item, description) combinations from my last 30 entries (`useTimeEntries` with `user_ids=[me]`, `order_by=-created_at`, `per_page=30`). Clicking one starts it straight away.
  - **Links:** "Log time manually…" (opens `LogTimeModal`), and "Review auto-stopped entries (n)" when n > 0, which opens Entries filtered with `needs_review=true&user_ids=me`.

**Running state:**

- A pill: pulsing dot, live `formatElapsed` updated once a second, and the truncated `WEB-42 Fix login` or the project name.
- At ≥ 10 h the pill turns amber with the tooltip "Timer will stop automatically at 12h".
- Clicking opens the **Running popover**:
  - editable description, work item, billable and start time (time picker; must be within the last 12 h)
  - **Stop** (primary), **Discard** (with confirmation) and a link to the work item
- After Stop: a toast "Logged 1h 30m on WEB-42" with an **Edit** action that opens `LogTimeModal`, or "Timer under 1 minute discarded".

**General:**

- Below the `md` breakpoint, show only the icon and elapsed time.
- Ticking: one `setInterval(1000)` inside a small `<ElapsedTime startedAt offset />` component, so only that text re-renders.

#### 9.4.2 Log time modal

File: `components/time-tracking/modals/log-time-modal.tsx`. Built on `ModalCore` from `@plane/ui`. Used for both create and edit.

| Field       | Behaviour                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Person      | Visible only to users who can log for others. `MemberDropdown` with the selected project's Admin/Member members. Defaults to me. Changing the project re-validates the selection.                   |
| Project     | `ProjectDropdown`, limited to loggable projects: for myself, projects where I'm Admin/Member; for others, projects I administer, or all projects if I'm a workspace admin. Pre-filled from context. |
| Work item   | `WorkItemSelect` within the project, optional. Pre-filled from context.                                                                                                                             |
| Date        | `DateDropdown`, defaults to today, max today. Hidden in start/end mode (the date picker moves into that row).                                                                                       |
| Mode        | Segmented control: **Duration** \| **Start – end**.                                                                                                                                                 |
| Duration    | `DurationInput` (9.4.6) with a live preview ("= 1h 30m") and inline validation.                                                                                                                     |
| Start – end | Date + two `HH:MM` inputs. End must be after start on the same date. Shows the computed duration.                                                                                                   |
| Description | Textarea with a 2,000-character counter.                                                                                                                                                            |
| Billable    | Toggle, defaults from project settings when the project changes (not when editing).                                                                                                                 |

**Footer:**

- Cancel / **Save**.
- In create mode: "Save & add another", which keeps project, person and date and clears the rest.
- In edit mode: **Delete** on the left.
- If the entry is auto-stopped: a banner "This timer was stopped automatically after 12 hours" with a **Looks right** button (sends `confirm: true`).

**Errors:** server error `code`s map to field errors (6.6). Unknown errors show a toast.

**Read-only:** edit mode for `can_edit=false` entries is read-only: fields disabled, no Save or Delete.

#### 9.4.3 Work item "Time" property (sidebar and peek view)

File: `components/time-tracking/work-item/time-property.tsx`. Rendered as a `SidebarPropertyListItem` (icon `Timer`, label "Time") in `issue-detail/sidebar.tsx` after Estimate, and in `peek-overview/properties.tsx`.

**Content, left to right:**

- The total logged (`formatDuration(total_seconds)`, or "–").
- A **play/stop** icon button:
  - play when my timer isn't on this item
  - stop and live elapsed time when it is
  - hidden if I can't log in this project
- A **+** button that opens `LogTimeModal` pre-filled with the project and work item.

**Popover** (opens when the total is clicked):

- Per-person totals with avatars.
- The 10 most recent entries (person, date, duration, description; editable through the modal when `can_edit`).
- Anyone currently running a timer on this item, with live elapsed time.
- A "View all" link to `/time-tracking/entries?issue_ids=<id>`.

**Data:** `useWorkItemTime`.

#### 9.4.4 Quick actions, spreadsheet column, list/board badge, activity, Power K

- **Quick actions** (`quick-action-dropdowns/helper.tsx`):
  - Add `createTimerMenuItem()`: "Start timer" or "Stop timer", depending on `isRunningOnIssue`.
  - Add `createLogTimeMenuItem()`: "Log time…".
  - Both use `shouldRender: canLogOwn(project)`.
  - Include them in `project-issue.tsx`, `cycle-issue.tsx`, `module-issue.tsx`, `all-issue.tsx` and `issue-detail.tsx`, not in `archived-issue.tsx`.
  - The modal is rendered once per menu host. Follow how `setCreateUpdateIssueModal` is threaded through.
- **Spreadsheet column:**
  - `issue-layouts/spreadsheet/columns/time-column.tsx`, a copy of `page-column.tsx` that reads `useProjectIssueTimeTotals(ws, issue.project_id).getTotalByIssueId(issue.id)` and shows `formatDuration` or "-".
  - Register it in `columns/index.ts` and in `SPREADSHEET_COLUMNS` / `SpreadSheetPropertyIconMap` (`issue-layouts/utils.tsx`).
  - It's off by default, because existing saved display properties don't contain the key; users enable it from the Display menu.
- **List/board badge** (optional, FE-12b): in `issue-layouts/properties/all-properties.tsx`, show a `⏱ 2h 30m` chip when `displayProperties.time_logged` is on and the total is > 0. Follow how the fork added the `page` property there.
- **Activity:**
  - `issue-activity/activity/actions/time-entry.tsx`, modelled on `link.tsx`.
  - Icon `Timer`.
  - Text by verb:
    - created → "logged **1h 30m**"
    - updated → "changed logged time from **1h** to **2h**"
    - deleted → "removed **1h 30m** of logged time"
  - Append " for **{owner}**" when `old_identifier` (owner) ≠ `actor`.
  - Add `case "time_entry"` to `activity-list.tsx`.
- **Power K:**
  - `components/power-k/config/time-tracking-commands.ts`, registered in `commands.ts`.
  - "Start timer": on a work item page, starts on that item; elsewhere, opens the start popover.
  - "Stop timer": only shown while running.
  - "Log time…": opens the modal with context pre-filled.
  - "Open timesheet".

#### 9.4.5 Project settings → Time tracking

- Page: `app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/time-tracking/page.tsx`, a copy of `features/cycles/page.tsx`.
- Title and description come from the existing strings `project_settings.features.time_tracking.title` / `.description`.
- One control: "Billable by default", bound to `useProjectTimeSettings`.
- Only project admins can edit it (the page shows `NotAuthorizedView` to non-admins, as the cycles page does).
- Nav entry: `features_time_tracking` in `packages/constants/src/settings/project.ts` (`access: [EUserProjectRoles.ADMIN]`), added to the FEATURES group, plus an icon in `components/settings/project/sidebar/item-icon.tsx`.

#### 9.4.6 Duration input

File: `components/time-tracking/inputs/duration-input.tsx`.

- A text input that parses with `parseDurationInput` on every change and shows a preview or error under the field.
- **Up/Down** arrows step by 15 minutes.
- On blur, the text is normalised to `formatDuration(..., "short")`.
- Props: `value: number | null`, `onChange(seconds | null)`, `autoFocus?`, `compact?` (for timesheet cells: no preview line; errors show as a red border plus tooltip).

#### 9.4.7 Work item select

File: `components/time-tracking/inputs/work-item-select.tsx`.

- A searchable combobox backed by `ProjectService.projectIssuesSearch(ws, projectId, { search, workspace_search: false })` (`services/project/project.service.ts:187`), debounced by 300 ms.
- Rows show `WEB-42` and the title.
- It includes a "No work item (project time)" option.
- Disabled until a project is chosen.

### 9.5 The time-tracking page

Route: `/:workspaceSlug/time-tracking/:tabId`, with tabs `timesheet` (default), `entries` and `reports`.

- Header: breadcrumb "Time tracking" with the stopwatch icon, and on the right a "Log time" button that opens `LogTimeModal`.
- Tabs use `@plane/propel/tabs`, as the analytics page does (`app/(all)/[workspaceSlug]/(projects)/analytics/[tabId]/page.tsx`). Changing tab keeps the query string.
- Workspace Guests get `NotAuthorizedView`.

#### 9.5.1 Filters (shared by Entries and Reports)

Files: `components/time-tracking/filters/*`.

- **The URL is the single source of truth.** `useTimeTrackingFilters()` parses `useSearchParams()` into `TTimeEntryFilters` plus `date_preset`, and writes changes back with `replace` navigation. Parameter names match the API (7.4). Arrays are comma-separated. `date_preset` is resolved to `date_from` / `date_to` with `getDatePresetRange` before every API call.
- **Defaults** when the URL has none: `date_preset=this_week`, no other filters.
- **Bar layout:**
  `[Date ▾] [People ▾] [Projects ▾] [+ Filter ▾] [Search…] [Clear all]`
  - **Date:** the preset list (Appendix B) plus "Custom range" (`DateRangeDropdown`).
  - **People:** multi-select over workspace members, with a "Me" shortcut.
  - **Projects:** multi-select over visible projects; archived projects are listed in a separate group.
  - **+ Filter:** adds any of Work items, Labels, States, State groups, Cycles, Modules, Priority, Assignees, Billable, Source, Has work item, Logged by, Needs review, Duration range. Each added filter becomes a chip with its own dropdown and ×.
    - Label, state, cycle and module options come from the workspace-level stores, grouped by project, and narrowed to the selected projects when there are any.
  - **Search:** debounced by 300 ms.
- **Applied filters render as chips**, so a shared link shows exactly what's filtered.

#### 9.5.2 Timesheet tab

Files: `components/time-tracking/timesheet/*`.

**Top bar:**

- Person picker (anyone visible; defaults to me).
- Week navigator: ‹ previous · "This week" · next ›, plus a date picker. Weeks start on the viewer's `profile.start_of_the_week` (`useUserProfile().data.start_of_the_week`).
- Week total.

**Grid:**

| Project / Work item        | Mon 5 | Tue 6 | …   | Sun 11 | Total    |
| -------------------------- | ----- | ----- | --- | ------ | -------- |
| Website · WEB-42 Fix login | 1:30  |       |     |        | 1:30     |
| Website · (project time)   |       | 0:45  |     |        | 0:45     |
| **Day total**              | 1:30  | 0:45  |     |        | **2:15** |

- Today's column is highlighted and weekends are muted.
- A running timer shows in its cell with a pulsing dot and live time.

**Cell editing** (only when the viewer can edit the entries involved):

| Cell contains                                                     | Click does                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Nothing                                                           | Inline `DurationInput`. Enter creates a manual entry (that day, the row's project/work item, billable from the project default). |
| Exactly one manual, duration-only entry                           | Inline `DurationInput` pre-filled. Enter updates it; an empty value or `0` deletes it after confirmation.                        |
| Anything else (several entries, timer entries, start/end entries) | Popover listing the entries (each opens `LogTimeModal`), plus "Add entry".                                                       |

- Keyboard: Tab / Shift+Tab move between cells; Esc cancels.

**Rows:**

- **"Add row":** pick a project and an optional work item. The row exists only on the client until it has time.
- **"Copy rows from previous week":** copies row labels only, no time.

**Read-only** when viewing someone else, unless the viewer is an admin of that row's project.

#### 9.5.3 Entries tab

Files: `components/time-tracking/entries/*`.

**Layout:**

- Filter bar (9.5.1).
- Summary strip: total, billable, entry count (from `useTimeSummary`).
- Controls: "Group by: None / Day / Person / Project / Work item" and "Sort".
- The table.

**Table:**

- Built on `@tanstack/react-table`, as the analytics insight table is (`components/analytics/insight-table/data-table.tsx`).
- Columns: ☐ · Date · Person · Project · Work item (key + title; click opens the work item peek) · Description · Start–End (if set) · Duration · Billable (inline toggle when `can_edit`) · Source icon · Logged by (only when ≠ person) · ⋯ (Edit, Delete).
- **Running entries** are pinned at the top with a "Running" badge and live duration.
- **Auto-stopped entries** show an amber "Review" badge.
- **Grouping** adds group header rows with subtotals. It's client-side over loaded pages; mention "subtotals of loaded rows" if not everything is loaded.
- **Paging:** cursor-based, 50 per page, with a "Load more" button at the bottom.

**Bulk actions**, shown when rows are selected:

- Delete, Mark billable, Mark non-billable.
- Only rows with `can_edit` can be selected.

**Empty and loading states:**

- No entries: `EmptyStateDetailed` with "Start a timer" / "Log time" calls to action.
- Loading: skeleton rows.

#### 9.5.4 Reports tab (the analytics page)

Files: `components/time-tracking/reports/*`. Charts use `@plane/propel/charts` (`BarChart`, `PieChart`, `AreaChart`; prop types in `packages/types/src/charts/index.ts`).

The page uses the same filter bar (9.5.1). On the right sit a units toggle **h:mm | decimal** (stored in `localStorage`, with reads/writes wrapped in try/catch) and an **Export ▾** menu.

**1. KPI cards** (from `useTimeSummary`):

- Total time, with ▲/▼ vs the previous period.
- Billable time and % billable.
- Non-billable time.
- Average per person per active day.
- People.
- Work items.
- Time without a work item (h and %).
- Needs review (count; links to the filtered Entries tab).

**2. Time over time:**

- A stacked bar chart, x = date buckets.
- Interval is auto (≤ 31 days → day, ≤ 26 weeks → week, else month) with a manual override.
- "Stack by": None / Person / Project / Billable / Label / Work item.
- Shows the top 8 series plus "Other".
- Data: `useTimeReport(group_by=date, sub_group_by=<stack>, interval, week_start)`.

**3. Breakdown:**

- "Breakdown by" picker covering every dimension in 7.5 except date. Default: Project.
- Horizontal bar chart (top 15 plus "Other"), with a donut toggle.
- Each bar is split into billable and non-billable.
- Many-to-many dimensions show the note "An entry counts toward each label/module/assignee of its work item."

**4. Pivot table:**

- "Rows" and "Columns" pickers (any dimension, plus Date with an interval for columns). Default: Person × Project.
- Cells show hours with a light heat-map tint, plus row and column totals.
- Clicking a cell switches to the Entries tab with the current filters plus that row's and column's values applied (drill-down).
- "Export pivot (CSV)" runs client-side with `export-to-csv`, as `components/analytics/export.ts` does.
- Data: `useTimeReport(group_by=rows, sub_group_by=columns)`.

**5. Top work items:**

- A table with work item, project, total, billable, people, last logged.
- `useTimeReport(group_by=issue, sub_group_by=null)`, top 20 by time.
- Clicking a row opens Entries filtered by `issue_ids`.

**6. Drill-down everywhere:** clicking a bar, slice, pivot cell or table row adds that value to the filters and opens the Entries tab.

**7. Export menu:**

- "Entries (CSV)" and "Entries (Excel)" go to `/time-entries/export/` with the current filters.
- "Pivot (CSV)" runs client-side.

**8. States:**

- Skeletons while loading, following `components/analytics/loaders.tsx`.
- An empty state when there's no data for the filters.
- An error state with a Retry button.

### 9.6 Internationalisation

- Add the namespace `"time-tracking"` to `packages/i18n/src/constants/namespaces.ts`.
- Create `packages/i18n/src/locales/en/time-tracking.json`.
- Locale files are loaded with a dynamic `import()` per language (`packages/i18n/src/core/instance.ts:21`). To avoid failed imports in other languages, **copy the English file into every other locale folder** (19 locales). English is also the fallback language. Translate later with the repo's `/translate` skill (`.claude/skills/translate/SKILL.md`).
- Reuse the existing keys: `common.time_tracking`, `project_settings.features.time_tracking.title` / `.description`.
- Top-level key groups: `nav`, `timer.*`, `log_time.*`, `duration.*`, `work_item.*`, `activity.*`, `timesheet.*`, `entries.*`, `reports.*`, `filters.*`, `presets.*`, `dimensions.*`, `settings.*`, `errors.<CODE>`, `empty_state.*`, `toasts.*`, `display_property`.

---

## 10. Edge cases

| #   | Case                                                          | Expected behaviour                                                                                                                        |
| --- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A timer runs past midnight                                    | One entry on the start date (A5).                                                                                                         |
| 2   | The owner changes timezone                                    | Existing `spent_on` is unchanged; new entries use the new zone.                                                                           |
| 3   | A daylight-saving change during a timer                       | The duration comes from UTC timestamps and is correct.                                                                                    |
| 4   | Two tabs or devices press Start at the same time              | One succeeds. The other gets 409 `TIMER_CONFLICT`, re-fetches and shows the winner.                                                       |
| 5   | Stop is pressed in a stale tab                                | 404 `TIMER_NOT_RUNNING` → re-fetch and toast.                                                                                             |
| 6   | The laptop sleeps for 14 h with a timer running               | The job stops it at exactly 12 h with `auto_stopped`. The widget shows the review badge.                                                  |
| 7   | The scheduler is down                                         | Stopping still caps at 12 h. Reports exclude running entries.                                                                             |
| 8   | A work item is deleted                                        | Its entries become project time ("No work item"). This is permanent; a deleted item can't be told apart from never having one (accepted). |
| 9   | A work item is archived                                       | Its entries stay and count. No new entries on it. Existing ones stay editable. Reports mark it "archived".                                |
| 10  | A work item is in intake/triage or is a draft                 | It can't be logged against until accepted or published.                                                                                   |
| 11  | A project is archived                                         | Running timers stop. Entries stay in reports, marked archived. No new entries.                                                            |
| 12  | A project is deleted                                          | Entries are soft-deleted with it and disappear from reports.                                                                              |
| 13  | A member is removed from a project or workspace               | Their running timer stops. Their history stays and is still visible. They can no longer edit it; admins can.                              |
| 14  | A Guest is promoted to Member                                 | Can log from then on.                                                                                                                     |
| 15  | A secret project becomes public                               | Its entries become visible workspace-wide (expected per A2).                                                                              |
| 16  | Group-by label/module/assignee                                | Totals can exceed the overall total. The UI shows the note and the true total.                                                            |
| 17  | A timesheet cell holds several or timer entries               | Opens the popover instead of inline editing.                                                                                              |
| 18  | An export is very large                                       | 400 `EXPORT_TOO_LARGE` with "narrow the date range".                                                                                      |
| 19  | Someone types `90` in the duration field                      | Interpreted as 90 h → out of range → error "Did you mean 90m?" (A7).                                                                      |
| 20  | A decimal comma (`1,5`)                                       | Parsed as 1.5 h.                                                                                                                          |
| 21  | The project default for billable changes                      | Affects only new entries.                                                                                                                 |
| 22  | An admin edits someone else's entry                           | `updated_by` = admin, owner unchanged. The activity says "for {owner}".                                                                   |
| 23  | An entry belongs to a user who no longer exists (hard delete) | Deleted with the user (`CASCADE`); Plane normally deactivates users rather than deleting them.                                            |
| 24  | A work item is moved between projects                         | Not possible in this edition today. If upstream adds it, entries need re-pointing (future note).                                          |

---

## 11. Testing strategy

### 11.1 Backend (pytest, Docker)

Run with `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests -k time_tracking` (see `AGENTS.md` and `apps/api/tests/RUNNING_TESTS.md`).

**Factories:** put new factories in `apps/api/plane/tests/factories_time_tracking.py`, a new file so upstream's `factories.py` stays untouched:

- `StateFactory`, `IssueFactory` (minimal; `Issue.save()` assigns sequence and default state)
- `TimeEntryFactory`, `ProjectTimeSettingFactory`
- helpers `make_member(workspace, user, ws_role, project=None, project_role=None)`

**Unit tests** (`plane/tests/unit/time_tracking/`):

- `test_spent_on.py`: timer started 23:30 Europe/Lisbon (22:30Z) → local date. America/Los_Angeles where the UTC date differs. Changing `started_at` recomputes it.
- `test_week_bucket.py`: the SQL week-start expression for `week_start` 0, 1 and 6, across a year boundary.
- `test_access.py`: the full matrix in 6.1 against `TimeTrackingAccess` (each role × own/other × public/secret project).
- `test_services.py`: stop under 60 s discards. Stop over 12 h caps and flags. Start while running stops the old one. `stop_timer(auto=True)`.
- `test_serializers.py`: every row of 6.6, including 59/60/86,400/86,401 s boundaries, both create modes and the PATCH semantics in 6.5.
- `test_tasks.py`: `stop_stale_timers` sets exactly start + 12 h and leaves 11:59 timers alone. `record_time_entry_activity` creates the expected `IssueActivity` rows (call the function directly).
- `test_signals.py`: deactivating a `ProjectMember`, deactivating a `WorkspaceMember`, and archiving a `Project` each stop the right timers and no others.
- `test_constraints.py`: two running rows for the same user and workspace → `IntegrityError`. A running row with a duration → `IntegrityError`. End before start → `IntegrityError`.

**Contract tests** (`plane/tests/contract/app/test_time_tracking_*_app.py`):

- **Timer:** start → GET shows it → start on another item → old one stopped, one running → stop → duration set → stop again → 404 → PATCH description and `started_at` (valid and future) → discard → GET is empty.
- **Entries:**
  - create in both modes
  - `AMBIGUOUS_ENTRY_MODE`
  - future date
  - issue from another project
  - archived, draft and triage issue
  - archived project
  - non-member and guest
  - PATCH and DELETE by owner, other member (403), project admin, workspace admin
  - `confirm` clears `auto_stopped`
- **On behalf:**
  - a project admin logs for a member → 201, `user` = target, `created_by` = admin
  - a member sending `user_id` → 403
  - an admin targeting a non-member → 400
  - a workspace admin who isn't in the project → 201
- **Visibility:**
  - a member sees others' entries in a public project they're not in
  - a member doesn't see secret-project entries unless they're a member
  - a workspace admin sees all
  - a guest gets 403 on every endpoint
- **Filters:** each parameter alone, plus a few combinations. `search` by description, title and `WEB-42`. Many-to-many filters don't duplicate rows.
- **Report:** for each `group_by`, the sum of group totals equals the list's sum of durations with the same filters (except multi-valued dimensions, where `total_seconds` equals the list sum). Empty date buckets are filled. `week_start` variants. "No …" buckets appear.
- **Summary:** the previous-period window and numbers. Running entries are excluded from totals.
- **Timesheet:** grouping, cells, running entry, viewing another person's timesheet.
- **Work-item endpoints:** issue totals map; `by_user` and `running` on the item endpoint.
- **Export:** CSV header and row count; XLSX content type; the cap (patch the constant to 2).
- **Bulk:** delete own entries; a mix of permitted and forbidden → 403 and nothing changes; more than 500 IDs → 400.
- **Deleting an issue:** `soft_delete_related_objects` → the entry remains with `issue_id` empty.
- **Settings:** GET creates defaults; PATCH by an admin; PATCH by a member → 403.

### 11.2 Frontend

- **vitest in `packages/utils`:**
  - `parseDurationInput`: the whole table in Appendix A, valid and invalid.
  - `formatDuration` and `formatElapsed`.
  - `getDatePresetRange`: every preset, with today at month end, year end and leap day, and both Sunday and Monday week starts.
  - `getWeekStartDate`, `getElapsedSeconds` with a positive and a negative clock offset.
- **Type and lint checks:** `pnpm check:types` / `pnpm check:lint`, or rely on the web Docker build, which typechecks (`docs/deploying-from-source.md`).
- **React Doctor:** `npx react-doctor@latest --verbose --diff` must not lower the score (`.claude/skills/react-doctor/SKILL.md`).
- **Manual QA:** Appendix D.

---

## 12. Deployment and rollback

Follow `docs/deploying-from-source.md` for the exact image names and tags. Summary:

1. **Back up the database** before the first deployment of the migration, e.g.:
   ```bash
   docker exec plane-app-plane-db-1 pg_dump -U plane -Fc plane > before-time-tracking.dump
   ```
   Check the container name with `docker ps`.
2. **Tag rollback images** for `api` and `web`.
3. **Build `api`** (the same image is used by `api`, `worker`, `beat-worker` and `migrator`). Recreate `migrator` (it applies migrations), then `api`, `worker` and `beat-worker`, each with `--no-deps`. `beat-worker` **must** be recreated so the new schedule entry is picked up.
4. **Check:**
   - `docker compose … exec api python manage.py showmigrations time_tracking` shows `[X] 0001_initial`
   - `GET /api/workspaces/<slug>/time-entries/timer/` returns 200 in the browser
5. **Build `web`**, recreate it, confirm a marker string (e.g. `time-tracking.nav`) is in the served assets, and hard-refresh.
6. **Rollback:** re-tag and recreate the images. The new tables are additive and harmless if left in place. To remove them completely: `python manage.py migrate time_tracking zero`.

Recommended: before production, restore `plane_db.dump` into a scratch database and apply the migration there first.

---

## 13. Task list

Sizes: **S** ≤ ½ day, **M** 1-2 days, **L** 3-5 days. "Deps" are task IDs that must be finished first.

**Before starting:** create a Plane work item for the feature and a branch with the repo's `/branch-name` skill, e.g. `feat/<id>-time-tracking`. PRs target the fork's working branch (`v1.4.2-base` today), not upstream's `preview`, which the `/create-pull-request` skill defaults to.

### Phase 1 - Backend foundation

- [ ] **BE-01 · Create the Django app** · S · Deps: -
  - Create `apps/api/plane/time_tracking/` with `__init__.py`, `apps.py` (`TimeTrackingConfig`, `name="plane.time_tracking"`, `ready()` imports `signals`), `constants.py`, `models.py`, `access.py`, `services.py`, `serializers.py`, `filters.py`, `reports.py`, `export.py`, `tasks.py`, `signals.py`, `urls.py`, `views/__init__.py`, `migrations/__init__.py`.
  - Add `"plane.time_tracking"` to `INSTALLED_APPS` (`settings/common.py:~97`). Add `path("api/", include("plane.time_tracking.urls"))` to `plane/urls.py`.
  - **Done when:** the API boots and `python manage.py check` passes.

- [ ] **BE-02 · Models and migration** · M · Deps: BE-01
  - Write `TimeEntry` and `ProjectTimeSetting` exactly as in section 5. Generate `0001_initial.py` (depends on `db.0124_issuepage_single_page_per_issue`).
  - **Done when:** `makemigrations --check` is clean for every app, including `db` after BE-15. The migration applies to a copy of the production dump. The constraint tests (11.1 `test_constraints.py`) pass.

- [ ] **BE-03 · Access rules** · M · Deps: BE-02
  - Write `TimeTrackingAccess` (6.2) with cached role lookups (at most 2 queries per request).
  - **Done when:** `test_access.py` covers every cell of 6.1.

- [ ] **BE-04 · Domain services** · M · Deps: BE-02
  - In `services.py`: `start_timer`, `stop_timer` (with `auto`), `update_running_timer`, `discard_timer`, `create_manual_entry`, `update_entry`, `delete_entry`, `local_date_for(user, dt)`, `get_default_billable(project)`. They raise one `TimeTrackingError(code, message, field, status)`, which views turn into the error format in 6.6. All the rules in 6.3-6.5 live here; views stay thin.
  - **Done when:** `test_services.py` and `test_spent_on.py` pass.

- [ ] **BE-05 · Serializers** · M · Deps: BE-03, BE-04
  - `TimeEntrySerializer` (read; `issue_detail`; `can_edit` from an access object in context), `TimeEntryCreateSerializer`, `TimeEntryUpdateSerializer`, `TimerStartSerializer`, `TimerUpdateSerializer`, `ProjectTimeSettingSerializer`. Validation calls into services and access. Field-level errors use the codes in 6.6.
  - **Done when:** `test_serializers.py` passes.

- [ ] **BE-06 · Timer endpoints (#1-5)** · M · Deps: BE-05
  - `views/timer.py`. The start endpoint is atomic with `select_for_update` and handles `IntegrityError` → 409.
  - **Done when:** the timer contract tests pass.

- [ ] **BE-07 · Entry CRUD and bulk (#6-11)** · M · Deps: BE-05, BE-09
  - `views/entries.py`, paginated (`default_per_page=50`, `max_per_page=200`). Bulk is all-or-nothing.
  - **Done when:** the entries, on-behalf, visibility and bulk contract tests pass.

- [ ] **BE-08 · Work-item and project endpoints (#16-19)** · S · Deps: BE-05
  - `views/work_item.py`, `views/settings.py`.
  - **Done when:** the contract tests pass, and each endpoint runs a fixed number of queries regardless of entry count (check with `django_assert_max_num_queries`).

- [ ] **BE-09 · Filter set** · M · Deps: BE-02
  - `TimeEntryFilterSet` per 7.4, with work-item-key search parsing (`WEB-42`).
  - **Done when:** the filter contract tests pass with no duplicate rows from many-to-many filters.

- [ ] **BE-10 · Summary and report (#12-13)** · L · Deps: BE-09
  - `reports.py`: the dimension registry (7.5), the `FilteredRelation` joins, the week-bucket expression, empty-bucket filling, previous-period summary, label resolution. `views/reports.py`.
  - **Done when:** `test_week_bucket.py` and the report/summary contract tests pass, including "group totals = list total" for every single-valued dimension.

- [ ] **BE-11 · Timesheet (#14)** · M · Deps: BE-09
  - `views/timesheet.py` per 7.3 #14.
  - **Done when:** the timesheet contract tests pass.

- [ ] **BE-12 · Export (#15)** · S · Deps: BE-09
  - `TimeEntryExportSchema` in `export.py` using `plane.utils.exporters` field types; `views/export.py` streams the file.
  - **Done when:** the export contract tests pass, and the file opens in Excel with correct durations and local times.

- [ ] **BE-13 · Activity task** · S · Deps: BE-04
  - `record_time_entry_activity` (8.2), triggered with `.delay()` from the services after commit (`transaction.on_commit`).
  - **Done when:** the unit test passes and the activity rows look right in the DB.

- [ ] **BE-14 · Auto-stop job and signals** · M · Deps: BE-04
  - `stop_stale_timers` task, the `celery.py` beat entry, and the `signals.py` handlers in 6.8.
  - **Done when:** `test_tasks.py` and `test_signals.py` pass, and the beat log shows the task scheduled after deploy.

- [ ] **BE-15 · Nav preference key** · S · Deps: -
  - Add `TIME_TRACKING` to `WorkspaceUserPreference.UserPreferenceKeys`.
  - **Done when:** `makemigrations db --check` reports no changes and the preferences GET returns a `time_tracking` key.

- [ ] **BE-16 · Backend tests complete** · M · Deps: BE-06…BE-15
  - Fill any gaps against 11.1. Coverage of `plane/time_tracking` ≥ 90%.
  - **Done when:** the full time-tracking suite is green in Docker.

### Phase 2 - Shared frontend packages

- [ ] **FP-01 · Types** · S · Deps: API shapes frozen (BE-05)
  - `packages/types/src/time-tracking.ts` per 9.1, the index export, and `time_logged` in `view-props.ts`.
  - **Done when:** types compile.

- [ ] **FP-02 · Constants** · S · Deps: FP-01
  - `packages/constants/src/time-tracking.ts`, the index export, and the display-property additions in `issue/common.ts`.
  - **Done when:** they compile; the values match the backend constants.

- [ ] **FP-03 · Utils and vitest** · M · Deps: FP-01
  - `packages/utils/src/time-tracking.ts` per 9.1 / Appendix A / Appendix B, vitest setup, `time-tracking.test.ts`.
  - **Done when:** `pnpm --filter @plane/utils test` passes with all of Appendix A covered.

- [ ] **FP-04 · i18n namespace** · S · Deps: -
  - Add the namespace, `en/time-tracking.json` with all keys used by later tasks (extend as you go), and copy it to the 19 other locales.
  - **Done when:** switching the UI language to German shows English strings, with no console import errors.

### Phase 3 - Core web plumbing and work-item integration

- [ ] **FE-01 · Service** · S · Deps: FP-01
  - `services/time-tracking.service.ts`.

- [ ] **FE-02 · Timer store** · M · Deps: FE-01
  - `store/time-tracking/timer.store.ts`, root-store registration (constructor and `resetOnSignOut`), `hooks/store/use-timer.ts`, focus/visibility re-fetch, clock offset.
  - **Done when:** starting in one tab and focusing another shows the timer.

- [ ] **FE-03 · SWR hooks and revalidation** · M · Deps: FE-01
  - Everything in `hooks/time-tracking/` (9.2), including `useLoggableProjects` and `useTimeTrackingPermissions`.

- [ ] **FE-04 · Inputs** · M · Deps: FP-03
  - `DurationInput` (9.4.6) and `WorkItemSelect` (9.4.7).

- [ ] **FE-05 · Log time modal and delete confirmation** · L · Deps: FE-03, FE-04
  - Per 9.4.2, including on-behalf, edit and read-only modes, "Save & add another", the auto-stopped banner, and error mapping.
  - **Done when:** every validation code in 6.6 shows next to the right field.

- [ ] **FE-06 · Top-nav timer widget** · L · Deps: FE-02, FE-04, FE-05
  - Per 9.4.1, including the recent list, review badge, 10 h warning and responsive layout.
  - **Done when:** QA script D1-D6 passes.

- [ ] **FE-07 · Work item Time property** · M · Deps: FE-02, FE-03, FE-05
  - Per 9.4.3, in the sidebar and the peek view.
  - **Done when:** QA D7-D9 passes.

- [ ] **FE-08 · Quick actions** · M · Deps: FE-02, FE-05
  - Per 9.4.4, in all five menus.

- [ ] **FE-09 · Activity renderer** · S · Deps: BE-13
  - `actions/time-entry.tsx` and the `activity-list.tsx` case.

- [ ] **FE-10 · Spreadsheet "Time logged" column** · M · Deps: FE-03, FP-02
  - Per 9.4.4.
  - **Done when:** it can be enabled from the Display menu and refreshes after logging time.

- [ ] **FE-11 · Power K commands** · S · Deps: FE-02, FE-05
  - Per 9.4.4.

- [ ] **FE-12 · Project settings page** · S · Deps: FE-03
  - Per 9.4.5, including the route in `extended.ts`, the nav entry and the icon.

- [ ] **FE-12b · List/board badge** (optional) · S · Deps: FE-10

### Phase 4 - Time-tracking page: timesheet and entries

- [ ] **TP-01 · Routes, layout, header, redirect, sidebar nav** · M · Deps: FP-04
  - Per 9.3: `extended.ts`, `routes/redirects/extended/time-tracking.tsx`, `app/(all)/[workspaceSlug]/(projects)/time-tracking/[tabId]/{layout,header,page}.tsx`, the nav constants and icon, and the guest guard.
  - **Done when:** the nav item appears, can be pinned and reordered, and all 3 tabs route correctly.

- [ ] **TP-02 · Filter bar and URL state** · L · Deps: TP-01, FE-03
  - Per 9.5.1.
  - **Done when:** every filter round-trips through the URL, a copied URL reproduces the view in another browser, and Clear all resets to the default.

- [ ] **TP-03 · Timesheet tab** · L · Deps: TP-01, FE-05
  - Per 9.5.2.
  - **Done when:** QA D10-D14 passes.

- [ ] **TP-04 · Entries tab** · L · Deps: TP-02, FE-05
  - Per 9.5.3.
  - **Done when:** QA D15-D18 passes.

### Phase 5 - Reports

- [ ] **RP-01 · KPI cards** · M · Deps: TP-02
- [ ] **RP-02 · Time-over-time chart** · M · Deps: TP-02
- [ ] **RP-03 · Breakdown chart** · M · Deps: TP-02
- [ ] **RP-04 · Pivot table, drill-down and pivot CSV** · L · Deps: TP-02, TP-04
- [ ] **RP-05 · Top work items** · S · Deps: TP-02
- [ ] **RP-06 · Export menu and units toggle** · S · Deps: BE-12, TP-02
- [ ] **RP-07 · Loading, empty and error states** · S · Deps: RP-01…RP-05

**Phase 5 done when:** QA D19-D24 passes, and every chart number matches the Entries tab for the same filters.

### Phase 6 - Polish, QA and release

- [ ] **QA-01 · Full manual QA** (Appendix D) on a staging copy restored from `plane_db.dump` · M
- [ ] **QA-02 · Quality gates:** `pnpm check`, React Doctor `--diff` with no regression, the backend suite green, and `addlicense --check` on the new Python files · S
- [ ] **QA-03 · Optional project header entry point** (9.3) · S
- [ ] **QA-04 · Deploy** per section 12 and record the date in the PR · S
- [ ] **QA-05 · Translations** with `/translate` (can follow the release) · M
- [ ] **QA-06 · Add a "Time tracking" section to `docs/`** covering what it does, admin settings and limits, for end users · S

### Suggested parallel tracks for two developers

| Week | Developer A (backend)                             | Developer B (frontend)                                          |
| ---- | ------------------------------------------------- | --------------------------------------------------------------- |
| 1    | BE-01…BE-06                                       | FP-01…FP-04 (against the API shapes in section 7), FE-01, FE-04 |
| 2    | BE-07…BE-09, BE-13…BE-15                          | FE-02, FE-03, FE-05, FE-06                                      |
| 3    | BE-10…BE-12, BE-16                                | FE-07…FE-12, TP-01, TP-02                                       |
| 4    | Support, perf checks on the production-sized dump | TP-03, TP-04                                                    |
| 5    | QA-01, QA-04                                      | RP-01…RP-07, QA-02                                              |

---

## 14. Future work (not in v1)

- Hourly rates per person/project and cost/revenue reports. Invoices.
- Locking or approving past weeks. Timesheet submission.
- Estimate vs actual. Needs either un-gating the "time" estimate system (`packages/constants/src/estimates.ts`, `is_ee: true`) or a dedicated "estimated hours" field.
- Rolling up sub-work-item time onto parents.
- Saved report presets. Scheduled email reports.
- External REST API (`/api/v1/`) endpoints and webhooks.
- Rounding rules (e.g. round up to 15 min for billing).
- Idle detection and reminders ("You haven't logged time today").
- Overlap warnings.
- Mobile-specific UI.

---

## Appendix A - Duration input grammar

`parseDurationInput` is case-insensitive and ignores surrounding whitespace. It returns seconds rounded to the nearest minute, or `null`. Valid results are 60 s to 86,400 s.

| Input                                     | Result           | Rule                                                                                    |
| ----------------------------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `1h 30m`, `1h30m`, `1 h 30 min`           | 5400             | hours + minutes units                                                                   |
| `2h`, `2 hours`, `2hrs`                   | 7200             | hours unit (`h`, `hr`, `hrs`, `hour`, `hours`)                                          |
| `45m`, `45 min`, `45 mins`, `45 minutes`  | 2700             | minutes unit                                                                            |
| `1.5h`, `1,5h`                            | 5400             | decimal hours; `.` or `,`                                                               |
| `1:30`                                    | 5400             | `H:MM` (minutes 00-59)                                                                  |
| `0:05`                                    | 300              |                                                                                         |
| `1.5`, `1,5`, `2`                         | 5400, 5400, 7200 | bare number = hours (A7)                                                                |
| `0.25`                                    | 900              |                                                                                         |
| `24h`, `24:00`                            | 86400            | maximum                                                                                 |
| `24h 1m`, `25`, `90`                      | null             | above 24 h ("Did you mean 90m?" hint when a bare number ≥ 25 would be valid as minutes) |
| `0`, `0m`, `30s`                          | null             | below 1 minute / seconds unit not supported                                             |
| `1:75`, `abc`, `1h 30`, `-1h`, `` (empty) | null             | invalid                                                                                 |

## Appendix B - Date presets

All presets are resolved on the client with the viewer's timezone (`today`) and `start_of_the_week`. Ranges are inclusive.

| Preset         | From                   | To                         |
| -------------- | ---------------------- | -------------------------- |
| `today`        | today                  | today                      |
| `yesterday`    | today − 1              | today − 1                  |
| `this_week`    | week start of today    | week start + 6             |
| `last_week`    | week start − 7         | week start − 1             |
| `this_month`   | 1st of this month      | last day of this month     |
| `last_month`   | 1st of previous month  | last day of previous month |
| `this_quarter` | 1st day of the quarter | last day of the quarter    |
| `last_quarter` | previous quarter       |                            |
| `this_year`    | Jan 1                  | Dec 31                     |
| `last_year`    | previous Jan 1         | previous Dec 31            |
| `last_7_days`  | today − 6              | today                      |
| `last_30_days` | today − 29             | today                      |
| `last_90_days` | today − 89             | today                      |
| `custom`       | user choice            | user choice                |

## Appendix C - New file inventory

**Backend:** `apps/api/plane/time_tracking/`

```
__init__.py  apps.py  constants.py  models.py  access.py  services.py  serializers.py  filters.py
reports.py  export.py  tasks.py  signals.py  urls.py
views/__init__.py  views/timer.py  views/entries.py  views/work_item.py  views/settings.py
views/reports.py  views/timesheet.py  views/export.py
migrations/__init__.py  migrations/0001_initial.py
```

**Backend tests:** `apps/api/plane/tests/`

```
factories_time_tracking.py
unit/time_tracking/{__init__,test_spent_on,test_week_bucket,test_access,test_services,test_serializers,test_tasks,test_signals,test_constraints}.py
contract/app/test_time_tracking_{timer,entries,on_behalf,visibility,filters,reports,timesheet,work_item,export,bulk,settings}_app.py
```

**Shared packages:**

```
packages/types/src/time-tracking.ts
packages/constants/src/time-tracking.ts
packages/utils/src/time-tracking.ts
packages/utils/src/time-tracking.test.ts
packages/utils/vitest.config.ts
packages/i18n/src/locales/<each locale>/time-tracking.json
```

**Web:** `apps/web/`

```
app/routes/redirects/extended/time-tracking.tsx
app/(all)/[workspaceSlug]/(projects)/time-tracking/[tabId]/{layout,header,page}.tsx
app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/time-tracking/page.tsx
core/services/time-tracking.service.ts
core/store/time-tracking/timer.store.ts
core/hooks/store/use-timer.ts
core/hooks/time-tracking/{keys,use-work-item-time,use-project-issue-time-totals,use-time-entries,use-time-summary,use-time-report,use-timesheet,use-project-time-settings,use-loggable-projects,use-time-tracking-permissions,use-time-tracking-filters}.ts
core/components/time-tracking/
  timer/{timer-widget,start-timer-popover,running-timer-popover,elapsed-time,work-item-timer-button,recent-timers}.tsx
  modals/{log-time-modal,delete-time-entry-modal}.tsx
  inputs/{duration-input,work-item-select}.tsx
  work-item/{time-property,time-entries-popover}.tsx
  filters/{filters-bar,date-filter,member-filter,project-filter,add-filter-menu,filter-chip,applied-filters}.tsx
  timesheet/{timesheet-root,week-navigator,timesheet-grid,timesheet-row,timesheet-cell,cell-entries-popover,add-row-popover}.tsx
  entries/{entries-root,entries-table,entries-columns,bulk-actions-bar,summary-strip}.tsx
  reports/{reports-root,kpi-cards,time-over-time-chart,breakdown-chart,pivot-table,top-work-items,export-menu,units-toggle}.tsx
  empty-states.tsx  loaders.tsx
core/components/issues/issue-layouts/spreadsheet/columns/time-column.tsx
core/components/issues/issue-detail/issue-activity/activity/actions/time-entry.tsx
core/components/power-k/config/time-tracking-commands.ts
```

## Appendix D - Manual QA script

Run as three users: **Ana** (workspace Admin), **Ben** (Member, in project WEB, not in secret project SEC), **Gil** (workspace Guest). Use project **WEB** (Public) and **SEC** (Secret, only Ana is a member).

**Timer**

- D1. Ben starts a timer from the top bar on WEB with no work item. The pill shows live time. Reloading the page keeps it.
- D2. Ben starts a timer on WEB-1 from its sidebar. The first timer stops (toast). Only one pill.
- D3. Ben stops after 30 s → "discarded" toast, no entry.
- D4. Ben runs a timer, edits the start time to 20 min ago, stops → ~20 min entry. The WEB-1 activity shows "logged 20m".
- D5. Two browser tabs: start in tab 1, focus tab 2 → the pill appears. Stop in tab 2, press Stop in tab 1 → friendly toast and the state syncs.
- D6. In the DB, set a running timer's `started_at` 13 h ago and wait for the job (or run the task). The entry is 12 h, auto-stopped, review badge shows, "Looks right" clears it.

**Work items**

- D7. The WEB-1 sidebar shows the total, the per-person popover and Ana's running timer (live).
- D8. Log 1h 30m on WEB-1 via "+": the total updates in the sidebar, the spreadsheet column (when enabled) and the activity.
- D9. Quick action "Log time…" from the list view pre-fills WEB-1.

**Timesheet**

- D10. Ben's timesheet shows this week's rows. Type `2h` in an empty cell → entry created and totals updated.
- D11. Edit that cell to `1,5` → 1h 30m. Clear it → deleted after confirmation.
- D12. A cell with two entries opens the popover.
- D13. Ana views Ben's timesheet and can edit (admin). Ben views Ana's and it's read-only.
- D14. Change the profile start of week to Monday → the columns shift and the totals are still correct.

**Entries**

- D15. Ana logs 3h for Ben on WEB, yesterday → appears with "Logged by Ana". The WEB activity says "for Ben".
- D16. Ben can't edit Ana's entries. Ben can't select SEC (not visible). Ben does see entries in a public project he's not a member of.
- D17. Filters: each filter changes the result. The URL updates. Pasting the URL in another browser reproduces the view.
- D18. Bulk: select 3 → mark billable → the Billable KPI changes.

**Reports**

- D19. Per-week totals in Reports equal the Entries tab totals with the same filters.
- D20. Breakdown by label shows the multi-valued note. The KPI total is unchanged.
- D21. Pivot Person × Project: click a cell → Entries opens with both filters applied.
- D22. Export CSV and XLSX: row count matches, durations and local times are correct, and the file opens in Excel.
- D23. Previous-period ▲/▼ is correct for "last week" vs the week before.
- D24. Gil (Guest) gets no nav item, no timer widget, the page shows not-authorized, and API calls return 403.

**Lifecycle**

- D25. Archive WEB while Ben's timer runs → the timer stops. WEB entries still appear in reports, marked archived. New entries on WEB are rejected.
- D26. Remove Ben from WEB → his timer stops. His entries remain. He can't edit them. Ana can.
- D27. Delete WEB-1 → its entries show as "No work item" under WEB and totals are unchanged.
