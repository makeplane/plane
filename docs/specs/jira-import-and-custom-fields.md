# Spec: Jira Import + Custom Fields (Work Item Properties)

Status: **In progress** · Owner: fork maintainer · Last updated: 2026-06-03

This spec covers two related features for this Plane fork:

1. **Jira import** — connect to Jira Cloud and import individual Jira boards/projects as
   Plane projects, along with their issues, sprints, users, comments, attachments,
   components, and links.
2. **Custom fields** — add user-defined properties to work items, modelled (like Plane
   cloud) as **Work Item Types** that own a set of **Properties**.

Both are built to match the Plane cloud UX while staying simple and self-contained: no
separate "silo" microservice — everything runs inside the existing Django API + Celery
workers and the existing Next.js web app.

---

## 0. Context & current state (what already exists)

Findings from a full codebase sweep (see PR description for detail):

- **`Importer` model** (`apps/api/plane/db/models/importer.py`) exists with `service`
  (`github`/`jira`) + a 4-state `status`, but it is **vestigial**: no viewset, no URL, no
  Celery task. An orphaned `ImporterSerializer` exists. The legacy `Integration`/GitHub/Slack
  models are likewise dead schema. We do **not** build on these.
- **`Exporter`** (`ExporterHistory` + `ExportIssuesEndpoint` + `issue_export_task`) is the
  clean, fully-wired sibling pattern we mirror for the import job lifecycle.
- Idempotent-import hooks already exist: `external_source` + `external_id` columns on
  `Project`, `State`, `Label`, `Cycle`, `IssueType`, `Issue`, `IssueComment`,
  `IssueAttachment`, `Module`. Users/members have **no** external ids → keyed by **email**.
- `Issue.save()` auto-assigns `sequence_id` (per-project advisory lock), `sort_order`, and a
  default `state`. We therefore create issues via `.save()` (not `bulk_create`) and pass
  `created_by_id` to attribute the Jira reporter. The Jira key lives in `external_id`.
- **Custom fields do not exist** in OSS. Only `IssueType` + `ProjectIssueType` models are
  present; there are **no** `IssueProperty*` models, serializers, viewsets, or URLs, and the
  whole web feature is stubbed in `apps/web/ce/**` (returns `null`/`<></>`). There is **no
  feature-flag/license system** in OSS — gating is purely the `@/plane-web → ./ce` tsconfig
  alias. We therefore ship **real implementations in `ce/`** (no license gate), enabled per
  project via the existing `Project.is_issue_type_enabled` flag.
- Latest migration is `0121_alter_estimate_type`. New migrations start at `0122`.
- Web conventions: routes registered in `apps/web/app/routes/core.ts`; workspace settings
  under `…/(settings)/settings/(workspace)/<tab>/page.tsx`; `Button`/toast/icons from
  `@plane/propel`, `ModalCore`/`Input`/`CustomSelect`/`ToggleSwitch`/`Loader` from
  `@plane/ui`; semantic Tailwind tokens (`bg-surface-1`, `text-secondary`, `border-subtle`,
  …) — **not** the legacy `custom-background-*`; i18n via `useTranslation()` is mandatory;
  multi-step wizards use an `enum` + `useState` (see `create-project-modal.tsx`).

---

## 1. Feature A — Custom Fields (Work Item Types & Properties)

### 1.1 Data model (per Plane cloud, reusing `IssueType`)

