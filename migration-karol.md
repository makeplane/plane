# Questimus Migration Plan — Karol

> **Status:** Draft for discussion · **Owner:** Karol · **Date:** 2026-09-08
> **Purpose:** Move all tickets, todos, ideas, plans, and design decisions from local folders into Questimus — one place for everything, with per-app scoped access for users and LLM agents.
> **Note:** This document itself will be migrated into Questimus (as a page in the "Questimus" project) once the workspace is set up. Until then it lives here as the source of truth.

---

## 1. Goal

One home for all project management across Karol's apps and personal life:

- **Single workspace** — no switching between workspaces.
- **One project per app** (Questimus, Legaliosa, Jobernaut, Don Saldo, Media Consumerus, Kleinanzeigen, …) **+ a Personal project** for ideas, todos, errands, and research.
- **Each app can report issues into its own project** (end users click "Report issue" → issue lands in Questimus, scoped so the app can only see its own project).
- **LLM agents (DSH, Claude Code, …) can read & write per project** via the REST API, wrapped in per-project skills/runbooks — cheap in tokens, no MCP server needed.
- **Humans use the web app**; collaborators can be invited with comment rights.
- **Designs/mockups stay in the repos** (versioned, viewable); design _decisions_ move to Questimus pages where they can be commented on.

---

## 2. Current state — inventory of what exists where

### 2.1 Ticket systems (in project repos, all same SP/T markdown convention)

| Source                                                  | Volume                                                                                                                                                                                                                  | Notes                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Projects\Legaliosa-test-ox-alpha\planning`             | **211 tickets** (150 open + 61 done), 11 SP files, 38 T units, plan.md, design/ (79 files: 23 HTML mockups + 43 PNG + 5 md), archive/v1, v2-replan-input                                                                | **Active Legaliosa (v2)** — migrated last (§10)                                                                                 |
| `Projects\Legaliosa\planning`                           | **101 tickets**, SP01–10, mockups/                                                                                                                                                                                      | Legaliosa **v1** — superseded by v2                                                                                             |
| `Projects\Jobernaut2\planning`                          | **69 tickets** (65 open + 4 done), 7 active SP files (SP-13..19), 22 T units, PLAN.md, HANDOFF.md, PHASE-08.md, pilot-findings.md, design/; `archive\v1\subplans\` holds 12 **v1 subplans (excluded from import — O2)** | **Active Jobernaut (v2)** — j2mainlink removed by Karol 2026-09-08 (O3); **live source — count drifts** (+2 tickets 2026-09-08) |
| `Projects\Jobernaut\planning`                           | PLAN.md, HANDOFF.md, sub-plans/ (32), wireframes/ (21)                                                                                                                                                                  | Jobernaut **v1**                                                                                                                |
| `Projects\Don-Saldo\planning`                           | 2 tickets, `bank-import-which-accounts-when.txt`, design/                                                                                                                                                               | Small                                                                                                                           |
| `Projects\Media Consumerus\planning`                    | `BACKLOG.md` (priority/effort table), `TODOS.md` (deferred + resolution log), design/                                                                                                                                   | MVP done, low priority                                                                                                          |
| `Projects\Ideal Business Model`                         | `Conversation History.md` (135 KB planning handoff + decision register)                                                                                                                                                 | **Dropped** — one ongoing task in Personal (§5.1)                                                                               |
| `Projects\Obsidian Plugins\smart-connections-search-ui` | `PLAN.md` + `handoff-search-ui-plugin.md`                                                                                                                                                                               | **Dropped** (Karol 2026-09-08) — stays in repo                                                                                  |

### 2.2 Personal hub — `Wisdomous\Empirium\pm`

| File / folder                                                             | Content                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ideas.md`                                                                | Someday/maybe backlog (Business, Tooling & vaults, Personal Wishlist) — incl. the "build my own PM tool" idea (now realized as Questimus) and the "report bugs from my apps into Questimus" idea                                                                       |
| `Now.md`                                                                  | Daily task list (🔴 urgent / 📅 deadlines, `## Done` archive) — incl. the Questimus migration checklist                                                                                                                                                                |
| `hosting-publishing.md` (45 KB)                                           | Hosting/publishing plan for the web apps                                                                                                                                                                                                                               |
| 2 research notes                                                          | Claudian plugin, own-server-vs-VPS                                                                                                                                                                                                                                     |
| 3 subfolders remaining (7 .md): Arsenal (2), Don Saldo (2), Jobernaut (3) | Per-app task lists — the remaining pm import sources (§9.3). **Deleted by Karol 2026-09-09 (O13):** Legaliosa, Kleinanzeigen, Media Consumerus, Personal Operating Profile (content re-created manually as Questimus tickets); Input Splitter was dropped earlier (O5) |

### 2.3 Vault-internal planning (migrates into Questimus — O4 supersedes D8)

- `Wisdomous\Arsenal\planning` — 10 active plan files (plan-18..20), `done/` (488 files, 180 .md), `archive/` (21 files), `tickets/` (empty). **O4 (Karol 2026-09-08): all planning files → Plan-type work items; done/ + archive/ → state Done** (no pages for plans — consistent with §5.4)
- `Wisdomous\Empirium\planning` — 3 vault-migration plans

### 2.4 Not PM content

- `Projects\questimus-data-backup` — **backup of the Questimus instance itself** (Postgres dumps + MinIO uploads, daily 16:00, 14 snapshots kept). Keep as-is; take a fresh snapshot before importing.
- `Don-Saldo-Private-Data-Karol`, `Input_Splitter` (dropped — O5), `General-Stuff-And-Tests`, probes — not PM.

**Total migration volume (dry-run verified, 0 failures; live sources drift — Jobernaut +2 on 2026-09-08): 559 issues + 32 pages + 120 relations** (505 project issues + 54 Now-routing). Small enough to migrate everything (including done tickets) with scripts. **Revised 2026-09-09 (O13): 551 issues + 30 pages remain** — Karol deleted the pm folders for Legaliosa, Media Consumerus, Kleinanzeigen and POP (content re-created manually as tickets; §9.2).

---

## 3. Questimus capabilities — what we build on

Questimus is a **stock Plane v1.4.2 fork** (Django API + Vite/React-Router web app + admin/space apps — corrected 2026-09-08: the web app is **not** Next.js, `vite.config.ts` + `react-router.config.ts`; Docker, running locally at `http://localhost:7000`, daily backup pipeline in place). No code-level rebranding; the only local commit is deployment plumbing (7000-block ports, i18n build fix, backup script, fork changes §7).

**Available features (all confirmed in the code):**

- Workspaces, projects, issues (sub-issues, relations, priorities, estimates, labels, attachments, comments, activity feed, versions)
- **Pages (docs)** — for plans, design decisions, handoffs; with versions and comments
- **Modules** — group issues into epics/streams with progress tracking (exists, but **dropped from the target model** — nesting replaces it, §5.4)
- **Cycles** (sprints), **Views** (saved filters), **Intake** (triage inbox), **Estimates**
- Webhooks, CSV/JSON/XLSX export, global search, notifications, command palette
- **Public deploy boards** (anchor-based, unauthenticated issue pages) — possible future option for public bug trackers

**Key constraints found:**

1. **API tokens are user-level, not project-scoped** — but access control is membership-based: a user only sees projects they are a member of. → **Solution: one bot user per app, invited only to that app's project.** (See §6.2 — this answers the scoping question.)
2. **API tokens (`X-Api-Key`) work on `/api/v1/`** (work-items, states, labels, modules, cycles, intake, members, assets, comments, attachments, relations, search) — **but NOT on the main `/api/`** (pages, webhooks, exports), which only accepts session auth. → **Recommended: one-line fork change** to add `APIKeyAuthentication` to the main API's default auth classes (§7.4). Without it, LLM agents cannot read/write pages via API.
3. **No MCP server** in the codebase (only a marketing i18n string). → REST + skills is the right call (decision D6).
4. **Importers are dormant** (model exists, no endpoints wired). → Migration must be done via custom scripts against the API (or DB-level for setup).
5. **Roles:** Admin/Member/Guest at workspace and project level. Guests are **read-only** (writes require Admin/Member). No OIDC/2FA. Email/password + magic link + Google/GitHub/GitLab/Gitea OAuth.
6. **Local deployment** (`localhost:7000`) — fine for Karol + local apps; needs a public URL before deployed apps can report issues in production (§10 Phase 13).

---

## 4. Decisions (made)

| #   | Decision                                                                                                                                                       | Rationale                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | **Single workspace** (display name "Main", slug `main` — kept as-is, Karol 2026-09-08), project per app + Personal                                             | No switching; guests/bots scoped per project; one API surface. Multiple workspaces only if hard isolation is ever needed (e.g., a sold-off app) — can be split later                                                                                                                                                           |
| D2  | **Personal project in the main workspace**                                                                                                                     | Ideas, todos, errands, research in one place with labels + views                                                                                                                                                                                                                                                               |
| D3  | **Designs/mockups stay in repos, linked from Questimus**                                                                                                       | HTML prototypes are code artifacts: versioned, viewable, diffable. Only design _decisions/reviews_ move to Questimus pages. (Karol 2026-09-08: a future move of `planning/design/` into Questimus is planned once the HTML renderer exists — tracked as the design-folder migration epic, **out of scope for this migration**) |
| D4  | **Fire-and-forget issue reporting** via API with per-app bot tokens                                                                                            | No user accounts to manage; issue lands directly in the app's project; user gets the issue ID as confirmation                                                                                                                                                                                                                  |
| D5  | **LLM access via REST API + per-project skills**                                                                                                               | Cheapest in tokens, full control, no extra server; MCP can be added later if ever needed                                                                                                                                                                                                                                       |
| D6  | **Bot user per app** (workspace Guest + project Member of only its project) + API token                                                                        | Gives true per-project API scoping with stock Plane permissions                                                                                                                                                                                                                                                                |
| D7  | **Migrate everything, including done tickets**                                                                                                                 | ~560 issues is small; history is valuable; done → Done state                                                                                                                                                                                                                                                                   |
| D8  | ~~Vault-internal planning stays in the vaults~~ → **superseded by O4 (Karol 2026-09-08): vault planning migrates into Questimus**                              | Arsenal is the skills source of truth; its _planning_ now lives in Questimus like everything else                                                                                                                                                                                                                              |
| D9  | **SP files → Subplan issues; T units → Task issues; tickets → Ticket issues** (superseded by §5.4 — modules dropped)                                           | The nesting replaces modules; tickets keep their full content                                                                                                                                                                                                                                                                  |
| D10 | **Old folders stay untouched, never deleted** (superseded 2026-09-08: **no README pointers** — a manual cleanup task in Questimus covers verify + delete, §10) | Safe rollback; repos keep their history                                                                                                                                                                                                                                                                                        |

