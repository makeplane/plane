---
title: "Help Center In-App (Trung tam tro giup) - Shinhan Workspace"
description: "In-app, multilingual (VI/EN/KO), staff-authored help center for Shinhan Workspace"
status: done
priority: P2
branch: "duonglx/feat/help-center"
tags: [help-center, documentation, i18n, ce]
blockedBy: []
blocks: []
created: "2026-05-29T07:37:18.773Z"
createdBy: "ck:plan"
source: skill
---

# Help Center In-App (Trung tam tro giup) - Shinhan Workspace

## Overview

In-app help center so SHBVN staff self-serve: search, browse by function category, read
feature guides — all inside the web app, in the user's UI language (VI/EN/KO). Content is
authored by non-technical staff/BA with the existing Tiptap WYSIWYG, stored in dedicated
Help Center tables (not project Pages). Implemented in the CE layer (`apps/web/ce/`, `apps/api`),
which **minimizes** core touches: the PowerK static command + sidebar Help-menu item are
**required, isolated core edits** (no CE seam exists for top-level commands) — feature logic stays in `ce/`.

## Locked Decisions (user-confirmed — do NOT silently reverse)

1. **Approach B** — dedicated in-app Help Center route `/:workspaceSlug/help`, full build (no MVP cut).
2. **Multilingual VI/EN/KO**, content follows the user's current UI locale with fallback.
3. **Authors = non-technical staff/BA** via Tiptap WYSIWYG (`RichTextEditor`), no markdown/git.
4. **Content storage = dedicated Help Center tables** (HelpCategory/HelpArticle + per-locale
   translations holding `description_html/json/stripped`). NOT Plane Pages (Pages are
   project-scoped only in this fork; dedicated tables = clean multilingual + search + self-contained).

### User Decisions — Validation Session 2 (2026-05-29 — do NOT reverse)