```
Workspace
  └── IssueType (existing)            name, description, logo_props, is_epic, is_default,
        │                              is_active, level, external_source/id
        │   ProjectIssueType (existing) links a type into a project
        │
        └── IssueProperty (NEW)        the custom field definition
              │   issue_type FK, workspace FK, project FK
              │   name, display_name, description
              │   property_type  ∈ {TEXT, DECIMAL, BOOLEAN, DATETIME, OPTION, RELATION, URL}
              │   relation_type  ∈ {ISSUE, USER}      (only when property_type=RELATION)
              │   is_required, is_active, is_multi
              │   default_value (ArrayField[Text])    settings (JSON)  validation_rules (JSON)
              │   sort_order, logo_props, external_source/id
              │
              ├── IssuePropertyOption (NEW)  dropdown option (OPTION type)
              │     property FK, name, sort_order, is_active, is_default,
              │     logo_props, parent, external_source/id
              │
              └── IssuePropertyValue (NEW)   a value on one work item
                    issue FK, property FK, workspace FK, project FK
                    value_text / value_boolean / value_decimal / value_datetime
                    value_uuid (RELATION) / value_option FK (OPTION)
                    external_source/id   (multi-select → multiple rows)
```

**Why this shape:** it matches Plane cloud's published developer API
(`property_type`, `relation_type`, `is_required`, `is_active`, `is_multi`, `default_value`,
`settings`, `validation_rules`, `sort_order`, `logo_props`) so the model stays familiar, and
the typed-column value table avoids JSON-blob querying while supporting every field type.

### 1.2 Property types (first cut)

| UI label           | property_type | relation_type | is_multi | Notes                                        |
| ------------------ | ------------- | ------------- | -------- | -------------------------------------------- |
| Text               | TEXT          | –             | false    | `settings.display=single/paragraph/readonly` |
| Number             | DECIMAL       | –             | false    | `default_value`, `validation_rules` min/max  |
| Dropdown (single)  | OPTION        | –             | false    | options via `IssuePropertyOption`            |
| Dropdown (multi)   | OPTION        | –             | true     | multiple value rows                          |
| Checkbox / Boolean | BOOLEAN       | –             | false    | default false; cannot be required            |
| Date               | DATETIME      | –             | false    | stored as datetime                           |
| Member (single)    | RELATION      | USER          | false    | value_uuid = user id                         |
| Member (multi)     | RELATION      | USER          | true     | multiple value rows                          |
| URL                | URL           | –             | false    | validated URL string                         |

### 1.3 API (internal `plane.app` layer, session auth)

Project-scoped, mirroring the State viewset conventions (`@allow_permission`, soft-delete,
`get_queryset` scoped by `slug` + `project_id` + active membership).

```
# Work item types
GET    /api/workspaces/:slug/projects/:project_id/issue-types/
POST   /api/workspaces/:slug/projects/:project_id/issue-types/            (admin)
GET    /api/…/issue-types/:type_id/
PATCH  /api/…/issue-types/:type_id/                                        (admin)
DELETE /api/…/issue-types/:type_id/                                        (admin)
POST   /api/…/issue-types/enable/      # flips Project.is_issue_type_enabled + seeds default Task

# Properties (nested under a type)
GET    /api/…/issue-types/:type_id/issue-properties/
POST   /api/…/issue-types/:type_id/issue-properties/                       (admin)
PATCH  /api/…/issue-types/:type_id/issue-properties/:property_id/          (admin)
DELETE /api/…/issue-types/:type_id/issue-properties/:property_id/          (admin)

# Options (nested under a property)
GET    /api/…/issue-properties/:property_id/options/
POST   /api/…/issue-properties/:property_id/options/                       (admin)
PATCH  /api/…/issue-properties/:property_id/options/:option_id/            (admin)
DELETE /api/…/issue-properties/:property_id/options/:option_id/            (admin)

# Values on a work item (read on view, write on create/update)
GET    /api/…/issues/:issue_id/issue-property-values/
POST   /api/…/issues/:issue_id/issue-property-values/    # bulk upsert {property_id: [values]}
```

Validation lives in a shifted service (`utils/issue_property/validators.py`): required check,
type coercion (decimal/datetime/url/bool), `is_multi` cardinality, option membership.

### 1.4 Web UX (replace `ce/` stubs in place)

- **Project Settings → Work Item Types** (new page, modelled on the labels settings list):
  toggle to enable; list of types (Task seeded, Epic optional); per type an **Add Property**
  modal with **Title, Description, Property type, Mandatory, Active** (exactly the cloud
  modal) + per-type sub-config (options editor for dropdowns, single/multi toggle for
  member/dropdown, default value).