---

## 5. Target structure

### 5.1 Workspace & projects

**Workspace:** `Main` (slug `main`) — **already exists** (verified in the DB). Current contents: only a leftover `test` project (identifier `TEST`) — the `Main` and `Questimus` projects and the `test` workspace are **soft-deleted** (hidden from the UI). Phase 1: run the hierarchy smoke test in the `test` project (its issue types are already joined), then **hard-delete it** (v1 DELETE is permanent) + delete the test bot user (`bot_user_0f6c3a6b-0daf-4794-8d95-b09ff15a4e0f@localhost`).

| Project (identifier)                 | Source                                                                         | Initial content                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Personal** (PERSONAL)              | `Empirium\pm` (Ideas.md, research notes)                                       | Ideas (label `idea`), research content in ticket bodies (§5.5), **Ideal Business Model → ongoing task**; Now.md entries routed per project (§9.3) |
| **Questimus** (QUESTIMUS)            | (new)                                                                          | This migration plan (page + Plan issue in Phase 2; Plan issue marked Done in Phase 12), future Questimus planning/tickets                         |
| **Legaliosa** (LEGALIOSA)            | `Legaliosa-test-ox-alpha\planning` (v2, active)                                | 211 tickets, 11 SP + 38 T + Plan issues, design decisions                                                                                         |
| **Jobernaut** (JOBERNAUT)            | `Jobernaut2\planning` (active — j2mainlink removed by Karol 2026-09-08)        | 99 issues (1 Plan + 7 SP + 22 T + 69 tickets)                                                                                                     |
| **Don Saldo** (DONSALDO)             | `Don-Saldo\planning`                                                           | 2 tickets, bank-import note                                                                                                                       |
| **Media Consumerus** (CONSUMERUS)    | `Media Consumerus\planning`                                                    | BACKLOG.md + TODOS.md → issues                                                                                                                    |
| **Kleinanzeigen** (KLEINANZEIGE)     | ~~`Empirium\pm\Kleinanzeigen`~~ (folder deleted 2026-09-09 — O13)              | Karol re-created the content manually as tickets; no pm import                                                                                    |
| **Personal Operating Profile** (POP) | ~~`Empirium\pm\Personal Operating Profile`~~ (folder deleted 2026-09-09 — O13) | Karol re-created the content manually as tickets; no pm import                                                                                    |
| **Arsenal** (ARSENAL)                | `Wisdomous\Arsenal\planning` + `Empirium\pm\Arsenal`                           | 10 active plans → Plan issues (status kept); done/ + archive/ → Plan issues, state Done (O4); Arsenal.md task list → issues                       |
| **Empirium** (EMPIRIUM)              | `Wisdomous\Empirium\planning`                                                  | 3 vault-migration plans → Plan issues (state per status)                                                                                          |

**Dropped (Karol, 2026-09-08):** Ideal Business Model (→ ongoing task in Personal), Obsidian Plugins, Input Splitter (deleted). Identifiers are **full names** (max 12 chars, no hyphens/special chars — verified in the model).

Not migrated: Legaliosa v1, Jobernaut v1 (O1–O2), Input Splitter (O5), Obsidian Plugins, Ideal Business Model (→ one ongoing task in Personal), pm folders for Legaliosa / Media Consumerus / Kleinanzeigen / POP (O13 — deleted 2026-09-09, content re-created manually as tickets).

### 5.2 States (per project — Karol's set, 2026-09-08; revised same day: `Open` → `Backlog` + new `ToDo`)

| State       | Group     | Source mapping                                                              |
| ----------- | --------- | --------------------------------------------------------------------------- |
| Backlog     | backlog   | `status: open/backlog/deferred` (default state — new issues land here)      |
| ToDo        | unstarted | (no source mapping — new/manual work picked up from the backlog)            |
| In Progress | started   | `status: in-progress`                                                       |
| Blocked     | started   | `status: blocked` (a real state now — no label; sits in the Started column) |
| Cancelled   | cancelled | `status: cancelled/abandoned/dropped`                                       |
| Done        | completed | `status: done` (incl. `tickets/done/*`, checked items)                      |

Note (Phase 4, 2026-09-08): Plane creates a leftover **Triage** state (group `triage`) with every project. The default `State.objects` manager **excludes group=triage**, so the API-based convergence (`setup-workspace.js`) can never see or delete it — `setup_issue_types.py` now soft-deletes it per project (idempotent; verified: all 10 projects have exactly the 6 states above).

### 5.3 Labels

- **Per project:** `verified`, `user-report` (app-reported issues)
- **Personal:** `idea`, `todo`, `someday`, `research`
- **Import markers:** `parked` (Kleinanzeigen), `backlog` + `deferred` (Media Consumerus)
- (Karol confirmed 2026-09-08: no `errand`, no `pm` labels)

### 5.4 Planning model — nested work items + types (Karol, 2026-09-08; revised same day: 3 types)

Plans are **work items, not pages** — the hierarchy nests via sub-issues, and each level has its own state (mark tasks Done → then the subplan → then the plan):

```
PLAN (type "Plan")              ← plan.md / PLAN.md
└─ SP-01 (type "Plan")          ← SP-01-*.md (prefix carries the stage)
   └─ T-01-01 (type "Plan")     ← T-01-01-*.md
      └─ ST-01 (type "Plan")    ← ST-*.md (future convention)
```

- **Issue types (revised 2026-09-08): exactly three — `Plan`, `Ticket`, `Design`.** The hierarchy stages (SP/T/ST) are carried by the item prefixes, so Subplan/Task/Subtask were **removed** (existing items reassigned to Plan, types deleted). `Ticket` is the project default type (app-reported issues); `Design` is reserved for future design-task issues, not used by the migration.
- **Tickets are separate** (type "Ticket", no parent) — not mixed into the hierarchy. Tickets keep an `SP-XX` label from their `sub_plan` frontmatter for grouping.
- **Types are workspace-level** (created by `db/setup_issue_types.py`; ids land in `migration-tools/state/types.json`) and **apply to every project** — managed centrally at **Workspace settings → Issue types** (§7.12: name, color, description; add/delete with an in-use guard).
- **Modules are dropped** — the nesting replaces them.
- **Two sidebar views per project** (one click each): "Planning" (type Plan) and "Tickets" (type Ticket) — the `issue_type` view filter works after the §7.5 fork change.
- ClickUp-style multiple lists per project do **not** exist in Plane — candidate future Questimus feature, not migration scope.

### 5.5 Pages (docs)

Per project, from the markdown sources:

