# Code Review — Help Center Reading UI (Phase 5)

Date: 2026-05-30
Reviewer: code-reviewer
Scope: uncommitted Phase 5 diff (instance-global, read-only Help Center)

## Scope

- Backend: `apps/api/plane/app/views/help_center/article.py` (+`retrieve_by_slug`), `apps/api/plane/app/urls/help_center.py` (slug route)
- Frontend service/store: `apps/web/ce/services/help-center.service.ts`, `apps/web/ce/store/help-center/article.store.ts`
- Routes: `apps/web/app/routes/extended.ts`, `apps/web/app/(all)/[workspaceSlug]/(projects)/help/{layout,page,article}.tsx`
- Components: `apps/web/ce/components/help-center/*` (13 + index)
- i18n: en/vi/ko `+help_center.on_this_page`
- ~743 LOC of TSX components + small backend addition

## Overall Assessment

Solid, well-scoped, idiomatic work. Verified against the codebase:

- TypeScript: web `tsc --noEmit` produces ZERO errors in any help-center file (the pre-existing baseline errors in unrelated files are not touched).
- All 19 referenced `help_center.*` i18n keys exist in en/vi/ko.
- `TLanguage` in this fork is narrowed to exactly `"en" | "ko" | "vi"` (`packages/i18n/src/types/language.ts:7`), so `currentLocale: TLanguage` is structurally identical to `THelpLocale` — no out-of-range locale risk. (Concern raised and invalidated by verification.)
- `RichTextEditor` props (`editable={false}`, `workspaceId`, `projectId`, `id`, `initialValue`) match `apps/web/core/components/editor/rich-text/editor.tsx:22-40` + `IRichTextEditorProps`. The `editable: false` discriminated-union branch is satisfied (no upload handlers required). Correct — NOT DocumentEditor.
- Propel `EmptyStateDetailed`/`EmptyStateCompact` `customButton`/`align`/`title` props are real (`packages/propel/src/empty-state/detailed-empty-state.tsx:23-24`).
- Store registered in CE root (`ce/store/root.store.ts:39,53`); both sub-stores `makeObservable` with explicit fields; `runInAction` + lodash `set` used correctly.
- No hardcoded colors (`bg-white`/`bg-gray-*`/`#hex`/`dark:`), no user-facing "Plane" branding leak, all components <150 LOC, kebab-case, `apps/web/core/` untouched.
- Reader trusts `description_html` only; `description_json` is absent from the read serializer (`help_center.py:126-149`). HTML is sanitized author-side with a style-stripped allowlist (`sanitize_help_html`, clickjacking-hardened). XSS closure holds.
- Slug endpoint reuses the published+has-title queryset and passes locale via `get_serializer_context()` — 404s correctly on unpublished/unknown slug. Acceptance criteria 1–7 substantially met.

## Critical Issues

None.

## High Priority

None blocking. (The TOC index bug below is a correctness defect but degrades gracefully — placed Medium.)

## Medium Priority

### M1 — TOC active-highlight / scroll targets wrong heading when content has an empty heading

`apps/web/ce/components/help-center/help-article-toc.tsx`

`parseHeadings` (line 18-20) builds the visible list from the HTML but **filters out empty-text headings** (`.filter((heading) => heading.text.length > 0)`), and stores the *pre-filter* DOM index (`index` from the unfiltered `.map`). But:

- The IntersectionObserver assigns `dataset.tocIndex` by iterating the **live DOM** `querySelectorAll(HEADING_SELECTOR)` with a **fresh 0..n index** (line 52-53), no empty filter.
- `scrollTo(index)` (line 66-67) indexes the **live DOM** `nodes?.[index]` — again unfiltered.