- **Create / edit work item modal**: real `IssueTypeSelect` (type picker) +
  `WorkItemModalAdditionalProperties` rendering the active type's property inputs; values
  saved through the `IssueModalProvider` `handleCreateUpdatePropertyValues`.
- **Work item detail sidebar**: `WorkItemAdditionalSidebarProperties` renders + inline-edits
  values.
- **Layouts**: `WorkItemLayoutAdditionalProperties` stays minimal in this cut (spreadsheet
  custom columns are a follow-up).
- Shared types in `packages/types` (new `issues/issue-property.ts`): `EIssuePropertyType`,
  `TIssueProperty`, `TIssuePropertyOption`, real `TIssuePropertyValues`.
- MobX stores under `ce/store/issue/` for types/properties/values; `ce/hooks` to read them.

### 1.4a Epics

Epics are work item types with `is_epic=True`. Enabling Work Item Types seeds both a
default **Task** and an **Epic** type. An epic's children are regular work items whose
`parent` is the epic — the same relationship the existing **Sub-work items** widget manages,
so children CRUD already works on an epic's detail. On top of that, an **Epic children
panel** (`components/epics/epic-children-panel.tsx`) renders in the epic's detail sidebar:
a completion progress bar + per-state-group breakdown (from the sub-issues
`state_distribution`), the child list, and **Add work items** (reusing
`ExistingIssuesListModal` → `addSubIssues`) / remove (`patchIssue parent_id=null`).

The Jira importer maps Jira `Epic` issue types to an `is_epic` work item type and links
children to epics via `fields.parent` (team-managed projects) **or** the classic **Epic
Link** custom field (company-managed projects), discovered dynamically via `/field`.

Known limitation: the epic children panel keeps its own SWR cache, independent of the
Sub-work items widget's MobX store, so a change made in one updates the other only on its
next revalidation (SWR `revalidateOnFocus`), not instantly. A full first-class Epics
**section** (dedicated epics list/layout + epic detail route) remains a follow-up.

### 1.5 Gating

No license system in OSS. Custom fields are available to everyone; the per-project
`is_issue_type_enabled` flag is the on/off switch (admin-only), matching Plane's "enable Work
Item Types" action. Managing types/properties requires **project admin**; setting values
requires work-item write permission.

---

## 2. Feature B — Jira import (live Jira Cloud API)

### 2.1 Connection

Wizard collects **Jira domain** (`acme.atlassian.net`), **email**, and **API token**
(Atlassian PAT). The backend authenticates with HTTP Basic (`email:token`) against the Jira
Cloud REST API (`/rest/api/3/…` and Agile `/rest/agile/1.0/…`). A **Test connection** call
verifies credentials via `GET /rest/api/3/myself`.

Credentials are held only for the life of the import job: stored in the `ImportJob.config`
(write-only over the API), used by the Celery task, then **scrubbed** from the row on
completion/failure. (Documented trade-off for a single-service fork; a follow-up can move to
encrypted-at-rest or OAuth.)

### 2.2 `ImportJob` model (NEW, workspace-scoped)

Modelled on `ExporterHistory` (workspace-scoped + status), not on the project-scoped
`Importer`, because an import **creates** projects.

```
ImportJob(BaseModel)
  workspace FK
  source            CharField default "jira"
  status            queued | processing | completed | failed   (default queued)
  initiated_by FK
  config            JSON   # {domain, email, token(write-only), board_id, target,
                           #  user_import: skip|invite, state_map, priority_map, flags}
  report            JSON   # {projects, work_items, cycles, members, comments,
                           #  attachments, modules, links, errors[]}  progress counters
  reason            Text   # failure reason
  external_id       CharField  # Jira board/project key (for re-run idempotency)
```

### 2.3 API (internal `plane.app` layer)

