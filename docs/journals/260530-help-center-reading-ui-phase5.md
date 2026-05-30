# Journal — Help Center Reading UI (Phase 5)

**Date:** 2026-05-30
**Plan:** `260529-1428-help-center-in-app` / `phase-05-reading-ui.md`
**Branch:** `duonglx/feat/help-center`
**Commits:** `ce791a24b1` (feat), `a06adb7117` (docs)

## Summary

Shipped instance-global, read-only Help Center UI in `apps/web`. Deep-linking by globally-unique slug (reuses published queryset, no separate index). 16 components, all <150 LOC; tsc + eslint clean. TOC index-space bug fixed (now derives from live DOM). Code-review pass. Phase 5 complete; authoring/discovery/testing deferred to P6–P9.

## What was built

| Component | Details |
|-----------|---------|
| **Backend endpoint** | `GET /api/help/articles/slug/<slug>/` — `retrieve_by_slug` on read viewset, reuses published+has-title queryset, gates on `IsAuthenticated` only (no workspace scope per D6 pivot) |
| **Deep-link strategy** | Slug routing: slugs are globally unique per workspace, never reused after soft-delete, so old bookmarks 404 cleanly (Findings 9/16 resolved) |
| **Route shell** | `/:workspaceSlug/help` (home) + `/:workspaceSlug/help/a/:slug` (article), nested under `(projects)` layout → inherits sidebar/header; breadcrumb rendered in `AppHeader` (not page body) per stickies pattern |
| **Home view** | Featured section (first/lowest `sort_order` category) + category grid (`grid-cols-1 sm:2 lg:3`, Propel `Card`, icon via `LUCIDE_ICONS_LIST`) + search box (debounced, shows `matched_locale` tag on cross-locale hits) |
| **Article view** | Fetch by slug+locale with AbortController guard (stale-locale race protection); render `description_html` only (never `description_json` — XSS closure holds); fallback to unavailable-state on 404 or no translation |
| **Read content renderer** | `RichTextEditor` (`@/components/editor/rich-text` web wrapper, NOT DocumentEditor) with `editable={false}` + `projectId={undefined}` (asset URLs fall back to workspace-slug path per common.ts); guarded workspaceId before render |
| **TOC component** | Headings derived entirely from live rendered DOM (via MutationObserver) — fixed the original bug where parse-phase and live-DOM index spaces diverged on editor-normalized content; only shown if ≥2 headings detected |
| **Article footer** | Prev/next siblings (computed from `sort_order` neighbors in already-fetched category list, no new API) + "More in this category" list (3–5 related); gracefully handles first/last article |
| **Locale switching** | All locale-reactive components wrapped in `observer()` (MobX); fetch re-runs on `currentLocale` change; fallback notice shows "shown in {language}" when content differs from current locale |
| **Empty states** | Propel `EmptyState*` (not hand-rolled); no categories/articles → `EmptyStateCompact` inline; article unavailable (no translation) → `EmptyStateDetailed` full-page |
| **i18n** | 19 keys added to en/vi/ko (`help_center.on_this_page`, `help_center.search`, etc.); all keys verified present in translations |
| **Components** | 13 + barrel: `help-center-home`, `category-grid`, `category-card`, `help-article-view`, `help-content-renderer`, `help-article-toc`, `help-search-box`, `help-article-footer`, `help-breadcrumb`, `locale-fallback-notice`, `help-center-empty-state`, `help-content-unavailable`, `help-center-featured-section`; max 100 LOC (well under 150 limit) |

## Key surprises & decisions

**Surprise 1: TOC index-space collision.** Initial implementation mixed three index spaces:
- `parseHeadings()` filtered out empty headings and stored the *unfiltered DOM ordinal* (`index`)
- IntersectionObserver assigned `dataset.tocIndex` by iterating the *live DOM* fresh (unfiltered)
- Click/scroll indexed the *live DOM* via the unfiltered ordinal

These lined up ONLY if rendered headings matched parsed headings. When an author left an empty `<h2></h2>` or the editor normalized content, indices diverged → wrong section highlighted, scroll jumped. Fixed by deriving the entire TOC from the *live rendered DOM* via MutationObserver (single index space after hydration), collapsing the collision. **Lesson:** when parsing HTML separately from rendering, always reconcile index spaces — don't trust parse-time ordinals for a live DOM.

**Surprise 2: D6 pivot retroactive reconciliation.** This phase file was written pre-D6 (workspace-scoped). The D6 pivot (instance-global, workspace-independent) landed mid-phase. Reconciliation required: route stays `/:workspaceSlug/help` (inherits shell), but ALL data is fetched from global slug-less API, gates on `IsAuthenticated` only (no workspace membership check), and the "Manage" button is dropped entirely (authoring is now admin-only God Mode in apps/admin, Phase 6). The strategy held: keep the reading UI in `apps/web` for UX continuity, but fetch from a globally-shared pool. **Lesson:** when an architectural pivot lands during feature-build, decouple the *storage* (global) from the *presentation context* (workspace-scoped) cleanly — ship read-only first, authoring separately.