So three different index spaces are mixed:
1. `heading.index` = position in the *unfiltered* parsed list (so it already accounts for empties — good, it's a DOM ordinal).
2. observer `dataset.tocIndex` = position in *live DOM* nodes (matches #1 only if parse-DOM and live-DOM heading counts/order are identical).
3. the `<li key={heading.index}>` / `aria-current={active === heading.index}` compares #1 against #2.

These line up ONLY when the rendered editor output produces exactly the same heading sequence as the parsed `description_html`. They diverge when:
- The editor adds/wraps/normalizes headings on render (e.g., empties dropped, or a heading split), shifting live-DOM ordinals.
- An author leaves an empty `<h2></h2>`: it's kept in the live-DOM index space (#2/#3 via `nodes[index]`) but dropped from the visible list (#1) — but since `heading.index` is the *unfiltered* ordinal, clicking an item after the empty one scrolls to the correct DOM node only if parse order == render order.

Impact: wrong heading highlighted / scroll jumps to the wrong section on articles whose rendered headings differ from the raw HTML headings. No crash. Likely rare for clean authored content, but bank staff guides with empty headings or editor normalization will hit it.

Fix: derive the visible TOC list from the **live DOM** (the same source used for scroll/observe), not from a separate DOMParser pass. Build headings inside the `useEffect` after hydration from `container.querySelectorAll(HEADING_SELECTOR)`, filtering empties there, and key/scroll by the *same* node reference (store refs or a stable id). That collapses the three index spaces into one. If keeping the DOMParser pass for the immediate first paint, reconcile by filtering empties identically in the live-DOM pass and indexing both by the filtered ordinal.

### M2 — Article-list reactivity: `ArticleList` reads store-derived arrays but is not an `observer()`

`apps/web/ce/components/help-center/article-list.tsx`, consumed by `help-center-home.tsx:62,80` and indirectly the footer.

`ArticleList` itself is a plain function component (not wrapped in `observer`). It is fine here ONLY because its `articles`/`loading` props are read inside the parent `HelpCenterHome` (which IS an `observer`) — so the parent re-renders and passes new props. Verified the parent reads `article.searchResults`, `article.searchLoader`, `article.getArticlesByCategory(...)`, `article.listLoader` in its render body, establishing the MobX dependency at the parent. So reactivity works as written.

No change strictly required, but flag: this couples `ArticleList` correctness to the caller always reading the observables in an observer scope. If a future caller passes `store.searchResults` lazily or memoizes, it silently stops updating. Low-risk; consider a short comment, or wrap in `observer()` for defensiveness (cheap, matches the file-level convention "observer() always on store-derived data").

### M3 — Footer/home both re-fetch the same category list (duplicate request)

`help-center-home.tsx:38-40` fetches `article.fetchArticles({category, locale})` when `?category=` is set; `help-article-footer.tsx:25-27` independently fetches the same category list on every article view. On an article page only the footer runs (home isn't mounted), so no live double-fetch in the current routes — but both write the shared `articlesMap`, and the footer fetch fires on every article navigation even when siblings are already loaded. Minor: acceptable for a low-traffic internal guide; could gate on "already have >1 sibling for this category". Not blocking.

## Low Priority

### L1 — Footer prev/next silently empty until the sibling fetch resolves

`help-article-footer.tsx:31-37`: on first render `siblings` is empty, `currentIndex === -1`, so `prev`/`next`/`related` are all empty and the footer returns `null` (line 37) until `fetchArticles` resolves, then it pops in. Functionally correct (first/last article correctly yields no prev/next via the `currentIndex > 0` / `< length-1` guards — verified). The pop-in is a minor UX flicker; optional skeleton. Edge cases (article not in its own category list → `currentIndex === -1` → no prev/next, related still rendered) handled gracefully.

### L2 — `retrieve_by_slug` uses `<slug:slug>` path converter

`urls/help_center.py:33`. Django's `slug` converter accepts `[-a-zA-Z0-9_]+`. `generate_unique_slug` (base.py) folds diacritics via `slugify(fold_accents(...))`, so generated slugs stay ASCII/hyphen — compatible. Just note: any slug containing a dot or other char (not produced by the current generator) would 404 at the router before reaching the view. Acceptable given the generator guarantees.

### L3 — `category-card.tsx` icon resolution builds the `ICON_BY_NAME` Map at module load

`category-card.tsx:16` maps the full `LUCIDE_ICONS_LIST` once at import — good (not per-render). `resolveIcon` falls back to `BookOpen` for unknown/empty names. The inline `style={{ color: category.color }}` on the icon wrapper is the documented acceptable exception (author-supplied data). Correct. No change.

### L4 — Search box `aria-label` reuses the placeholder key; clear-button uses `help_center.cancel`

`help-search-box.tsx:28,35`. Functional, but the clear (X) button labeled "Cancel"/"Hủy" is slightly off semantically (it clears, not cancels). Cosmetic i18n nit; optional dedicated `help_center.clear_search` key.

## Edge Cases Verified (pass)

- Article with no usable translation in any locale: `resolve_translation` returns `(None, None)` → serializer `description_html=null`, `title=null` → `hasContent` false (`help-article-view.tsx:56`) → `HelpContentUnavailable` shown, no crash. Correct (criterion: must show unavailable, not blank/crash).
- Category with 0 articles: filtered out server-side (`category.py` `article_count__gt=0`). Empty grid → `HelpCenterEmpty`. Correct.
- Empty search (`trimmed===""`): effect early-returns (`home:43`), no request fired. Correct.
- First/last article prev/next: guarded by index bounds. Correct.
- Stale-locale race: `help-article-view.tsx:34-50` `cancelled` flag in the effect cleanup is correct — a late response from a superseded locale is dropped (effect re-runs on `currentLocale`, old closure's `cancelled=true`). The store's `articleDetailMap` may still be overwritten by the late response (store has no per-request guard), but the *view* state is protected by the flag, and the header reads `getArticleDetailBySlug` by id/slug match so it reflects whatever resolved last — acceptable for read-only. Criterion 2 met at the view layer.
- IntersectionObserver cleanup: `toc:57-60` clears timer and disconnects observer on unmount/deps-change. No leak. If content unmounts before the 200ms timer fires, `container` ref read happens inside the timer with no null guard on `container.querySelectorAll` — but `container` is captured at effect-setup where it was non-null, and disconnect/clearTimeout on cleanup prevents the callback from firing post-unmount. Safe.

## Positive Observations

- Backend correctly in `plane/app/` (session-auth read layer), `IsAuthenticated`, no workspace scope — matches the D6 instance-global pivot. No accidental workspace coupling found.
- Read serializer deliberately omits `description_json`; HTML sanitized with a style-stripped allowlist (clickjacking defense). Strong trust-boundary posture.
- `key={articleId}` on `RichTextEditor` forces a clean remount per article — avoids stale editor state across navigation.
- Route nested correctly under `(projects)/layout.tsx` so it inherits sidebar+header; breadcrumb in `AppHeader`, not page body (criterion 4 met).
- No "Manage" button, no admin gating — correct per D6 (authoring is God Mode / admin app).
- Comments reference Finding numbers (e.g. "Findings 9/16", "Finding 14") in 3 files — see U1.

## Recommended Actions

1. Fix M1 (TOC index space unification) — only correctness defect with user-visible impact.
2. Optionally wrap `ArticleList` in `observer()` (M2) for defensiveness.
3. Consider gating the footer category re-fetch (M3) — minor.
4. L-items are cosmetic/optional.

## Metrics

- Type errors in changed files: 0 (web `tsc --noEmit`).
- i18n key coverage: 19/19 present in en/vi/ko.
- Components >150 LOC: 0 (max 100).
- Hardcoded colors / branding leaks: 0.

## Unresolved Questions

1. **U1 (convention):** `help-article-view.tsx:23-24` and `:24`, `help-center-home.tsx:21`, and the store reference plan finding codes in comments ("Findings 9/16", "Finding 14", "Finding 16"). `.claude/rules/review-audit-self-decision.md` §5 forbids plan/finding references in code comments (they become unresolvable noise after renumbering). Recommend rewording to the *reason* ("request-sequence guard drops a superseded-locale response") without the finding code. Non-blocking but should be cleaned before commit.
2. **U2:** Does the rendered RichTextEditor output preserve the exact heading sequence of `description_html` (relevant to M1 severity)? If the editor normalizes/wraps headings, M1 becomes more frequent and should rise to High. Needs a runtime check with a real authored article containing h1/h2/h3.
3. **U3:** Is there a guaranteed at-least-one published category for the home "featured" slot? `help-center-home.tsx:94` indexes `categories[0]` only inside the `categories.length === 0 ? ... :` else-branch, so it's safe — but confirming the empty-state copy is acceptable to stakeholders for a fresh instance with zero published content.
