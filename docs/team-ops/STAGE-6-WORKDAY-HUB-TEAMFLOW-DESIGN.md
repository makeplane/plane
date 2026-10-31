# Stage 6: Workday, Hub and Teamflow

Status: **implemented and tested locally. Not deployed.**
Owner's request (translated): one page with a single-word name that merges Time tracking, Work calendar and Work reports; pick a project, then one of its tasks, start the timer, and at the end write a report; a document is optional but there must be a sure way to finish without one; a "needs attention" flag that notifies other teams in a **Hub**; the Hub is a professional and secure place for chat and files (tags, uploads) for team members and project members; **Teamflow** shows the documents and hand-offs between teams as a pipeline, with filters (all, delivered).

## What was built

### Workday (sidebar: "Workday")

One page, tabs **Today | Plan | Reports | Time log | Team**. The old three sidebar items are gone; their pages are the tabs (Plan = My calendar, Reports = My reports, Time log = timer, manual entries and the week view). Team calendar, report board, calendar settings, leave and dashboard are reached from the Team tab. The old URLs still work.

**Today**
1. *Project, then task.* A project (the ones you belong to), then a search over that project's work items, then **Start timer**. One running timer per person, as before.
2. *Running.* Work item, a live clock, **Finish work**.
3. *Finish work* (a required form, in place of the timer card):
   - **What did you do?** required. It is appended as a line (`KEY-12 summary (1h 5m)`) to today's daily report, as a draft, so the report is half written when the day ends.
   - **Document**: optional text or link, optional files. If there is neither, the person must tick **"There is no document for this work"**. The *Finish work* button stays disabled and says what is missing until one of the three is true. The server enforces the same rule.
   - **Needs attention from other teams**: a message and the teams to tell.
4. *Numbers*: today, this week, finished this week, needs attention, confirmed without a document; **time by task** for today and for the week as bars; the sessions finished today with badges *Document*, *No document (confirmed)* and *Needs attention*.

A timer started elsewhere without a work item cannot be finished as work (the page says to stop it in Time log). A bad file is checked before the timer is touched, so a rejected upload never costs the person their timer. The whole finish is one transaction: timer stop, session, report line, files and Hub posts all happen or none do.

The **Dashboard** has a new "Finished work (Workday)" block: sessions, hours, how many were confirmed without a document, how many needed attention, and the top tasks by time.

### Needs attention

On finish, the message is posted in the Hub as a highlighted "Needs attention" message in the project's channel and in the channel of every team chosen, tagging the members of those teams who can read the channel. Tagged people see it under **Hub → Mentions** and as an unread count.

### Hub (sidebar: "Hub")

Channels: one per **team** and one per **project**, created on first use. There is no member list to maintain: the members of a channel are the members of the team (Teamspaces) or of the project (active project members), so joining or leaving gives or removes access. Guests are never in a channel.
Messages, one-level replies, edit and delete (own messages; workspace admins can delete), `@person` and `@team` tags, up to 10 file attachments per message, unread counters per channel and a Mentions list, refreshed every 8 seconds.

### Teamflow (sidebar: "Teamflow")

A diagram of teams (nodes) and hand-offs (arrows with *waiting* and *delivered* counts, orange while something waits, green when all is delivered), and below it the list of hand-offs with the work item, the summary, the files and the status. Filters: **Show** (all / waiting / delivered), **Team**, **Period**. A hand-off is a message that tags a whole team; it goes from the author's team to the tagged team. *Delivered* means someone in the receiving team has opened it in the Hub. Work handed over from Workday that reaches the receiving team both in the project channel and in the team channel counts once. Admins see all hand-offs; others see those that touch their own teams.

## How the Hub is secured

