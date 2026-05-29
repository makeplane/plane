---
phase: 2
title: "Backend API and Search"
status: pending
priority: P1
effort: "2d"
dependencies: [1]
---

# Phase 2: Backend API and Search

## Overview

DRF endpoints for reading (members) and authoring (workspace admins) the Help Center, with
locale resolution + fallback, category/article CRUD, per-locale translation upsert, HTML
sanitization on write, and full-text-ish search over a precomputed accent-folded column (Phase 1), plus query-side folding for VI diacritics.

## Requirements

- Functional:
  - Members read **published** categories/articles in their locale (with fallback).
  - Workspace admins CRUD categories/articles + per-locale translations; see drafts.
  - Search articles by query (title + stripped text), scoped to workspace, published-only for members.
  - Reorder (sort_order) categories/articles.
- Non-functional: reuse Plane permission + base-view patterns; prefetch to avoid N+1;
  sanitize incoming HTML; consistent `/api/workspaces/<slug>/help/...` URL shape.

## Architecture

Reading and resolution rules:

- **Locale param contract (Finding 15)**: locale is passed as the query param `?locale=<vi|en|ko>`
  (UI passes `currentLocale`) — NOT `Accept-Language`. Freeze this; the FE service (Phase 4) depends on it.
- **Locale resolution (deterministic)**: per article resolve `requested → en → vi → any existing
translation with non-empty title`. (Translations have NO status field — Finding 13 — so do NOT say
  "any published translation".) Response includes `resolved_locale` + `requested_locale` so UI shows a
  "shown in <lang>" notice on fallback. If NO usable translation exists, return an explicit empty
  marker (never index `[0]` blindly → would 500, Finding 13).
- **Visibility (Finding 7) — enforce in `get_queryset()`, NOT just the serializer**: non-admins →
  only `status=published` articles that have ≥1 non-empty translation, AND categories with ≥1 such
  article. Admins → everything incl. drafts. Because `BaseViewSet.get_queryset` defaults to
  `self.model.objects.all()` (`apps/api/plane/app/views/base.py:62-67` — unscoped!), the override must
  apply workspace-scope + published-filter so DRF `get_object()` (retrieve) AND list AND search all
  inherit it from ONE place. The search snippet + `available_locales` derive from this same filtered set.

Serializers (`apps/api/plane/app/serializers/help_center.py`):

- `HelpCategorySerializer` — id, slug, sort_order, icon, color, is_active, `name` (resolved per
  locale), `article_count`.
- `HelpCategoryWriteSerializer` — accepts `translations: [{locale,name}]` (upsert).
- `HelpArticleListSerializer` — id, slug, category, sort_order, status, `title` (resolved),
  `resolved_locale`, updated_at.
- `HelpArticleDetailSerializer` — adds `description_html`, `description_json`, plus
  `available_locales` (which translations exist).
- `HelpArticleWriteSerializer` / translation upsert — sanitize + invariants:
  - **Sanitize `description_html`** via `validate_html_content` (`content_validator.py:211-243`), store the
    returned `clean_html`, 400 on invalid. BUT the default allowlist permits `style` on all tags
    (`content_validator.py:91`) and nh3 0.2.18 does NOT filter CSS → clickjacking/overlay XSS for
    broadcast content (Finding 2). For Help Center, pass a hardened allowlist that DROPS `style` (and
    any non-essential attrs), or post-strip `style`. Do not reuse the Pages config as-is.
  - **`description_json` is NOT rendered to readers (Validation decision 1)**: the read path renders the
    sanitized `description_html` only (Phase 5), so the JSON-XSS-to-reader vector (Finding 2/3) is closed
    without complex JSON sanitization. `description_json` is stored as the editor's own output for
    author-side edit fidelity (loaded only in the admin authoring editor). Persist via instance `.save()`
    so `description_stripped` re-derives (Finding 10). Derive `description_stripped` from the sanitized HTML.
  - **Publish invariant (Finding 13)**: reject setting `HelpArticle.status='published'` unless ≥1
    translation with non-empty title exists.

Views (`apps/api/plane/app/views/help_center/base.py`):

- `HelpCategoryViewSet(BaseViewSet)` — list/retrieve/create/update/destroy.
- `HelpArticleViewSet(BaseViewSet)` — list (filters `?category=`, `?locale=`; `?status=draft` honored
  ONLY for admins), retrieve (locale-resolved), create/update/destroy, `@action(detail=True) translation`
  (PUT/PATCH upsert one locale).