| Source file(s)                     | Page                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HANDOFF.md`                       | "HANDOFF"                                                                                                                                                                                                                                                                                                                                                                         |
| `pilot-findings.md`                | "Pilot findings"                                                                                                                                                                                                                                                                                                                                                                  |
| `design/reviews/*.md`              | "Design decisions" section (one page per review)                                                                                                                                                                                                                                                                                                                                  |
| `design/v2/design-system-delta.md` | "Design system delta"                                                                                                                                                                                                                                                                                                                                                             |
| `v2-replan-input/*.md`             | "v2 replan input" section                                                                                                                                                                                                                                                                                                                                                         |
| —                                  | "Design" index page: **links to repo paths** of the HTML mockups (e.g. `planning/design/v2/admin.html`) — mockups themselves stay in the repo (D3); **created manually in the UI during the Legaliosa batch** (not in the page importer)                                                                                                                                          |
| `Ideas.md`                         | Personal issues, label `idea` (§9.3)                                                                                                                                                                                                                                                                                                                                              |
| `Now.md`                           | **Routed per entry** to its project via `import-now.js` (§9.3) — no "Now" page                                                                                                                                                                                                                                                                                                    |
| `hosting-publishing.md`            | **Personal ticket "Hosting & Publishing Plan" (PERSONAL-52)** — Karol 2026-09-08: pages deleted, content moved into ticket bodies ("didnt make sense for me to have pretty much empty tickets and to link to documents when the same markdown formatting works inside the ticket body")                                                                                           |
| research notes                     | **Ticket bodies** (Karol 2026-09-08, supersedes the pages approach): `own-server-vs-vps-etc.md` → **PERSONAL-12**, `how-does-claudian…flatrate-subscription.md` → **PERSONAL-29**; all 4 pages deleted. General rule for the remaining phases: a standalone doc with a sibling issue → merge the content into the issue description; only docs **without** a sibling become pages |

Note: `plan.md`/`PLAN.md` and `SP-*.md` are **not** pages anymore — they are the Plan/Subplan work items (§5.4).

### 5.7 Dashboard & prioritization (Karol's "what now / what next" view)

**Native, no payment gate** (verified in the code: no premium/license-key gating in the self-hosted fork — the pricing page's "Pro" features are Plane Cloud tiers only; dashboards, time tracking, issue types all exist in the repo):

- **Correction (verified 2026-09-08): there is NO Home dashboard and NO "My Issues" page wired in this version** — the home-dashboard components exist in the codebase but are not routed (dead code); the `(home)` route is the login page. **Karol 2026-09-08: the home dashboard (Phase 3) is the "Now"/"Today" view** — it implements the combined logic (assigned to me, urgent/high **OR** due ≤ 7 days — saved views are AND-only, verified) and due today/overdue, computed per request. Until Phase 3, prioritization comes from the workspace **"Next"** view (assigned to me, medium/low — created in Phase 2) + per-project views + in-app notifications.
- **Phase 3 (2026-09-08): implemented.** The workspace home (`/{workspaceSlug}`) shows two widgets — **My Issues** (assigned to me across projects; Pending/Upcoming/Overdue/Marked-completed tabs) and **"Now"** (open + assigned + urgent/high **or** due ≤ 7 days, **overdue included** — the separate "Today" card was merged into Now on 2026-09-08: due-today/overdue is a subset of the due-≤-7-days window) — computed per request from the workspace issues endpoint (`assignee_id__in` rich filter). They are **real widgets** (backend `HomeWidgetKeys` + registry): toggleable and **reorderable via "Manage widgets"**; titles via i18n keys `home.my_issues.title`/`home.now.title` (added to the EN source locale file). Note: the workspace home was already routed (`WorkspaceHomeView` at the workspace index — the "dead code" claim was stale); what was missing was the My Issues/Now content.
- **Priority** (urgent/high/medium/low) and **due dates** on every issue — the prioritization mechanism.
- **In-app notifications are native** (bell + notifications page + per-user preferences). **No email** (Karol 2026-09-08): SMTP stays unconfigured; email toggles off. **User-reports get assigned to Karol by default** → native in-app ping when an app reports an issue.
- **Cycles — tested, NOT adopted per project (Karol 2026-09-08, Phase 4):** the "This week" cycle in Personal worked, but per-project cycles give no cross-project overview ("if i only do this in personal project then i wont be really doing anything else in the other projects"). A **workspace-wide cycle** would be the real need — tracked as a Questimus idea ticket — but the **"Now" home widget already is the workspace-wide weekly view** (urgent/high **or** due ≤ 7 days, across all projects). Workflow: focus on Now; when its items are done, pull the next tasks in by adjusting their priority/due dates. `cycle_view` is now **off everywhere** (converged; the test cycle data stays in Personal, hidden).
- **Future Questimus features** (from Now.md, now Questimus project ideas): Eisenhower Matrix view, ADHD single-task view, mascot guide — tracked as Questimus project issues (type Ticket, label `idea`).

### 5.6 Views (saved filters, per project)

- Per project (created in Phase 1 via `setup-workspace.js` — `config/setup.json` `views` section; "All" is the default view, no creation needed): "In Progress", "Done", "User reports" (label `user-report`), "Blocked" (state filter), **"Planning"** (type Plan), **"Tickets"** (type Ticket) — the type views need the §7.5 fork change
- Personal extras: "Inbox" (state Backlog), "Ideas" (label `idea`), "Someday" (label `someday`)
- Workspace: **"Next"** (assigned to me, medium/low). "Now" is a **home dashboard widget (Phase 3)** — saved views are AND-only and store fixed dates, so the combined/due logic can't be a saved view (Karol 2026-09-08)
- **The web UI reads `rich_filters`, not `filters`** (execution finding 2026-09-08): the view stores hydrate from `viewDetails.rich_filters` (TWorkItemFilterExpression — `"<field>__in": "a,b"`, `and` groups) and ignore the legacy `filters` field. Views created with only `filters` were born invisible/filter-less. `setup-workspace.js` now converts resolved filters → `rich_filters` (its own converter — the backend's `LegacyToRichFiltersConverter` doesn't know the fork's `issue_type` key; key names must match `IssueFilterSet` fields: `state_id__in`/`label_id__in`/`assignee_id__in`/`priority__in`/`issue_type__in`) and writes both fields. Existing views are **converged** on every run (PATCH when stored filters/rich_filters differ — canonical compare) — this repaired all 64 views (24 had been created with empty filters because newly-created states/labels were missing from the lookup maps; the maps are now updated on create).

### 5.8 Feature toggles (per project; Karol 2026-09-08, applied to all 10)

Plane's per-project feature flags (model defaults: pages on, everything else off; the plan **must** override views — the views are the plan's navigation and were created in Phase 1 but were invisible until activated):

| Toggle  | Model field        | Setting               | Why                                                                                                                                                                       |
| ------- | ------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Views   | `issue_views_view` | **on** (all projects) | the plan's navigation — 64 saved views (workspace "Next", per-project 6, Personal 3)                                                                                      |
| Pages   | `page_view`        | **on** (all projects) | the plan creates 29 pages (design reviews O8, POP doc, Questimus plan page, …; Personal research/hosting docs merged into ticket bodies instead — Karol 2026-09-08, §5.5) |
| Cycles  | `cycle_view`       | off (all)             | tested in Personal (Phase 4) — **not adopted per project** (no cross-project overview; the "Now" home widget is the weekly view, §5.7)                                    |
| Modules | `module_view`      | off (all)             | modules dropped (§5.4)                                                                                                                                                    |
| Intake  | `intake_view`      | off (all)             | app reports come in directly as work items with label `user-report` (§8.1)                                                                                                |

`setup-workspace.js` enforces this: `DEFAULT_FEATURES` + per-project `features` override in `config/setup.json` (no overrides currently — cycles converged off after the Phase 4 test); new projects are created with the flags, existing ones are PATCHed on every run (convergent, reports `features: N`).

---

## 6. Access & security model

### 6.1 Karol

Workspace **Admin** + Admin on every project. Own API token for migration scripts and the Personal project.

### 6.2 Bot users per app (the API-scoping answer)

API tokens are user-level, so **scoping = membership** (verified in the permission code: project endpoints gate on `ProjectMember`; the project-list endpoint and UI additionally require a `WorkspaceMember` row — hence the Guest role):

1. Create one bot user per app: `legaliosa-bot@questimus.local`, `jobernaut-bot@…`, `don-saldo-bot@…`, `media-consumerus-bot@…`, `kleinanzeigen-bot@…`, `questimus-bot@…` — plus one per personal project (Karol 2026-09-08): `personal-bot@…`, `pop-bot@…`, `arsenal-bot@…`, `empirium-bot@…` (created via a small Django management command — no email needed, `is_email_verified=True`, `is_bot=True`, `is_service=True`).
2. Add the bot to the workspace as **Guest** (read-only at workspace level — required for project listing + UI).
3. Add the bot to **only its app's project** as **Member** (Member is required for writes; Guest is read-only in this Plane version).
4. Create **two API tokens per app bot** (both same scope, independently revocable):
   - `…-app` token → used by the app's backend for issue reporting
   - `…-agent` token → used by LLM harnesses (skills)
     Personal-project bots get the `-agent` token only (no app backend exists).

**Execution finding (Phase 2, 2026-09-08):** `User.username` is `unique=True` with no default — the first bot created with an empty username (`""`) makes every further bot creation fail with `user_username_key` violation. The command now sets `username = email` (collision-free) and backfills pre-fix bots; the token file `migration-tools/state/tokens.json` is written UTF-8 **without BOM** (a BOM breaks JSON.parse in Node).

Result: the token can read/write **only its project** (project list and all project endpoints are gated by `ProjectMember` rows). The bot can see workspace-level metadata (name, its own membership) but nothing of other projects. If hard isolation is ever needed (bot must not know other projects exist), that requires a separate workspace — not needed now.

### 6.3 Collaborators (humans)

Invited as **project Member** (commenting is a write; Guests are read-only in this version). Per-project membership means a collaborator only sees the project(s) they're added to.

### 6.4 App end users

**No Questimus accounts.** They report via the app's UI; the app's backend creates the issue with the bot token (§8). They get the issue ID (e.g. `LEG-123`) as confirmation.

### 6.5 Token handling

- Tokens live in env vars / secret stores, never in skills or repos.
- Rotation = create new token, swap env, delete old.
- Rate limit default 60/min per token — fine.

### 6.6 If Questimus ever goes public (Phase 13)

- Domain + HTTPS via the built-in **Caddy** proxy (verified: `Caddyfile.ce` — set `SITE_ADDRESS` to the domain + `CERT_EMAIL`; ACME auto-provisions the cert).
- **Signup lockdown** (verified): set `ENABLE_SIGNUP=0` in `apps/api/.env` — the auth adapter then blocks signups (invited users still work).
- **Email**: SMTP stays unconfigured locally (Karol 2026-09-08). Phase 13 configures SMTP if password resets/email verification are needed (the "email verification on" toggle requires it).
- Strong admin password, backups already running.
- Public deploy boards (`/api/public/` anchors) are a possible future option for a public bug tracker per app.

---

## 7. LLM access — per-project skills (REST API)

### 7.1 Why REST + skills (D5)

- No MCP server exists in Questimus; building/running one adds a moving part and token overhead per call.
- REST is direct, scriptable, and the skill documents exactly what the agent needs — cheapest in tokens.
- MCP can be added later (community `plane-mcp` or a custom one) if another tool needs it.

### 7.2 API surface for agents

- **Base URL:** `http://localhost:7000` (local) → public URL later (Phase 13)
- **Auth:** `X-Api-Key: plane_api_…` (bot's `-agent` token)
- **Endpoints (v1):** see Appendix A. After the fork change (§7.4) the same token also works on the main API for pages.

### 7.3 Skill anatomy (one per project, deployed via Arsenal to all harnesses)

Each skill (e.g. `questimus-legaliosa`) contains:

1. **Scope:** workspace slug, project ID, token env var (`QUESTIMUS_LEGALIOSA_AGENT_TOKEN`)
2. **Endpoint cheat-sheet:** list/create/update work-items, comments, attachments, states, labels, search
3. **Conventions:** state names, labels (`user-report`, `verified`, `SP-XX`), priority mapping
4. **Workflows:** triage user reports → work on ticket → verify → resolve → close; how to read plan pages (after fork change) and design links (repo paths)

Skill list: `questimus-legaliosa`, `questimus-jobernaut`, `questimus-don-saldo`, `questimus-media-consumerus`, `questimus-kleinanzeigen`, `questimus-personal`, `questimus-pop`, `questimus-arsenal`, `questimus-empirium`, plus a generic `questimus` skill (workspace-level ops, project discovery).

### 7.4 Recommended fork change (small, high value)

`apps/api/plane/settings/common.py` line 139 — add the existing (but unwired) app-side auth class:

```python
"DEFAULT_AUTHENTICATION_CLASSES": (
    "rest_framework.authentication.SessionAuthentication",
    "plane.app.middleware.api_authentication.APIKeyAuthentication",
),
```

Effect: `X-Api-Key` works on the **main API** too → LLM agents can read/write **pages** (plans, design decisions), webhooks, exports. The class is already implemented and tested (contract tests exist). Without this, agents can only reach issues via v1 and plan docs stay repo-only.

**Execution finding (Phase 1, 2026-09-08): the settings change alone is NOT sufficient.** `BaseAPIView` and `BaseViewSet` (`plane/app/views/base.py`) hardcode `authentication_classes = [BaseSessionAuthentication]`, which overrides the DRF default for every main-API view → token calls 401'd despite the settings entry. Fixed by adding `APIKeyAuthentication` to both base classes (same file, plus the import). Keep the settings change (it covers any view that doesn't override).

### 7.5 Second fork change — issue-type filter (applied 2026-09-08)

The "Planning"/"Tickets" views filter by issue type, but this Plane version has **no issue-type filter in the backend** (the UI's filter state has `issue_type`, but the backend ignores it — the "Planning"/"Tickets" views would show every issue). Applied:

- `plane/utils/issue_filters.py` — new `filter_issue_type` (param `issue_type` → `type__in`), registered in `ISSUE_FILTER`.
- `plane/utils/filters/filterset.py` — `IssueFilterSet` gains `issue_type` / `issue_type__in` (→ `type_id`).

Effect: the UI's issue-type filter and the type-based views work. Takes effect on the next api rebuild (Phase 1).

### 7.6 Third fork change — issue-types endpoint (applied 2026-09-08)

The "Issue type UI" ticket (Phase 3) needs the project's issue types in the web app, but this Plane version has **no issue-type endpoint** (types are DB-only; the web app's `getIssueTypeIdOnProjectChange` is hardcoded `null`). Applied:

- `plane/app/views/issue_type.py` — new `IssueTypeListEndpoint` (`GET /api/workspaces/{slug}/projects/{id}/issue-types/` → the project's types with `is_default`/`level`).
- Registered in `plane/app/views/__init__.py` + `plane/app/urls/issue.py`.

Effect: the web app can list a project's types → the type selector (modal) + type badge (list/detail) become implementable in Phase 3. Takes effect on the next api rebuild (Phase 1).

### 7.7 Fourth fork change — v1 estimate routes registered (applied 2026-09-08, Phase 1)

Stock bug caught by the Phase 1 smoke test: `plane/api/urls/estimate.py` exists (the v1 estimate views are fully implemented — single-object GET/409-on-create, bulk points) but was **never included in the v1 urlconf** → `POST/GET /api/v1/workspaces/{slug}/projects/{id}/estimates/` 404'd. Fixed: added the `estimate_patterns` import + include to `plane/api/urls/__init__.py`. No other v1 module was missing (comments/relations/search live inside `work_item.py`).

### 7.8 Fifth fork change — created_at preservation (applied 2026-09-08, Phase 1)

The plan assumed v1 create preserves `created_at`, but the model field is `auto_now_add` → the serializer treats it as auto read-only and the server's timestamp wins. Fixed in `plane/api/serializers/issue.py`: explicit writable `created_at = DateTimeField(required=False)` + pop from `validated_data` in `create()` + `Issue.objects.filter(pk=...).update(created_at=...)` (bypasses `auto_now_add`'s pre_save). Verified by the smoke test (`2026-01-01T00:00:00Z` preserved).

### 7.9 Operational note — v1 API rate limit (Phase 1, 2026-09-08)

The v1 API throttles per API key (`ApiKeyRateThrottle`, `settings.API_KEY_RATE_LIMIT`, default **60/minute**) — the setup script and the importers (559 issues + relations + pages) blow through that instantly (HTTP 429 `RATE_LIMIT_EXCEEDED`). Raised locally via `API_KEY_RATE_LIMIT=1000/minute` in `apps/api/.env` (gitignored — no repo change; **re-apply after any fresh clone/setup**). Note: `docker compose restart` does NOT re-read `env_file` — use `docker compose up -d api` to apply.

### 7.10 Sixth fork change — zero-padded issue keys (applied 2026-09-08)

Karol: issue keys should read `QUESTIMUS-001` (minimum 3 digits) instead of `QUESTIMUS-1`. **Display-only.**

- `apps/web/helpers/issue-key.helper.ts` (new) — `padIssueSequence()` + `getIssueKey()`. The web UI composes keys client-side from the project `identifier` + `sequence_id` (the web app is Vite + React Router — see §1).
- `IssueIdentifier` (the central key component behind all list layouts, modals, relation lists, preview cards, ⌘K) now pads; ~21 other inline composition sites swept (detail header/page titles, activities, notifications, inbox, delete/archive modals, power-k).
- Internal lookup keys (`issuesIdentifierMap`) and the API request path (`retrieveWithIdentifier`) deliberately stay raw — routing and the API contract are unchanged; pad is cosmetic.
- **The web app must be rebuilt** (`docker compose up -d --build web`). Type-check caveat: `react-router build` (esbuild) does not type-check — verify via oxlint and the served bundle (`grep 'padStart(3' html/assets/`).

### 7.11 Seventh fork change — issue type UI + type_id in payloads (applied 2026-09-08, Phase 3)

Phase 3 implemented the "Issue type UI" ticket (§5.4 types now visible everywhere):

- **Backend — `type_id` in main-API issue payloads** (the web UI composes the badge from it): `IssueSerializer.Meta.fields` (`app/serializers/issue.py` — also covers `IssueDetailSerializer`), the `.values()` fast path (`app/views/issue/base.py` list) and `issue_on_results` required fields (`utils/grouper.py` — the web list path).
- **Type badge** — new `IssueTypeBadge` (`apps/web/core/components/issues/issue-type-badge.tsx`, dot in the type's own `color`, name from the §7.6 endpoint via `useProjectIssueTypes` SWR hook + shared cache `helpers/issue-types.helper.ts`); rendered by **`IssueIdentifier`** next to every issue key (list/kanban/spreadsheet/calendar rows, relations, preview cards, sub-issues, detail/peek headers — the upstream `issueTypeId` prop that was dead is now honored).
- **Modal type selector** — `dropdowns/type.tsx` (searchable single-select) as the first property in `issue-modal/components/default-properties.tsx`; new issues default to the project's **default type (Ticket)** when the project changes (form effect: sync from the module cache, else async load) — the create/update payloads already carried `type_id`.
- **Change type on existing items** — the detail/peek header badge (`IssueTypeSwitcher`) is now a picker: click the badge → choose a type → PATCHes `type_id` (display-only when not editable). **Execution fix (2026-09-08): the main API's `IssueCreateSerializer` silently dropped `type_id`** (the model FK is named `type`) — added the explicit `type_id` field; the switcher now persists. **Second fix (2026-09-09, Phase 4 review — Karol: the UI still didn't change the type): the switcher called `issueOperations.update(...)` on a property that does NOT exist on the issue-details store** (`useIssueDetail()` exposes no `issueOperations`) — `changeType` threw `undefined.update` before any request (no PATCH, no activity, no toast; the API PATCH worked). `IssueTypeSwitcher` now takes `issueOperations` as a prop from both call sites (detail root + peek overview), like every other property editor. `dropdowns/type.tsx` was also rewritten without headlessui (plain React, own outside-click/Escape/absolute menu — kept; the combobox itself was not the bug). Follow-up tickets: **project-level issue types with workspace fallback** (QUESTIMUS-29) and **sort by Name/ID asc+desc** (QUESTIMUS-28).
- **Home dashboard** — see §5.7 (My Issues / Now widgets, reorderable via Manage widgets).
- Both dev tickets marked **Done** in Questimus; the 8 Questimus content tickets are now **assigned to Karol** (the home sections only show assigned issues; user-reports auto-assign per §8.1 anyway).

### 7.12 Eighth fork change — 3-type model + colors + central management (applied 2026-09-08)

Karol: the hierarchy stages (SP/T/ST) are carried by the item prefixes, so the type set is exactly **Plan / Ticket / Design**; types need **colors** and a **central management place** (workspace level, applying to every project).

- **Model change**: `IssueType.color` (CharField, default `#3f76ff`; migration `db.0123_issuetype_color`). `setup_issue_types.py` reworked: creates the 3 types with colors, **reassigns issues of the removed Subplan/Task/Subtask types → Plan and deletes them** (idempotent), joins to the project, Ticket stays the per-project default. Existing data migrated (2 Task issues → Plan; removed types gone).
- **Per-project endpoint (§7.6) now returns ALL workspace types** (with `color` + the project's `is_default`) — types apply to every project; the join rows only carry the default flag.
- **Workspace-level CRUD** (`app/views/issue_type.py` + `urls/workspace.py`): `GET/POST /api/workspaces/{slug}/issue-types/` (create joins the new type to every project) + `PATCH/DELETE .../{id}/` (delete blocked with a 400 while issues reference the type).
- **Central UI**: **Workspace settings → Issue types** (`settings/(workspace)/issue-types/` — sidebar entry under Features, icon Layers, label from the existing `work_item_type.label` i18n key): list with color swatches, inline rename/recolor/description, add, delete (in-use guard surfaces the error).
- **Badge + switcher use the type's color**; the importers map Subplan/Task/Subtask → Plan (`import-issues.js`), the Questimus content script uses Plan for the former Task tickets, the smoke test hierarchy is all-Plan, and the "Planning" view filters `{{type:Plan}}` only.
- **Tickets created for later** (workspace-level inheritance idea — Karol 2026-09-08): workspace-level **states**, **labels** and **priority options** with per-project override (the same "defaults + override" logic issue types now have).

### 7.13 Ninth fork change — page create with parent (applied 2026-09-08, Phase 4)

Upstream bug: `PageViewSet.create` re-fetches the created page from the list queryset, which filters `parent__isnull=True` — creating a page **with a parent** (e.g. a "Research" section) returns 404 _after_ the page was created (the importer then can't record it → duplicate risk on re-run). Fix: re-fetch by pk (`Page.objects.get(pk=...)`) in `app/views/page/base.py`. Note (Phase 4, 2026-09-08): the UI has no child-page display and Karol ultimately dropped pages for standalone docs (content → ticket bodies, §5.5) — the fix stays (correct API behavior) and the importer's `parentPage` option stays for future UI support (QUESTIMUS-26).

---

## 8. App integrations — "Report issue" in each app

### 8.1 Pattern (fire-and-forget, D4)

```
User clicks "Report issue" in the app
  → modal: summary, description, optional email, optional screenshot
  → app backend:
      POST /api/v1/workspaces/main/projects/{project_id}/work-items/
        title: "[Report] <summary>"
        description: structured (what happened / expected / steps / app version / user email)
        state: Backlog (backlog group) · label: user-report · priority: from severity
      screenshot → POST .../work-items/{id}/attachments/ (multipart)
  → response: issue identifier (e.g. LEG-123)
  → app shows confirmation: "Thanks! Your report is LEG-123."
```

### 8.2 Per-app config (env vars)

`QUESTIMUS_URL`, `QUESTIMUS_TOKEN` (the `-app` bot token), `QUESTIMUS_PROJECT_ID`.

### 8.3 Workflow

- New reports land in Backlog (backlog group) with label `user-report` → Karol (or the LLM agent via skill) triages: reproduce, dedupe (search endpoint), prioritize, assign.
- Apps can also **fetch their own issues** (same token) and **resolve them** (e.g., auto-close on release).
- Optional later: Plane **Intake** (triage inbox) if reports need a formal accept/reject step; **public deploy board** per app for a public tracker.

### 8.4 Rollout

Legaliosa first (most mature), then Don Saldo, Jobernaut, Media Consumerus, others. Each app gets a small shared module (report-issue form + API client) so the pattern is identical everywhere.

---

## 9. Migration mechanics

### 9.1 Mapping rules (ticket → issue)

| Ticket frontmatter/field                            | Questimus field                                                                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                                             | Issue title                                                                                                                                                                                                               |
| body (Findings / Suggested path / Related / Effort) | Issue description (markdown, preserved)                                                                                                                                                                                   |
| `status: done`                                      | State **Done**                                                                                                                                                                                                            |
| `status: in-progress`                               | State **In Progress**                                                                                                                                                                                                     |
| `status: blocked`                                   | State **Blocked**                                                                                                                                                                                                         |
| `status: open/backlog/deferred`                     | State **Backlog**                                                                                                                                                                                                         |
| `severity: major/minor/…`                           | Priority (major→high, minor→medium, …)                                                                                                                                                                                    |
| `sub_plan: SP05`                                    | Label `SP-05` (grouping; tickets stay outside the hierarchy)                                                                                                                                                              |
| `blocked_by: "0129"`                                | Issue relation `blocked_by` (two-pass)                                                                                                                                                                                    |
| `verified: <date>`                                  | Label `verified`                                                                                                                                                                                                          |
| `Effort: S/M/L`                                     | Estimate points (1/3/5) — optional                                                                                                                                                                                        |
| `id: 0119`                                          | `external_source: "legaliosa-v2"`, `external_id: "0119"` (idempotency + traceability; **derived from the filename prefix** — YAML parses leading-zero ids as octal, e.g. `0130` → `88`, so the filename is authoritative) |
| `tickets/done/*`                                    | State **Done**                                                                                                                                                                                                            |
| `T-XX-XX-*.md` (root task units)                    | Issue type **Task**, parent = its SP issue, `depends-on` → `blocked_by` relations                                                                                                                                         |
| `SP-XX-*.md`                                        | Issue type **Plan**, parent = the Plan issue                                                                                                                                                                              |
| `plan.md` / `PLAN.md`                               | Issue type **Plan** (root of the hierarchy)                                                                                                                                                                               |
| `ST-*.md` (future)                                  | Issue type **Plan**, parent = its T issue                                                                                                                                                                                 |
| `sub_plan: SP05` (tickets)                          | Label `SP-05` (grouping; tickets stay outside the hierarchy)                                                                                                                                                              |

### 9.2 Import tooling

**Status: built and dry-run verified against all real sources (2026-09-08).** See `migration-tools/` (README inside): API client, generic importer (tickets + T-task units + markdown tables + heading sections + checkbox lists), page importer, idempotent setup script, bot-user management command, skill template. **13 configs, one per source — 9 active, 4 retired by O13 (2026-09-09).** Verified totals (dry-run, 0 API calls, 0 failures):

| Config                                                                                          | Issues                                                                            | Pages           | Relations |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------- | --------- |
| legaliosa-v2                                                                                    | 261 (1 Plan + 11 SP + 38 T + 211 tickets)                                         | 11              | 86        |
| jobernaut-v2                                                                                    | 99 (1 Plan + 7 SP + 22 T + 69 tickets; `archive/` excluded; live source — drifts) | 10              | 34        |
| don-saldo                                                                                       | 2                                                                                 | 1               | 0         |
| media-consumerus                                                                                | 12 (10 backlog + 2 todos; +4 deduped section ids)                                 | 3               | 0         |
| personal (Ideas only — Now.md moved to now-routing)                                             | 23                                                                                | 0               | 0         |
| jobernaut-pm                                                                                    | 48                                                                                | 0               | 0         |
| don-saldo-pm                                                                                    | 29                                                                                | 0               | 0         |
| ~~legaliosa-pm~~ — **dropped 2026-09-09 (O13: pm folder deleted, content re-created manually)** | 4                                                                                 | 0               | 0         |
| ~~media-consumerus-pm~~ — **dropped 2026-09-09 (O13: same)**                                    | 4                                                                                 | 0               | 0         |
| arsenal-pm (Arsenal.md task list)                                                               | 23                                                                                | 1               | 0         |
| ~~kleinanzeigen~~ — **dropped 2026-09-09 (O13: pm folder deleted, note re-created manually)**   | 0 (note → page)                                                                   | 1               | 0         |
| ~~pop~~ — **dropped 2026-09-09 (O13: pm folder deleted, document re-created manually)**         | 0 (doc → page)                                                                    | 1               | 0         |
| now-routing (Now.md — live file, count drifts)                                                  | 54                                                                                | 0               | 0         |
| **Total**                                                                                       | **551** (559 − 8 dropped)                                                         | **27** (29 − 2) | **120**   |

Node.js scripts in `C:\Users\Karol\Projects\Questimus\migration-tools\` (new folder, not part of the app build):

- `config/<project>.json` — per-source config: folder, file patterns, state/label mappings
- `lib/questimus-client.js` — thin API client (X-Api-Key; session login only if the fork change is deferred)
- `import-issues.js` — parse frontmatter (gray-matter) + markdown → create issues/relations; **two-pass** (issues first, then `blocked_by` relations); **idempotent** via `external_source/id` + a local state file (`state/<project>.json` mapping source path → issue id); `--dry-run` mode; per-project import report (created/updated/skipped/failed). Descriptions are sent as `description_html` — convert markdown with `marked`/`markdown-it` (server sanitizes). `excludeDirs` skips subfolders (e.g. `archive/` — v1 subplans must not be imported). **`assigneeId` config (Phase 4 finding, 2026-09-08):** all imported issues are assigned to Karol (`config.assigneeId`) — without it the home widgets ("assigned to me") never show imported work; the 78 Phase 4 issues were backfilled via SQL. **Two fixes (Phase 5, 2026-09-09):** (a) **external-id collision** — a section source's raw heading id (`E1`/`E2`) collided with BACKLOG table-row ids in the same config; the server-side 409-dedup then wrongly merged the TODOS items into the table issues (invisible in `--dry-run` — dedup only happens against the live DB). Section external ids now get a **file-derived prefix** (`TODOS-E1`); (b) **bold-cell mapping** — the BACKLOG `Priority` cells are `**P0**`; table-cell lookups now strip markdown emphasis before mapping, without it every issue silently fell back to `medium` priority. The `media-consumerus` config also gained `typesFile`/`assigneeId`/`pagesStateFile`/`priorityMapping` (Phase 4 conventions — without `assigneeId` imported work never appears in the home widgets).
- `import-pages.js` — create pages from plan/SP/review/handoff markdown (needs main API; works via API token after the fork change, else via session login)
- `setup-workspace.js` — create projects/states/labels skeleton (idempotent, config-driven; module support exists but unused — modules dropped) **+ views from the config's `views` section** (workspace + per-project; main API, token works after the fork change; `{{state:Name}}`/`{{label:Name}}`/`{{type:Name}}`/`{{karolUserId}}` placeholders). `config/setup.json` holds all 10 projects (identifiers + labels) for Phase 1 + the views for Phase 2.
- `smoke-test.js` — Phase 1 hierarchy smoke test (Plan → SP → T → Ticket + relation + 409-dedup + created_at + main-API page; `--delete-project` flag).
- `create-questimus-content.js` — Phase 2: this plan → page + the 8 Questimus tickets (7 + the migration Plan issue; idempotent via external_source/external_id).

### 9.3 Per-source plan

| Source                                                          | Action                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Legaliosa-test-ox-alpha\planning`                              | 211 tickets → issues; 11 SP → Plan issues; 38 T → Plan issues; plan.md → Plan issue; HANDOFF/pilot-findings/design reviews/design-system-delta/v2-replan-input → pages; design HTML → "Design" index page (repo links, created in UI); archive/v1 stays in repo                                                                                                                                                                                   |
| `Jobernaut2\planning`                                           | Same pattern: 69 tickets, 7 SP (SP-13..19), 22 T, PLAN.md → Plan issue; `archive/v1` subplans excluded from import (O2)                                                                                                                                                                                                                                                                                                                           |
| `Don-Saldo\planning`                                            | 2 tickets → issues; bank-import note → page                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Media Consumerus\planning`                                     | BACKLOG.md rows → issues (priority/effort → priority/estimate); TODOS.md → issues with resolution log in description — **imported 2026-09-09 (Phase 5)**                                                                                                                                                                                                                                                                                           |
| `Empirium\pm\Ideas.md`                                          | Each checkbox item → Personal issue, label `idea` (category → section label or description heading); the "build my own PM tool" idea → **Completed** (Questimus exists)                                                                                                                                                                                                                                                                           |
| `Empirium\pm\Now.md`                                            | **Routed per entry** via `import-now.js` + `config/now-routing.json` (Karol 2026-09-08): each entry goes to its project (Questimus ideas → Questimus [idea], Jobernaut → Jobernaut, transcription batch → Empirium, …); nesting preserved as sub-issues; no "Now" page/project — the dashboard replaces the overview function. **Also discovered: a Google Sheets personal wishlist** (linked in Now.md) that still needs migrating into Personal |
| `Empirium\pm\<app> folders`                                     | Task lists → issues in the respective app projects (or Personal if no project exists). **Remaining folders: Arsenal, Don Saldo, Jobernaut** — Legaliosa / Media Consumerus / Kleinanzeigen / POP deleted 2026-09-09 (O13)                                                                                                                                                                                                                         |
| `hosting-publishing.md`, research notes                         | Ticket bodies (Karol 2026-09-08 — pages deleted; §5.5: PERSONAL-52 / PERSONAL-12 / PERSONAL-29)                                                                                                                                                                                                                                                                                                                                                   |
| `Ideal Business Model\Conversation History.md`                  | **Dropped** — one ongoing task in Personal (label `todo`); doc stays in repo                                                                                                                                                                                                                                                                                                                                                                      |
| `Obsidian Plugins\…\PLAN.md` + handoff                          | **Dropped** (Karol 2026-09-08) — stays in repo                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Kleinanzeigen` (pm folder)                                     | ~~Parked note → issue/page in Kleinanzeigen project~~ **dropped 2026-09-09 (O13 — folder deleted, content re-created manually)**                                                                                                                                                                                                                                                                                                                  |
| `Personal Operating Profile`                                    | ~~Page in Personal (O6)~~ **dropped 2026-09-09 (O13 — folder deleted, content re-created manually)**                                                                                                                                                                                                                                                                                                                                              |
| `Empirium\pm\Arsenal` (Arsenal.md + improve-subagent-config.md) | Arsenal.md → 23 issues in Arsenal (label `todo`); improve-subagent-config → page                                                                                                                                                                                                                                                                                                                                                                  |
| `Wisdomous\Arsenal\planning`                                    | Phase 6: 10 active plans → Plan issues (status kept; incl. the `plan-20-audit-*.txt` files — needs `planFiles` list support); done/ + archive/ → Plan issues, state Done (O4; only `.md` files — the `.txt`/`.py`/`.csv` artifacts stay in the vault)                                                                                                                                                                                             |
| `Wisdomous\Empirium\planning`                                   | Phase 6: 3 vault-migration plans → Plan issues (state per status — the migration plan is active)                                                                                                                                                                                                                                                                                                                                                  |
| Questimus project                                               | This plan → page + Plan issue (Phase 2; Plan issue marked Done in Phase 12); Questimus tickets created in Phase 2                                                                                                                                                                                                                                                                                                                                 |
| Google Sheets wishlist (linked in Now.md)                       | Phase 4: Karol exports the sheet to CSV (File → Download → CSV) into `migration-tools/sources/wishlist.csv`, then the format is inspected and a config is built (CSV → markdown table → existing table source, or a small CSV source)                                                                                                                                                                                                             |

### 9.4 Verification

- Counts match source (211/69/2/…), spot-check in UI, relations resolve, links to repo mockups work, search finds migrated items. (Media Consumerus: 4 deduped section ids are expected. Live sources drift — the dry-run at import time is authoritative.)
- Fresh backup snapshot before each import wave (backup pipeline already exists).

### 9.5 Archive & pointers (D10, superseded 2026-09-08)

After each project is verified: **no pointers, folders stay untouched** (Karol 2026-09-08). The **manual cleanup task** in the Questimus project covers verify + delete (§10).

---

## 10. Phases

**Execution protocol (Karol, 2026-09-08): one thing at a time.** Migrate one project at a time, and within a project in sub-batches (plan hierarchy → tickets → pages). Every batch: dry-run → import → verify (counts + spot-check in UI) → Karol sign-off → next batch. Small blast radius, nothing gets lost, no big-bang fixes. The tooling supports this natively (per-config state files, idempotent re-runs, 409-dedup).

**Migration order (Karol, 2026-09-08):**

1. **Personal** (Phase 4 — first, quick win, pilots the basic pipeline)
2. **Media Consumerus** (Phase 5 — exercises tables, sections, estimates, pages) — **done 2026-09-09** (12 issues + 3 pages; two importer fixes: §9.2)
3. **Arsenal** → **Empirium** (Phase 6 — vault planning; Kleinanzeigen + POP dropped 2026-09-09 — O13, content re-created manually)
4. **Don Saldo** (Phase 7 — move to the last batch if it becomes actively developed)
5. **Legaliosa** (Phase 8 — **last**: in active development; Karol signals a good pause point first)
6. **Jobernaut** (Phase 9 — **last**: same)

**Freeze per project:** each source folder is not touched during its import run (minutes) so the snapshot is clean; new tickets created after the import go directly into Questimus.

**Phase 1 includes a hierarchy smoke test** (`migration-tools/smoke-test.js`): creates a scratch Plan → SP → T → Ticket chain in the leftover `test` project (its issue types are already joined) and validates the exact API surface the importers use — `type_id` + `parent` nesting, state, label, estimate point, `blocked_by` relation, 409-dedup on `external_source`/`external_id`, `created_at` preservation, and a page create on the main API (proves the fork change is live). Run → all checks PASS → Karol sign-off → re-run with `--delete-project` (v1 DELETE is **permanent** — fine, the project only holds smoke-test data). Then delete the test bot user (`bot_user_0f6c3a6b-0daf-4794-8d95-b09ff15a4e0f@localhost`).

**After each project verifies:** no pointers, folders stay untouched (Karol 2026-09-08). A **manual cleanup task** lives in the Questimus project: Karol verifies everything migrated correctly, then deletes the old files/folders himself.

**Questimus project content created during Phase 2** (via `create-questimus-content.js`): this plan → page; the tickets below:

- **Questimus Migration Plan** (type Plan): the migration itself — marked Done in Phase 12
- **HTML renderer** (type Ticket): native rendering of HTML mockups/design files in Questimus, with per-file comments — prerequisite for migrating the design folders later
- **Design-folder migration** (type Plan, future epic): migrate `planning/design/` into Questimus once the renderer exists — **future, out of scope for this migration** (D3: mockups stay in repos for now)
- **Manual cleanup** (type Plan): verify + delete old folders after all batches
- **Issue type UI** (type Ticket): this Plane version has **no type selector/badge in the GUI** (verified — the "issue_type" list column shows the issue key, not the type; the "type switcher" renders the identifier; types are API/DB-only). Add a type selector to the issue modal + a type badge in list/detail — the types come from the §7.6 endpoint. **Implemented in Phase 3 (Karol 2026-09-08).**
- **Home dashboard + My Issues widget** (type Ticket): the home-dashboard components exist but are not routed (dead code) — wire them up so the Home page shows: **My Issues** across projects, the **"Now"** list (assigned to me, urgent/high **OR** due ≤ 7 days) and **"Today"** (due today/overdue) — computed per request (Karol 2026-09-08: the home dashboard replaces the "Now"/"Today" saved views — saved views are AND-only and store fixed dates). **Implemented in Phase 3 (Karol 2026-09-08).**
- **Monetization research** (type Ticket): AGPL-3.0 **allows selling** the fork (that's how Plane itself monetizes Plane Cloud); obligations: fork stays AGPL, source offer to hosted users, no Plane trademarks. Scope (Karol 2026-09-08): audit Plane's paid tiers (**One / Pro / Enterprise** — cloud tiers) feature-by-feature against the self-hosted code — what exists, what would need activation, what's genuinely missing — plus hosting/monetization options for Questimus. (Note: exact tier feature lists from marketing pages need fetching during the research; web fetch was unavailable in this session.)
- **Cycles test** (type Plan): try weekly cycles in Personal (Karol 2026-09-08) — **tested 2026-09-08: not adopted per project** (no cross-project overview); the "Now" home widget is the workspace-wide weekly view (§5.7); a workspace-wide cycle is a future idea ticket

| Phase                                                                                                                                    | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Done when                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0. Decisions**                                                                                                                         | All decision blocks A–F complete (2026-09-08)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | This doc approved                                                                                                                                        |
| **1. Questimus foundation**                                                                                                              | **Backup first** (restore point) → rebuild api (fork change §7.4) + **re-copy management commands** (rebuild wipes `docker compose cp` files) → **Karol's token** (needed by smoke test + all imports) → **hierarchy smoke test** (`smoke-test.js` in the leftover test project) → Karol sign-off → **delete test project** (v1 DELETE — permanent) **+ test bot user** → create 10 projects via `config/setup.json` (identifiers, states, labels) → **issue types (`setup_issue_types` per project — 10×)** → verify (idempotent re-run, UI)                                     | Smoke test PASS, setup idempotent (re-run creates 0), UI looks right (10 projects, states, labels), backup snapshot exists, test project + bot user gone |
| **2. Access & views**                                                                                                                    | Bot users + tokens (§6.2 — incl. personal-project bots; tokens saved to a gitignored local file for Phase 8/9 wiring); **views already created in Phase 1** (64 total: workspace "Next" + per-project In Progress/Done/User reports/Blocked/Planning/Tickets + Personal Inbox/Ideas/Someday — verify by re-run, 0 created); Questimus project content via `create-questimus-content.js` (this plan → page + the 8 tickets)                                                                                                                                                        | Tokens work, views in place, Questimus content live                                                                                                      |
| **3. Questimus dev**                                                                                                                     | Implement the two dev tickets created in Phase 2: **issue type UI** (selector + badge) and **home dashboard + My Issues widget** — **done 2026-09-08** (see §5.7 + §7.11: type badge everywhere + modal selector with default type; My Issues/Now home widgets; both tickets marked Done)                                                                                                                                                                                                                                                                                         | Type selector/badge in UI; Home shows My Issues — **done**                                                                                               |
| **4. Personal** (first batch)                                                                                                            | Ideas.md → issues; **Google Sheets wishlist** (Karol exports the sheet to CSV — File → Download → CSV — then the format is inspected and imported); research notes + hosting-publishing → **ticket bodies** (PERSONAL-12/29/52 — pages created then deleted by Karol 2026-09-08, §5.5); Now.md routed via import-now.js; cycles test ("This week" cycle in Personal — created in the UI — **done 2026-09-08: not adopted per project**, §5.7); **backup restore drill** (restore latest snapshot into a throwaway stack per the backup repo README, verify, tear down — **done**) | Personal live, Now.md retired                                                                                                                            |
| **5. Media Consumerus**                                                                                                                  | BACKLOG table + TODOS sections → issues (estimates, labels), pages (the pm-folder config `media-consumerus-pm` is dropped — O13)                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Counts verified — **done 2026-09-09** (12 issues + 3 pages; two importer fixes, §9.2)                                                                    |
| **6. Arsenal → Empirium** (Kleinanzeigen + POP dropped 2026-09-09 — O13, re-created manually; their projects exist with Karol's tickets) | Vault planning (**tooling built in this phase**: `import-issues.js` gains a `planFiles` list (multiple plan files → Plan issues, incl. `.txt` — the walk only picks `.md`) + `donePlanDirs`/`archivePlanDirs` (each `.md` → Plan issue, state Done); new configs `arsenal-planning.json` + `empirium-planning.json`): active plans + HANDOFF → Plan issues; done/ + archive/ → Plan issues, state Done (O4); artifacts stay in vaults                                                                                                                                             | Counts verified                                                                                                                                          |
| **7. Don Saldo**                                                                                                                         | 2 tickets + bank-import note (move to last batch if it becomes active)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Counts verified                                                                                                                                          |
| **8. Legaliosa** (last — Karol signals pause point)                                                                                      | Full hierarchy: Plan → 11 SP → 38 T → 211 tickets; relations, estimates, design reviews → pages; "Design" index page created in the UI                                                                                                                                                                                                                                                                                                                                                                                                                                            | Counts verified + spot-check                                                                                                                             |
| **9. Jobernaut** (last — Karol signals pause point)                                                                                      | Same pattern from Jobernaut2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Counts verified                                                                                                                                          |
| **10. App integrations**                                                                                                                 | Report-issue module per app (Legaliosa first), bot tokens wired, **user-reports auto-assigned to Karol** (in-app ping), confirmation UX                                                                                                                                                                                                                                                                                                                                                                                                                                           | Real test report lands in Questimus                                                                                                                      |
| **11. LLM skills**                                                                                                                       | Per-project skills in Arsenal, deployed to DSH/Claude Code/etc.; agent tokens wired                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Agent can triage + work + resolve via skill                                                                                                              |
| **12. Wrap-up**                                                                                                                          | This plan → Plan issue in Questimus project (created in Phase 2 by `create-questimus-content.js` — marked Done here); migration-tools stays in the repo (README documents it; `state/` with tokens stays gitignored); manual cleanup task for Karol (verify + delete old folders)                                                                                                                                                                                                                                                                                                 | Everything reachable from Questimus                                                                                                                      |
| **13. (Optional) Public deployment**                                                                                                     | Domain + HTTPS (Caddy: `SITE_ADDRESS` + `CERT_EMAIL`), signup lockdown (`ENABLE_SIGNUP=0`), SMTP if email needed, public URL in app configs                                                                                                                                                                                                                                                                                                                                                                                                                                       | Deployed apps report issues from production                                                                                                              |

**Phase 1 — execution sequence (in order, each step verified before the next; all commands run from `C:\Users\Karol\Projects\Questimus`):**

1. **Backup (restore point):** `powershell -File scripts\backup-data.ps1` (Questimus repo) → confirm a new snapshot in `questimus-data-backup\snapshots\`.
2. **Rebuild api** (fork change §7.4 goes live): `docker compose up -d --build api` → wait until the container answers (`docker compose exec api python -c "import django; print('up')"` succeeds) → verify the fork change: `docker compose exec api python manage.py shell -c "from django.conf import settings; print(settings.DEFAULT_AUTHENTICATION_CLASSES)"` shows `APIKeyAuthentication`.
3. **Re-copy the management commands** (the rebuild wiped them — the container has no bind mounts): `docker compose cp migration-tools/db/setup_issue_types.py api:/code/plane/db/management/commands/` and same for `create_bot_user.py`; then `docker compose exec api rm -f /code/plane/db/management/commands/__pycache__/setup_issue_types*.pyc /code/plane/db/management/commands/__pycache__/create_bot_user*.pyc` (stale bytecode).
4. **Karol's token:** `docker compose exec api python manage.py shell -c "from plane.db.models import User, Workspace, APIToken; u = User.objects.get(email='finalligence@gmail.com'); w = Workspace.objects.get(slug='main'); t = APIToken.objects.create(user=u, workspace=w, label='karol-migration'); print(t.token)"` (token auto-generates with the `plane_api_` prefix; shown once) — or create via UI (Settings → API tokens). Store as `QUESTIMUS_TOKEN` (used by the smoke test, setup, and every import).
5. **Smoke test:** `node smoke-test.js` (needs `QUESTIMUS_TOKEN`) → all checks PASS → Karol sign-off → `node smoke-test.js --delete-project` (hard-deletes the test project).
6. **Delete the test bot user:** `docker compose exec api python manage.py shell -c "from plane.db.models import User; User.objects.filter(email='bot_user_0f6c3a6b-0daf-4794-8d95-b09ff15a4e0f@localhost').delete()"` (it is a **workspace Admin** — leftover from the test setup).
7. **Create the 10 projects:** `node setup-workspace.js --config config/setup.json` (identifiers, states, labels; `network: 0` = secret; short descriptions per project — Karol confirmed). The script **normalizes the auto-created default states** to Karol's set (revised 2026-09-08: `Backlog` + `ToDo`): the project's default state cannot be deleted, so if its name isn't in the wanted set it is renamed to the config's backlog state (Phase 1 ran default Backlog → `Open`; the model change runs `Open` → `Backlog` — the default flag stays, so new issues default to Backlog) — each project ends with exactly Backlog/ToDo/In Progress/Blocked/Cancelled/Done.
8. **Issue types per project:** collect the 10 project ids from the step-7 output ("created project … (id)"), then for each: `docker compose exec api python manage.py setup_issue_types --workspace-slug main --project-id <id>` (idempotent; the workspace-level type UUIDs in `state/types.json` stay valid).
9. **Verify:** re-run step 7 (0 created = idempotent); UI check — 10 projects with the right identifiers, **6 states each**, labels; smoke-test artifacts gone with the test project; backup snapshot exists. Then run `scripts\backup-data.ps1` again — a **post-setup snapshot** (the state we would restore from).

**Phase 2 — execution sequence (in order; commands run from `C:\Users\Karol\Projects\Questimus`):**

1. **Bot users + tokens** (§6.2): for each bot, `docker compose exec api python manage.py create_bot_user --email <bot>@questimus.local --workspace-slug main --project-id <id> --label <bot>-app` (app bots: `legaliosa`, `jobernaut`, `don-saldo`, `media-consumerus`, `kleinanzeigen`, `questimus` — two tokens each: `-app` + `-agent`; personal bots: `personal`, `pop`, `arsenal`, `empirium` — one token each: `-agent`). The command prints each token once — **save all tokens to `migration-tools/state/tokens.json`** (gitignored) for the Phase 8/9 wiring.
2. **Views:** **already created during Phase 1** by `setup-workspace.js` (the script creates views on every run — Phase 1's runs built all 64: workspace "Next" + per-project In Progress/Done/User reports/Blocked/Planning/Tickets + Personal Inbox/Ideas/Someday). Verify by re-running `node setup-workspace.js --config config/setup.json` (report shows 0 created) and checking the sidebar.
3. **Questimus content:** `node create-questimus-content.js --dry-run` → `node create-questimus-content.js` (this plan → page + the 8 tickets).
4. **Verify:** a bot token works on the v1 API (e.g. `GET /api/v1/workspaces/main/projects/` with the bot's `-app` token returns only its project); views appear in the sidebar; the Questimus project shows the plan page + 8 tickets.

---

## 11. Open decisions (recommendations in bold)

| #   | Question                                                                                            | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | Legaliosa **v1** (101 tickets)?                                                                     | **Archive in repo, don't migrate** (Karol 2026-09-08)                                                                                                                                                                                                                                                                                                                                                                                                           |
| O2  | Jobernaut **v1** (PLAN.md, sub-plans, wireframes)?                                                  | **Archive in repo, don't migrate** (Karol 2026-09-08)                                                                                                                                                                                                                                                                                                                                                                                                           |
| O3  | **Jobernaut2** duplicate folder?                                                                    | **Resolved 2026-09-08: Jobernaut2 is now the ACTIVE repo** (j2mainlink removed by Karol); Jobernaut migrates from Jobernaut2                                                                                                                                                                                                                                                                                                                                    |
| O4  | Arsenal/Empirium **vault planning**?                                                                | **All planning files → Plan-type work items** (Karol 2026-09-08 — no pages for plans, consistent with §5.4): active plans keep their status; done/ + archive/ → state Done; Empirium plans → Plan issues (state per status)                                                                                                                                                                                                                                     |
| O5  | **Input Splitter** (done)?                                                                          | **Dropped by Karol** (deleted)                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| O6  | **Personal Operating Profile**?                                                                     | **Own project** (identifier POP) — Karol 2026-09-08                                                                                                                                                                                                                                                                                                                                                                                                             |
| O7  | `hosting-publishing.md` home?                                                                       | **Superseded 2026-09-08: content → ticket body** (Personal ticket "Hosting & Publishing Plan" — PERSONAL-52); pages dropped as a home for standalone docs with sibling issues (§5.5)                                                                                                                                                                                                                                                                            |
| O8  | **Design reviews → pages**?                                                                         | **Yes** — they're decisions; pages + comments are the right home (mockups stay in repo)                                                                                                                                                                                                                                                                                                                                                                         |
| O9  | **Done tickets migrated**?                                                                          | **Yes, all** (D7) — small volume, keeps history                                                                                                                                                                                                                                                                                                                                                                                                                 |
| O10 | **Fork change** (API tokens on main API)?                                                           | **Approved + applied 2026-09-08** (common.py; takes effect on the next api container rebuild)                                                                                                                                                                                                                                                                                                                                                                   |
| O11 | Migration tools location?                                                                           | **`Questimus\migration-tools\`** (built, dry-run verified; gitignored `node_modules`/`state`)                                                                                                                                                                                                                                                                                                                                                                   |
| O12 | **Public deployment timing**?                                                                       | **Local for now** (Karol 2026-09-08). **Legaliosa, Don Saldo, Jobernaut are in active development and need Questimus access from the local machine as soon as the migration lands** — they continuously create/work tickets. So app integrations + bot tokens + LLM skills are sequenced right after the data migration (not deferred). Phase 13 (public URL) only when an app actually goes live                                                               |
| O13 | **pm folders for Legaliosa, Media Consumerus, Kleinanzeigen, POP** (Karol deleted them 2026-09-09)? | **Dropped** — content was re-created manually as tickets in the respective projects before deletion; the configs `legaliosa-pm`, `media-consumerus-pm`, `kleinanzeigen`, `pop` are retired (never run — no state files exist). Remaining migration volume: **551 issues / 27 pages / 120 relations**. The main sources (`Projects\*\planning`, `Wisdomous\Arsenal\planning`, `Wisdomous\Empirium\planning`) are unaffected — those imports still run as planned |

---

## 12. Appendix

### A. API cheat-sheet (verified against the code)

**v1 API — API-token auth (`X-Api-Key: plane_api_<token>`), base `http://localhost:7000/api/v1/`**

```
Projects:  GET  /workspaces/{slug}/projects/            (projects-lite for minimal)
Work items:
           GET  /workspaces/{slug}/projects/{id}/work-items/          (NO filters — the v1 list ignores filter params; only external_id/source lookup + ordering)
           POST /workspaces/{slug}/projects/{id}/work-items/
           GET/PATCH/DELETE /workspaces/{slug}/projects/{id}/work-items/{wid}/
           GET  /workspaces/{slug}/work-items/{project_identifier}-{issue_identifier}/   (e.g. LEG-123)
           GET  /workspaces/{slug}/work-items/search/                 (search=<query>)
           POST .../work-items/{wid}/comments/          (comment_html)
           POST .../work-items/{wid}/attachments/       (multipart: name, type, size)
           POST .../work-items/{wid}/relations/         (relation_type: blocked_by|blocking|duplicate|relates_to|…, issues: [ids])
           POST .../work-items/{wid}/links/              (title, url)
States:    GET/POST /workspaces/{slug}/projects/{id}/states/
Labels:    GET/POST /workspaces/{slug}/projects/{id}/labels/
Modules:   GET/POST /workspaces/{slug}/projects/{id}/modules/  (+ module-issues)  (exists, unused — modules dropped from the target model)
Estimates: GET/POST /workspaces/{slug}/projects/{id}/estimates/   (NOT a list: single object, 404 if none; POST → 409 if one already exists)
           GET/POST .../estimates/{id}/estimate-points/            (plain array; POST is a BULK create — send a list)
Intake:    GET/POST /workspaces/{slug}/projects/{id}/intake-issues/
```

**Create work-item payload (verified in the v1 serializer):** `name`, `description_html` (HTML — the import tool converts markdown, e.g. `marked`/`markdown-it`; content is sanitized server-side), `priority` (urgent|high|medium|low), `state` (state UUID — **NOT `state_id`**), `labels` (label IDs), `assignees` (must be project members with role ≥ 15), `parent`, `type_id`, `estimate_point`, `start_date`/`target_date`, `created_at` (preservable), `external_source`/`external_id` (idempotency + traceability).

**Main API — session auth by default; API tokens work after the fork change (§7.4), base `http://localhost:7000/api/`**

```
Issues:    GET /workspaces/{slug}/projects/{id}/issues/   (list WITH filters: state, labels, assignees, priority, target_date, issue_type — the main API list applies the filterset + legacy filters; token works after §7.4)
Pages:     GET/POST /workspaces/{slug}/projects/{id}/pages/   (+ detail, archive, lock, access, description, versions, duplicate)
Views:     GET/POST /workspaces/{slug}/views/   (workspace views) · /workspaces/{slug}/projects/{id}/views/ (project views)
Tokens:    POST /api/users/api-tokens/   (label, description, expired_at — creates the caller's own token; session auth)
```

**Token notes (verified):** the api-tokens endpoint only manages the caller's own non-service tokens (`is_service=False`); bot tokens created via management command with `is_service=True` are valid for auth but hidden from the UI. Token prefix `plane_api_`.

### B. File → Questimus mapping (quick reference)

| Source                                          | Target                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `T-XX-*.md` (task units)                        | Issue type Plan, parent = its SP issue, relations from `depends-on` |
| `tickets/done/*.md`                             | Issue, state Done                                                   |
| `SP-XX-*.md`                                    | Issue type Plan, parent = the Plan issue                            |
| `plan.md` / `PLAN.md`                           | Issue type Plan (root of the hierarchy)                             |
| `HANDOFF.md`, `pilot-findings.md`               | Pages                                                               |
| `design/reviews/*.md`, `design-system-delta.md` | Pages "Design decisions"                                            |
| `design/**/*.html` (mockups)                    | Stay in repo; linked from "Design" page                             |
| `Ideas.md` items                                | Personal issues, label `idea`                                       |
| `Now.md` items                                  | Routed per entry to its project via `import-now.js`                 |
| `BACKLOG.md` / `TODOS.md` rows                  | Issues (priority/estimate mapped)                                   |
| `Conversation History.md`                       | Dropped — one ongoing task in Personal                              |

### C. Bot user creation (management command sketch)

```python
# apps/api/plane/manage.py shell — or a proper management command
from plane.db.models import User, Workspace, WorkspaceMember, ProjectMember, APIToken
import secrets

