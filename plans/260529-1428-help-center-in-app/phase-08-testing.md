---
phase: 8
title: "Testing"
status: done
priority: P1
effort: "2d"
dependencies: [2, 4, 5, 6, 7]
---

# Phase 8: Testing

> **Done (2026-05-30):** Backend automated suite = **51 tests, all green** across
> `tests/unit/models/test_help_center_models.py` (14), `tests/contract/app/test_help_center_read.py` (20),
> `tests/contract/license/test_help_center_admin.py` (17). Re-grounded to the instance-global model
> (read=`IsAuthenticated`, write=God Mode `InstanceAdmin`); the pre-pivot workspace-scoped cases
> (member-403-in-workspace, cross-workspace IDOR, `unique(workspace,slug)`) are obsolete and were
> replaced by the global equivalents. D5 Cmd+K regression verified by static check (no `help` key in
> `IWorkspaceSearchResults` / global search backend). FE store/service + author→read e2e have **no JS
> harness** (no vitest/jest/playwright) → captured as `phase-08-manual-qa-checklist.md` (sign-off before
> merge). Report: `plans/reports/from-tester-to-cook-help-center-phase8-backend-tests-report.md`.

> **D7 additions (2026-05-30):** also cover the standalone `/help` route — (1) reader renders at
> top-level `/help` with NO workspace context (no `workspaceId` guard regression); (2) backend unit test
> asserting `sanitize_help_html` keeps `rel="noopener noreferrer"` on author `<a target="_blank">`
> (anti-tabnabbing, red-team MED); (3) image render without workspace via the global
> `/api/assets/v2/static/{id}/` URL; (4) `StaticFileAssetEndpoint` returns 404 for a soft-deleted
> `HELP_ARTICLE_CONTENT` asset. Note: g18 (`projectId=undefined` workspace-path image) is mooted by D7 —
> help images now use the global static path, not the workspace path.

## Overview

Verify correctness across layers: backend models/API (permissions, locale fallback, search,
sanitization), frontend store/service, and an end-to-end lookup + authoring flow. No mocks/fakes
to "pass" the build; real assertions against real behavior.

## Requirements

- Functional: tests cover happy paths + key edge cases (draft visibility, locale fallback order,
  XSS sanitization, cross-workspace isolation, unique-slug, search relevance).
- Non-functional: tests deterministic, isolated (fresh DB/fixtures), runnable in CI; all pass before push.

## Architecture

**Backend** (`cd apps/api && python run_tests.py`) — add tests under the existing test layout
(verify: `apps/api/plane/tests/` or per-app `tests/`). Cases:

- Models: unique (workspace, slug) where not deleted; unique (article, locale); `description_stripped`
  auto-set on save AND re-derived when `description_html` is PATCHed (not stale — Finding 10); soft delete.
- API permissions (Finding 1): member read-only — assert a `role=MEMBER` (15), not just Guest, gets 403
  on create/update/destroy/translation; ADMIN full CRUD; anonymous blocked.
- Visibility (Findings 7): drafts hidden from members in list, retrieve (404), `?search=` results,
  search snippet, AND `available_locales`; visible to admins; category with no published article hidden.
- Locale resolution: `?locale=ko` returns ko; missing ko → en→vi→any-with-title; `resolved_locale` correct;
  **published article with 0 translations → 200 + empty marker, NOT 500** (Finding 13/8).
- Search: `?search=` on list, workspace-scoped, published-only for members, icontains over title +
  stripped body (NOT trigram — Finding 3).
- **Accent-folded search (g1 — D4, Phase 5)**: assert `?search=tai chinh` returns article titled
  "Tài chính"; assert `?search=du an` returns article titled "Dự án". Query is folded via
  app-managed `search_text` column (pre-normalised on save, no `unaccent` extension — prod DB
  has only `pg_stat_statements`+`pgcrypto`; `icontains` folds case only). Test must confirm the
  folded `search_text` path is hit, NOT a trigram/`unaccent` path.
