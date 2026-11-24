# Liviere/plane fork

A fork of Plane Community Edition with our own changes; it runs `plane.liviere.studio`.

## Branches

- `master`, `preview` – exact mirrors of [makeplane/plane](https://github.com/makeplane/plane). Never commit
  to them, only sync them with upstream.
- `liviere` – our changes on top of an official release (started from tag `v1.4.2`). New features go to
  `feat/*` branches and are merged into `liviere` via PR (note: in a fork GitHub suggests `makeplane/plane`
  as the PR target – change it).

## Releases and images

A `v<official version>-liviere.<n>` tag (e.g. `v1.4.2-liviere.1`) runs `.github/workflows/liviere-images.yml`,
which builds 6 images `ghcr.io/liviere/plane-{frontend,space,admin,live,backend,proxy}:<tag>`.
On the server: `PLANE_IMAGE_REPO=ghcr.io/liviere` and `APP_RELEASE=<tag>` in `plane.env`.

## Updating to a new official release

```sh
git fetch upstream --tags
git switch liviere && git merge v1.5.0   # an official tag, not preview
git tag v1.5.0-liviere.1 && git push origin liviere v1.5.0-liviere.1
```

Never merge `preview` – it carries database migrations that releases do not have yet.

## Rules for our changes

- **Database:** our own models live in a separate Django app (`apps/api/plane/liviere/`) with its own
  migrations. Do not add files to `apps/api/plane/db/migrations/` (numbering clashes with upstream). Instead of
  altering official tables, add separate tables linked 1:1 or by a foreign key.
- **Our code** goes to `liviere` directories next to the official code (`apps/api/plane/liviere/`,
  `apps/live/src/liviere/`, `apps/web/liviere/`); official files only get hook points (a few lines, marked
  `Liviere/plane fork`). Upstream removed the `apps/web/ce/` layer in v1.4 (#9245) and flattened
  `apps/web/core/` into `apps/web/` in v1.5 (`@/*` points at the app root); the leftover stubs (e.g.
  `apps/web/store/pages/extended-base-page.ts`, `packages/types/src/page/extended.ts`) are the intended
  extension points.
- Our app `plane.liviere` (`apps.py`, registered in `INSTALLED_APPS`) holds our models, migrations
  (`plane/liviere/migrations/`), signals and Celery tasks (`plane/liviere/tasks.py`, found by autodiscovery).
  Periodic tasks are scheduled by `django_celery_beat` rows created in our migrations, not in `plane/celery.py`.
- Since v1.5 upstream's `makemigrations` also rewrites `apps/api/migrations_lockfile.txt` (latest migration per
  app) and `makemigrations --check` fails when it does not match; commit our `liviere: <migration>` line with
  every new migration of ours. It sorts last in the file, so upstream changes to the `db:` line do not conflict.
- Going back to the official images: our migrations only add tables, which the official code ignores, so a
  change of `PLANE_IMAGE_REPO`/`APP_RELEASE` still works; disable our periodic tasks first (see the feature
  sections). Removing our tables needs `manage.py migrate liviere zero` on a fork image.
- **Language:** code comments, documentation and commit messages are in English.

## Project pages API (`/api/v1/.../projects/{id}/pages/`)

Our code is in `apps/api/plane/liviere/` (`api/` public API, `app/` app endpoints, `live_client.py`),
`apps/live/src/liviere/` and `apps/web/liviere/`. Tests: `apps/api/plane/tests/contract/api/test_pages.py`,
`apps/live/tests/liviere/` (`redis-publish.test.ts` needs a Redis: `TEST_REDIS_URL=redis://…`); compatibility check against `plane-sdk==0.3.1`:
`apps/api/plane/liviere/scripts/sdk_pages_smoke.py`. The contract follows the SDK: list, retrieve, create,
`PUT`/`PATCH` (both partial), `POST`/`DELETE .../archive/`, `DELETE` (archived pages only).
Permissions are the same as in the UI (`ProjectPagePermission`).

**Content and title of a page opened in the editor.** The editor works on the Yjs document
(`description_binary`, fragments `default` and `title`) that the `live` server stores when a page is first
opened. Once it exists, the API never rebuilds it from HTML (an open editor would overwrite the change and a
browser's y-indexeddb copy would duplicate the content). Instead:

1. Django locks the page row and sends the stored binary and the change to `live`
   (`POST /live/liviere/page-edit/`, header `live-server-secret-key` = `LIVE_SERVER_SECRET_KEY`).
2. `live` computes the change against the stored document with `updateYFragment` (y-prosemirror): only the
   nodes that differ are changed, so unchanged paragraphs keep their Yjs items. If the page is open, the
   change is merged into the in-memory document as a CRDT update – editors see it immediately and text a person
   typed but `live` has not stored yet is kept. `live` returns the resulting binary, HTML and JSON.
3. Django stores binary, HTML, JSON and `name` in one write, then asks `live` to replay the update on a document
   opened in the meantime and on other `live` instances (`POST /live/liviere/page-edit/publish/`, Redis channel
   `hocuspocus:<page id>`).

If `live` cannot be reached, the API answers 503 and writes nothing. Pages without a binary (never opened) get
their HTML written directly; `live` builds the document from it on first open. `live` is found at
`settings.LIVE_URL`, else `LIVIERE_LIVE_URL`, else `http://live:3000/live/` (service name in the compose files).

The API replaces the whole content: text that is already stored but missing from the HTML sent by the client is
removed. Version history keeps the previous content (`track_page_version`; its v1.4.2 bug – it read the
non-existent `Page.description` and silently saved nothing – is fixed in this fork).

**Block API changes.** Page menu (•••) → *Block API changes*, available to the page owner and project admins
(`POST`/`DELETE /api/workspaces/.../pages/{id}/liviere/api-block/`, session only – API keys cannot reach it).
Stored as `view_props.liviere_block_api`; the app does not write page `view_props` (full width and sticky
toolbar are browser-local), but a project member sending a crafted app `PATCH` with `view_props` could
overwrite it. When on, every change through the API (update, archive, unarchive, delete) answers 409 and writes
nothing; reading works and returns `api_changes_blocked: true`.

**Locking.** `is_locked` can be set when creating a page through the API; locking and unlocking afterwards is
done in the app only (403 through the API). A locked page refuses every change through the API.

## Project activity (`/api/v1/.../projects/{id}/activity/`)

A per-project heatmap of when work happens, like GitHub contributions but finer: rows are days, columns are the
96 quarters of the day, the colour says how many actions happened in that quarter. It also gives an approximate
time (quarters with any activity × 15 min) – not logged working time. The current quarter has an amber outline
and the rest of today is dimmed; the page moves both on every quarter, without a reload.

Code: `apps/api/plane/liviere/activity/` (catalog, recording, queries), `liviere/models.py`
(`ActivityEvent`, `ProjectActivitySettings`), `liviere/app/activity.py` and `liviere/api/activity.py`
(endpoints), `apps/web/liviere/activity/` (page, settings, sidebar item), i18n namespace `liviere`
(`packages/i18n/src/locales/*/liviere.json`; only `en` and `pl` are translated). Tests:
`apps/api/plane/tests/contract/api/test_activity.py`.

**Recording.** Every action becomes an `ActivityEvent` (project, actor, time, kind, object):

- Work items: copied from `IssueActivity`, the history Plane keeps anyway, by the Celery task
  `plane.liviere.tasks.sync_issue_activity_events` every minute (django_celery_beat row
  `liviere: sync issue activity to activity events`). Each run takes rows updated since the last copy minus
  10 minutes and skips what it already has (`source_id` is unique), so it is idempotent and needs no change to
  the upstream activity task. Migration `0002` copies the whole existing history once.
- Pages, cycles, modules, views have no history table; Django signals record them (`activity/signals.py`).
  The actor comes from `crum` (the request user, also for API keys and for page content stored by `live`
  with the editor's cookie); saves without a user (background tasks) are skipped. Page content edits count at
  most once a minute per person and page (`live` stores an open page every ~10 s). Page archive/unarchive run
  raw SQL, so `PageViewSet.archive/unarchive` and our API call `record_page_archive` (hook in
  `plane/app/views/page/base.py`).

**Catalog** (`activity/kinds.py`; off by default: reactions/votes, views): work item created, state, property,
description, comment, link/attachment, relation/sub-item, cycle/module membership, archive/delete, intake;
page created, edited, renamed, archived/deleted; cycle changed, module changed; view changed; log entry.

**Settings** – Project settings → Features → Activity (project admins): *Enable Activity* (shows the item in
the project navigation; events are recorded either way) and the counted actions. Stored in
`ProjectActivitySettings`; the choice of actions applies at read time, so also to the past.

**API.** Project admins and members (not guests – events name work items a guest may not see):

| Endpoint | |
|---|---|
| `GET .../activity/heatmap/` | sparse buckets `[{date, slot (0-95), start, count, by_kind}]` + `summary` (`events`, `active_buckets`, `active_hours`, `by_kind`) |
| `GET .../activity/events/` | the actions, newest first, with actor and referenced work item/page/cycle/module/view (paginated like other v1 lists) |
| `GET .../activity/settings/` | `enabled`, counted `kinds`, `catalog` |

Parameters: `from`, `to` (local dates, default the last 30 days, at most 366), `tz` (IANA name, default the
project time zone), `actor` (user id), `kinds` (comma-separated, default the project setting); `events` also
takes `start`/`end` (ISO date-times, e.g. one quarter). On the day clocks go back, both copies of the repeated
hour fall into the same slots. The settings change only in the app
(`PATCH /api/workspaces/.../projects/{id}/liviere/activity/settings/`, project admin).

### Activity log (`/api/v1/.../projects/{id}/activity/logs/`)

What a person or an AI agent did and when, for work that leaves no other trace in Plane (code, servers,
research). An entry is an `ActivityEvent` with `source="log"`, `kind="log.entry"`, the text in `note`, the start
in `occurred_at` and an optional end in `ended_at`; it counts once in every quarter of its range and once in the
summary. Rules in `activity/logs.py`; migration `0003` adds the columns and `log.entry` to saved settings.

| Endpoint | |
|---|---|
| `GET .../activity/logs/` | entries (same parameters and format as `events/`, whatever kinds the project counts) |
| `POST .../activity/logs/` | new entry → 201 |
| `GET/PATCH/DELETE .../activity/logs/{id}/` | one entry |

Body: `text` (required, ≤ 4000 characters); time as `started_at` + `ended_at`, `started_at` +
`duration_minutes`, only `duration_minutes` (ends now) or only `started_at`/nothing (a moment, one quarter);
ISO date-times, without an offset in the project time zone; at most 12 h, not in the future. Optional `issue`
(UUID or identifier such as `ORD-12`) and `page` (UUID), both of this project. Admins and members write; the
author or a project admin changes and deletes (hard delete). A `PATCH` with a new start keeps the length. The
same endpoints exist for the app under `/api/workspaces/.../projects/{id}/liviere/activity/logs/`; the
*Activity* page has *Add entry* and edit/delete in the list of a quarter; its *Work log* tab (`?view=log`) lists
the entries of the chosen range by day, with the count and the time covered per day (overlapping entries and
parallel sessions count once; computed from the loaded entries), and loads more while scrolling.

**`liviere/tools/plane-log`** – a command-line client for agents (Python standard library only). It reads the
token from `~/.config/plane-mcp/env`, like the Plane MCP setup, and takes project identifiers:
`plane-log add -p ORD --minutes 40 --issue ORD-12 "…"`, `plane-log list -p ORD --date … [--at HH:MM --events]`,
`plane-log edit`/`rm`. The `plane-mcp-server` package does not know these endpoints.

**Disabling the sync** (e.g. before going back to images without our code, where the worker would log an unknown
task): `docker compose exec api python manage.py shell -c "from django_celery_beat.models import PeriodicTask;
PeriodicTask.objects.filter(name__startswith='liviere:').update(enabled=False)"`.


## New work items (`/:workspace/new-work-items`)

Most work items here are created by AI agents (API key, MCP). *New* lists the work items somebody else created in
my projects that I have not opened yet, with a counter in the workspace sidebar.

Code: `apps/api/plane/liviere/unread/queries.py` (rules), `liviere/models.py` (`WorkItemOpen`,
`UnreadWorkspaceCutoff`, `UnreadProjectCutoff`), `liviere/app/unread.py` (endpoints), `apps/web/liviere/unread/`
(page, sidebar item, `markWorkItemOpened`), i18n namespace `liviere` (`liviere.unread.*`). Tests:
`apps/api/plane/tests/contract/app/test_unread_work_items.py`.

**Rules.** A work item is new for a person when all of these hold:

- it is listed normally (`Issue.issue_objects`: no drafts, triage/intake, archived or deleted items, no archived
  projects), in any state;
- the person is an active member of its project and may see others' work items (guests only with
  `guest_view_all_features`; a restricted guest sees only their own, which never count);
- somebody else created it (a work item without an author counts too);
- it was created after the person's cutoff of the project and there is no `WorkItemOpen` row for it.

The cutoff is the latest of three times: the workspace cutoff (`UnreadWorkspaceCutoff`, set to the migration time
for every existing workspace by migration `0004`, so nothing that existed at deployment is new), the time the
person joined the project (`ProjectMember.created_at`, so a newcomer does not inherit the project's history) and
the person's *Mark all as read* time for the project (`UnreadProjectCutoff`). No rows are written per work item
except when one is opened.

**Opened = peek or full page.** The web app calls
`POST /api/workspaces/{slug}/projects/{id}/liviere/work-items/{id}/opened/` (session only, idempotent, 204; 404 when
the person may not see the work item) from two hooks: the peek overview (`components/issues/peek-overview/root.tsx`,
after `fetchIssue`; every peek – layouts, *Your work*, Home, Inbox, pages – renders this component) and the full
page (`app/(all)/[workspaceSlug]/(projects)/browse/[workItem]/page.tsx`). The upstream `retrieve` endpoints are not
used: `fetchIssue` also retrieves the parent of the opened item and the edit modal retrieves its item, which would
mark items nobody opened. Reading a work item through `/api/v1/` never marks it, also with the person's own key.
Opening from the edit modal or the intake view does not count.

**Endpoints** (session; any workspace role):

| Endpoint | |
|---|---|
| `GET /api/workspaces/{slug}/liviere/new-work-items/` | newest first: `{results, has_more, as_of}`; `projects` (comma-separated ids), `per_page` (≤ 200, default 50), `older_than` (`created_at` of the last item – keyset paging, so items opened meanwhile do not shift the next page) |
| `GET .../new-work-items/count/` | `{total, by_project, as_of}` |
| `POST .../new-work-items/mark-read/` | `{before, project_ids?}` → `{cleared}`; moves the person's cutoff of the projects (all or the given ones) to `before`, never back |

`before` must be the `as_of` the server returned (400 when missing or in the future), so the browser clock never
decides what is marked and items created after the list was loaded stay new.

**Web.** Sidebar item *New* with the count (hook in `components/workspace/sidebar/sidebar-menu-items.tsx`; always
shown, not part of *Customize navigation*, which would need the upstream `UserPreferenceKeys` enum), refreshed
every minute, on focus and after every change. The page (route in `app/routes/extended.ts`) has a project filter
(`?projects=`) and *Mark all as read*; a row opens the peek (the full page on phones) and disappears once opened.

**Going back** to images without our code: nothing to disable; the tables stay unused. `migrate liviere 0003` on a
fork image removes them.

### Push notifications

A system notification (Web Push, e.g. Firefox on Windows) when somebody else creates a work item in a project I
chose. Code: `apps/api/plane/liviere/push/` (`config.py` VAPID keys, `webpush.py` sending, `notify.py`
recipients and texts, `messages.py`, `signals.py`), `liviere/app/push.py` (endpoints), `liviere/models.py`
(`PushSubscription`, `PushProject`, migration `0005`), `apps/web/liviere/push/` and the service worker
`apps/web/public/liviere/push-sw.js`. Tests: `apps/api/plane/tests/contract/app/test_push_notifications.py`,
`apps/api/plane/tests/unit/liviere/test_webpush.py`.

**Keys** – environment only, never in the repository; all three or push stays off (the profile section then says
it is unavailable, subscribing answers 503 and nothing is queued):

| Variable | |
|---|---|
| `LIVIERE_VAPID_PUBLIC_KEY` | base64url of the uncompressed P-256 public point (65 bytes) |
| `LIVIERE_VAPID_PRIVATE_KEY` | base64url of the 32-byte private scalar (must match the public key) |
| `LIVIERE_VAPID_SUBJECT` | `mailto:…` or `https://…` contact for the push services |

`api` and `worker` both need them (`x-app-env` in `deployments/cli/community/docker-compose.yml` passes them; the
local `docker-compose-local.yml` reads `apps/api/.env`). The web app gets the public key from the API.

**Flow.** `post_save` of a new `Issue` (app, `/api/v1/` with an API key, MCP) queues
`plane.liviere.tasks.notify_new_work_item` with `transaction.on_commit`; nothing happens in the request when the keys
are missing or the item is a draft, and the receiver never raises. The task reads the item from
`Issue.issue_objects` (no drafts, triage, archived, deleted) and sends to every browser of every recipient:
people who chose the project (`PushProject`, per account), except the author, who are active members allowed to
see others' work items – the rules of *New*. Not notified: items created by `bulk_create` (imports) and intake
items accepted later.

**One notification per project.** The tag is `liviere-new-<project id>`, so a newer notification replaces the
older one; `renotify` is not set, so a replacement is silent while the previous one is still shown. The title counts
the recipient's new work items of the project at sending time: with one, `LS-7 · Project name` and a click opens
the work item (which marks it as read); with more, `LS: 4 new work items` (Polish for a `pl` profile language:
`nowe elementy pracy` / `nowych elementów pracy`) and a click opens *New* filtered to the project. The body is the
title of the newest one. Nothing else of the work item is sent.

**Sending** (`webpush.py`): aes128gcm (RFC 8291, `http-ece`) and a VAPID JWT (RFC 8292, ES256 with `PyJWT`), TTL
24 h. The endpoint comes from the browser, so it must be `https://` on a known push service
(`updates.push.services.mozilla.com`, `fcm.googleapis.com`, `*.notify.windows.com`, `*.push.apple.com`; checked when
subscribing and when sending) and the request goes through `pinned_fetch` like webhooks. 404/410 removes the
subscription; other failures increase `failure_count` and are not retried.

**Endpoints** (session, user-level – the profile page is outside a workspace):

| Endpoint | |
|---|---|
| `GET /api/users/me/liviere/push/` | `available`, `public_key`, workspaces with the projects one may choose (`selected`) |
| `PUT .../push/projects/` | `{project_ids}` – the whole choice |
| `POST`/`DELETE .../push/subscriptions/` | `{endpoint, keys: {p256dh, auth}}`; the same browser signed in with another account takes the subscription over |
| `POST .../push/test/` | a test notification to my browsers (queued task) |

**Web.** Profile settings → Notifications → *Push notifications* (hook in
`components/settings/profile/content/pages/notifications/root.tsx`): *Enable in this browser* asks for the browser
permission only on that click, then project switches, *Send a test* and *Turn off*. The service worker is registered
with the scope `/liviere/push/`, so it controls no page and cannot clash with an app worker at `/` (the old unused
`public/sw.js` is left alone). A click focuses a tab already showing the target or opens a new one.

**Going back** to images without our code: nothing queues the task there; to stop pushes while staying on a fork
image, remove one of the three variables.
