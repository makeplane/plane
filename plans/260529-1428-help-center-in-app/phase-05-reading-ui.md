---
phase: 5
title: "Reading UI"
status: done
priority: P1
effort: "3d"
dependencies: [3, 4]
---

# Phase 5: Reading UI

## Implementation Status — 2026-05-30 (done; tsc + lint clean)

Built in `apps/web` (read-only, instance-global). **D6 reconciliation applied** (this phase file
predates the pivot): route stays workspace-prefixed `/:workspaceSlug/help` so it inherits the shell,
but ALL data is fetched from the global slug-less API; reader gates on `IsAuthenticated` only;
**no "Manage" button** (authoring moved to `apps/admin` God Mode — Phase 6). Deep-link decision:
**by slug** — added a small read endpoint `GET /api/help/articles/slug/<slug>/`
(`retrieve_by_slug`) reusing the published+has-title queryset. Featured section = first (lowest
`sort_order`) category (no `is_featured` field — YAGNI).

Files: `apps/web/app/(all)/[workspaceSlug]/(projects)/help/{layout,page,article}.tsx`;
`apps/web/ce/components/help-center/*` (13 components + barrel, all <150 LOC);
`extended.ts` routes; `help-center.service.ts` + `article.store.ts` (slug fetch + slug computed);
`i18n` added `help_center.on_this_page` (en/vi/ko); backend `article.py` + `urls/help_center.py`.

Verified: `pnpm check:types` 0 errors in help files; eslint 0 errors/warnings; code-review pass
(TOC index-space bug fixed → TOC now derives from live DOM; plan-ref comments removed per rules).
**Deferred to P8 (manual/e2e QA):** g18 image-render with `projectId=undefined`; light+dark theme
click-through; locale-switch re-fetch end-to-end.

## D7 Rework — standalone top-level `/help` (2026-05-30, validated; supersedes the route above)

Per D7 the reader moves OUT of the workspace shell to a **standalone top-level `/help`** (no workspace).
Validated GO — `plans/reports/validation-260530-1124-standalone-help-route-d7-report.md`. Changes:

- **Route:** move from `(all)/[workspaceSlug]/(projects)/help/*` to **`apps/web/app/(all)/help/{layout,page,article}.tsx`**
  (under `(all)` auth layout, OUTSIDE `[workspaceSlug]`). Precedent: `settings/profile/layout.tsx` (auth-only,
  no `WorkspaceAuthWrapper`). Register `/help` + `/help/a/:articleSlug` in `extended.ts`.
