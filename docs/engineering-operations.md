# Engineering Operations

The implementation of [`PROJECT.md`](../PROJECT.md) — the operational layer that sits beside the Workspaces
work tracking so developers, QA, PMs and DevOps rarely need to leave the workspace.

Everything here follows the spec's first principle: **nothing duplicates a Workspaces concept.** Projects,
cycles, modules, issues, states, labels and members stay exactly as Workspaces defines them. What this
layer adds is the operations _around_ execution — attendance, the day people actually had, requests
that have not yet earned an issue, the documents that were never work, what got deployed, and the
metrics that fall out of all of it.

---

## Where it lives

| Layer                | Path                                                               |
| -------------------- | ------------------------------------------------------------------ |
| Models               | `apps/api/workspaces/db/models/operations.py`                      |
| Migration            | `apps/api/workspaces/db/migrations/0123_engineering_operations.py` |
| Serializers          | `apps/api/workspaces/app/serializers/operations.py`                |
| Views                | `apps/api/workspaces/app/views/operations/`                        |
| Routes               | `apps/api/workspaces/app/urls/operations.py`                       |
| Workflow vocabulary  | `apps/api/workspaces/utils/engineering_ops.py`                     |
| Bootstrap            | `apps/api/workspaces/utils/engineering_ops_setup.py`               |
| Reminders            | `apps/api/workspaces/bgtasks/operations_reminder_task.py`          |
| Odoo client          | `apps/api/workspaces/utils/odoo_bridge.py`                         |
| Attendance endpoints | `apps/api/workspaces/app/views/attendance/`                        |
| Web services         | `apps/web/core/services/operations/`                               |
| Web components       | `apps/web/core/components/operations/`                             |
| Web routes           | `apps/web/app/(all)/[workspaceSlug]/(projects)/operations/`        |
| Tests                | `apps/api/workspaces/tests/unit/views/test_operations.py`          |

The web section is at `/<workspace>/operations`, reachable from a permanent sidebar entry.

---

## The workflow

`PROJECT.md` fixes a nine-state workflow and assigns each state an owner. Because Workspaces states are
per project and freely renamed, **no code hard-codes a state name at the point of use.** Instead:

- `ENGINEERING_WORKFLOW_STATES` in `engineering_ops.py` holds the canonical states and their Workspaces
  state-group mapping (which is what board columns and cycle progress read).
- `DEFAULT_STATE_MAPPING` maps semantic buckets (`qa`, `blocked`, `developer_owned`, …) onto those
  names.
- `OperationsSetting.config` lets a workspace that already had its own states say which of theirs
  mean what, merged over the defaults one key at a time.

Every dashboard and metric asks for a bucket. Only that table knows the names.

| State                     | Group     | Owner           |
| ------------------------- | --------- | --------------- |
| Backlog                   | backlog   | Project manager |
| Todo                      | unstarted | Project manager |
| In Progress               | started   | Developer       |
| Ready for Test Deployment | started   | Developer       |
| QA Testing                | started   | QA              |
| Ready for Release         | started   | QA              |
| Deployed                  | completed | DevOps          |
| Halt                      | backlog   | Project manager |
| Cancelled                 | cancelled | Project manager |

`developer_owned` — In Progress and Ready for Test Deployment — is what productivity is measured
over, per the spec's rule that developers are only measured in developer-owned states.

### Applying it

Additive and idempotent. States, labels and work-item types that already exist are left alone;
nothing is ever deleted.

```bash
# Every project in the workspace
python manage.py bootstrap_engineering_ops --workspace hgn

# One project, reporting what it would do and rolling back
python manage.py bootstrap_engineering_ops --workspace hgn --project <uuid> --dry-run
```

Or from the UI: **Operations → Settings → Apply the engineering workflow** (workspace admins).

The one non-additive thing it does is rename a project's `Done` state to `Deployed` — and only while
no issue is sitting in it. Past that point the name is part of somebody's history.

---

## What each piece does

### Work logs

One row per person per day, enforced by a unique constraint. A day that can be filed twice is a day
nobody can count, and "who is missing a log?" is the question the PM dashboard is built around.

- `GET /api/workspaces/<slug>/work-logs/me/` returns today's log, **creating the draft if absent** —
  a GET that writes, deliberately, so no client has to handle "404 means POST an empty one".
- Drafts autosave; `submit` is a separate act and refuses an empty log, so the missing-logs counter
  cannot be zeroed by clicking the button.
- `work-logs/missing/` is the single definition of "missing", shared by the dashboard tile and the
  nightly reminder.

### Operations tickets

A request that has not yet earned a Workspaces issue. The lifecycle in `ALLOWED_TRANSITIONS`
(`views/operations/ticket.py`) is the graph from `PROJECT.md`, and it is enforced server-side — the
frontend's copy in `components/operations/constants.ts` only decides which buttons to draw.

Two rules the tests cover because nothing else would catch them breaking:

- **Nothing transitions to `converted`.** Conversion goes through `/convert/` only, so a ticket can
  never be marked converted with no work item behind it.
- **Approval requires review.** A brand new request cannot jump to approved.

Conversion runs in one transaction and copies the description, priority, reporter (when they are a
member of the target project), and target date; labels the issue with its source; optionally files it
under a module; links both records; and writes an audit row. It happens once — a converted ticket is
read-only afterwards, because editing the request after it became work makes the audit trail lie.

### Records

