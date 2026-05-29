---
phase: 4
title: "Frontend Store and Services"
status: pending
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 4: Frontend Store and Services

## Overview

CE-layer TypeScript types, API service class, and MobX store for the Help Center, wired into
the CE root store. This is the data layer the Reading + Authoring UIs consume.

## Requirements

- Functional: fetch categories/articles (locale-aware), fetch article detail, search, and
  (admin) create/update/delete/reorder categories+articles and upsert per-locale translations.
- Non-functional: follow Plane service+store conventions; observable state; no `core/` edits;
  files <200 LOC (split store if needed).

## Architecture

Aliases: `@/plane-web/*` → `apps/web/ce/*`. CE root store extends CoreRootStore.

Types (`apps/web/ce/types/help-center.ts`):

```
type THelpLocale = "vi" | "en" | "ko";
type THelpArticleStatus = "draft" | "published";
type THelpCategory = { id; slug; sort_order; icon; color; is_active; name; article_count };
type THelpArticleListItem = { id; slug; category; sort_order; status; title; resolved_locale; updated_at };
type THelpArticleDetail = THelpArticleListItem & { description_html; description_json; available_locales: THelpLocale[] };
type THelpArticleTranslation = { locale; title; description_html; description_json };
type THelpSearchResult = { id; slug; title; matched_locale; snippet; category };
```

Service (`apps/web/ce/services/help-center.service.ts`) extends `APIService` (`@/services/api.service`):

- `fetchCategories(slug, locale)`, `fetchArticles(slug, {category?, locale, search?, status?})`,
  `fetchArticleById(slug, id, locale)`. **Search is `fetchArticles({search})`** (list `?search=`),
  NOT a separate endpoint (Finding 3).
- `createCategory/updateCategory/deleteCategory`, `createArticle/updateArticle/deleteArticle`.
  **Reorder = `updateCategory/updateArticle({sort_order})`** (Finding 12) — no `reorder*` method/endpoint.
- `upsertTranslation(slug, articleId, locale, payload)` → PUT `.../articles/<id>/translations/<locale>/`.
- URL base `/api/workspaces/${slug}/help/...`; **locale is the `?locale=` query param** (frozen contract,
  Finding 15) — match Phase 2 paths exactly. `.then(res=>res.data).catch(err=>{throw err.response?.data})`

Store (`apps/web/ce/store/help-center.store.ts`; split into
`ce/store/help-center/{category.store.ts,article.store.ts,help-center.store.ts}` if >200 LOC):

- Observables: `categoriesMap`, `articlesMap`, `articleDetailMap`, `searchResults`, loaders/errors.
- Computeds: `getCategoriesSorted`, `getArticlesByCategory(categoryId)`.
- Actions (async, `runInAction` for writes, `set` from `lodash-es`): mirror service methods. Reorder =
  compute new `sort_order` between neighbors then call `updateCategory/updateArticle` (mirror
  `apps/web/core/store/label.store.ts:242-274` `updateLabelPosition`). Accept `locale` from caller
  (UI passes `currentLocale`).
- **`copyLocaleContent(articleId, fromLocale, toLocale)`** (D4, g13 — copy-between-locales): pure
  client-side action; reads `articleDetailMap[articleId]` translations, finds the `fromLocale` entry,
  and writes its `title`+`description_html`+`description_json` into the `toLocale` slot in the same map
  (`runInAction`). No network call — seeds the target locale's editor fields so the author can translate
  and then call `upsertTranslation`. Guard: no-op if `fromLocale` translation is absent or `toLocale`
  already has non-empty content (prevent accidental overwrite).
- Register in `apps/web/ce/store/root.store.ts` constructor: `this.helpCenter = new HelpCenterStore(this)`
  (mirrors the `TimeLineStore(this)`-style registrations at `ce/store/root.store.ts:23-44`).
- **Editor-agnostic note**: the store does NOT resolve `workspaceId`. Components (Phase 5/6) obtain it
  via `useWorkspace().getWorkspaceBySlug(slug)?.id` and pass it directly to the `RichTextEditor` wrapper
  (`apps/web/core/components/core/description-versions/modal.tsx:58-61` for pattern). The store only
  holds raw `description_html`/`description_json` strings.

Hook (`apps/web/ce/hooks/store/use-help-center.ts`): `useContext(StoreContext).helpCenter`
(throws if used outside provider) — mirror existing `use-*` hooks.

## Related Code Files

- Create: `apps/web/ce/types/help-center.ts`
- Create: `apps/web/ce/services/help-center.service.ts`
- Create: `apps/web/ce/store/help-center.store.ts` (+ split files if needed)
- Create: `apps/web/ce/hooks/store/use-help-center.ts`
- Modify: `apps/web/ce/store/root.store.ts` (instantiate `helpCenter`)
- Read for pattern: `apps/web/core/services/page/project-page.service.ts:15-58` (service shape),
  `apps/web/ce/store/root.store.ts:24-44` (store registration), an existing `core/store` MobX store
  (runInAction + lodash set), a `core/hooks/store/use-*.ts`

## Implementation Steps

1. Read `project-page.service.ts` + the CE `root.store.ts` to copy conventions.
2. Define types in `ce/types/help-center.ts`.
3. Implement service class with all methods.
4. Implement MobX store (observables, computeds, actions); keep each file <200 LOC.
   - Include `copyLocaleContent(articleId, fromLocale, toLocale)` as a synchronous `runInAction`;
     guard: no-op if source absent or target already has non-empty `description_html`.
   - Do NOT resolve or store `workspaceId`; leave that to Phase 5/6 components.
5. Register store in CE `root.store.ts`; add `use-help-center` hook.
6. Type-check: `pnpm --filter web typecheck` (or repo check) — no errors.

## Success Criteria

- [ ] `useHelpCenter()` returns the store inside the app provider
- [ ] Service methods hit the Phase-2 endpoints (verified against a running API)
- [ ] Store fetch populates observables; computeds group by category correctly
- [ ] `copyLocaleContent` seeds target locale in map; guards against overwrite of existing content
- [ ] Store holds only raw strings; no workspaceId logic bleeds into store layer
- [ ] TypeScript compiles; no `core/` files modified
- [ ] All new files <200 LOC

## Risk Assessment

- **Store LOC creep** → pre-split category vs article stores; keep root store thin.
- **Locale threading** → store actions take `locale` param explicitly (no hidden global) to keep testable.
- **Reactivity (Finding 14)** → `currentLocale` from `useTranslation()` is read via plain `useContext`;
  consuming components must be wrapped in `observer()` (mobx-react) or they won't re-render/re-fetch on
  language switch. Enforce in Phase 5/6.
- **Contract drift (Finding 15)** → service paths + `?locale=` query param must match Phase 2 exactly;
  freeze the list/detail/search-snippet response shapes before coding the UI.
- **Copy-locale overwrite risk** → `copyLocaleContent` must check `toLocale` slot for non-empty
  `description_html` before seeding; UI (Phase 5/6) should show a confirmation prompt if content exists.
- **Editor coupling** → store must NOT import or reference any editor component; workspaceId resolution
  is strictly a component concern (Phase 5/6).