- **Multilingual search (D5 — Phase 2/5)**: `search_fields = ["translations__search_text"]` spans ALL
  locale rows of an article, so a query matching a term that exists ONLY in the EN (or KO) translation
  finds the article even when the request's `?locale=vi`. Assert: seed an article whose EN title contains
  "finance" but VI title does not → `?search=finance&locale=vi` returns it, with `matched_locale=en` and
  the row resolved/displayed per the `?locale=` rule (Phase 2 resolution). Confirms help lookup works
  across VI/EN/KO from the single in-page `/help` search box.
- Sanitization (Finding 2 + Validation decisions 1/2): `<script>`/onerror AND the `style` attribute
  stripped from stored `description_html` (no CSS overlay). Assert the **reader** detail response renders
  from sanitized `description_html` only — a payload placed solely in `description_json` does NOT reach the
  reader (json is never on the read path).
- Slug (Finding 11): Vietnamese-title slug transliterates diacritics; duplicate titles get `-2` suffix;
  create with zero titles rejected.
- Publish invariant (Finding 13): publishing an article with 0 non-empty translations → 400.
- Cross-workspace (Finding 8): workspace-A token + workspace-B UUID on retrieve, translation upsert,
  and `sort_order` update → 404 (no leakage/overwrite).

**Frontend read-only render (g18 — C4, Phase 4)**:

- **Automated (e2e if harness present)**: assert the article reader renders an uploaded image; confirm
  the `<RichTextEditor editable={false} ... projectId={undefined}>` receives a valid asset URL rooted
  at `/api/assets/v2/workspaces/<slug>/<assetId>/` (asset URL workspace fallback:
  `packages/utils/src/editor/common.ts:23-27`).
- **If no e2e harness**: this becomes a **required manual QA step** — open a published article
  containing an uploaded image, confirm image loads (HTTP 200), no broken-image icon, no console
  asset-404 errors. Must be signed off before merge.
- In either case, this is a **Phase-8 success criterion** (see Success Criteria below).

**Frontend** — store/service unit tests (framework = whatever web app uses; verify vitest/jest config):

- Store actions populate observables; `getArticlesByCategory` / `getCategoriesSorted` computeds.
- Service builds correct URLs + passes `?locale=` query param (Finding 15); search via `fetchArticles({search})`.
- Content-pick uses `isJSONContentEmpty(json) ? html : json` — assert empty `{}` json falls through to
  HTML, NOT shadows it (Finding 4).
- Reorder computes a new `sort_order` between neighbors and calls `updateArticle`/`updateCategory`
  (no reorder endpoint — Finding 12).
- Locale fallback notice logic (`resolved_locale !== currentLocale`).

**E2E** (Playwright via `/ck:web-testing`, if e2e harness exists):

- Admin authors a category + article in VI/EN/KO, publishes.
- Member opens `/help`, browses category, opens article, sees content in their locale.
- Switch UI language → content switches; fallback notice when translation missing.
- Cmd+K "Help Center" command navigates; sidebar item navigates.

**Toolbar + Preview (g5/g9 — D4, Phase 6)**:

- Admin opens article editor; toolbar is always visible (fixed, no slash-command needed).
- Author formats text (bold, heading) and inserts an image via the toolbar image action (not slash).
  Confirm image appears inline in the editor immediately.
- Author clicks Preview toggle; confirm rendered preview matches the published reader view (same
  HTML output, no layout/styling difference for bold, heading, image).
- Manual QA fallback if e2e harness absent; must be signed off before merge.

**Cmd+K (D5 — Phase 7)**: Cmd+K hosts ONLY the open-Help-Center command — there is NO Help
search-results group. Test that the Cmd+K "Help Center" command navigates to `/help` (covered in E2E
above). Assert (regression guard) that `searchWorkspace()` / `IWorkspaceSearchResults` are UNCHANGED and
NO `help`/`help_articles` key exists in the Cmd+K search payload. All help search assertions live in the
in-page `/help` search tests (accent-folded + multilingual, above).