- **Standalone shell — NOT bare (red-team HIGH):** `(all)/help/layout.tsx` uses `AuthenticationWrapper`
  (`EPageTypes.AUTHENTICATED`) + a lightweight chrome carrying a **"Back to {workspace}" affordance**
  (target = `user.userSettings…last_workspace_slug`, fallback first `useWorkspace().workspaces`). The
  chrome's full header design (product brand identity + signed-in user) is specified in
  **Standalone shell header (D8)** below — **no workspace switcher** (D8 supersedes D-1's optional switcher).
- **`help-content-renderer.tsx`:** DROP the `if(!workspaceId) return null` guard; render without a workspace.
  Renders text + images whose `src` is a global `/api/assets/v2/static/{id}/` URL. (Confirm at impl whether
  the read-only editor calls `getAssetSrc` at render — if it reads `description_html` directly, no
  workspaceId is needed at all.) Does NOT block on P6.
- **Links:** `help-center-header.tsx` (breadcrumb), `help-article-footer.tsx`, `article-list.tsx` change
  `/${workspaceSlug}/help/...` → `/help/...`. `help-article-view.tsx` no longer reads `workspaceSlug` from params.
- **Images:** uploaded images render only if their URL is the global static path — depends on P6 producing
  `HELP_ARTICLE_CONTENT` assets. Text-only / external-image articles render fully without P6.
- **Effort:** small-medium (~2–3h); backend unchanged.

### Reader image viewer (click-to-zoom) — implemented 2026-05-31

Article images render small (editor default ~35% width) and full-screen was only reachable via the
read-only image's hover toolbar (`custom-image` extension). Added the expected "click image to enlarge"
affordance, **help-reader-scoped only**: `help-image-lightbox.tsx` (CE) wraps the read-only editor, delegates
`click` on `img.read-only-image`, and opens the **platform's existing viewer** `ImageFullScreenModal`
(zoom 0.5–2×, pinch ctrl+wheel, drag-pan, download, open-in-tab, Esc/±) — reused via a one-line additive
export from `@plane/editor` (no fork, no behaviour change to other editors). `cursor:zoom-in` hints
clickability; linked images still navigate (`img.closest("a")` guard); user-confirmed scope = help reader
only (not platform-wide). `check:types` (web + @plane/editor) + eslint clean; code-review = no blocking
issues. Deferred (optional): keyboard-open affordance for the image (modal itself is Esc-closable + a11y-labeled).

### Standalone shell header (D8) — product identity + signed-in user

The `/help` top bar (`help-center-header.tsx`, rendered by `(all)/help/layout.tsx`) carries the two things
a workspace-agnostic shell otherwise hides: **which system** this is, and **who is signed in**. Single
52px row (`h-[52px]`, `border-b border-subtle`), 3 zones, all semantic tokens:

- **Left — brand (answers "which system"):** Shinhan Bank logo
  (`import ShinhanBankLogo from "@/app/assets/logos/shinhan-bank-logo.svg?url"`, rendered ~`h-6`, the same
  asset the auth screens use — `auth-screens/header.tsx`) + a thin `bg-border-strong` divider + the
  `t("help_center.breadcrumb_home")` label. The whole brand block is a `<Link to="/help">`.
- **Center — breadcrumb:** on an article page append `› {detail?.title ?? slug}` (current behaviour);
  reactive via `observer()` so the title fills in after fetch + on locale switch.
- **Right — account (answers "who is signed in"):** the existing **"Back to app"** link (resolves to
  last/fallback workspace via `useWorkspace().getWorkspaceRedirectionUrl()`) + a **user avatar menu**
  (new component `help-center-user-menu.tsx`).

`help-center-user-menu.tsx` (new CE component in `apps/web/ce/components/help-center/`, <150 LOC,
`observer()`) reuses the sidebar account pattern at
`apps/web/core/components/workspace/sidebar/user-menu-root.tsx`:

- `Avatar` (`@plane/ui`) with `getFileURL(currentUser?.avatar_url ?? "")` + `currentUser?.display_name`
  (sizes ~20 in the trigger, ~40 in the panel), from `useUser()` (`@/hooks/store/user`).
- `CustomMenu` (`@plane/ui`) dropdown, `placement="bottom-end"`: a header block with the larger avatar +
  `{first_name} {last_name}` + `email`, then a **Sign out** item calling `useUser().signOut()` with the
  existing `t("sign_out")` label and `t("sign_out.toast.error.*")` error toast (`setToast`/`TOAST_TYPE`
  from `@plane/propel/toast`).
- `useUser()`/`signOut()` are **workspace-independent**, so the menu works on `/help` and **for users who
  belong to no workspace** (the auth-gate admits them per D7).

**Brand, NOT a workspace switcher (D8):** `/help` is instance-global/shared (D6); showing one workspace's
logo/name would mislead and would break for no-workspace users — the left zone shows the product brand only.

**Not included (YAGNI):** a "Settings"/"Preferences" item via `toggleProfileSettingsModal` — that modal is
not mounted in the `/help` layout. Add only if the profile-settings modal is first wired into the standalone
shell (or the action navigates to a real settings route).

**i18n:** add `help_center.account_menu_label` (avatar trigger `aria-label`, e.g. VI "Tài khoản") to
en/vi/ko; reuse existing `help_center.breadcrumb_home`, `help_center.back_to_app`, top-level `sign_out`
(+`sign_out.toast.error.title/message`). No hardcoded strings.

**Files (D8 delta):** modify `apps/web/ce/components/help-center/help-center-header.tsx` (3-zone layout +
brand block); create `apps/web/ce/components/help-center/help-center-user-menu.tsx` + export from the
barrel `index.ts`; add the i18n key in `packages/i18n/src/locales/{en,vi,ko}/translations.ts`.

**Implemented 2026-05-30:** built as specified (header 65 LOC, user-menu 66 LOC, both <150; `observer()`;
semantic tokens; no `core/` edits). Sign-out error toast uses `t("auth.sign_out.toast.error.*")` — the
top-level `sign_out.toast.*` path does NOT resolve (top-level `sign_out` is the string "Sign out"; the
nested block lives under `auth`). No-workspace edge case verified safe: `getWorkspaceRedirectionUrl()`
returns `/create-workspace` (never empty), so the back link never breaks. `check:types` (web + @plane/i18n)
+ eslint clean on changed files; code-review = 5/5 acceptance criteria PASS, no blocking issues.

## Overview

The staff-facing Help Center: a branded `/:workspaceSlug/help` portal with a category grid
("by function"), in-page search, article list, and article detail rendering stored rich content
read-only — all in the user's current UI locale with graceful fallback.

## Requirements

- Functional: home with category cards + search box; category → article list; article detail with
  breadcrumb + read-only rich content; deep-linkable article URLs; locale follows `currentLocale`,
  shows "shown in <lang>" notice when content falls back.
- Non-functional: lives in CE; route nested under workspace shell (sidebar/header preserved);
  components <150 LOC. **Follow `plan.md` → "UI/UX Inheritance"**: semantic tokens only
  (`text-primary/secondary/tertiary`, `bg-canvas/surface-1/surface-2`, `border-subtle`) — NO hardcoded
  colors; reuse standard components (Propel `Card`/`EmptyState*`/`Spinner`/`Button`, `@plane/ui`
  `Breadcrumbs`) instead of hand-rolling; responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`;
  a11y (search landmark, breadcrumb `aria-label`, TOC `aria-current`); dark mode auto-inherits via tokens.

## Architecture

Routes (React Router v7) — add to `apps/web/app/routes/extended.ts` inside the `(projects)` layout,
mirroring the `ho` route (`core.ts:108-111`):

```
layout("./(all)/[workspaceSlug]/(projects)/help/layout.tsx", [
  route(":workspaceSlug/help", "./(all)/[workspaceSlug]/(projects)/help/page.tsx"),
  route(":workspaceSlug/help/a/:articleSlug", "./(all)/[workspaceSlug]/(projects)/help/article.tsx"),
]),
```

- `layout.tsx`: `<AppHeader header={<HelpCenterHeader/>} />` + `ContentWrapper` + `<Outlet/>`.
  `HelpCenterHeader` (new CE component) renders the `@plane/ui` `Breadcrumbs` (Shinhan Workspace ›
  Category › Article) — breadcrumb lives in the HEADER, not page body, matching the workspace-standard
  pattern `stickies/layout.tsx:8-15` + `stickies/header.tsx:28-40` (NOT the breadcrumb-less `ho` layout).
- `page.tsx` (home): `PageHead` title + `<HelpCenterHome/>` (from CE).
- `article.tsx`: reads `useParams().articleSlug` → `<HelpArticleView/>`.

Components (`apps/web/ce/components/help-center/`), each <150 LOC:

- `help-center-home.tsx` — header, `<HelpSearchBox/>`, `<CategoryGrid/>`.
- `category-grid.tsx` + `category-card.tsx` — cards (icon/color/name/article_count) → on click
  expand list or navigate; uses `useHelpCenter().getCategoriesSorted`. **Card = Propel `Card`**
  (`@plane/propel/card`, `variant=WITH_SHADOW`, `spacing=LG`, `onClick` to navigate) — do NOT hand-roll
  card styling; grid is responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- `article-list.tsx` — list of articles in a category (title resolved in locale).
- `help-article-view.tsx` — fetch by slug+locale, `<HelpBreadcrumb/>`, title, `<LocaleFallbackNotice/>`,
  `<HelpContentRenderer/>`.
- `help-content-renderer.tsx` — render read-only with **`RichTextEditor` (web wrapper at
  `@/components/editor/rich-text`) `editable={false}`**, NOT `DocumentEditor`. Precedent:
  `apps/web/core/components/core/description-versions/modal.tsx:127` (RichTextEditor editable={false}
  - workspaceId guard pattern). Reason to avoid DocumentEditor: it is collaborative/Hocuspocus-backed
    (heavy, designed for live co-edit), not because projectId breaks asset URLs (asset URLs in
    `packages/utils/src/editor/common.ts:23-27` fall back to workspace-slug path when projectId is undefined).
    **Import**: `import { RichTextEditor } from "@/components/editor/rich-text"` (the web wrapper —
    `@plane/editor` exports `RichTextEditorWithRef`, NOT a bare `RichTextEditor`).
    **workspaceId wiring**: resolve via `useWorkspace().getWorkspaceBySlug(workspaceSlug)?.id`; guard
    `if (!workspaceId) return null` before rendering (mirrors modal.tsx:61,76).
    **Props**: `workspaceSlug={workspaceSlug}` + `workspaceId={workspaceId}` + `projectId={undefined}` +
    `editable={false}`.
    **Reader renders from the sanitized `description_html` ONLY** (Validation Session 1, decision 1): the
    stored `description_json` is NEVER trusted/rendered on the read path — this closes the JSON-XSS path
    (Finding 2/3) without dropping the json column (it stays for author-side edit fidelity, Phase 6).
    When the resolver returns no translation, render `<HelpContentUnavailable/>` (Finding 8), not a blank editor.
- `help-article-toc.tsx` — optional sticky Table-of-Contents sidebar for long articles (D4). Reads
  headings via editor `getHeadings()` API (`packages/editor/src/core/types/editor.ts:127`, returns
  `IMarking[]`) when the ref is available, OR parses `description_html` h1-h3 tags as fallback for
  the initial (pre-hydration) render. Renders anchor jump-links; highlights active heading on scroll.
  Improves "dễ dàng tìm hiểu" on multi-section guides. Only shown when ≥2 headings detected.
- `help-search-box.tsx` — the SOLE help-search surface (D5: no Cmd+K help search). Debounced query →
  `useHelpCenter().fetchArticles({search,locale})` (list `?search=`, NOT a separate endpoint) → results
  list linking to `/help/a/:slug`. Backend search (Phase 2) is **multilingual** (matches across VI/EN/KO
  content) and **Vietnamese accent-insensitive** ("tai chinh" finds "Tài chính") — so the box must be
  prominent on home + reachable from category/article views. Show each result's `matched_locale` when it
  differs from the current locale (e.g. a small "EN"/"KO" tag) so users understand a cross-locale hit.
  Empty results → suggest browsing categories (no dead end).
- `help-breadcrumb.tsx` — Shinhan Workspace › Category › Article (D2: no "Plane" branding). **Built on
  the `@plane/ui` `Breadcrumbs` composite** (`Breadcrumbs.Item` + `BreadcrumbLink`, precedent
  `stickies/header.tsx:31-40`), NOT a custom breadcrumb; rendered inside `HelpCenterHeader` (layout).
- `locale-fallback-notice.tsx` — shown when `resolved_locale !== currentLocale` ("shown in {language}").
- `help-center-empty-state.tsx` / `help-content-unavailable.tsx` — no categories/articles yet, or an
  article that resolves to no translation (Finding 8) — render a message, never blank/500. **Built on
  Propel empty-state** (`@plane/propel/empty-state`): `EmptyStateCompact` for inline (no categories/
  articles), `EmptyStateDetailed` for the full-page article-unavailable case — do NOT hand-roll the empty
  layout. Loading states use Propel `Spinner` (`@plane/propel/spinners`).
- `help-article-footer.tsx` — cross-article nav (D4): prev/next sibling within the same category
  (computed from `sort_order` neighbor — no extra API; derive from the already-fetched category article
  list). "More in this category" list (3-5 related titles). Optional "Was this helpful?" link that
  deep-links to the existing workspace support channel (no new model; use workspace contact URL from
  workspace settings or a hardcoded support channel; component is conditional on config presence).
- `help-center-featured-section.tsx` — optional "Bắt đầu tại đây" (Get Started Here) pinned section
  on the Help home (D4). Pinned category displayed prominently above the category grid. No schema
  change; sourced from a `is_featured` boolean on `HelpCategory` (set via admin, Phase 6) or
  simply the lowest `sort_order` category if no feature flag exists yet — whichever Phase 6 decides.
  Falls back gracefully (renders nothing) if no category is pinned.

Locale + reactivity (Finding 14): `const { currentLocale, t } = useTranslation()` → pass `currentLocale`
to all fetches. EVERY locale-reactive component MUST be wrapped in `observer()` (mobx-react) — the i18n
store is observable but `useTranslation` reads it via plain `useContext`, so an un-observed component
won't re-render/re-fetch on language switch (the codebase's `PagesVersionEditor` is `observer`-wrapped).

Fetch safety (Findings 9, 16): deep-link fetches in `useEffect` keyed on `[slug, articleSlug,
currentLocale]` must use an `AbortController`/request-sequence guard so a late stale-locale response
can't overwrite a newer one. Handle 404 (article not found / soft-deleted) explicitly.

## Related Code Files

- Modify: `apps/web/app/routes/extended.ts`
- Create: `apps/web/app/(all)/[workspaceSlug]/(projects)/help/{layout.tsx,page.tsx,article.tsx}`
- Create: `apps/web/ce/components/help-center/*` (components above) + `index.ts` barrel
- Read for pattern: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/{layout.tsx,page.tsx}` (route shell),
  `apps/web/core/components/core/description-versions/modal.tsx:127` (CORRECT read-only precedent:
  `RichTextEditor editable={false}` + workspaceId guard; replaces the previously cited
  `pages/version/editor.tsx:92-104` which uses project-scoped DocumentEditor — not applicable here),
  `apps/web/core/components/editor/rich-text/editor.tsx:23-27` (web wrapper required props:
  workspaceSlug + workspaceId), `pages/list/search-input.tsx` (search input UX),
  `packages/i18n/src/hooks/use-translation.ts:14,30` (`currentLocale`, untyped `t`),
  `packages/editor/src/core/types/editor.ts:127` (getHeadings API for TOC component)

## Implementation Steps

1. Read the `ho` route layout/page for the workspace-shell pattern AND `stickies/{layout,header}.tsx` for
   the breadcrumb-in-header pattern; add help routes to `extended.ts`. Build `HelpCenterHeader` (`@plane/ui`
   `Breadcrumbs`) and pass it to `<AppHeader header={...} />`.
2. Build read-only `help-content-renderer.tsx`:
   - Import `RichTextEditor` from `"@/components/editor/rich-text"` (web wrapper, NOT `@plane/editor`).
   - Resolve `workspaceId` via `useWorkspace().getWorkspaceBySlug(workspaceSlug)?.id`; guard
     `if (!workspaceId) return null`.
   - Props: `workspaceSlug`, `workspaceId`, `projectId={undefined}`, `editable={false}`.
   - Render from `description_html` only.
   - Manually verify with an article that CONTAINS AN UPLOADED IMAGE (not just text) to confirm
     asset URLs resolve correctly with `projectId` undefined (success criterion g18).
3. Build `help-article-toc.tsx`: parse headings from `description_html` h1-h3 on first render; wire
   to editor `getHeadings()` via ref when available; render sticky anchor list; only show if ≥2 headings.
4. Build home: `help-center-featured-section.tsx` (pinned/first category "Bắt đầu tại đây") +
   `category-grid.tsx` + `help-search-box.tsx`. Use "Shinhan Workspace" in all user-facing labels (D2).
5. Build article view: `help-article-view.tsx` with breadcrumb (Shinhan Workspace › …) + content +
   fallback notice + `help-article-toc.tsx` + `help-article-footer.tsx` (prev/next + related articles
   - optional "Was this helpful?" link). Wire deep-link by slug.
6. Build `help-article-footer.tsx`: compute prev/next from category article list sort_order neighbors;
   render "More in this category" list; conditionally render "Was this helpful?" link.
7. Build empty/loading states; ensure locale switch re-fetches content (observer() wrapping).
8. Type-check + manual click-through against seeded data (create a few articles via Phase-6 UI or API).

## Success Criteria

- [ ] `/:workspaceSlug/help` renders with sidebar/header intact; home shows "Bắt đầu tại đây" + category grid + search (no "Plane" text — "Shinhan Workspace" branding per D2)
- [ ] Article detail renders stored rich content read-only (images/lists/tables OK)
- [ ] **g18**: article with an UPLOADED IMAGE renders correctly with `projectId={undefined}` — image URL resolves via workspace-slug path (`/api/assets/v2/workspaces/<slug>/…`)
- [ ] Switching UI language (vi↔en↔ko) changes shown content; fallback notice appears when needed
- [ ] Deep link `/help/a/:slug` loads directly
- [ ] Search returns and links to results; empty/loading states correct
- [ ] In-article TOC renders for articles with ≥2 headings; anchor links scroll correctly
- [ ] Prev/next within category + "More in this category" list visible at article foot
- [ ] Breadcrumb rendered via `@plane/ui` `Breadcrumbs` inside `HelpCenterHeader` (in `AppHeader`, not page body)
- [ ] Category cards use Propel `Card`; empty/loading via Propel `EmptyState*`/`Spinner` — no hand-rolled chrome
- [ ] Only semantic tokens used (no `bg-gray-*`/hex); UI verified in BOTH light and dark theme
- [ ] Responsive: category grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; a11y landmarks/aria set
- [ ] **D8 header:** left brand block (Shinhan logo + "Trung tâm trợ giúp", links to `/help`) is visible on home AND article pages → the system is identifiable everywhere, incl. article deep-links
- [ ] **D8 header:** right side shows the signed-in user (avatar + name/email) with a working **Sign out**; renders correctly for a user with NO workspace (no workspace switcher anywhere)
- [ ] `help-center-user-menu.tsx` <150 LOC, `observer()`-wrapped, reuses `Avatar`/`CustomMenu`/`useUser`; only semantic tokens; new `help_center.account_menu_label` present in en/vi/ko
- [ ] All components <150 LOC; no `core/` modified

## Risk Assessment

- **Editor import (g2/g6, compile-blocker)** → import `RichTextEditor` from `"@/components/editor/rich-text"`
  (web wrapper), NOT from `"@plane/editor"` (that package only exports `RichTextEditorWithRef`).
  Guard workspaceId before render. Validate with an image in Step 2 (g18).
- **DocumentEditor avoided (correct reason)** → DocumentEditor is Hocuspocus-collaborative (heavy),
  not because projectId breaks asset URLs (asset URLs fall back to workspace-slug gracefully per
  `packages/utils/src/editor/common.ts:23-27`). Avoids pulling in collaborative sockets for a read-only view.
- **Content-pick (Finding 4)** → reader renders `description_html` directly (Validation decision 1) — no
  json/html pick on the read path, so the `json || html` truthy-`{}` trap can't occur here (it applies
  to the author editor load, Phase 6).
- **Reactivity (Finding 14)** → wrap locale-reactive components in `observer()`.
- **SPA, no loaders** → fetch in `useEffect`; explicit loading + 404 + content-unavailable (Finding 8) states.
- **Stale-locale race (Findings 9/16)** → AbortController/request-token guard; effects keyed on
  `[slug, articleSlug, currentLocale]` only.
- **Slug reuse after soft-delete (Finding 16) — RESOLVED (Validation decision 3)**: slug is **globally
  unique per workspace** (constraint NOT conditioned on `deleted_at`), so deleted slugs are never reused.
  Old bookmarks to a removed article 404 cleanly (no silent content swap). Phase 5 just renders a clean 404.
- **TOC component** → getHeadings() only available after editor hydration; parse `description_html` h1-h3
  for immediate SSR/first-render; wire ref-based API afterward. Render nothing if <2 headings detected.
- **Footer prev/next** → derives from category article list already fetched; no additional API call.
  Handle edge cases: first/last article in category (no prev/next link shown).
- **D2 branding** → search all user-visible strings in this phase's components for "Plane"; replace
  with "Shinhan Workspace". No change to internal code identifiers.

## Follow-up — preview/reader parity + unsaved-changes guard (2026-06-01; tsc + lint clean, adversarial review pass)

Two consistency fixes after review of the God Mode authoring screen vs the public reader:

- **Seeded tables rendered at ~half width** (reader AND God Mode preview). Root cause: editor cell
  `colwidth` defaults to `[150]` (`packages/editor/.../table/table-cell.ts`), so seeded tables — whose
  stored HTML carries no `colwidth` — render at a fixed `150px×cols` inline width that beats the base
  `table { width:100% }`. Fix = scoped CSS override `table { width:100% !important; table-layout:auto }`
  in BOTH the reader wrapper (`apps/web/ce/components/help-center/help-image-lightbox.tsx`) and a NEW
  God Mode preview wrapper. Deliberately NOT changing the shared editor default (would break doc-editor
  column resize). Known limit: a genuinely wide table wraps instead of horizontal-scroll (fine for help).
- **God Mode preview lacked image parity** → NEW `apps/admin/.../help-center/components/help-preview-content.tsx`
  mirrors the reader: content images fill the column (read-only default is 35%) + click/Enter opens
  `ImageFullScreenModal` (zoom/pan/download). Wrapped the preview branch in `translation-locale-editor.tsx`.
  Both wrappers also reset per-image center/right alignment offsets so a full-width image stays flush.
- **Unsaved-edit data loss on leave** → NEW `discard-changes-modal.tsx` + `use-unsaved-changes-guard.ts`
  (`useBlocker` for in-app nav / browser Back + `beforeunload` for refresh/close). `translation-tabs.tsx`
  computes `isDirty` (draft title/HTML vs saved); `article-editor-panel.tsx` Back button + the route
  blocker both confirm before leaving. No false dirty (editor emits no onChange on mount), auto-clears
  on save, no double-prompt on delete. English-only (admin), no `core/` edits.
