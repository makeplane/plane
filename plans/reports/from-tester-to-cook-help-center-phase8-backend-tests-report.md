# Help Center — Phase 8 Testing Report

**Date:** 2026-05-30 · **Branch:** `duonglx/feat/help-center` · **Status:** Backend automated = DONE; FE/e2e = manual-QA checklist (no harness)

## What was tested

Instance-global Help Center (post D6/D7 pivot): READ = any authenticated user (published-only, no
workspace/role gate); WRITE = God Mode `InstanceAdmin`. Phase-08's pre-pivot workspace-scoped cases
(member-403-within-workspace, cross-workspace IDOR, `unique(workspace,slug)`) were **re-grounded** to
the shipped global model — those workspace concepts no longer exist in the code.

## Automated suite (51 tests, all green, 4.4s)

Run inside the `planeso-api-1` container (code mounted `/code` = `apps/api`; DB networking + deps live there):

```
docker exec planeso-api-1 sh -c 'cd /code && python -m pytest \
  plane/tests/unit/models/test_help_center_models.py \
  plane/tests/contract/app/test_help_center_read.py \
  plane/tests/contract/license/test_help_center_admin.py \
  --reuse-db --nomigrations -q'
# 51 passed
```

Canonical runner: `cd apps/api && python run_tests.py -u -c` (markers `unit` + `contract`).
Full-suite collection verified clean (591 tests collected, no import/fixture breakage); license+app
contract isolation run 64/64.

| File | n | Covers |
| --- | --- | --- |
| `unit/models/test_help_center_models.py` | 14 | `fold_accents` (VI diacritics, `đ→d`, None/empty); `description_stripped`+`search_text` derive on save **and re-derive on html change** (no stale column); empty-html→stripped None; global-unique slug `IntegrityError`; `generate_unique_slug` VI transliteration + collision suffix **incl. soft-deleted** (`all_objects`) + Korean→`untitled`; `sanitize_help_html` strips `<script>`/`style`, drops `javascript:` href, keeps anti-tabnabbing `rel` |
| `contract/app/test_help_center_read.py` | 20 | category list (active + ≥1 published only; inactive/empty hidden; `article_count` excludes drafts); article published-only (draft hidden in list / retrieve-404 / **search** / by-slug-404); **anon blocked** on categories+articles list+detail; locale resolution (requested ko; fallback→en w/ title; →only-available w/ title); **accent-folded search** (`tai chinh`→Tài chính, `du an`→Dự án); **multilingual search** (EN-only term found at `locale=vi`, `matched_locale=en`); json-never-on-read-path (sentinel leak check); static-asset 404 for not-uploaded + is_deleted `HELP_ARTICLE_CONTENT` |
| `contract/license/test_help_center_admin.py` | 17 | InstanceAdmin create category/article (slug gen); validation (no-translation/no-title→400; bad `sort_order`→400-not-500; invalid locale→400); **permission boundary** (non-admin→403, anon→401/403 on category/article/asset write); **publish invariant** (titleless→400, titled→200 published); duplicate-title slug suffix; **write-path sanitization** (`<script>`+`style` stripped, `rel` kept, **script body absent from `search_text`**); workspaceless image asset (`workspace_id is None`, `HELP_ARTICLE_CONTENT`, bound to article); asset completion PATCH flips `is_uploaded` (S3/celery patched) |

## Independent verification & review

- **tester agent:** DONE — 44/44 then 51/51; 591 collected clean; 64/64 isolation. No fakes/skips.
- **code-reviewer agent:** APPROVE-WITH-NITS → all High/Med nits applied (+7 tests): H1 json-leak made
  non-trivial (sentinel), H2 search_text safety, anon-read gaps, draft-in-search, deterministic
  fallback titles, publish happy-path, asset-completion PATCH.

## D5 Cmd+K regression guard (static — no TS test runner)

`IWorkspaceSearchResults` (`packages/types/src/workspace.ts:156`) members = `{workspace, project,
issue, cycle, module, issue_view, page}` — **no `help`/`help_articles`**. Global search backend
(`apps/api/plane/app/views/search/base.py`) has zero help references. `searchWorkspace` untouched. ✔

## Not automated (no harness) → `phase-08-manual-qa-checklist.md`

`apps/web` has no vitest/jest and no Playwright/e2e. FE store/service unit tests + author→read e2e
(g5 fixed toolbar, g9 preview-matches-reader, g18 image render via global static path, locale switch,
discovery entry points, light/dark) are **named manual-QA steps requiring sign-off before merge**.
The backend behaviors those flows depend on are covered by the contract suite above.

## Unresolved questions

1. FE/e2e remain manual until a web test harness is introduced (out of scope this phase). Sign-off
   owner for the manual checklist? (default: implementer + 1 reviewer before `develop` PR).
2. `test_soft_deleted_help_asset_returns_404` exercises the `is_deleted` flag branch; the `deleted_at`
   `.delete()` path 404s via a different branch (`DoesNotExist`) and is not separately asserted — low
   value (both 404), left as a noted gap.
