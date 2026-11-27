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

**Block API changes.** Page menu (•••) → _Block API changes_, available to the page owner and project admins
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

**Period and time zone.** The page shows days and quarters in the project time zone (Project settings → General;
the browser's only until the project is loaded), like the API and `plane-log`; the log entry dialog reads its
times in the same zone. The period is in the URL, for the grid and the _Work log_ tab alike:
`?range=7d|30d|90d|month|prev_month` (default 30 days; `month` is the current month from its first day to today,
`prev_month` the whole previous month, both in the project time zone) or a custom `?from=YYYY-MM-DD&to=YYYY-MM-DD`
(at most 366 days, picked in the date field of the toolbar). The page sends `from`, `to` and `tz` to the same
`heatmap`/`events`/`logs` endpoints as before.

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

**Settings** – Project settings → Features → Activity (project admins): _Enable Activity_ (shows the item in
the project navigation; events are recorded either way), the counted actions, the series thresholds of the
time report and its skipped periods. Stored in
`ProjectActivitySettings`; the choice of actions applies at read time, so also to the past.

**API.** Project admins and members (not guests – events name work items a guest may not see):

| Endpoint                     |                                                                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `GET .../activity/heatmap/`  | sparse buckets `[{date, slot (0-95), start, count, by_kind}]` + `summary` (`events`, `active_buckets`, `active_hours`, `by_kind`) |
| `GET .../activity/events/`   | the actions, newest first, with actor and referenced work item/page/cycle/module/view (paginated like other v1 lists)             |
| `GET .../activity/settings/` | `enabled`, counted `kinds`, `series_gap_minutes`, `series_padding_minutes` (time report), `catalog`                               |

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

| Endpoint                                   |                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `GET .../activity/logs/`                   | entries (same parameters and format as `events/`, whatever kinds the project counts) |
| `POST .../activity/logs/`                  | new entry → 201                                                                      |
| `GET/PATCH/DELETE .../activity/logs/{id}/` | one entry                                                                            |

Body: `text` (required, ≤ 4000 characters); time as `started_at` + `ended_at`, `started_at` +
`duration_minutes`, only `duration_minutes` (ends now) or only `started_at`/nothing (a moment, one quarter);
ISO date-times, without an offset in the project time zone; at most 12 h, not in the future. Optional `issue`
(UUID or identifier such as `ORD-12`) and `page` (UUID), both of this project. Admins and members write; the
author or a project admin changes and deletes (hard delete). A `PATCH` with a new start keeps the length. The
same endpoints exist for the app under `/api/workspaces/.../projects/{id}/liviere/activity/logs/`; the
_Activity_ page has _Add entry_ and edit/delete in the list of a quarter; its _Work log_ tab (`?view=log`) lists
the entries of the chosen range by day, with the count and the time covered per day (overlapping entries and
parallel sessions count once; computed from the loaded entries), and loads more while scrolling.

**`liviere/tools/plane-log`** – a command-line client for agents (Python standard library only). It reads the
token from `~/.config/plane-mcp/env`, like the Plane MCP setup, and takes project identifiers:
`plane-log add -p ORD --minutes 40 --issue ORD-12 "…"`, `plane-log list -p ORD --date … [--at HH:MM --events]`,
`plane-log edit`/`rm`. The `plane-mcp-server` package does not know these endpoints.

**Disabling the sync** (e.g. before going back to images without our code, where the worker would log an unknown
task): `docker compose exec api python manage.py shell -c "from django_celery_beat.models import PeriodicTask;
PeriodicTask.objects.filter(name__startswith='liviere:').update(enabled=False)"`.

### Day summaries (`/api/v1/.../projects/{id}/activity/summaries/`)

A few sentences on what happened in a project on one day, mostly written by AI agents at the end of their
work: easier to read than every action or log entry. `ActivityDaySummary` (table
`liviere_activity_day_summaries`, migration `0008`): project, local day in the project time zone, author, text
(≤ 8000 characters); one per project, day and author. Not an activity event, so it adds no time. Rules in
`activity/summaries.py`.

| Endpoint                                        |                                                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET .../activity/summaries/`                   | summaries of `from`–`to` (default the last 30 days), optionally of one `actor`, newest day first                                                |
| `POST .../activity/summaries/`                  | `{date, text}` (`date` default today, not in the future) → 201 new, or 200 with `"replaced": true` when the author already has one for that day |
| `GET/PATCH/DELETE .../activity/summaries/{id}/` | one summary; `PATCH {text}`                                                                                                                     |

Admins and members write; the author or a project admin changes and deletes. All agents of one account share
an author, so a `POST` of a second session replaces the first one's summary: `plane-log summary add` therefore
asks first and refuses without `--replace` (overwrite) or `--append` (add a paragraph);
`plane-log summary show|edit|rm` do the rest. The same endpoints exist for the app under
`/api/workspaces/.../projects/{id}/liviere/activity/summaries/`; the _Summaries_ tab of the _Activity_ page
(`?view=summaries`) lists them by day with add, edit and delete (your summary of a day opens for editing). The
time report shows the summaries of its days (JSON `days[].summaries`, the _Log entry_ column of the PDF, Markdown
and _Report_ tab; not CSV).

### Time report (`/api/v1/.../projects/{id}/activity/report/`)

How much time went into one project in a period, for weekly and monthly reports. The grid of the page keeps
counting quarters; the report counts real time from one of three sources (`source`):

- `grid` – **series of actions**, not quarter-hours: actions (not log entries; the kinds the project counts) less
  than _gap_ minutes apart form a series that lasts from the first to the last action plus _padding_ minutes, so
  a single action counts _padding_. Defaults 15 and 5, per project in the Activity settings (gap 1–120,
  padding 0–60 and not above the gap). Example: actions at 10:13 and 10:16 are 8 min (two quarters: 30).
- `log` – work log entries; an entry without an end counts 15 min, as in the _Work log_ tab. Entries count
  whatever kinds the project counts.
- `mixed` (default) – both of them per day, the difference (log − series) and as the result the rule
  **"work log + actions outside the log"** (`mixed_rule: "log_plus_actions"`): the time covered by an entry or
  by a series, counted once. Actions outside entries add to it, also those of AI agents (work items created by
  an agent at night count 5 min each unless an entry covers them).

Series are built per person; the project time is the union of everybody's ranges, so parallel work (two people,
or two agent sessions of one account) counts once, and JSON `people` gives each person's own time. Ranges are
split at local midnights of the project time zone (`tz`) and counted in real time, so the day clocks go back
has 25 hours. Every cell (a day of one source, for the project or one person) is rounded to whole minutes, half
up; the difference and totals add up rounded cells, so every format shows the same numbers. Actions just before
and just after the period still shape the series that reach into it (the report reads a margin of the series gap
on both sides): a day counts the same in a report of that day and of its month. Code: `activity/report.py` (counting, pure functions), `report_export.py` (Markdown, CSV, the table rows),
`report_pdf.py` (PDF), `report_grid.py` (levels of the PDF grid), `report_labels.py` (texts of the files in
`en`/`pl`; the app has its own in the i18n namespace, `liviere.activity.report.*` – keep the column names in step); tests `plane/tests/unit/liviere/test_activity_report.py` (hand-counted examples)
and `plane/tests/contract/api/test_activity_report.py`.

`GET .../activity/report/` (admins and members, the same parameters as `heatmap/`: `from`, `to`, `tz`, `actor`,
`kinds`) plus `source=grid|log|mixed`, `entries=0` (leave log entries and their notes out; summaries stay), `export=pdf|md|csv` (a file
instead of JSON; not `format`, which Django REST framework keeps for itself) and `lang=en|pl` (files; default
the language of the Plane profile, else English). JSON: the header fields, `totals`, `days` (`date`,
`log_minutes`, `grid_minutes`, `difference_minutes`, `result_minutes`, `summaries`, `entries`) and `people`.
PDF (A4, the main format) and Markdown: the title, the period (and the person, only with `actor`), then one
table _Date | Log entry | Work_ with a _Total_ row. _Work_ is the time of the chosen source (the source itself is
not printed). _Log entry_ is, for every person, their summary of the day, or without one the notes of their log
entries of that day, each on its own line and without times (none with `entries=0`); when the report is not
narrowed to one person and its texts come from several, every text starts with "name: ". The table (and the
_Report_ tab) leaves out days without time and without texts and says how many it left out ("No activity in this
period." when nothing is left); a day with a summary but no time stays. The totals do not change, and JSON and
CSV keep every day. The PDF draws the table line by line, so a long summary goes on over pages (the heading and,
in grey, the date repeat), and under it the activity grid of the Activity page for the days of the table, oldest
first: 96 quarters a day, the heatmap of the same query (`actor`, `kinds`; computed only for the PDF), levels as in
`grid.ts` (quartiles of the non-empty quarters of the period), Plane's blue on white with empty quarters light
grey, skipped quarters hatched, hours every 3 h repeated on every page, legend _Less … More_ bottom right; up to
366 days take a few pages. In Markdown the texts of people and agents are escaped line by line and joined with
`<br>` in their cell, so they cannot add rows, headings, lists or HTML. CSV: one row per day and a total row, minutes as numbers, UTF-8 with a BOM (spreadsheets then read
Polish letters). The app endpoint is `/api/workspaces/.../projects/{id}/liviere/activity/report/`; the
_Activity_ page shows the report in its _Report_ tab (`?view=report&source=…`, the period of the toolbar) with
_PDF_, _Markdown_ and _CSV_ buttons, and the Activity settings have the two thresholds.
`plane-log report -p ORD --month previous|current` or `--from D --to D`, with `--source`, `--format pdf|md|csv|json`,
`--lang`, `--mine`, `--no-entries`, `-o file` (a PDF needs `-o`; tests:
`python3 -m unittest liviere/tools/test_plane_log.py`).

**Skipped periods** (`.../activity/skipped-periods/`, migration `0009`, table `liviere_activity_skip_periods`,
rules in `activity/skips.py`): single ranges from–to (at most 31 days, may overlap or lie in the future) with an
optional description, e.g. a night of automated tests. The report leaves them out of every source: actions inside
them neither start nor extend a series, and what remains of series (with their padding) and of log entries inside
them is cut, so an entry 21:30–22:30 counts 30 min against a period from 22:00. The report lists the periods it
touches (`skipped`, PDF, Markdown). The grid (of the page and of the PDF) hatches their quarters but keeps counting them (the heatmap response
does not change; the page reads the periods separately). Project admins add, change and delete them in the
Activity settings (`POST`, `PATCH`/`DELETE .../{id}/` in the app; times without an offset in the project time
zone); members and `/api/v1/` (`GET`, optional `from`/`to`) only read them.

**PDF** – `fpdf2` 2.9.0 (pure Python, LGPL-3.0, with `Pillow` and `fontTools`, prebuilt wheels for the Alpine
image: no system packages, no browser, no other service) draws the file in DejaVu Sans 2.37 (regular and bold,
`activity/fonts/` with its licence: Bitstream Vera / Arev, free to use, embed and redistribute; the PDF embeds
only the used glyphs). Characters the font lacks (emoji) print as "?"; the `fpdf` and `fontTools` loggers are
set to errors only (fpdf would name missing characters, fontTools the kept glyphs), so nothing of the texts reaches
the server logs. Tests read the PDF text with `pypdf` (test group only).
`APITokenLogMiddleware` (upstream, `plane/middleware/logger.py`) stores request and response bodies of
`/api/v1/` requests in `api_activity_logs` for 14 days (`API_ACTIVITY_LOG_RETENTION_DAYS`): the PDF as
`[Binary Content]`, but JSON, Markdown and CSV reports and the `logs/` and `summaries/` requests with the texts
of entries and summaries – as the `logs/` endpoints already did before the report.

## Content search (`/api/v1/workspaces/{slug}/liviere/search/`)

Upstream search (`IssueSearchEndpoint`) matches only the title and the number of a work item, so an agent that
does not know the number reads work items one by one. This endpoint finds a phrase in the title, the description
or a comment. It is a plain substring search, not a search by meaning, and nothing leaves the server.

Code: `apps/api/plane/liviere/search/` (`queries.py` rules and queries, `privacy.py` routes kept out of the request
log), `liviere/api/search.py` (endpoint). Tests: `plane/tests/contract/api/test_content_search.py`,
`plane/tests/unit/liviere/test_content_search_snippet.py`; the timing test runs only with
`LIVIERE_SEARCH_BENCH=1` (`docker compose … run -e LIVIERE_SEARCH_BENCH=1 api-tests pytest -k timing …`).

`POST` (API key; any active workspace member) with a JSON body. The phrase is never part of a URL, so it does not
reach the request log of `RequestLoggerMiddleware` (`docker logs`) or proxy logs:

| Field      |                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`        | the phrase, 3–200 characters after trimming (400 otherwise, e.g. `q must be at least 3 characters`)                                            |
| `project`  | optional identifier (any case) or id; 404 when the key is not an active member or the project is archived; without it every project of the key |
| `limit`    | 1–100, default 20; no paging, narrow the phrase instead                                                                                        |
| `archived` | default `true`; `false` leaves archived work items out                                                                                         |

**What matches.** Case-insensitive `icontains` on `Issue.name`, `Issue.description_stripped` and
`IssueComment.comment_stripped` (plain text Plane keeps next to the HTML). A piece of a word matches, so agents
search by the stem with Polish letters: "oszust" finds "oszustwo", "zapyta" finds "zapytań". There is no
`unaccent`, so "zapytan" does not find "zapytań"; upper and lower case of Polish letters match when the
database's `LC_CTYPE` is a UTF-8 locale (the official Postgres image: `en_US.utf8`), not with `C`. `%` and `_` are
literal. Plane strips tags without adding spaces, so a phrase across two paragraphs may not match. Mentions are
stored as tags, so a mentioned person's name is not in the text.

**Which work items.** The rules of the work item list of the API: `visible_issue_q` (members above guests, guests of
projects sharing all features; restricted guests only their own work items), as an `EXISTS` per row. Deleted work
items, drafts, triage/intake work items and work items of archived projects never match; deleted comments never
match, and neither do comments of a work item that does not (also before the background task marks them
deleted). Unlike `Issue.issue_objects`, archived work items match by default (`archived: true` in the result):
projects with `archive_in` move closed work items to the archive after a month, and old decisions are what agents
look for. Comments are not filtered by `access` (INTERNAL/EXTERNAL), like the upstream comment API.

**Result.** One per work item: `match` is the best place (`title`, then `description`, then `comment`), and
`comment_matches` counts its matching comments in every case. Order: place, then newest first (`updated_at` of
the work item for title and description, the newest matching comment for comments), then id.

```json
{
  "query": "rate limit",
  "project": null,
  "limit": 20,
  "archived": true,
  "total": 1,
  "has_more": false,
  "results": [
    {
      "id": "…",
      "identifier": "LS-5",
      "project_id": "…",
      "project_identifier": "LS",
      "sequence_id": 5,
      "name": "…",
      "state": "Todo",
      "state_group": "unstarted",
      "archived": false,
      "archived_at": null,
      "updated_at": "…",
      "match": "comment",
      "comment_matches": 1,
      "snippet": "…a rate limit of 60 requests a minute…",
      "highlight": [2, 12],
      "comment_id": "…",
      "comment_created_at": "…"
    }
  ]
}
```

`snippet` is the whole title, or up to 80 characters on both sides of the first match with whitespace collapsed and
"…" where it was cut; `highlight` is `[start, end]` of the match in it (`null` when Python's case rules disagree
with the database's and the snippet is the start of the text). `comment_id` and `comment_created_at` (the newest
matching comment) only with `match: "comment"`.

**Cost.** Four queries whatever the number of matches (matching work items as ids only, matching comments counted
per work item, details of the shown work items, their newest matching comment); no index, migration or extension.
Every search scans the text columns of the workspace. Measured on the test stack (1000 work items, 3000 comments,
fresh tables without `ANALYZE`, medians): with the machine under load 13 the whole `search()` took 69 ms (work items
7 ms and comments 38 ms in Postgres, the rest round trips); under load 20–31 the queries alone took 121–287 ms and
the whole request 208–368 ms. Most of the comment query is the visibility subquery, not the text scan (13 ms without
it), so a `pg_trgm` index or `tsvector` would not help much at this size; measure on the server before adding one
(about 300 ms is the threshold).

**Request log.** `APITokenLogMiddleware` (upstream, stores `/api/v1/` requests in `api_activity_logs` for 14 days)
keeps a row for this route without `query_params`, `body` and `response_body` (hook in
`plane/middleware/logger.py`, marked `Liviere/plane fork`; routes listed in `liviere/search/privacy.py`). Other
routes are logged as before.

**`liviere/tools/plane-search`** – the command-line client for agents (Python standard library only, the same
configuration as `plane-log`: `~/.config/plane-mcp/env` or `$PLANE_LOG_ENV`):
`plane-search [-p LS] [-n 20] [--no-archived] [--json] PHRASE…` prints one line per work item
(`LS-5  [Todo]  comment (2)  Title`, archived ones as `[Done, archived]`) with the fragment indented under it
(not for a title match) and `N of TOTAL` at the end; `--json` prints the response. Tests:
`python3 -m unittest liviere/tools/test_plane_search.py`. Install like `plane-log`, as a copy of the file in
`~/.local/bin`.

**Going back** to images without our code: nothing to disable; no tables.

## Decision register (`/api/v1/.../projects/{id}/liviere/decisions/`)

A list of the decisions a project keeps to, one rule each ("Returns are accepted for 30 days"), with a state, an
area, the work items and sources it comes from and a history, so that the owner can look them up and change their
mind, and AI agents can read and write them. The register is the source of truth for the owner's decisions: agent
memory and rule files point to decision numbers, and the register wins when they disagree.

Code: `apps/api/plane/liviere/decisions/` (`rules.py` states, operations and field checks, `services.py` writes,
`queries.py` filters, queues and search, `issues.py` work item links, `importer.py`, `serialize.py`, `endpoints.py`
handlers shared by both trees, `routes.py`), `liviere/app/decisions.py` and `liviere/api/decisions.py` (views),
`liviere/models.py`, migration `0010` (tables `liviere_decision_settings`, `_areas`, `liviere_decisions`, `_issues`,
`_relations`, `_events`). Tests: `plane/tests/contract/api/test_decisions.py`, `test_decisions_import.py` (on
`data/decisions_sample.json`, an invented tea shop), `plane/tests/unit/liviere/test_decision_rules.py`.

**Switch.** Per project, off by default: `PATCH .../liviere/decisions/settings/ {"enabled": true}` (project admins,
also with an API key; the settings page comes with the web app). While off, every other route answers
`404 {"error": "Decisions are not enabled in this project", "code": "decisions_disabled"}` and nothing can be
written. Project admins and members read and write; guests and people outside the project get 403 (a workspace
admin who is a guest of the project gets in, as everywhere in `allow_permission` – also to the switch, which is
otherwise for project admins only). The same routes and responses
exist for the app under `/api/workspaces/.../projects/{id}/liviere/decisions/`, plus
`GET /api/workspaces/{slug}/liviere/decisions/enabled-projects/`.

**A decision** (the fields of the import file): `number` (per project, 1–1,000,000, from a counter row locked for
the write, so parallel writes get different numbers; never handed out again), shown as `identifier` `DEMO-D12`; `title` (the rule,
≤ 500), `rationale`, `rejected`, `note`; `area`, `mechanism` (an area of the project's own two-level list) and an
optional second `area2`; `kind` (`product`, `architecture`, `process`, `operations`); `status`; `decided_by` (`user`
– the owner, `agent`, `unknown`) and `confirmed`; `decided_on`, `review_on`, `review_condition` (a date or a condition
to come back); `issues` (work items such as `DEMO-3`), `sources` (where it is written, e.g. `memory:notes.md`),
`supersedes` and `superseded_by` (a list: a decision split into several rules has several successors), `related`
(symmetric); `pending_rollout` with `rollout` (`reason`, `at`, `by`, `channel`); `needs_review` and `estimated` (the
fields of an imported decision that are guesses); `queues` (the queues it is in).

**States and operations.** `proposed`, `active` (in force), `deferred`, `done` (a one-off decision carried out),
`superseded`, `revoked`. Every change is its own route and leaves a history entry (account, time, channel `app` or
`api`, `kind`, changes `{field: [old, new]}`). "Session" is the app (the owner in the browser), "key" an API key
(agents); `by: "user"` says that the owner decided, `rollout: true` puts a key's change in the coordinator's inbox.

| `POST .../{number}/…` or route                                                                                                                                              | From                                    | Result                              | `decided_by` / `confirmed`                                          | Waits for rollout                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `POST decisions/`                                                                                                                                                           | –                                       | `active`                            | session `user`/true; key `agent`/false, with `by: user` `user`/true | session; key with `rollout`                                                             |
| `POST decisions/propose/`                                                                                                                                                   | –                                       | `proposed`                          | `agent`/false (session `user`/false)                                | never                                                                                   |
| `accept/` (optional `title`, `rationale`: change and accept)                                                                                                                | proposed                                | active                              | session `user`/true; key unchanged or `by`                          | session; key with `rollout`                                                             |
| `confirm/`                                                                                                                                                                  | active, deferred, done; not confirmed   | –                                   | `user`/true (the owner's word, also with a key)                     | no                                                                                      |
| `defer/` (`review_on` and/or `review_condition`)                                                                                                                            | active                                  | deferred                            | –                                                                   | session; key with `rollout`                                                             |
| `resume/`                                                                                                                                                                   | deferred                                | active, review fields cleared       | –                                                                   | session; key with `rollout`                                                             |
| `done/`                                                                                                                                                                     | active, deferred                        | done, review fields cleared         | –                                                                   | cleared                                                                                 |
| `revoke/` (optional `reason`)                                                                                                                                               | active, deferred; proposed (= rejected) | revoked                             | –                                                                   | session; key with `rollout` (never for a proposal)                                      |
| `supersede/` (one decision, or `{"decisions": [...]}`, at most 10)                                                                                                          | active, deferred, done                  | old `superseded`, new `active`      | as for a new decision                                               | new: session; old: cleared                                                              |
| `review/` (new `review_on`/`review_condition` or none)                                                                                                                      | active, deferred                        | –                                   | –                                                                   | no                                                                                      |
| `import-review/` (optional `decided_by`, `decided_on`, `status`, and for an active or deferred result `review_on`, `review_condition`; required when corrected to deferred) | `needs_review`                          | `needs_review`, `estimated` cleared | `unknown` → session `user`/true; key must send `decided_by`         | no                                                                                      |
| `link/` (`issues`, `sources` to add)                                                                                                                                        | any                                     | –                                   | –                                                                   | no                                                                                      |
| `ack/` (optional `issues` of the rollout)                                                                                                                                   | waits for rollout                       | cleared                             | –                                                                   | cleared                                                                                 |
| `PATCH {number}/`                                                                                                                                                           | any                                     | –                                   | –                                                                   | when the `title` of an active or deferred decision changes: session; key with `rollout` |

`PATCH` changes `title` (a correction: a change of meaning goes through `supersede/`), `rationale`, `rejected`, `note`,
areas, `kind`, `issues`, `sources`, `related`, `review_on` and `review_condition`; a changed field leaves `estimated`.
`supersede/` is one transaction (counter, the old decision locked and checked, the new ones, both history entries);
new decisions take the areas, kind, rationale, work items and related decisions of the old one unless given. A
change still waiting for rollout is never lost: the successors of a decision that waits inherit the flag (reason
`supersedes`), and an operation on a decision that waits moves the reason and time to itself, also through a key
without `rollout`. Decisions are never deleted, and an area with decisions cannot be deleted (`RESTRICT`; a project
deleted for good takes its areas and decisions with it). Decision rows are locked `FOR NO KEY UPDATE`, so two writes
relating A and B the other way round do not deadlock; should Postgres abort one anyway, the answer is
`409 {"code": "conflict"}` and the write can be retried. A 400 is `{"error", "code", "field", "number"}`; the codes are `ERROR_CODES` in
`rules.py` (e.g. `invalid_transition`, `already_superseded`, `issue_not_found`, `validation_error`).

**Queues** (`GET .../queues/`, counts and `today`; `?queue=` on the list): `confirm` – in force, decided by somebody
else than the owner, not confirmed; `review` – active or deferred with `review_on` at most 14 days from today in the
project time zone, past dates too (a condition alone never enters it); `rollout` – waits for rollout and not
superseded; `proposed`; `imported` – `needs_review`. `GET .../inbox/` is the coordinator's inbox: the `rollout`
queue oldest first, each with `rollout.reason` (`created`, `accepted`, `supersedes`, `revoked`, `deferred`,
`resumed`, `corrected`); `POST .../{number}/ack/` takes it off once rules and code follow.

| Endpoint                                  |                                                                                                                                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`, `PATCH settings/`                  | `{enabled, last_number}`                                                                                                                                                                 |
| `GET .../decisions/`                      | in force by default; `area` (also as `area2`), `mechanism`, `status` (comma-separated or `all`), `kind`, `queue`; paginated like other v1 lists (`per_page` ≤ 1000, `cursor`), by number |
| `POST .../decisions/search/`              | `{q, limit (≤ 200), area, mechanism, status, kind, queue}` → `{total, limit, has_more, results}`, newest first, every state by default                                                   |
| `GET`, `PATCH .../{number}/`              | one decision with `history` and `chain: {previous, next}` (number, identifier, title, status, decided_on, supersedes)                                                                    |
| `GET`, `POST areas/`, `PATCH areas/{id}/` | `{results: [{id, key, name, sort_order, mechanisms: [...]}]}`; new area or mechanism (`parent`); `name`, `sort_order`                                                                    |
| `POST import/[?commit=1]`                 | the import file (below)                                                                                                                                                                  |

**Search.** Every word of `q` (3–200 characters) must appear, case-insensitive, in the title, rationale, rejected
options or note (`icontains`, like the content search): agents search by the stem with Polish letters ("zwrot" finds
"zwroty"); there is no `unaccent`, so "zolw" does not find "żółw". The phrase goes in the body: it never reaches a URL
or a request log. A superseded decision in the results names its successors in `superseded_by`.

**Work items.** `issues` are resolved among the work items of the workspace the writer may see (the rules of the
content search, archived work items included: closed work items are archived after a month and old decisions point
to them); one that is not found is a 400 (`issue_not_found`). Reading checks again for the reader: everybody gets the
`identifier`, only a reader who may see the work item gets `id`, `name` and `archived` (`visible: false`
otherwise), so a decision never shows the title of a work item of a project the reader is not in; a work item
deleted after it was linked is not visible to anybody.

**Import** (`POST .../import/`, the file as the body; a dry run unless `?commit=1`). Format 2:
`{"format": 2, "project": "DEMO", "areas": [{"key", "name", "mechanisms": [{"key", "name"}]}], "decisions":
[{...the fields above...}]}`, at most 2000 decisions (250 are about 150 kB, well under `FILE_SIZE_LIMIT`, 5 MB by
default, the limit of Django and of the proxy). All checks come first and every error is listed with the decision
number and the field: known areas and mechanisms, required fields, values, dates, `area2`, an unknown author or date
needs `needs_review`, targets of `supersedes` and `related` exist (in the file or the project), a `supersedes` target
is `superseded`, no cycle, numbers unique and not used in the project (a second run is refused with the list of
collisions, nothing is overwritten). Then one transaction: missing areas are created (existing ones keep their
names), the decisions come in with their numbers, dates, states, authors, `confirmed` and chains as in the file
(the channel does not change `decided_by`, `pending_rollout` is never set), one `imported` history entry each, and
the counter moves past the highest number. The dry run performs the same write and rolls it back. A work item that
cannot be found is a warning: the decision comes in without that link and `ticket:DEMO-99 (not found)` is added to
its `sources`. The answer: `{dry_run, errors, warnings, summary: {decisions, by_status, areas_created,
mechanisms_created, needs_review, issue_links, issues_not_found}, sources: {source: [numbers]}, last_number}`
(400 with `code: "import_rejected"` when there are errors).

**Request log.** Decision routes carry decision text, so `APITokenLogMiddleware` keeps their rows in
`api_activity_logs` without query string and bodies (`liviere/search/privacy.py`), in both trees: a request with an
API key sent to the session routes is refused (401) but logged all the same. Errors name numbers and fields, never
the text; text with NUL characters or lone surrogates (which Postgres cannot store) is refused with
`validation_error`.

**`liviere/tools/plane-decision`** – the command-line client for agents (Python standard library only, the same
configuration as `plane-log`: `~/.config/plane-mcp/env` or `$PLANE_LOG_ENV`). Decisions are given as `12`, `D12`
or `DEMO-D12`.

```sh
plane-decision add -p DEMO --area zamowienia/zwroty --kind product --issue DEMO-3 \
  --rationale "Klienci często otwierają paczkę dopiero po 2–3 tygodniach." "Zwrot przyjmujemy do 30 dni od dostawy"
plane-decision propose -p DEMO --area zamowienia/zwroty --kind operations "Raport ze zwrotów przychodzi mailem raz w tygodniu"
plane-decision list -p DEMO --area zamowienia --brief   # every page: "DEMO-D2  Zwrot przyjmujemy do 30 dni od dostawy"
plane-decision show -p DEMO D2
plane-decision search -p DEMO zwrot dni                # every state; "[superseded → DEMO-D2]"
plane-decision supersede -p DEMO D2 "Zwrot przyjmujemy do 60 dni od dostawy" --by user
plane-decision supersede -p DEMO D9 "Pierwsza reguła" "Druga reguła"   # a split
plane-decision revoke|defer --until D|--when T|done|confirm|accept -p DEMO D7
plane-decision link -p DEMO D2 --issue DEMO-20 --source CLAUDE.md:41
plane-decision inbox -p DEMO; plane-decision ack -p DEMO D10 --issue DEMO-20
plane-decision areas -p DEMO; plane-decision areas add -p DEMO zamowienia/wysylka "Wysyłka"
plane-decision import -p DEMO decisions.json [--commit]  # dry run unless --commit; then "source → decisions"
```

`--json` prints the response of reads. Rules for agents (not permissions – the account is shared): the project
coordinator writes decisions with `add`, `supersede`, `revoke` and the like; an executing session only uses
`propose`, `list`, `show` and `search`; `confirm` and `accept --by user` (and `--by user` in general) only on the
owner's word. Tests: `python3 -m unittest liviere/tools/test_plane_decision.py`. Install like `plane-log`, as a copy
of the file in `~/.local/bin`.

**Going back** to images without our code: nothing to disable; the tables stay unused. `migrate liviere 0009` on a
fork image removes them.

### Decision register page (`/:workspace/projects/:id/decisions`)

The owner reviews the decisions of a project in the browser and changes their mind there; the endpoints are the
session tree of the section above (`/api/workspaces/{slug}/projects/{id}/liviere/decisions/…`).

Code: `apps/web/liviere/decisions/` (page, settings, data hooks, `model.ts` with the logic without React,
`map-geometry.ts`), `apps/web/liviere/navigation.ts` (the one hook adding our items to the project navigation),
routes in `app/routes/extended.ts`, i18n `liviere.decisions.*`. Hook points in official files: the navigation hook
in `components/navigation/use-navigation-items.ts` and `components/workspace/sidebar/projects-list-item.tsx`,
the settings tab `features_decisions` in `packages/types/src/settings.ts`, `packages/constants/src/settings/project.ts`
and `components/settings/project/sidebar/item-icon.tsx`. Tests: `node --test apps/web/liviere/decisions/*.test.mjs`
(Node strips the types of `model.ts` and `map-geometry.ts` itself, so those two files import nothing at run time but
types; `i18n.test.mjs` checks that `pl` and `en` have the same keys).

**Access.** Project settings → Features → _Decisions_ (project admins) turns the register on and the _Decisions_
item of the project navigation with it. The page lets in project admins and members; guests get _No access_ without
a request, a turned-off register (also when it is turned off meanwhile: 404 `decisions_disabled`) _not turned on_.
A workspace admin who is a guest of the project is let in by the API but not by the page, as for _Activity_.

**Data.** The page loads the whole register once (`GET …/decisions/?status=all&per_page=1000`, following
`next_cursor`, at most 5 pages; it warns when the list is cut) and filters it in the browser; queue counts
(`queues/`), areas (`areas/`) and the details of an opened card (`<number>/`, history) come separately, the
search goes to `POST search/` 300 ms after the last keystroke (3–200 characters; a decision number such as
`D12`/`DEMO-D12` or a linked work item identifier also matches, in the browser). Fine up to about 2000 decisions
(the import limit, ~2 MB); beyond that the list should move to the server filters and paging. Every change
reloads the list, the counts, the areas and open details (SWR keys `LIVIERE_DECISIONS_<project>_*`).

**URL.** `?view=areas|map&area=<key>&mech=<key>&queue=<queue>&status=current|proposed|deferred|done|past|all&kind=<kind>&d=<number>`;
defaults are left out, `?d=12` opens decision 12 (and widens the filters when they hide it). The search phrase is
never in the URL, like the API keeps it out of request logs.

**Areas view.** Area tree with counts after the filters (mechanisms unfold under the selected area; on a phone the
tree folds above the list), cards grouped by area, or by mechanism within an area ("General" for none, "From area:
X" for decisions having it as their second area). Badges come from the server's `queues` of each decision; review
and return dates are compared with `today` of `queues/` (the project's day).

**Actions** – one request each; the page never builds a change out of several:

| State                                | Button                              | Request                                                                   |
| ------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------- |
| imported (`needs_review`)            | Reviewed, correct / Correct         | `import-review/` with nothing / with `decided_by`, `decided_on`, `status` |
| active, deferred, done not confirmed | Confirm                             | `confirm/`                                                                |
| active with a review date/condition  | Reviewed, stays                     | `review/` with the next date or condition, or none                        |
| active                               | Change                              | `supersede/`: one new version or a split (`decisions`, ≤ 10)              |
| active                               | Defer                               | `defer/` with a date or a condition                                       |
| active, deferred                     | Done / Revoke                       | `done/` / `revoke/` (confirmed, optional reason)                          |
| proposed                             | Accept / Change and accept / Reject | `accept/` / `accept/` with `title`, `rationale` / `revoke/` (confirmed)   |
| deferred                             | Back to it / Move the return        | `resume/` / `review/`                                                     |

Errors show a text by the API `code` (`invalid_transition`, `already_superseded`, `conflict`, …) and the server
text for others. `ack/` and the import stay in the terminal (`plane-decision`).

**Map.** All areas at once, rows with a number dot coloured by state; dashed lines for "supersedes" (one per
successor), solid ones for "related". Hover highlights a decision's lines, a click opens its card in a side panel
with the same actions. Kind, search and queue dim what does not match; the state filter is off (old versions are
part of the chains). By default no line is drawn (the owner's decision: the full web is unreadable at a few
hundred decisions); pointing at a decision or opening it shows its "supersedes" and "related" lines, and _Show all
lines_ shows every line until the map is left (not remembered); below 768 px the boxes stack without lines. Drawing is measured as `liviere-decisions-map-lines`
(`performance.getEntriesByName(...)` in the console). An invented register to try it on:
`node apps/web/liviere/decisions/fixtures/generate-sample.mjs --decisions 300 --areas 20 > /tmp/sample.json`,
then `plane-decision import` into a project with the register on.

## New work items (`/:workspace/new-work-items`)

Most work items here are created by AI agents (API key, MCP). _New_ lists the work items somebody else created in
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
the person's _Mark all as read_ time for the project (`UnreadProjectCutoff`). No rows are written per work item
except when one is opened.

Plane adds a person to a project again by re-activating the old `ProjectMember` row (`bulk_update`, no signal,
old `created_at`). The periodic task `plane.liviere.tasks.sync_unread_memberships` (every minute,
django_celery_beat row `liviere: sync memberships for new work items`, migration `0006`) compares memberships with
`UnreadMembershipState`; a membership seen inactive and active again moves the person's cutoff of the project to
the last check that saw it inactive, so the time away does not show up as new (at most the last minute before the
re-activation does). It is one cutoff per project, so work items not opened before leaving count as read too.

**Opened = peek or full page.** The web app calls
`POST /api/workspaces/{slug}/projects/{id}/liviere/work-items/{id}/opened/` (session only, idempotent, 204; 404 when
the person may not see the work item) from two hooks: the peek overview (`components/issues/peek-overview/root.tsx`,
after `fetchIssue`; every peek – layouts, _Your work_, Home, Inbox, pages – renders this component) and the full
page (`app/(all)/[workspaceSlug]/(projects)/browse/[workItem]/page.tsx`). The upstream `retrieve` endpoints are not
used: `fetchIssue` also retrieves the parent of the opened item and the edit modal retrieves its item, which would
mark items nobody opened. Reading a work item through `/api/v1/` never marks it, also with the person's own key.
Opening from the edit modal or the intake view does not count.

**Endpoints** (session; any workspace role):

| Endpoint                                             |                                                                                                                                                                                                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/workspaces/{slug}/liviere/new-work-items/` | newest first: `{results, has_more, as_of}`; `projects` (comma-separated ids), `per_page` (≤ 200, default 50), `older_than` + `older_than_id` (`created_at` and `id` of the last item – keyset paging, so items opened meanwhile do not shift the next page) |
| `GET .../new-work-items/count/`                      | `{total, by_project, as_of}`                                                                                                                                                                                                                                |
| `POST .../new-work-items/mark-read/`                 | `{before, project_ids?}` → `{cleared}`; moves the person's cutoff of the projects (all or the given ones) to `before`, never back                                                                                                                           |

`before` must be the `as_of` the server returned (400 when missing or in the future), so the browser clock never
decides what is marked and items created after the list was loaded stay new. Known gap: `created_at` is set before
the creating transaction commits, so a work item committed a few milliseconds after `as_of` with an earlier
`created_at` can be marked read without having been listed.

**Web.** Sidebar item _New_ with the count (hook in `components/workspace/sidebar/sidebar-menu-items.tsx`; always
shown, not part of _Customize navigation_, which would need the upstream `UserPreferenceKeys` enum), refreshed
every minute, on focus and after every change. The page (route in `app/routes/extended.ts`) has a project filter
(`?projects=`) and _Mark all as read_; a row opens the peek (the full page on phones) and disappears once opened.

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

| Variable                        |                                                                                                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LIVIERE_VAPID_PUBLIC_KEY`      | base64url of the uncompressed P-256 public point (65 bytes)                                                                                                                                                |
| `LIVIERE_VAPID_PRIVATE_KEY`     | base64url of the 32-byte private scalar (must match the public key)                                                                                                                                        |
| `LIVIERE_VAPID_SUBJECT`         | `mailto:…` or `https://…` contact for the push services                                                                                                                                                    |
| `LIVIERE_PUSH_COALESCE_SECONDS` | optional: window collecting a project's new work items into one push (empty or invalid = 15, `0` = one push per work item, at most 300: a waiting countdown task holds an unacknowledged RabbitMQ message) |

`api` and `worker` both need them (`x-app-env` in `deployments/cli/community/docker-compose.yml` passes them; the
local `docker-compose-local.yml` reads `apps/api/.env`). The web app gets the public key from the API.

**Flow.** `post_save` of a new `Issue` (app, `/api/v1/` with an API key, MCP) does its work with
`transaction.on_commit`; nothing happens in the request when the keys are missing or the item is a draft, and
neither the receiver nor a broker failure breaks creating the work item. Work items are read from
`Issue.issue_objects` (no drafts, triage, archived, deleted) and sent to every browser of every recipient: people
who chose the project (`PushProject`, per account) who are active members allowed to see others' work items – the
rules of _New_. Own work items are never new, so their author gets nothing about them. Not notified: items created
by `bulk_create` (imports) and intake items accepted later.

**One notification per project and window.** The tag is `liviere-new-<project id>`, so a newer notification
replaces the older one and the notification centre keeps one entry per project. That alone does not stop the
pop-ups: on Windows the toast pops up again on every replacement (live test: a parent and two sub-items 3 s apart
gave 3 pop-ups), even without `renotify`. So the server coalesces: the first work item of a project committed
after a quiet spell takes the cache key `liviere-push-pending-<project id>` (`cache.add`, two windows long) and
queues `plane.liviere.tasks.notify_project_work_items` with a countdown of `LIVIERE_PUSH_COALESCE_SECONDS`
(default 15 s); later work items queue nothing while the key exists. The task deletes the key before it reads
anything, so a work item committed after that queues the next window (never lost; one committed right at the
boundary may give one extra notification). A recipient gets the push only when at least one of their new work
items was created in the window (from 5 s before its first work item), so an older unread item never pops up
again because of somebody's – or their own – new work item. If the cache fails, every work item queues the
project task (no coalescing, nothing lost); with the window `0` every work item queues
`plane.liviere.tasks.notify_new_work_item` at once, as before. The title counts the recipient's
new work items of the project at sending time: with one, `LS-7 · Project name` and a click opens the work item
(which marks it as read); with more, `LS: 4 new work items` (Polish for a `pl` profile language: `nowe elementy
pracy` / `nowych elementów pracy`) and a click opens _New_ filtered to the project. The body is the title of the
newest one. Nothing else of the work item is sent. Notifications come up to one window late.

**Sending** (`webpush.py`): aes128gcm (RFC 8291, `http-ece`) and a VAPID JWT (RFC 8292, ES256 with `PyJWT`), TTL
24 h. The endpoint comes from the browser, so it must be `https://` on a known push service
(`updates.push.services.mozilla.com`, `fcm.googleapis.com`, `*.notify.windows.com`, `*.push.apple.com`; checked when
subscribing and when sending) and the request goes through `pinned_fetch` like webhooks. 404/410 removes the
subscription, and so do 400/403 (the subscription does not match our keys, e.g. after they changed) and five
failures in a row; a failure is never retried. An error with one subscription never stops the others. Titles and
bodies are cut to 150/500 characters (payload well under the ~4 KB push services accept). A person keeps at most 10
browsers (subscribing another drops the oldest); an endpoint already stored with other keys is refused (409); the
test notification is limited to 5 a minute. All pushes share the default Celery queue; at our volume (tens of work
items a day) a separate queue is not needed.

**Signing out** (`user_logged_out`) removes all push subscriptions of the person – the browser cannot be told apart
from their other browsers. After the next sign-in the web app registers the subscription this browser still has
again, but only for the account that turned push on in it (remembered in `localStorage`); for another account the
profile shows push as off until they turn it on themselves. A subscription made with old VAPID keys is replaced.

**Endpoints** (session, user-level – the profile page is outside a workspace):

| Endpoint                                |                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET /api/users/me/liviere/push/`       | `available`, `public_key`, workspaces with the projects one may choose (`selected`)                             |
| `PUT .../push/projects/`                | `{project_ids}` – the whole choice                                                                              |
| `POST`/`DELETE .../push/subscriptions/` | `{endpoint, keys: {p256dh, auth}}`; the same browser signed in with another account takes the subscription over |
| `POST .../push/test/`                   | a test notification to my browsers (queued task)                                                                |

**Web.** Profile settings → Notifications → _Push notifications_ (hook in
`components/settings/profile/content/pages/notifications/root.tsx`): _Enable in this browser_ asks for the browser
permission only on that click, then project switches, _Send a test_ and _Turn off_. The service worker is registered
with the scope `/liviere/push/`, so it controls no page and cannot clash with an app worker at `/` (the old unused
`public/sw.js` is left alone). A click focuses a tab already showing the target or opens a new one.

**Going back** to images without our code: nothing queues the push task there; disable the membership sync first
(the `liviere:` periodic tasks, see _Disabling the sync_ above). To stop pushes while staying on a fork image,
remove one of the three variables.