```
POST   /api/workspaces/:slug/jira-import/test-connection/   # {domain,email,token} → ok|error
POST   /api/workspaces/:slug/jira-import/boards/            # creds → list of boards/projects
POST   /api/workspaces/:slug/jira-import/metadata/          # creds+board → {statuses,priorities,users,sprints,issueCount}
GET    /api/workspaces/:slug/jira-import/                   # list ImportJob (paginated, polled)
POST   /api/workspaces/:slug/jira-import/                   # create job → enqueue task
POST   /api/workspaces/:slug/jira-import/:job_id/re-run/    # incremental re-sync
```

`POST`/list gated `@allow_permission([ADMIN], level="WORKSPACE")`.

### 2.4 Jira client (`apps/api/plane/utils/jira/`)

Thin `requests`-based wrapper, fully unit-testable with mocked HTTP:

- `JiraClient(domain, email, token)` → `myself()`, `boards()`, `board_project(board_id)`,
  `sprints(board_id)`, `issues(jql, fields, expand, paginated)`, `users(project_key)`,
  `comments(issue_key)`, `attachments(issue)`, `components(project_key)`.
- Pagination via `startAt`/`maxResults`; retries with backoff on 429/5xx.
- Pure mapping helpers in `mappers.py` (status→state group, priority→Plane priority,
  ADF/Jira markup → HTML) kept side-effect free for testing.

### 2.5 Import engine (`apps/api/plane/bgtasks/jira_import_task.py`)

`@shared_task jira_import_task(job_id)` — mirrors `issue_export_task`'s status lifecycle
(`processing` → `completed`/`failed`, `log_exception`, scrub creds). Order of creation
(respecting FK + `Issue.save()` semantics; everything upserted on
`external_source="JIRA"` + `external_id`):

1. **Project** — board/project → `Project` (`identifier` from Jira project key), or import
   into a chosen existing project. Auto-create `DEFAULT_STATES` if new.
2. **Members** — Jira users → match `User` by email; `WorkspaceMember` + `ProjectMember`
   (role Member); unmatched emails → `WorkspaceMemberInvite` (or skipped if "skip users").
   Keep an in-memory `jiraAccountId → user_id` map for reporter/assignee/comment author.
3. **States** — Jira statuses → `State` by `state_map`; "auto-create" makes a `State` per
   unmapped status (group from Jira status category: To Do→unstarted, In Progress→started,
   Done→completed). One `default=True`.
4. **Labels** — Jira labels → `Label` (project-scoped).
5. **Components → Modules** — Jira components → `Module`.
6. **Work Item Types** — if enabled, map Jira issue types → `IssueType`/`ProjectIssueType`
   (Epic → `is_epic`). Otherwise issue type stored as a label/prefix (cloud parity on free).
7. **Cycles** — Jira sprints → `Cycle` (`owned_by` = initiator; sprint start/end dates).
8. **Work items** — Jira issues → `Issue` via `.save()`: summary→`name`,
   description (ADF→HTML)→`description_html`, status→`state`, priority→`priority`,
   reporter→`created_by_id`, due/start dates, `external_id`=Jira key. Then links:
   `IssueAssignee`, `IssueLabel`, `CycleIssue` (sprint membership), `ModuleIssue`.
9. **Parent / sub-tasks & epics** — second pass sets `Issue.parent` from the key map.
10. **Comments** — Jira comments → `IssueComment` (`actor`, timestamps preserved).
11. **Attachments** — imported as `IssueLink`s pointing at the Jira attachment content
    URL (titled with the filename). Binary re-hosting into Plane's S3/`FileAsset` is a
    follow-up — the OSS attachment flow is client-side presigned upload, which can't be
    driven from a worker without replicating presign/confirm. Skippable via a flag.
12. **Links** — Jira issue links → `IssueRelation` (blocked_by/relates_to/duplicate) and web
    links → `IssueLink`.

Progress counters are written into `ImportJob.report` as each phase completes so the UI can
show live counts. Re-run re-executes the upsert (idempotent via external ids), creating only
new records and updating changed ones.