def create_bot(ws, project, email, label):
    user, _ = User.objects.get_or_create(email=email, defaults={
        "password": secrets.token_urlsafe(24), "is_email_verified": True,
        "is_bot": True, "is_active": True,
    })
    WorkspaceMember.objects.get_or_create(workspace=ws, member=user, defaults={"role": 5})   # Guest
    ProjectMember.objects.get_or_create(project=project, member=user, defaults={"role": 15}) # Member
    token = APIToken.objects.create(user=user, workspace=ws, label=label, is_service=True)
    return token.token  # store in the app's secrets / harness env
```

Note: `is_service=True` tokens are valid for `X-Api-Key` auth but hidden from the user's token list in the UI (the api-tokens endpoint filters `is_service=False`) — exactly what we want for bot tokens. Karol's own token is created via the UI or `POST /api/users/api-tokens/`. Roles (verified in the model): **20=Admin, 15=Member, 5=Guest** — the sketch's Guest/Member roles are correct.

### D. Risks & mitigations

| Risk                                              | Mitigation                                                                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Importer bugs corrupt data                        | Dry-run + Phase 1 smoke test + fresh backup before each wave; idempotent by external_source/id                                          |
| Token leak                                        | Least-privilege bots, separate app/agent tokens, rotation procedure, secrets never in repos                                             |
| Local-only deployment blocks production reporting | Phase 13 (public URL) before first app goes live                                                                                        |
| Pages unreachable for LLMs                        | Fork change (§7.4) — 1 line; fallback: session login in tools, plan docs stay repo-readable                                             |
| Dual maintenance (repo vs Questimus)              | Clear rule: **content lives in Questimus; repos keep only code + design source**; old folders stay untouched, manual cleanup task (§10) |