| Risk | What is done |
|---|---|
| Reading another team's or project's chat | Every call checks the person is a member of that channel's team or project **now**, so a channel they cannot use answers "not found" (it does not reveal that it exists). Leaving a team or project closes the channel immediately. Guests and people outside the workspace get 403. |
| Reaching other workspaces | Every query is scoped to the workspace in the URL; ids from another workspace answer "not found". |
| Files being public | Files go into Plane's **private** object storage. There is no public URL. The API hands out a signed link that works for **5 minutes**, only after re-checking that the person may read the message (or work session) the file belongs to. The link is requested again each time and never stored. Deleting a message hides its files. |
| Guessing file addresses | Storage keys are `team-ops/<workspace>/<random>/<random>.<ext>`: unguessable, and the original name is kept only in the database, so path tricks such as `../../x.pdf` cannot reach anything. |
| Dangerous uploads | An allow-list of extensions (images, PDF, text, Markdown, CSV, Word, Excel, PowerPoint); no executables, scripts, HTML or SVG. The declared content type must match the extension, and for formats with a fixed signature (PNG, JPEG, GIF, PDF, Office) the first bytes of the file must match, so a renamed file is refused. Empty files and files over **20 MB** (change with `TEAM_OPS_MAX_UPLOAD_BYTES`) are refused; at most 10 files per message. All files of a message are checked before anything is stored. |
| Script injection in messages | Messages are plain text, shown by React as text (never as HTML). Downloads (except images) are sent as attachments, not displayed in the page. |
| Tagging people who may not see the channel | Tags are checked against the channel's members; tagging a team only reaches its members who can read the channel. |
| Editing others' messages | Only the author edits; the author or a workspace admin deletes. Deleted messages keep their place in a thread but lose their text. |
| Spoofing | Authors and recipients always come from the logged-in session, never from the request body. |

What is **not** done (be aware): messages are not end-to-end encrypted (admins with database access can read them, like all Plane data); there is no virus scan of uploaded files (the storage can be given one); message text is not searchable yet; there are no direct messages or push notifications to e-mail.

## Data

New tables, all `tops_*` (migration `team_ops.0006_hub_and_work_sessions`): `tops_work_session`, `tops_hub_channel`, `tops_hub_message`, `tops_hub_mention` (also the notification), `tops_hub_attachment`, `tops_hub_read_state`. No existing table changed. Plane's own notification tables were deliberately not used, so the core inbox cannot be affected.

API (all under `/api/workspaces/<slug>/team-ops/`): `work-sessions/finish/` (POST), `work-sessions/`, `work-tasks/`, `teamflow/`, `hub/channels/`, `hub/channels/<id>/`, `hub/channels/<id>/messages/`, `hub/messages/<id>/`, `hub/files/<id>/`, `hub/mentions/`.

## Verification

- Backend: `test_team_ops_workday.py`, 51 tests (finish rules, the no-document confirmation, report line, files, attention, Teamflow visibility and filters, channel access across teams, projects and workspaces, upload refusals, signed links, edit/delete rules, dashboard block). With the earlier stages, 339 Team Ops tests pass.
- Frontend: `tsc`, `oxlint`, the i18n sync check and the production build are clean; 131 unit tests pass in `@plane/services` (new: finish rules, multipart bodies, Hub and Workday services).
- Migration `0006` applied on a copy of the real server data (with `0001`–`0005` already applied): six new tables, nothing else changed except Django's own metadata; rolled back and re-applied.
- Seen in a real browser against a local database: Workday (project picker, running timer, finish form with live validation, time by task, badges), Plan and Time log tabs, Hub (attention message in the project channel), Teamflow (pipeline diagram with a waiting hand-off), the sidebar.

## Not verified

- **File upload and download against the real storage.** There is no MinIO on the development machine, so the tests use a fake storage. The first thing to do on staging: attach a PDF in the Hub and in the Finish form, open it from the message and from Teamflow, and confirm the link stops working after a few minutes. The server's bucket and credentials are the ones Plane already uses for its own uploads.
- Two people chatting at the same time in two browsers (the API is tested; the 8-second refresh was seen working for one person).
- Very large channels: the first page is the latest 100 messages; an older-messages button is not built yet (the API supports it with `before`).