### 2.6 Web UX — wizard (matches Plane cloud)

`Workspace Settings → Imports → Jira` (new settings tab). Multi-step `ModalCore` wizard:

1. **Connect** — domain + email + API token + **Connect** (calls test-connection).
2. **Select** — pick source Jira board, pick target (new Plane project [default] or
   existing). Toggles for attachments / comments / components.
3. **Users** — list matched/unmatched; choose **Invite unmatched** or **Skip user data**
   (assignees blank, comments attributed to the importer).
4. **Map states** — two-column dropdown rows (Jira status → Plane state) + **Auto-create
   missing states** checkbox. Same for **priorities**.
5. **Review** — summary counts; **Confirm** creates the `ImportJob` and enqueues.
6. The Imports page lists jobs with status, polling every 3s while `processing`
   (mirrors `prev-exports.tsx`), plus a **Re-run** action.

### 2.7 Field mapping (Jira → Plane), cloud parity

| Jira              | Plane                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| Board / Project   | Project                                                                       |
| Summary           | Work item Title (`name`)                                                      |
| Description (ADF) | `description_html`                                                            |
| Status            | State (mapped / auto-created)                                                 |
| Priority          | Priority (Highest/High→urgent/high, Medium→medium, Low/Lowest→low, none→none) |
| Labels            | Labels                                                                        |
| Reporter          | `created_by`                                                                  |
| Assignee          | Assignees                                                                     |
| Created / dates   | timestamps, start/target dates                                                |
| Sprint            | Cycle (+ membership + dates)                                                  |
| Component         | Module                                                                        |
| Comments          | Work item comments (author+ts)                                                |
| Attachments       | Attachments                                                                   |
| Issue links       | Relations / Links                                                             |
| Issue type        | Work Item Type (if enabled)                                                   |

---

## 3. Permissions & security

- Jira import: **workspace admin**.
- Manage Work Item Types & properties: **project admin**.
- Set property values: anyone with work-item write (Admin/Member).

**SSRF protection.** The Jira client validates every outbound URL (the user-supplied
domain and any attachment content URL) with `plane.utils.ip_address.validate_url`, which
resolves the host and rejects private/loopback/reserved/link-local IPs; redirects are not
followed (`allow_redirects=False`); upstream response bodies are never reflected back to the
caller. This matches the repo's existing outbound-link hardening.

**Required-field enforcement.** The property-value endpoint validates the payload against
**all** active properties of the work item type (not only the ones present in the request),
so a required field cannot be bypassed by omitting it. Booleans are exempt (default false).
Note: because the detail panel submits the full draft, an existing work item with an unset
required custom field must have it filled before other custom values can be saved — the
intended "required means required" behaviour.

## 4. Testing

- **Backend (pytest, Docker stack):** custom-field model + serializer validation
  (required/type/option/cardinality); property-value upsert; Jira client against mocked HTTP;
  `jira_import_task` mapping (status/priority/sprint/user resolution, idempotent re-run) with
  JSON fixtures.
- **Frontend:** `pnpm check:types` + `pnpm check:lint`; manual wizard + properties walkthrough.

## 5. Out of scope (follow-ups)

- Spreadsheet custom-field columns / filtering by custom fields.
- Importing Jira **custom fields** into Plane custom fields (cloud doesn't do this either).
- OAuth for Jira (PAT only for now); encrypted-at-rest credential storage.
- Other importers (Linear/Asana/CSV) — the `ImportJob.source` field leaves room.

## 6. Migration & rollout

- Migrations `0122` (custom fields) and `0123` (ImportJob) — hand-authored to the existing
  `CreateModel` format; regenerate/verify with `python manage.py makemigrations --check` in
  the Docker stack before merge.
- No env vars required for custom fields. Jira import needs only outbound HTTPS to
  `*.atlassian.net` from the worker; attachment upload reuses existing S3/MinIO config.
- Ship behind no flag; both features are discoverable via existing settings nav.