Incidents, RCAs, architecture decisions, outages, meeting notes. These have no state, no assignee and
no sprint on purpose: filing an RCA as an issue would put it in every burndown and every velocity
number, which is exactly the distortion the records module exists to avoid. They are rows so they stay
searchable (`description_stripped` is maintained on save) and auditable.

### Deployments

Project-scoped, because a release without an application is not something anybody can act on.
`started_at` and `completed_at` are set by the API from the status change rather than typed in — a
history whose timestamps were typed by hand is not a history.

### Dashboards

Four points of view on one route, each **one request**. A PM should understand team health from a
single screen, and a screen that fires fourteen requests is half-loaded whenever anybody looks at it.

Attendance is the deliberate exception: it is a second request, because it talks to Odoo and a
dashboard that waits on an external system to render its own data feels broken whenever that system is.

### Analytics

Every metric is derived from work the team already does — issue transitions, cycles, deployments, work
logs — so nothing has to be filled in to keep the numbers honest.

Where a metric has more than one defensible definition, the API returns the definition it used and the
UI prints it beside the number:

| Metric        | Definition                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Lead time     | Created → completed                                                                                                                 |
| Cycle time    | First entry into a developer-owned state → completed. Issues that never passed through one are excluded rather than counted as zero |
| QA time       | Entering QA Testing → leaving it. An issue still in QA contributes nothing, so a stuck queue cannot look fast                       |
| Reopened rate | Moves from a QA state back to development, over the issues that entered QA                                                          |
| Escaped bugs  | Bugs and hotfixes filed within 14 days after a production deployment in the same project                                            |
| Velocity      | Completed issues per cycle, counting only velocity-bearing types (Research, Documentation and Spike are excluded per the spec)      |

Cycle time, QA time and the reopened rate all come off `IssueActivity` — an issue's current state has
no memory of the path it took.

### Reports

Weekly, monthly, sprint, executive and team. A report is a period plus a point of view; there is no
report _data_ the dashboards do not already produce. Each preset gets the window its name promises —
"weekly" is the Monday-to-Sunday week that just finished, not thirty days — and the executive report
carries a plain-language headline derived only from numbers already in the payload, so it can never
disagree with the tables under it. Every report copies as plain text.

### Notifications

Celery tasks in `operations_reminder_task.py`, landing in the Workspaces inbox rather than email or a
webhook — the point of the extension is that people stop leaving Workspaces.

Two rules hold across all of them: **never notify twice for the same thing in a day** (a reminder that
repeats hourly is a reminder people mute), and **respect the workspace's configuration**. The
work-log and attendance reminders run hourly and each checks the workspace's _local_ hour before
firing, which is how one UTC schedule respects a team in Kathmandu and a team in Lisbon at once.

---

## Odoo

Odoo stays the source of truth for attendance; Workspaces is the interface. The browser never holds the
bridge key and never talks to Odoo — the Workspaces Django layer proxies, authenticated by the session
cookie like every other call.

Three bridge endpoints are deployed and working: today's status, check in, check out. Four more are
called but not yet served — history, leave, holidays, working hours — plus a team endpoint. Those
answer **200 with `available: false`**, not an error, and the UI says so plainly instead of showing a
plausible zero. Their contracts are written up in
[`odoo-implementation/ODOO_MODULE_SPEC.md`](../odoo-implementation/ODOO_MODULE_SPEC.md); once the
module ships they start returning data with no change on the Workspaces side.

Team availability tries the bridge's team endpoint first and falls back to a bounded, parallel,
one-minute-cached fan-out over `/attendance/me`. That fallback is why the PM dashboard can answer
"who is in?" today.

---

## Configuration

`OperationsSetting` — one row per workspace, one JSON blob, so adding a knob never needs a migration.
Reads are open to any member (the state mapping is what every number on screen is phrased in, and a
member who cannot see it cannot tell why a number is what it is); writes are admin-only. Saving one
panel merges rather than replaces, so it cannot wipe the panels it did not render.

Environment (`apps/api/.env`):

```
ODOO_BASE_URL=https://odoo.example.com
ODOO_API_KEY=<the key from Odoo → Settings → Atlas Bridge>
```

Both blank is a supported state: attendance reports itself unavailable, the navbar control hides, and
nothing logs an error.

---

## Not implemented

Stated plainly so nobody goes looking:

- **Attachments on operations tickets.** The spec's conversion list includes "copy attachments";
  everything else on that list is copied. Ticket attachments need a new `FileAsset` entity type plus
  upload/serve endpoints, and moving an asset between entities on conversion needs care about which
  row owns the S3 object. Descriptions are plain text today.
- **Team-wide attendance and leave trends.** Blocked on the bridge endpoints above. The team-analytics
  response says so rather than returning zeroes.
- **Phase 2–4 integrations** (GitHub, GitLab, Discord, Slack, Jenkins, Azure DevOps; SonarQube, Sentry,
  Grafana, Prometheus, Loki; the AI features). `PROJECT.md` lists these as future phases, and none of
  them are in the phase 1–7 roadmap this implements.
- **Modules are suggested, not created.** The twelve business domains are offered in Settings;
  creating them is the Workspaces per-project module screen, which already does the job.

---

## Running it

```bash
# Backend checks
cd apps/api && python manage.py check
python -m pytest workspaces/tests/unit/views/test_operations.py -m unit

# Frontend
pnpm turbo run check:types --filter=web
pnpm exec oxlint apps/web/core/components/operations

# Locales (a new sidebar string was added to all 20)
pnpm --filter @workspaces/i18n run sync:check
```