- **Search = list `?search=` (Findings 3, drop HelpSearchEndpoint)**: set `search_fields =
["translations__search_text"]` (the accent-folded column written by Phase 1's `HelpArticleTranslation`
  post-save signal) on `HelpArticleViewSet`. DRF `SearchFilter` is already wired into `BaseViewSet`
  (`apps/api/plane/app/views/base.py:53`) and compiles to `UPPER(field) LIKE UPPER(pattern)` — case-fold
  only, no diacritics. To fold diacritics without a DB extension (prod `plane_app` lacks `CREATE
EXTENSION unaccent` — `docs/shbvn-deployment/02-installation/prod/02-data-node-postgres.md:57`), add a
  small `AccentInsensitiveSearchFilter(filters.SearchFilter)` subclass that overrides
  `get_search_terms()` to NFKD/unidecode-fold each term before `icontains`. With the folded column on
  disk and the folded query term, "tai chinh" matches "Tài chính" with zero DB extension.
  Snippet derives from `description_stripped` (readable text); `matched_locale` computed in list
  serializer when `search` is present. This keeps ONE queryset = ONE visibility path (no dual
  draft-leak risk). No separate endpoint, no trigram.
- **Multilingual search (D5)**: because `search_fields` traverses `translations__search_text`, the JOIN
  spans ALL locale rows of each article — so a query is matched against the article's VI **and** EN
  **and** KO content. A user finds an article whether the term they typed appears in any of the 3
  locales (results de-duplicated to one row per article via `.distinct()`); the row is then resolved/
  displayed per the `?locale=` rule with `matched_locale` telling the UI which locale produced the hit.
  This is the SOLE help-search surface (D5: no Cmd+K help search) — it must work for VI/EN/KO and
  accent-insensitive VI from the in-page `/help` box.
- **Reorder = `partial_update(sort_order=...)` (Findings 12, drop reorder actions)**: client computes the
  new `sort_order` between neighbors (Phase 4/6, mirroring `label.store.ts:242-274`) and PATCHes the row.
  No bulk `@action reorder`, no UUID-list endpoint (also shrinks the IDOR surface).
- **Cross-workspace safety (Finding 8)**: EVERY action — incl. the custom `translation` upsert — resolves
  objects via `self.get_object()` (or `get_queryset().get(...)`), never `Model.objects.get(pk=...)`.
- All querysets override `get_queryset()` to `.filter(workspace__slug=slug)` (+ published-filter for
  members, see Visibility) + `.prefetch_related("translations", "category__translations")`.

Permissions (Finding 1 — CRITICAL):

- **ADMIN-only authoring is a deliberate user decision (D1)**, not only a security finding —
  the fork has exactly 3 roles (ADMIN=20 / MEMBER=15 / GUEST=5) with no intermediate role.
- **Do NOT use `WorkSpaceAdminPermission`** — it authorizes `role__in=[Admin, Member]`
  (`apps/api/plane/app/permissions/workspace.py:61-71`), i.e. ANY Member can write. Same trap with
  `WorkspaceEntityPermission` (`workspace.py:74-90`).
- **Writes (create/update/destroy/translation) = ADMIN only**, using the codebase-native per-method
  decorator `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` — verified pattern:
  `apps/api/plane/app/views/webhook/base.py:21,38`. `ROLE` enum: `apps/api/plane/app/permissions/base.py:14-16`
  (ADMIN=20 / MEMBER=15 / GUEST=5). NOT a novel DRF `get_permissions()` split (no in-repo precedent).
- **Reads = any active member** → `permission_classes = [WorkspaceUserPermission]`
  (`workspace.py:103-110`).
- Test that a `role=MEMBER` (not just Guest) write returns 403.

URLs (`apps/api/plane/app/urls/help_center.py`, register in `urls/__init__.py`):

```
workspaces/<str:slug>/help/categories/
workspaces/<str:slug>/help/categories/<uuid:pk>/
workspaces/<str:slug>/help/articles/                # supports ?category= ?locale= ?search=
workspaces/<str:slug>/help/articles/<uuid:pk>/       # ?locale= (locale-resolved)
workspaces/<str:slug>/help/articles/<uuid:pk>/translations/<str:locale>/
```

(No `reorder/` or `search/` routes — reorder = `partial_update(sort_order)`, search = list `?search=`.)
Frozen FE↔BE contract (Finding 15): these exact paths + the `?locale=` query param + the list/detail/
search-snippet JSON shapes are what Phase 4 codes against. Register the urls module in
`apps/api/plane/app/urls/__init__.py` (an explicit Phase-2 deliverable — `urls/` has no `help.py` yet).

## Related Code Files

- Create: `apps/api/plane/app/serializers/help_center.py`
- Create: `apps/api/plane/app/views/help_center/__init__.py`, `.../help_center/base.py`
- Create: `apps/api/plane/app/urls/help_center.py`
- Modify: `apps/api/plane/app/serializers/__init__.py`, `apps/api/plane/app/views/__init__.py`,
  `apps/api/plane/app/urls/__init__.py` (register)
- Read for pattern: `apps/api/plane/app/views/webhook/base.py:21,38` (`@allow_permission([ROLE.ADMIN],
level="WORKSPACE")` — the verified ADMIN-only-workspace precedent), `apps/api/plane/app/views/page/base.py`
  (queryset scoping, `search_fields`), `apps/api/plane/app/serializers/page.py`
  (detail vs list serializer, `description_html` field), `apps/api/plane/utils/content_validator.py`
  (HTML sanitize + its `style`-in-allowlist gap), `apps/api/plane/app/permissions/base.py:14-16`
  (ROLE enum; ADMIN=20/MEMBER=15/GUEST=5), `apps/api/plane/app/permissions/workspace.py`
  (pick `WorkspaceUserPermission` for read)

