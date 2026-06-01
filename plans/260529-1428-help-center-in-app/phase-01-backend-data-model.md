---
phase: 1
title: "Backend Data Model"
status: pending
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Backend Data Model

## Overview

Dedicated Django models for the Help Center: categories + articles, each with per-locale
(VI/EN/KO) translations holding Tiptap rich content. Workspace-scoped, soft-deletable,
self-contained — no dependency on the project-scoped Page system.

## Requirements

- Functional: store help categories and articles per workspace; each has a translation row
  per locale (title + `description_html/json/stripped`); ordering; draft/published status;
  stable slugs for deep-linking; category grouping ("by function").
- Non-functional: searchable via accent-folded `search_text` (covers title + body, unaccented
  queries match accented VI/EN/KO content); `description_stripped` retained for snippets; soft
  delete; audit columns; unique slug per workspace; fast list/lookup; migration is additive (no data loss).

## Architecture

Four models in a new file `apps/api/plane/db/models/help_center.py`, app label `db`.
Extend `BaseModel` — which **via `AuditModel`** (`apps/api/plane/db/mixins.py:85`) provides
`created_at/by`, `updated_at/by`, and `deleted_at` soft-delete (`mixins.py:61-64`); `BaseModel`
itself only adds the UUID `id` (`apps/api/plane/db/models/base.py:17-18`). Add an explicit
`workspace` FK (workspace scope only, NOT project — do NOT use `WorkspaceBaseModel`, which adds a
project FK). The `UniqueConstraint(condition=Q(deleted_at__isnull=True))` pattern relies on the
`deleted_at` column coming from `AuditModel` — keep that inheritance.

```
HelpCategory (BaseModel)
  workspace      FK(Workspace, CASCADE, related_name="help_categories")
  slug           SlugField (stable id within workspace)
  sort_order     FloatField default 65535
  icon           CharField  (lucide icon name, blank)   # e.g. "folder-kanban"
  color          CharField  (hex, blank)
  is_active      BooleanField default True
  -> constraint: unique (workspace, slug)  [globally unique — NOT conditioned on deleted_at, so a
     soft-deleted slug is never reused; preserves deep links (Validation decision 3)]

HelpCategoryTranslation (BaseModel)
  category       FK(HelpCategory, CASCADE, related_name="translations")
  locale         CharField choices HELP_LOCALES (vi|en|ko)
  name           CharField
  -> constraint: unique (category, locale) where deleted_at IS NULL

HelpArticle (BaseModel)
  workspace      FK(Workspace, CASCADE, related_name="help_articles")
  category       FK(HelpCategory, SET_NULL, null=True, related_name="articles")
  slug           SlugField
  sort_order     FloatField default 65535
  status         CharField choices (draft|published) default draft
  -> constraint: unique (workspace, slug)  [globally unique — NOT conditioned on deleted_at, so a
     soft-deleted slug is never reused; preserves deep links (Validation decision 3)]
  -> index: (workspace, status)

HelpArticleTranslation (BaseModel)
  article            FK(HelpArticle, CASCADE, related_name="translations")
  locale             CharField choices HELP_LOCALES
  title              CharField
  description_html   TextField default "<p></p>"
  description_json   JSONField default dict
  description_stripped TextField null  (auto in save(), for search snippet/display)
  search_text        TextField null    (auto in save(), accent-folded: lowercase + diacritics stripped;
                                        search target for unaccented queries — see VI search below)
  -> constraint: unique (article, locale) where deleted_at IS NULL
  -> plain db_index on search_text  (NOT title — search now targets folded column;
     NO pg_trgm — still icontains via DRF SearchFilter, Phase 2)
  NOTE: translations have NO status field — publish is article-level only (HelpArticle.status).
  NOTE: D2 (confirmed 2026-05-29) — NO is_custom / source / tag fields; content is ONE unified
        Shinhan Workspace platform; custom-vs-stock distinction is permanently excluded.
```

**No pg_trgm (Finding 3):** prod `plane_app` lacks `CREATE EXTENSION` privilege
(`docs/shbvn-deployment/02-installation/prod/02-data-node-postgres.md:163-172`) and the fork uses
`icontains` search everywhere — so do NOT add `TrigramExtension()` or a `gin_trgm_ops` index.
Search is `icontains` over `search_text` (Phase 2); plain `db_index` is enough.