| ID  | Decision                                        | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **ADMIN-only authoring is DELIBERATE**          | Authoring = Workspace Admin only. This is a conscious product decision (C3), NOT a side-effect of security finding #1. Fork has exactly 3 roles: Admin=20 / Member=15 / Guest=5 (no intermediate or custom roles).                                                                                                                                                                                                                                              |
| D2  | **NO custom-vs-stock distinction**              | Everything is ONE unified platform: "Shinhan Workspace". NO `is_custom` field, NO badge, NO reserved category. Use "Shinhan Workspace" in all user-facing help text (not "Plane").                                                                                                                                                                                                                                                                              |
| D3  | **Greenfield content only**                     | No bulk import of existing docs. Content is net-new, authored in the new UI.                                                                                                                                                                                                                                                                                                                                                                                    |
| D4  | **Full UX recommendation set**                  | Apply the complete UX set: fixed toolbar, preview, accent-folded VI search (app-managed — prod DB has no `unaccent` extension), in-article TOC, prominent top-level sidebar Help nav entry, visual icon picker, copy-between-locales, prev/next + related articles.                                                                                                                                                                                             |
| D5  | **NO Cmd+K Help search; all lookup in `/help`** | Drop the Cmd+K search-results help group (supersedes D4's UX g3). Cmd+K keeps ONLY the open-Help-Center command. ALL help lookup happens in the in-page `/help` search box, which MUST support **multilingual search (matches content across all 3 locales VI/EN/KO)** AND **Vietnamese accent-insensitive search** (folded `search_text` column + folded query term). `searchWorkspace()` / `IWorkspaceSearchResults` are NOT modified — keeps core untouched. |

### User Decisions — Validation Session 3 (2026-05-30 — MAJOR PIVOT, do NOT reverse)

| ID  | Decision                                    | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D6  | **Help Center is INSTANCE-GLOBAL / SHARED** | Bank runs ~100 workspaces (one per department). The Help Center is ONE shared platform user guide visible by default in EVERY workspace — NOT per-workspace content. **Reverses Locked Decision #4's workspace-scoping and supersedes D1.** READ = any authenticated user in any workspace (global published content). WRITE/authoring = **God Mode / Instance Admin only** (not workspace admin). Authoring UI moves to `apps/admin` (God Mode, English-only chrome; content still VI/EN/KO). Models DROP the `workspace` FK; slug is globally unique. Backend split: read = `plane/app/` (`IsAuthenticated`, global), write = `plane/license/api/` (`InstanceAdminPermission`). Image assets need a non-workspace strategy (TBD from scout). |

**Impact on phases:** P1 (models+migration) and P2 (API) rewritten for global + God-Mode-write; P4 (FE read service/store) adjusted to global routes; P3 (i18n) unaffected; P5 (reading UI) stays in `apps/web` but fetches global data; **P6 (authoring UI) moves from `apps/web/ce` to `apps/admin` God Mode**. The workspace-scoped code committed in commits `e1584e83`/`5545e0d2` is the pre-pivot baseline and is being reworked on this same branch.

**P5 done (2026-05-30):** Reading UI built in `apps/web` against the global API; reconciled with D6
(workspace-prefixed route for the shell, global slug-less data, `IsAuthenticated`, **no Manage button**
— authoring is admin/God-Mode in P6). Deep-link decision: **by slug** → added read endpoint
`GET /api/help/articles/slug/<slug>/` (`retrieve_by_slug`, reuses the published+has-title queryset).
tsc + eslint clean; code-review passed. Remaining manual/e2e QA (image render with `projectId=undefined`,
light/dark, locale-switch) folded into P8.

### User Decisions — Validation Session 4 (2026-05-30 — D7 standalone route, do NOT reverse)

| ID  | Decision                                          | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D7  | **Help Center is a STANDALONE top-level `/help`** | The reader moves from workspace-prefixed `/:workspaceSlug/help` to a **standalone top-level `/help`** (+ `/help/a/:articleSlug`), NO workspace context — matching the instance-global data model (a workspace-prefixed URL falsely implied per-workspace content). Auth-gated (logged-in), NOT public. Lives at `apps/web/app/(all)/help/*` under the `(all)` auth layout, OUTSIDE `[workspaceSlug]` (precedent: `/settings/profile`, `/create-workspace`). **Must NOT be a bare shell** — carries a lightweight "Back to {workspace}" affordance (red-team HIGH). Backend unchanged (read API already global). |

**Validation:** GO — see `plans/reports/validation-260530-1124-standalone-help-route-d7-report.md` (7-agent workflow: feasibility + red-team, evidence-grounded). Backend = zero change; FE = small-medium.

**Auth boundary LOCKED (2026-05-30, user-confirmed — do NOT reverse):** `/help` is visible to **ALL authenticated users**, regardless of workspace membership; content stays behind login (**NOT public/anonymous** — it is internal SHBVN staff documentation). Read API stays `IsAuthenticated`; route under the `(all)` auth gate. **Discovery is GLOBAL** — the entry doors (help "?" menu, Cmd+K) are visible to every logged-in user and push `/help` with NO `workspaceSlug` gating (resolves D-4 → global, not workspace-gated). Rationale: help is instance-level, not tied to any workspace; a short shareable `/help` URL.

**Remaining impl-level decisions (defaults recommended, confirm at D7 impl):** D-1 back affordance — keep a graceful "Back to {last workspace}" link (red-team HIGH: not a bare shell), falls back to home/create-workspace if user has no workspace; D-2 help images via public AllowAny static endpoint (recommended, UUIDv4-unguessable, parity with avatars) vs IsAuthenticated for text-parity (P6 detail); D-3 add legacy `/{slug}/help → /help` redirect (recommended yes); D-5 reserve `help` in `RESTRICTED_URLS` (recommended yes).

**Impact on phases (D7):** **P5** reading UI moves to standalone `/help` — drop the `workspaceId` guard in `help-content-renderer.tsx`, new `(all)/help/{layout,page,article}.tsx` shell with back-affordance, links → `/help/...`; renders text + global-URL images WITHOUT blocking on P6. **P7** entry-point targets change `/${workspaceSlug}/help` → `/help`; reserve slug; optional redirect. **P6** authoring must produce **global** image URLs (`HELP_ARTICLE_CONTENT` FileAsset → public `/api/assets/v2/static/{id}/` + `is_deleted` 404 guard) so images render in the workspace-less reader. **P8** add: standalone-route render, nh3 `rel` (anti-tabnabbing) test, image-render-without-workspace. Backend read API/models/slug endpoint UNCHANGED.

### User Decisions — Validation Session 5 (2026-05-30 — D8 standalone shell header identity, do NOT reverse)

| ID  | Decision                                                          | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D8  | **Standalone `/help` header carries product identity + the signed-in user** | The standalone shell top bar (D7) MUST make two things obvious on every page (home AND article deep-links): (1) **which system** the help belongs to, and (2) **who is signed in**. Layout = single 52px row, 3 zones: **left** = Shinhan Bank logo (`@/app/assets/logos/shinhan-bank-logo.svg?url`, same asset as auth screens) + divider + `t("help_center.breadcrumb_home")` label, whole block links to `/help`; **center** = breadcrumb (append `› {article.title}` on article pages); **right** = "Back to app" link + a **user avatar dropdown** (avatar + full name + email + **Sign out**). **Brand, NOT a workspace switcher** — `/help` is instance-global/shared (D6) and auth-gates users who may belong to NO workspace (D7), so a single workspace's logo/name would mislead (help is shared, not per-ws) and break for no-workspace users. **Supersedes D7's "optional workspace switcher"** (`ProfileSettingsSidebarWorkspaceOptions` is NOT used). Avatar menu reuses the sidebar account pattern (`Avatar`/`CustomMenu`/`useUser().signOut()` — all workspace-independent, safe on `/help`). |

**Impact on phases (D8):** **P5** header gains a left brand block (logo + label → `/help`) and a right-side user avatar menu extracted into a new CE component `help-center-user-menu.tsx` (<150 LOC); `help-center-header.tsx` becomes a 3-zone composition. New i18n key `help_center.account_menu_label` (aria) in en/vi/ko; reuses `help_center.breadcrumb_home`, `help_center.back_to_app`, top-level `sign_out`(+`.toast.error.*`). No backend change. A "Settings/Preferences" item is intentionally NOT added (profile-settings modal is not mounted in the `/help` layout).

### User Decisions — Validation Session 6 (2026-06-01 — D9 God Mode export/import bundle UI)

| ID  | Decision                                                       | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D9  | **Per-environment guide lifecycle + God Mode export/import UI** | Each environment (dev/UAT/prod) is seeded ONCE, then edited **independently** in God Mode (rows in that env's DB, images in its MinIO) — never a shared live DB. Promotion is manual: **export a `.zip` bundle, copy it across, import it.** Surfaced as **God Mode → Help Center** buttons (Export bundle ⬇ / Import bundle ⬆ behind an overwrite confirm), backed by `plane/license` endpoints (`GET /help/export/` → zip, `POST /help/import/` → `{categories,articles,images}`, InstanceAdmin-gated) over a shared `transfer.py` core reused by the existing CLI commands. Import = additive upsert-by-slug (overwrites matching slugs, never deletes), re-sanitizes HTML, content-type allowlist, uploads images to the target's MinIO + rewrites `/static/<id>/` refs (HTML + editor JSON). A one-time **seed guard** protects God-Mode edits from re-seed. **Proxy body limit = route-scoped (user-confirmed over global-bump / CLI-only):** `/api/instances/help/import/` raised to `HELP_BUNDLE_MAX_SIZE` (default 300MB) in the bundled Caddyfiles so a real (~tens-of-MB) bundle does not 413; every other route stays at `FILE_SIZE_LIMIT` (5MB). API caps the bundle at 256MB. |

**Impact on phases (D9):** new **P10** (God Mode export/import UI + endpoints). No change to P1–P9 read/author behavior — reuses P6's `HELP_ARTICLE_CONTENT` asset model + P1/P2 models. Backend refactor extracts the previously CLI-only export/import into `plane/db/fixtures/help_center/transfer.py`; the CLI commands (`export_help_center`/`import_help_center`) and `loader.py` become thin wrappers over it (behavior preserved; the existing CLI tests + 7 new endpoint guard tests are green). Adversarial review (4 lenses: security / refactor-parity / FE-contract / completeness) found 0 critical/high.

## Phases

| Phase | Name                                                                         | Priority | Effort | Status                                              |
| ----- | ---------------------------------------------------------------------------- | -------- | ------ | --------------------------------------------------- |
| 1     | [Backend Data Model](./phase-01-backend-data-model.md)                       | P1       | 1.5d   | Done (impl; live-migrate pending)                   |
| 2     | [Backend API and Search](./phase-02-backend-api-and-search.md)               | P1       | 2d     | Done (impl; live-DB tests in P8)                    |
| 3     | [i18n Keys](./phase-03-i18n-keys.md)                                         | P2       | 0.5d   | Done (47 keys × vi/en/ko; KO review)                |
| 4     | [Frontend Store and Services](./phase-04-frontend-store-and-services.md)     | P1       | 1d     | Done (tsc + lint clean)                             |
| 5     | [Reading UI](./phase-05-reading-ui.md)                                       | P1       | 3d     | Done — standalone `/help` (D7), verified live       |
| 6     | [Authoring UI](./phase-06-authoring-ui.md)                                   | P1       | 3.5d   | Done — God Mode authoring in apps/admin + global image assets (D7) |
| 7     | [Discovery and Contextual Help](./phase-07-discovery-and-contextual-help.md) | P2       | 1d     | Done — entry points → `/help` (D7), verified live   |
| 8     | [Testing](./phase-08-testing.md)                                             | P1       | 2d     | Done — 51 backend tests green; FE/e2e = manual QA   |
| 9     | [Documentation](./phase-09-documentation.md)                                 | P3       | 0.5d   | Done — docs updated + VI authoring guide + seed cmd  |
| 10    | [God Mode Export/Import UI](./phase-10-god-mode-export-import-ui.md)          | P1       | 1d     | Done — license endpoints + admin buttons + route-scoped proxy; 121 backend tests green (D9) |

**Estimated effort: ~15 dev-days** (full UX scope per D4; Cmd+K backend search dropped per D5). Original baseline was ~11d; the +4d covers fixed toolbar + live preview + visual icon picker + copy-between-locales (P6), in-article TOC + prev/next + related (P5), accent-folded multilingual search (P1/P2), and the matching tests (P8).

## Dependency Graph

```
01 ──> 02 ──> 04 ──┬─> 05 ──> 07 ──┐
03 ────────────────┴─> 06 ─────────┼─> 08 ──> 09 ──> 10 (D9, follow-on)
```

- P1 → P2 → P4 (backend before FE store).
- P3 (i18n) is independent, must land before P5/P6 UI.
- P5 + P6 depend on P4 (+ P3). P7 depends on P5/P6.
- P8 (tests) depends on all impl phases. P9 (docs) last.
- P10 (export/import UI, D9) is a follow-on: reuses P2 models + P6's `HELP_ARTICLE_CONTENT` asset model; landed after the core feature shipped.

## Key References

- **AUTHORITATIVE global design (D6 pivot):** `plans/reports/from-scout-to-cook-help-center-global-redesign-report.md`
  — three-layer split (read=`plane/app` `IsAuthenticated` global; write=`plane/license/api` God Mode; authoring UI=`apps/admin`),
  models drop workspace FK, asset strategy. **Where phase-01/02/04/06 (workspace-scoped) conflict, D6 + this report win.**
- Scout findings: project-scoped Pages only, no workspace wiki; `Page` model
  `apps/api/plane/db/models/page.py`; app label `db`. **Do NOT hardcode the migration number** —
  branch from `develop` and number relative to the then-current tail (`0168` was measured on the docs branch).
- CE route: add to `apps/web/app/routes/extended.ts`; mirror the `ho` route at `core.ts:108-111`.
  Aliases: `@/*`→core, `@/plane-web/*`→`ce/*`.
- Read-only render: use the **web wrapper** `RichTextEditor` imported from `"@/components/editor/rich-text"`
  (NOT the bare `@plane/editor` export which is `RichTextEditorWithRef` only; NOT `DocumentEditor` —
  DocumentEditor is collaborative/Hocuspocus-backed, heavier than needed here; both wrappers fall back
  to the workspace asset URL so `projectId` is not the reason to avoid it — weight is).
  Props: `workspaceSlug` (string) + `workspaceId` (resolve via `useWorkspace().getWorkspaceBySlug(slug)?.id`,
  guard render until non-null) + `projectId={undefined}` + `editable={false}`.
  Precedent: `core/description-versions/modal.tsx:127-138` (guard at `:76`; workspaceId resolve at `:58-61`).
  Asset URL workspace fallback: `packages/utils/src/editor/common.ts:23-27`.
  `isJSONContentEmpty(json) ? html : json` applies to the **author load path only** (never `json || html` — `{}` is truthy).
- Search: `icontains` via DRF `SearchFilter` on the list endpoint (NO pg_trgm — prod `plane_app` lacks
  CREATE EXTENSION; the fork uses icontains everywhere).
- Permissions: writes → `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` (codebase-native);
  reads → `WorkspaceUserPermission`. NOT `WorkSpaceAdminPermission` (that allows Members too).
  Precedent: `apps/api/plane/app/views/webhook/base.py:21,38`. ROLE enum: `apps/api/plane/app/permissions/base.py:14-16`.
  Do NOT cite `page/base.py:475,485` — that is `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` at PROJECT level (both roles, wrong level).
- PowerK: `apps/web/core/components/power-k/config/help-commands.ts` (group `"help"`).
  **Cmd+K hosts ONLY the open-Help-Center command** (static, CE-clean, routes to `/:workspaceSlug/help`).
  **NO Help search-results group in Cmd+K** (D5): all help lookup happens in the in-page `/help` search
  box (Phase 5). This deliberately AVOIDS touching `searchWorkspace()` / `IWorkspaceSearchResults` —
  keeping the global Cmd+K search backend untouched.
  Sidebar Help dropdown (insertion point): `apps/web/core/components/workspace/sidebar/help-section/root.tsx:24-61`.
- Locale at runtime: `useTranslation().currentLocale` (`@plane/i18n`).
- Permissions: `useUserPermissions().allowPermissions([EUserPermissions.ADMIN], WORKSPACE, slug)`.
- CE root store: `apps/web/ce/store/root.store.ts`.

## Conventions

- CE-first. Sanctioned `core/` edits (explicit, reviewed — no others):
  (a) PowerK static "Help Center" command — `power-k/config/help-commands.ts` (open route, CE-clean).
  (b) Sidebar Help dropdown internal item — `workspace/sidebar/help-section/root.tsx:24-61` (≤ a few lines).
  (c) Prominent top-level sidebar Help nav entry (D4 / UX g10) — one nav-item in the core sidebar structure.
  (d) ≤ 3 `HelpHint` contextual placements in existing core views (inline, isolated).
  NO Cmd+K Help search-results group (D5) — `searchWorkspace()` / `IWorkspaceSearchResults` are NOT
  touched; help search is in-page only. Everything else lives in `ce/`. Files <200 LOC (<150 components),
  kebab-case, YAGNI/KISS/DRY.
- No plan/phase refs in code, comments, or migration filenames — explain the "why" self-contained.
- Branch the feature from `develop` (NOT the current docs branch): `duonglx/feat/help-center`
  → develop (PR) → preview (PR). Use `/git`.

## UI/UX Inheritance (Plane platform — applies to ALL UI phases 5/6/7)

The shell/editor/sidebar wiring already mirrors Plane correctly. These rules close the **presentation**
gap so the Help Center looks native, not bolted-on. **MUST follow in every Help Center component.**

### 1. Semantic design tokens — MANDATORY (biggest inheritance lever)

This fork uses semantic CSS-variable tokens (Tailwind v4), defined in
`packages/tailwind-config/variables.css`. Real usage example: `apps/web/core/components/api-token/empty-state.tsx`
(`border-subtle bg-surface-2 text-tertiary`). **Use these everywhere; NEVER hardcode colors**
(`bg-gray-*`, `bg-white`, `text-black`, `#hex`):

- Text: `text-primary` / `text-secondary` / `text-tertiary`; icons `text-icon-primary`.
- Surfaces: `bg-canvas` (page), `bg-surface-1` / `bg-surface-2` (containers/cards), `bg-layer-2` (inputs).
- Borders: `border-subtle` / `border-strong`.
- Brand/action: use the Propel component variant props (do NOT re-skin with raw colors).

### 2. Dark mode — free, but must be verified

Dark mode is driven by `[data-theme*="dark"]` + the CSS variables above — **semantic tokens auto-adapt,
no `dark:` Tailwind variants needed**. Do not read theme state programmatically (no `useTheme()`).
`observer()` is required for **locale** reactivity (Finding 14), NOT for theme. **Phase 8 must click
through light + dark.**

### 3. Reuse standard components — do NOT hand-roll chrome

| Need                     | Use (import)                                                                | Notes / precedent                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breadcrumb               | `Breadcrumbs` from `@plane/ui`                                              | composite (responsive collapse, icon/label, tooltip); usage `stickies/header.tsx:31-40`. Replaces hand-rolled `help-breadcrumb.tsx`.                                      |
| Empty / no-content state | `EmptyStateCompact` / `EmptyStateDetailed` from `@plane/propel/empty-state` | Compact = inline (no categories/articles); Detailed = full-page (article unavailable in locale). Replaces `help-center-empty-state.tsx` / `help-content-unavailable.tsx`. |
| Locale tabs (VI/EN/KO)   | `Tabs` from `@plane/propel/tabs`                                            | `Tabs.Root/List/Trigger/Content` — a11y + keyboard nav free. Wrap `translation-tabs.tsx` + category-form locale tabs.                                                     |
| Card (category grid)     | `Card` from `@plane/propel/card`                                            | `variant=WITH_SHADOW`, `spacing=LG` + `onClick`. Replaces bespoke `category-card.tsx` styling.                                                                            |
| Button                   | `Button` from `@plane/propel/button`                                        | CLAUDE.md: prefer Propel over `@plane/ui`. variants primary/secondary/ghost/error.                                                                                        |
| Text input / slug field  | `Input` from `@plane/propel/input`                                          | `bg-layer-2`.                                                                                                                                                             |
| Loading                  | `Spinner` from `@plane/propel/spinners`                                     | article fetch, search debounce.                                                                                                                                           |
| Dialog (delete confirm)  | `Dialog` from `@plane/propel/dialog`                                        | already specified (Phase 6) — uses `onOpenChange`.                                                                                                                        |
| Toast                    | `setToast` / `TOAST_TYPE` from `@plane/propel/toast`                        | already specified (Phase 6).                                                                                                                                              |
| Icon picker              | Propel `EmojiIconPicker` (`iconType="lucide"`)                              | already specified (Phase 6 / g12).                                                                                                                                        |
| Rich content             | web wrapper `RichTextEditor` (`@/components/editor/rich-text`)              | already specified (Phase 5/6).                                                                                                                                            |

> Verify exact subpath export at implementation; fall back to the `@plane/propel` barrel if a subpath is not published.

### 4. Page framing (header + breadcrumb placement)

Standard workspace pages (Stickies/Time-tracking) put the breadcrumb in a **header component passed to
`AppHeader`**, not inside the page body. So: build `HelpCenterHeader` (renders `<Breadcrumbs>`) in
`layout.tsx` → `<AppHeader header={<HelpCenterHeader/>} />`. Precedent: `stickies/layout.tsx:8-15` +
`stickies/header.tsx:28-40`. (The `ho` route omits breadcrumbs — that is the atypical case; follow Stickies.)

### 5. Responsive + a11y baseline

- Category grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; search box full-width; test 375/768/1440.
- Search box wrapped as a search landmark; breadcrumb `aria-label="breadcrumb"`; TOC active link
  `aria-current="page"`; category cards are real `<button>`/`<a>` with accessible names.
- Reusing Propel/UI primitives gives focus-visible + keyboard nav + WCAG-AA contrast for free.

## Red Team Review

### Session — 2026-05-29

**Findings:** 16 accepted (0 rejected of accepted set; 1 sub-claim rejected — see note). **Scope cuts: none** (user confirmed FULL BUILD).
**Severity breakdown:** 6 Critical, 7 High, 3 Medium. Reviewers: Security Adversary, Failure Mode Analyst, Assumption Destroyer, Scope & Complexity Critic (all evidence-backed `file:line`).

| #   | Finding                                                                                          | Severity | Disposition | Applied To          |
| --- | ------------------------------------------------------------------------------------------------ | -------- | ----------- | ------------------- |
| 1   | `WorkSpaceAdminPermission` authorizes Members → use `@allow_permission([ROLE.ADMIN], WORKSPACE)` | Critical | Accept      | Phase 2             |
| 2   | Stored-XSS via `style` attr + unsanitized `description_json` render path                         | Critical | Accept      | Phase 1, 2, 5       |
| 3   | pg_trgm migration fails in prod (`plane_app` not superuser) → drop trigram, use icontains        | Critical | Accept      | Phase 1, 2, 8       |
| 4   | `DocumentEditor` project-scoped → use `RichTextEditor editable={false}`                          | Critical | Accept      | Phase 5, 6          |
| 5   | "Never modify core" false — PowerK + sidebar are required core edits                             | Critical | Accept      | plan.md, Phase 7    |
| 6   | `t("core.help_center")` renders raw key (flat merge) → `t("help_center")`                        | Critical | Accept      | Phase 3, 7          |
| 7   | Draft leak to members via queryset/search/`available_locales` → filter in `get_queryset()`       | High     | Accept      | Phase 2             |
| 8   | Cross-workspace IDOR in custom actions → `get_object()`/scoped queryset everywhere               | High     | Accept      | Phase 2             |
| 9   | `json \|\| html` truthy-`{}` bug → `isJSONContentEmpty()`                                        | High     | Accept      | Phase 5             |
| 10  | `description_stripped` staleness + wrong import path + missing empty-guard                       | High     | Accept      | Phase 1, 2          |
| 11  | Slug gen failure path + Vietnamese diacritics + no FE slugify → server-side slug                 | High     | Accept      | Phase 1, 2, 6       |
| 12  | Reorder endpoints over-built + `sort_order` race → reuse `partial_update` + increment-on-create  | High     | Accept      | Phase 1, 2, 4, 6    |
| 13  | Published article with 0 translations → publish invariant + empty-state                          | High     | Accept      | Phase 1, 2, 5       |
| 14  | i18n: tsc can't catch missing keys; locale switch needs `observer()`                             | High     | Accept      | Phase 3, 5          |
| 15  | Don't hardcode migration `0169`; branch from develop; pin FE↔BE contract (`?locale=`, `help.py`) | Medium   | Accept      | plan.md, Phase 2, 4 |
| 16  | `BaseModel` has no `deleted_at` (via `AuditModel`); SPA slug-reuse + stale-locale fetch          | Medium   | Accept      | Phase 1, 5          |

**Rejected sub-claim:** Scope-critic's "trust nh3 verbatim, trim XSS tests" — REJECTED; Findings 2 prove nh3's
default config (allows `style`) + the `description_json` path are insufficient for broadcast content.
Keep hardened sanitization + JSON-path XSS tests.

**Kept (verified sound, no change):** 4-table translation schema (not over-modeled), `ho`-route mirror,
VI/EN/KO, `allowPermissions` FE gate, CE root-store registration, alias map.

### Whole-Plan Consistency Sweep

Re-read `plan.md` + all 9 phase files after applying findings; grepped for superseded terms. Decision deltas reconciled across the whole plan:

- **trigram/pg_trgm → icontains** — no `TrigramExtension`/`gin_trgm`/search-endpoint remains as a deliverable (only "do NOT use" warnings).
- **reorder endpoints → `partial_update(sort_order)`** — removed from Phase 2 URLs/views, Phase 4 service, Phase 6 UI; reorder via `updateLabelPosition` pattern.
- **`HelpSearchEndpoint` / `/help/search/` → list `?search=`** — removed everywhere; help search is the in-page `/help` box on the list endpoint. (Superseded by D5: Phase 7 has NO Cmd+K help search at all — Cmd+K is command-only.)
- **`DocumentEditor` → `RichTextEditor editable={false}`** — Phase 5 + plan.md updated; cite at time was `version/editor.tsx:92-104` (subsequently corrected in Session 2 to `description-versions/modal.tsx:127-138`).
- **`json || html` → `isJSONContentEmpty()`**; **`t("core.help_center")` → `t("help_center.menu_label")`**; **`WorkSpaceAdminPermission` → `@allow_permission([ROLE.ADMIN])`** — reconciled in all referencing phases.
- **migration `0169` not hardcoded** — Phase 1 Related Files + Success Criteria + steps use `NNNN`; branch from develop.
- **"never modify core" → 2 sanctioned core edits** (PowerK command + sidebar) — plan.md Conventions + Phase 7 aligned.

**Result: zero unresolved contradictions.** Plan is internally consistent and ready for implementation.

## Validation Log

### Session 1 — 2026-05-29

Verification pass SKIPPED per guard (Red Team Review above already verified claims with `file:line`).
4 critical-decision questions asked; all answered (recommended options):

| #   | Decision                        | Choice                                                                                                                               | Propagated to    |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 1   | `description_json` + reader XSS | Store html+json; **reader renders sanitized `description_html` ONLY** (json never trusted on read; kept for author edit fidelity)    | Phase 2, 5, 6, 8 |
| 2   | Inline CSS `style` attribute    | **Drop `style` entirely** from the help HTML allowlist                                                                               | Phase 2, 8       |
| 3   | Slug after soft-delete          | **Globally unique slug** per workspace (constraint NOT conditioned on `deleted_at`); deleted slugs never reused; old links 404 clean | Phase 1, 5       |
| 4   | Authoring image upload          | **Reuse `FileService.uploadWorkspaceAsset`** → `/api/assets/v2/workspaces/<slug>/` (`file.service.ts:72`, `urls/asset.py:50`)        | Phase 6          |

**Combined security effect (decisions 1+2):** the entire stored-XSS surface is closed at the read path —
readers only ever see nh3-sanitized HTML with `style` stripped; the JSON path is never rendered to them.

### Whole-Plan Consistency Sweep (post-validation)

Re-read all files after propagation. Reconciled: Phase 5 reader content-pick (html-only, dropped the
`isJSONContentEmpty` read-path pick → moved to Phase 6 author-load), Phase 1 slug constraint (global
unique + collision count incl. soft-deleted), Phase 2 sanitize bullet + security note + success criteria
(json not read-rendered), Phase 8 XSS test (assert reader uses html only), Phase 6 editor (asset endpoint

- fidelity load). **Zero unresolved contradictions.** Plan ready for implementation.

### Session 2 — 2026-05-29

**Verdict: ready-with-fixes.** 6 factual code-reference corrections applied across phases; 5 user decisions recorded; sanctioned core-edit list = 4 categories (Cmd+K Help search DROPPED per D5).

**Factual corrections applied:**

| #   | Correction                         | Old (wrong)                                                  | New (correct)                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Editor import path                 | `@plane/editor` bare export (`RichTextEditor`)               | Web wrapper `"@/components/editor/rich-text"` (only `RichTextEditorWithRef` exported from `@plane/editor:8-13`)                                                                                                                                                                                                          |
| 2   | Read-only component props          | implied no `workspaceId` guard needed                        | Must resolve `workspaceId` via `useWorkspace().getWorkspaceBySlug(slug)?.id` and guard render until non-null; precedent `modal.tsx:127-138`                                                                                                                                                                              |
| 3   | Read-only ref                      | `version/editor.tsx:92-104` (DocumentEditor, project-scoped) | `description-versions/modal.tsx:127-138` (RichTextEditor web wrapper, correct)                                                                                                                                                                                                                                           |
| 4   | DocumentEditor avoidance rationale | "projectId undefined breaks asset URLs"                      | Correct: collaborative/Hocuspocus weight (both wrappers fall back to workspace asset URL via `common.ts:23-27`)                                                                                                                                                                                                          |
| 5   | Permission precedent               | `page/base.py:475,485` (PROJECT-level, ADMIN+MEMBER)         | `webhook/base.py:21,38` (WORKSPACE-level, ADMIN-only); ROLE enum `permissions/base.py:14-16`                                                                                                                                                                                                                             |
| 6   | Cmd+K search results               | claimed CE-clean / reuses list `?search=`                    | FALSE: CE seam (`search-results-map.tsx:12-14`) is presentation-only (`types=never`); a real Cmd+K help group would need a core+API change to `searchWorkspace()` + `IWorkspaceSearchResults`. **Resolved by D5: Cmd+K Help search DROPPED — all lookup in `/help`; only the open-Help-Center command kept (CE-clean).** |

**VI accent-folded search note:** prod DB (`plane_app` non-superuser, `en_US.UTF-8`, `pg_stat_statements`+`pgcrypto` only — `docs/shbvn-deployment/02-installation/prod/02-data-node-postgres.md:57,154-172`) has no `unaccent` extension. `icontains` folds case only (UPPER/LIKE), not diacritics. Accent folding for Vietnamese search is app-managed (normalize input before query).

**User decisions recorded:** D1 (ADMIN-only authoring deliberate, not security side-effect), D2 (unified "Shinhan Workspace", no `is_custom`/badge/reserved category), D3 (greenfield, no bulk import), D4 (full UX set including prominent sidebar entry, copy-between-locales, prev/next, in-article TOC, visual icon picker), D5 (NO Cmd+K Help search — all lookup in `/help`; in-page search must be multilingual across VI/EN/KO + Vietnamese accent-insensitive; `searchWorkspace` untouched).

**Sanctioned core-edit list:** 4 categories — (a) PowerK open command, (b) sidebar Help dropdown item, (c) prominent sidebar nav entry, (d) ≤3 `HelpHint` placements. The Cmd+K `searchWorkspace`/`IWorkspaceSearchResults` `help_articles` edit is REMOVED (D5) — backend global search untouched.