## Implementation Steps

1. Read `views/webhook/base.py:21,38` (ADMIN-only-workspace `@allow_permission` pattern — D1/verified)
   - `views/page/base.py` + `serializers/page.py` for base-view + serializer conventions.
2. Confirm ROLE enum in `permissions/base.py:14-16` (ADMIN=20/MEMBER=15/GUEST=5); reads →
   `WorkspaceUserPermission`, writes → `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`.
3. Write serializers incl. deterministic locale-resolution helper `resolve_translation(article, locale)`
   returning an empty marker when none.
4. Write viewsets: `get_queryset()` = workspace-scope + member published-filter (covers
   list/retrieve/search); custom `translation` action via `self.get_object()`; set
   `search_fields = ["translations__search_text"]` + `filter_backends = [AccentInsensitiveSearchFilter, ...]`
   for VI diacritic-folded `?search=`; prefetch translations. NO reorder action.
5. Write `AccentInsensitiveSearchFilter(filters.SearchFilter)`: override `get_search_terms()` to
   NFKD/unidecode-fold each term; wire it into `HelpArticleViewSet.filter_backends`.
6. Write serializer sanitization: hardened allowlist drops `style` AND does NOT permit
   `iframe`/`embed`/`video` — intentional bank/broadcast security posture; no video embeds. Handle
   `description_json` path; persist via instance `.save()` (re-derives `description_stripped`);
   publish invariant check.
7. Register urls/serializers/views in the `__init__.py` aggregators (incl. new `urls/help_center.py`).
8. Smoke-test with `curl`/DRF browsable API: create category+article+3 translations, list as
   member (published only) vs admin (incl draft), retrieve with `?locale=ko` fallback, search
   "tai chinh" matching article titled "Tài chính" (accent-fold assertion).

## Success Criteria

- [ ] Member token: list/retrieve returns only published, locale-resolved, with `resolved_locale`
- [ ] Admin token: full CRUD on categories/articles/translations; drafts visible
- [ ] `role=MEMBER` (not just Guest) write attempts → 403; only ADMIN writes
- [ ] Search (`?search=`) returns workspace-scoped, published-only matches with snippet + matched locale; "tai chinh" matches article titled "Tài chính" (accent-fold via `search_text` column + `AccentInsensitiveSearchFilter`)
- [ ] `description_html` sanitized with `style` dropped (no CSS overlay); reader renders html only, never json (decision 1)
- [ ] Member retrieve/search of a draft article → 404 / excluded; cross-workspace UUID on any action → 404
- [ ] Cannot publish an article with 0 non-empty translations
- [ ] No N+1 (prefetch verified); no `core`/upstream view modified

## Risk Assessment

- **Permission class mismatch (Finding 1)** → `WorkSpaceAdminPermission`/`WorkspaceEntityPermission`
  silently allow Members to write. Use `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`
  (verified: `webhook/base.py:21,38`; ROLE enum `permissions/base.py:14-16`) for writes; test a
  Member (role 15) write → 403. ADMIN-only is also D1 (deliberate user decision).
- **Accent-fold gap** → DRF default `icontains` = `UPPER() LIKE UPPER()` (case only, not diacritics);
  prod DB lacks `unaccent` extension. Both risks mitigated by: (a) `search_text` column stores
  NFKD-folded text (Phase 1 signal), (b) `AccentInsensitiveSearchFilter` folds the query term.
- **Draft leak (Findings 7/8)** → enforce published-filter in `get_queryset()` so list+retrieve+search
  share it; never gate only in the serializer. Test member retrieve of a draft pk → 404.
- **Locale fallback** → deterministic `requested→en→vi→any-with-title`; zero-translation → empty marker
  (Phase 5 empty-state), never 500.

## Security Considerations

- **Sanitize HTML, harden allowlist (Findings 2 + Validation decision 2):** DROP the `style` attribute
  entirely (nh3 0.2.18 does not filter CSS → overlay/clickjacking). The hardened allowlist also does NOT
  permit `iframe`/`embed`/`video` — intentional security posture for a bank-facing broadcast channel;
  authors embed images only. Readers render the sanitized `description_html` only (decision 1) —
  `description_json` is never rendered to readers, so no separate JSON sanitizer is required for
  read-path safety.
- **Workspace-scope + published-filter in `get_queryset()`** (one place) — every action, incl. custom
  `translation` upsert, resolves via `self.get_object()` to block cross-workspace IDOR (Finding 8).
- Draft articles must never reach non-admins via list, retrieve, search snippet, or `available_locales`
  (enforce in queryset, not just serializer — Findings 7).
- **ADMIN-only writes (D1 — decided):** `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` on all
  mutating actions; verified pattern `webhook/base.py:21,38`; ROLE enum `permissions/base.py:14-16`.