**VI accent-folded search (C1 fix, D4):** `icontains` compiles to `UPPER(field) LIKE UPPER(pattern)`
— folds case only, NOT diacritics. User typing "tai chinh" must match "Tài chính". Solution:
app-managed `search_text` column. In `HelpArticleTranslation.save()`, after computing
`description_stripped`, set:

```python
import unicodedata
def _fold(text):
    nfkd = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()

self.search_text = _fold(self.title + " " + (self.description_stripped or ""))
```

Alternatively use `unidecode(text).lower()` — both achieve the same result; `unicodedata` is
stdlib (zero new dependency); `unidecode` is more complete for edge transliterations but NOT yet
installed (see Dependency note below). **Prefer stdlib `unicodedata` approach** to avoid the new
dep; fall back to `unidecode` if real-world VI test cases reveal gaps.

`icontains` over `search_text` then matches: `Unidecode("Tài chính") → "tai chinh"`, query
`"tai chinh".lower()` hits the folded row. Always use instance `.save()` (never `QuerySet.update()`)
so `search_text` never goes stale (Finding 10 still applies). `description_stripped` remains
unchanged — used for snippet display, not search.

**Dependency note — `unidecode`:** NOT in `apps/api/requirements.txt` and NOT imported anywhere in
`apps/api/`. If `unidecode` approach is chosen over stdlib, it MUST be added to
`apps/api/requirements.txt` before the migration lands. Slug generation (Risk Assessment below) also
references `unidecode`; both would share one install. Flag for Phase 1 implementer: verify stdlib
`unicodedata` covers all target VI/EN/KO folding cases first; add `unidecode` only if gaps found.

**sort_order (Finding 12):** `FloatField`; on create set `sort_order = (max in scope or 0) + 10000`
(mirror `apps/api/plane/db/models/state.py:136-139` sequence pattern), NOT a constant `65535` for every
row — otherwise initial ordering is pure created_at and reorder is nondeterministic. Reordering reuses
`partial_update(sort_order=...)` (no bespoke reorder endpoint — Phase 2/4/6), with `id` as final tie-break.

**Publish invariant (Finding 13):** `HelpArticle.status` may be set `published` ONLY if ≥1
`HelpArticleTranslation` with non-empty `title` exists — enforce in the write serializer (Phase 2),
so members never reach an article that resolves to no content.

Define `HELP_LOCALES = (("vi","Vietnamese"),("en","English"),("ko","Korean"))` in the model file.
`HelpArticleTranslation.save()` sets BOTH `description_stripped` and `search_text` from
`description_html` — mirror `Page.save()` (`apps/api/plane/db/models/page.py:70-77`) for the strip
step, including the import it uses: `from plane.utils.html_processor import strip_tags`
(NOT `django.utils.html`, see `page.py:14`) and the empty-string guard
(`description_stripped = None` when html strips to empty). Then derive `search_text` via the `_fold()`
helper above (stdlib `unicodedata`) over `title + " " + (description_stripped or "")`.
The upsert path MUST go through instance `.save()` (never `QuerySet.update()`) or
`description_stripped` + `search_text` both go stale (Finding 10).

Data flow: locale=VI/EN/KO translations are siblings under one logical article/category →
reading side picks current-locale row with fallback; authoring side edits rows per tab.

## Related Code Files

- Create: `apps/api/plane/db/models/help_center.py`
- Create: `apps/api/plane/db/migrations/NNNN_help_center.py` (via `makemigrations db`; number assigned off the current tail, not hardcoded)
- Modify: `apps/api/plane/db/models/__init__.py` (export the 4 models)
- Modify (optional): `apps/api/plane/db/admin/__init__.py` or admin module (register for ops) — keep minimal
- Read for pattern: `apps/api/plane/db/models/page.py` (BaseModel usage, save() strip, constraints),
  `apps/api/plane/db/models/label.py` (workspace-scoped + sort_order + unique-when-not-deleted),
  latest migration `apps/api/plane/db/migrations/0168_add_issue_workitems_index.py` (numbering + CONCURRENTLY pattern)

## Implementation Steps

1. Read `page.py` + `label.py` to copy the exact `BaseModel` import path and the
   `UniqueConstraint(condition=Q(deleted_at__isnull=True))` pattern Plane uses.
