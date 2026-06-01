---
title: "Help Center In-App (Trung tam tro giup) - Shinhan Workspace"
description: "In-app, multilingual (VI/EN/KO), staff-authored help center for Shinhan Workspace"
status: pending
priority: P2
branch: "duonglx/docs/shbvn-deployment-docs"
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

## Phases

| Phase | Name                                                                         | Priority | Effort | Status  |
| ----- | ---------------------------------------------------------------------------- | -------- | ------ | ------- |
| 1     | [Backend Data Model](./phase-01-backend-data-model.md)                       | P1       | 1.5d   | Pending |
| 2     | [Backend API and Search](./phase-02-backend-api-and-search.md)               | P1       | 2d     | Pending |
| 3     | [i18n Keys](./phase-03-i18n-keys.md)                                         | P2       | 0.5d   | Pending |
| 4     | [Frontend Store and Services](./phase-04-frontend-store-and-services.md)     | P1       | 1d     | Pending |
| 5     | [Reading UI](./phase-05-reading-ui.md)                                       | P1       | 3d     | Pending |
| 6     | [Authoring UI](./phase-06-authoring-ui.md)                                   | P1       | 3.5d   | Pending |
| 7     | [Discovery and Contextual Help](./phase-07-discovery-and-contextual-help.md) | P2       | 1d     | Pending |
| 8     | [Testing](./phase-08-testing.md)                                             | P1       | 2d     | Pending |
| 9     | [Documentation](./phase-09-documentation.md)                                 | P3       | 0.5d   | Pending |

**Estimated effort: ~15 dev-days** (full UX scope per D4; Cmd+K backend search dropped per D5). Original baseline was ~11d; the +4d covers fixed toolbar + live preview + visual icon picker + copy-between-locales (P6), in-article TOC + prev/next + related (P5), accent-folded multilingual search (P1/P2), and the matching tests (P8).

## Dependency Graph

```
01 ──> 02 ──> 04 ──┬─> 05 ──> 07 ──┐
03 ────────────────┴─> 06 ─────────┼─> 08 ──> 09
```

- P1 → P2 → P4 (backend before FE store).
- P3 (i18n) is independent, must land before P5/P6 UI.
- P5 + P6 depend on P4 (+ P3). P7 depends on P5/P6.
- P8 (tests) depends on all impl phases. P9 (docs) last.

## Key References

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