## Related Code Files

- Create: backend tests `apps/api/plane/tests/.../test_help_center*.py` (match existing layout)
- Create: frontend tests `apps/web/ce/store/__tests__/help-center.store.test.ts` (+ service test)
- Create (if harness): `apps/web` e2e spec for help center
- Read for pattern: existing backend test files (fixtures, auth client, workspace setup),
  existing web unit test + e2e setup; `apps/api/run_tests.py`

## Implementation Steps

1. Locate + read existing backend test patterns (auth fixtures, workspace/member factory) and the FE test setup.
2. Write backend model + API + permission + locale + search + sanitization tests; include accent-folded
   search fixtures (g1) — ensure factory populates `search_text` via the save/normalisation path.
3. Write FE store/service unit tests.
4. Add e2e spec (if harness present) covering: author toolbar + image insert + preview (g5/g9);
   image render in reader with `projectId=undefined` (g18); in-page `/help` accent-folded + multilingual
   search; Cmd+K "Help Center" command navigates to `/help`. Otherwise document each as a named manual QA step.
5. Run `cd apps/api && python run_tests.py` and the web test command; fix failures (no skips/mocks-to-pass).
6. Add a regression guard (D5): assert no `help`/`help_articles` key was introduced to the Cmd+K
   `searchWorkspace` payload / `IWorkspaceSearchResults` — help search stays in-page only.
7. Delegate a final run to `tester` agent; only finish when all green.

## Success Criteria

- [ ] Backend suite passes incl. permission, draft-visibility, locale-fallback, search, sanitization, isolation
- [ ] **Accent-folded search (g1)**: `?search=tai chinh` → "Tài chính", `?search=du an` → "Dự án"
      (app-managed `search_text` column, no `unaccent` extension)
- [ ] Frontend store/service tests pass
- [ ] **Image render read-only (g18)**: uploaded image renders in article reader with `projectId=undefined`;
      verified via e2e assertion OR explicit manual QA sign-off
- [ ] E2E (or documented manual QA) covers author→publish→read→locale-switch
- [ ] **Toolbar + Preview (g5/g9)**: author inserts image via visible toolbar (no slash); Preview matches
      reader render — verified via e2e OR manual QA sign-off
- [ ] **Multilingual search (D5)**: query matching a term only in EN/KO translation is found from `/help`
      with `matched_locale` correct; result resolved to current `?locale=`
- [ ] **Cmd+K command-only (D5)**: "Help Center" command opens `/help`; NO `help`/`help_articles` key in
      the `searchWorkspace` payload (regression guard) — help search is in-page only
- [ ] No failing tests ignored; no fake data used to force green
- [ ] CI green

## Risk Assessment

- **Sparse existing FE test infra** → if no runner configured, focus on backend + e2e + manual QA checklist; note gap.
- **Search = icontains (no pg_trgm)** → no CI extension setup needed; test the icontains path that ships.
- **Flaky e2e on locale switch** → wait on content text, not timeouts; ensure components are `observer()`-wrapped (Finding 14).
- **Accent-folded search (g1)**: test fixtures must store `search_text` via the same app-normalisation
  path used in production (not bypass it). If `search_text` is not populated in CI fixtures, tests
  will pass trivially but miss the real code path — validate normalisation is called in the factory/save.
- **Image render (g18)**: `projectId=undefined` must NOT cause an asset-URL construction error at test
  time; confirm `packages/utils/src/editor/common.ts:23-27` workspace-fallback handles `undefined` projectId.
- **Cmd+K (D5)**: no Cmd+K Help search-results group; keep a regression guard that `searchWorkspace` /
  `IWorkspaceSearchResults` stay unchanged. All help search is covered by the in-page accent-folded +
  multilingual tests above.
- **Toolbar/Preview (g5/g9)**: Preview toggle is a Phase 6 addition; if e2e harness lacks the
  component selector, fall back to manual QA checklist — do NOT mock the editor to force green.