2. Create `help_center.py` with the 4 models + `HELP_LOCALES`. Add `__str__`, `Meta.db_table`
   (`help_categories`, `help_category_translations`, `help_articles`, `help_article_translations`),
   default ordering (`sort_order`, then `-created_at`).
3. Override `HelpArticleTranslation.save()` to:
   a. Set `description_stripped` from `description_html` (mirror `page.py:70-77`; guard empty→None).
   b. Set `search_text = _fold(title + " " + (description_stripped or ""))` using stdlib
   `unicodedata.normalize("NFKD", ...)` + strip combining chars + `.lower()`.
   If VI/EN/KO edge cases reveal gaps, swap `_fold` to `unidecode(text).lower()` and add
   `unidecode` to `apps/api/requirements.txt` (not yet present — flag before merge).
4. Export models in `db/models/__init__.py`.
5. Add a plain `db_index` on `search_text` (and FKs). Do NOT index `title` separately — search
   now targets the folded column. Do NOT add `TrigramExtension()` / `gin_trgm_ops` —
   search is `icontains` over `search_text` (Phase 2); pg_trgm fails in prod (Finding 3).
   D2 confirmed: do NOT add `is_custom`, `source`, or `tag` fields.
6. Branch from `develop` first. `cd apps/api && python manage.py makemigrations db` → the CLI names the
   migration off the then-current tail; do NOT hardcode `0169`. Slug filename = domain only
   (`NNNN_help_center.py`), no phase refs. Re-base the number if a collision appears at merge.
7. `python manage.py migrate` on a dev DB; confirm tables + constraints created.
8. (Optional) register models in Django admin for ops/debugging.

## Success Criteria

- [ ] 4 models created, exported, importable (`from plane.db.models import HelpArticle`)
- [ ] Migration `NNNN_help_center.py` generated (number off the then-current tail on `develop`), app `db`
- [ ] `migrate` runs clean on dev DB; unique-slug + unique-(article,locale) constraints enforced
- [ ] `description_stripped` auto-populates on translation save (verified in shell)
- [ ] `search_text` auto-populates with accent-folded value on save (verified: saving a translation
      with `title="Tài chính"` produces `search_text` containing `"tai chinh"`)
- [ ] Unaccented query `icontains` over `search_text` matches accented title/body content
- [ ] `db_index` exists on `search_text`; no separate index on `title`
- [ ] No `is_custom` / `source` / `tag` field on any model (D2)
- [ ] No change to any `core`/upstream model file

## Risk Assessment

- **Slug generation (Finding 11)** → `django.template.defaultfilters.slugify` STRIPS Vietnamese
  diacritics (`Tài chính`→`ti-chnh`) and there is NO frontend slugify in the repo. Generate slug
  **server-side** from the first available title (prefer VI, else EN, else KO), transliterate diacritics
  (e.g. `unidecode`), and append `-2`, `-3`, … on collision (loop until unique within workspace,
  **counting soft-deleted rows too** since slug is globally unique — Validation decision 3). Reject
  create if zero titles exist. Slug is set once at create; editable only while `status=draft`, frozen
  after first publish (preserves deep links).
- **`unidecode` dependency gap** → `unidecode` is NOT in `apps/api/requirements.txt` and NOT used
  anywhere in the API codebase (confirmed: grep returns no results). Slug generation already references
  it (Finding 11 above). `search_text` folding can use stdlib `unicodedata` (no new dep). If
  `unidecode` is chosen for either slug or search, add one line to `requirements.txt` before merge.
  Recommended: use stdlib `unicodedata` for `search_text`; evaluate `unidecode` for slug only where
  transliteration quality matters more than zero-dependency.
- **`search_text` staleness** → only risk is bypassing `save()` with `QuerySet.update()`. Finding 10
  mitigation (always use instance `.save()`) covers both `description_stripped` and `search_text`
  simultaneously — no extra guard needed.
- **Migration numbering** → do not hardcode the number; branch from `develop` and number off the
  then-current tail; re-base on collision (Finding 15).
- **sort_order race** → increment-on-create + `partial_update` reorder with `id` tie-break (see above);
  no bespoke bulk reorder endpoint (Finding 12).