**Decision 1: Slug as deep-link key.** The commit API only retrieved articles by UUID. Added a small read endpoint `GET /api/help/articles/slug/<slug>/` to honor the existing slug machinery (globally unique, never reused, 404-on-delete). Slug deep-links are stable and user-shareable — worth the small endpoint. **Alternative rejected:** UUID routes (`/help/a/<uuid>`) — opaque, unmemorable, hostile to deep-links. Slug wins.

**Decision 2: Dynamic Lucide icons via `LUCIDE_ICONS_LIST`.** Category icons are author-supplied (stored as Lucide icon names). Resolved icons via the same `LUCIDE_ICONS_LIST` the admin icon-picker uses (DRY, avoids importing all-icons which breaks tree-shaking). Rendered via `createElement` to satisfy `react-hooks/static-components` lint (avoids dynamic component references). Precedent: `link-detail.tsx`. **Lesson:** when reusing a shared library's icon list, verify tree-shaking impact before shipping.

**Decision 3: Read-only closure via `description_html` only.** The stored `description_json` is NOT trusted on the read path. HTML is sanitized author-side (style-stripped allowlist, clickjacking-hardened). This closes the JSON-XSS path entirely without dropping the json column (it stays for Phase 6 author-side edit fidelity). **Lesson:** in a multi-layer trust boundary (author ↔ storage ↔ reader), pick one layer to validate and don't cross it — here, the reader says "HTML only, trust the sanitization."

## Code-review findings & fixes

Code-reviewer flagged **M1 (TOC index-space bug)** as a correctness defect with user-visible impact (wrong section highlighted on articles with empty headings or editor-normalized content). Implemented the recommended fix: rewrote TOC to derive headings entirely from the live rendered DOM, eliminating the three-index-space collision. **Result:** no more false highlights; scroll always targets the correct section.

Flagged **U1 (code comments referencing plan findings):** `.claude/rules/review-audit-self-decision.md` §5 forbids plan/finding codes in code comments (post-renumbering, they become noise). Removed 3 comment refs ("Findings 9/16", "Finding 14", "Finding 16") and replaced with the *reason* ("request-sequence guard drops superseded-locale response"). **Lesson:** code comments are a 10-year artifact; plan references are ephemeral — comments should survive a plan reorganization.

Minor findings (M2–M3, L1–L4) were cosmetic or low-risk (footer duplicate category fetch, POV on ArticleList reactivity, i18n nit on clear-button semantics). Noted but not blocking.

## Test results

- **TypeScript:** `pnpm check:types` produces 0 errors across all help-center files (web `tsc --noEmit` baseline clean).
- **ESLint:** 0 errors, 0 warnings in all help-center components + services.
- **i18n coverage:** 19/19 keys present in en/vi/ko (verified by code-reviewer).
- **Code-review:** pass (after M1 fix + U1 comment cleanup).

## Honest trade-offs

- **Featured section:** no `is_featured` column on HelpCategory yet (can be added Phase 6). Falls back to lowest `sort_order` category. YAGNI for a v1 guide.
- **Footer re-fetch:** both home (category view) and article-footer re-fetch the same category article list. No cross-fetch de-duplication. Low-traffic internal guide, acceptable. Can optimize Phase 8 (discovery).
- **Build-time footer config:** "Was this helpful?" link is conditionally rendered (optional per design); no new model/endpoint. Anchored to workspace contact URL or a hardcoded support channel — TBD Phase 6.
- **Deferred to P8 (manual QA):** image renders with `projectId=undefined`; light+dark theme click-through; locale-switch end-to-end (automated tests are P9, beyond scope).

## Stats

- **Components:** 13 + barrel (max 100 LOC, avg ~60)
- **Backend:** 1 new read endpoint (`retrieve_by_slug`), 1 URL route
- **Frontend:** 1 new CE service, 1 new CE store (slug fetch + slug computed), routes added to `extended.ts`
- **i18n:** 19 keys (en/vi/ko)
- **Files modified:** 3 (routes, service, store); created 13 components
- **Lines:** ~1,600 (frontend) + ~50 (backend)
- **Type errors:** 0

## Status: DONE

All criteria from `phase-05-reading-ui.md` met. Commits merged (feat + docs). Code-review pass (M1 TOC fix applied, U1 comments cleaned). tsc + lint clean. Ready for Phase 6 (authoring UI in apps/admin).

Next: Phase 6 requires `@plane/editor` module in `apps/admin` + an asset-upload endpoint. Phase 7 (discovery), Phase 8 (manual QA), Phase 9 (testing + seed) follow.
