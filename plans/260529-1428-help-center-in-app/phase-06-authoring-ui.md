---
phase: 6
title: "Authoring UI"
status: done
priority: P1
effort: "3.5d"
dependencies: [3, 4]
---

# Phase 6: Authoring UI

> **DONE (2026-05-30):** Built God Mode authoring in `apps/admin` (per D6/D7), NOT `apps/web/ce`
> (this file's original workspace-admin design was superseded — see the D7 NOTE below).
> **Delivered:**
> - Backend global image assets: `HELP_ARTICLE_CONTENT` added to `FileAsset.EntityTypeContext` +
>   `asset_url` static branch (`asset.py`); `StaticFileAssetEndpoint` allowlist + `is_deleted`→404 guard
>   (`v2.py`); God Mode upload endpoint `InstanceHelpArticleAssetEndpoint` (presigned POST + mark-uploaded)
>   in `license/api/views/help_center.py` + URLs. No migration (entity_type is a plain CharField).
> - Editor ported into `apps/admin` (added `@plane/editor` dep + styles import) via a thin
>   `HelpRichTextEditor` (RichTextEditorWithRef) + `editor.helper.ts` file handler (global static asset src,
>   no workspace) + always-visible `HelpEditorToolbar` (headings/marks/lists/quote/code/table/image) +
>   live preview (editable=false). Mentions disabled (stub handler).
> - Data layer: `packages/types/src/help-center.ts`, `packages/services/.../instance-help-center.service.ts`
>   (CRUD + translations + 3-step image upload), `apps/admin/store/instance-help-center.store.ts` + hook +
>   root.store registration.
> - UI (`apps/admin/app/(all)/(dashboard)/help-center/`): page + sidebar entry + route; category list/form
>   (VI/EN/KO Propel Tabs + EmojiIconPicker lucide picker + active), article list, article create modal,
>   article editor panel (slug editable-while-draft, publish guard ≥1 titled translation, delete confirm),
>   translation tabs (per-locale title + WYSIWYG + preview + copy-between-locales), reorder via sort_order
>   midpoint (no bespoke endpoint).
> - Web reader L2 cleanup: `help-content-renderer.tsx` now uses a help-only read file handler resolving
>   global `/api/assets/v2/static/{id}/` images — zero workspace dependency.
> **Verified:** admin+web `tsc` clean; admin eslint 0 errors; `manage.py check` ok; URL reverse + asset_url
> verified live; backend unit suite 240 pass (failures pre-existing). Code review: ship-ready (M1 delete-
> toast fixed). Remaining live/e2e QA (image upload round-trip, light/dark, locale switch) folded into P8.

> **D7 NOTE (2026-05-30):** Authoring moved to `apps/admin` God Mode (per D6) — this phase file's
> `apps/web/ce` workspace-admin design is SUPERSEDED (see `plans/reports/from-scout-to-cook-help-center-global-redesign-report.md` §2 P6).
> **D7 makes the global image-asset strategy REQUIRED** (the standalone `/help` reader has no workspace,
> so images must use workspace-agnostic URLs): implement redesign-report §4 — add `HELP_ARTICLE_CONTENT`
> to `FileAsset.EntityTypeContext`, return `/api/assets/v2/static/{id}/` from `asset_url`, add it to the
> `StaticFileAssetEndpoint` allowlist (AllowAny) **+ a `if asset.is_deleted: return 404` guard** (red-team MED),
> and a God Mode upload endpoint creating `FileAsset(workspace_id=NULL, entity_type=HELP_ARTICLE_CONTENT)`.
> On save, ensure sanitized `description_html` image `src` is ONLY the global static path (reject/rewrite
> workspace-scoped src). Public image endpoint = accepted risk (UUIDv4, matches avatars) — decision D-2.
> **L2 cleanup (when global assets land):** `help-content-renderer.tsx` currently feeds the read-only
> editor a `workspaceId` from the user's first workspace (`Object.values(workspaces)[0]`) ONLY for image
> asset-URL construction. Once help images use the global `/api/assets/v2/static/{id}/` path, drop that
> first-workspace lookup so the standalone reader has zero workspace dependency.

## Overview

Admin-only authoring surface so non-technical staff/BA create and maintain categories + articles
through the familiar Tiptap WYSIWYG — per-locale (VI/EN/KO) title + content, draft/publish, and
drag/reorder. Gated to workspace ADMIN (D1 — deliberate, confirmed); no code/markdown/git needed
by authors. Platform is "Shinhan Workspace" — do not reference "Plane" in user-facing help text (D2).

## Requirements

- Functional: manage categories (name per locale, icon, color, order); manage articles (category,
  slug, status); edit each article's 3 locale translations (title + rich content) with WYSIWYG;
  publish/unpublish; reorder; delete with confirm.
- Non-functional: ADMIN-gated (hidden + route-guarded + server-enforced); WYSIWYG = same Tiptap
  family as Pages; components <150 LOC; CE only. **Follow `plan.md` → "UI/UX Inheritance"**: locale tabs
  via Propel `Tabs`; inputs via Propel `Input` (`bg-layer-2`); buttons via Propel `Button`; forms use
  semantic tokens (`bg-surface-1` container, `border-subtle`, `text-primary`) — NO hardcoded colors; verify
  light + dark theme.

## Architecture

Route (add to `extended.ts`, same `(projects)` layout):

```
route(":workspaceSlug/help/manage", ".../help/manage.tsx"),
route(":workspaceSlug/help/manage/articles/:articleId", ".../help/manage-article.tsx"),
```

Guard: `useUserPermissions().allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE,
workspaceSlug)` — non-admins redirect to `/help` (server already 403s writes). A "Manage" button on
`HelpCenterHome` is rendered only when admin. **D1 (confirmed):** ADMIN-only is intentional, not
a security side-effect. Fork has only 3 roles (ADMIN=20/MEMBER=15/GUEST=5); no intermediate role
exists. Precedent: `apps/api/plane/app/views/webhook/base.py:21,38` →
`@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")`.

Components (`apps/web/ce/components/help-center/authoring/`), each <150 LOC:

- `help-admin-dashboard.tsx` — tabs/sections: Categories list + Articles list with edit/delete/reorder
  - "New" buttons.
- `category-form.tsx` — locale tabs (vi/en/ko) name inputs, **visual icon picker** (see g12 below),
  color, sort_order; uses `react-hook-form`. Locale tabs = Propel `Tabs` (`@plane/propel/tabs`); name
  fields = Propel `Input` (`@plane/propel/input`).
- `article-form.tsx` — category select, status toggle, slug field. **Slug is generated SERVER-SIDE**
  (Finding 11) from the first available title (VI→EN→KO), diacritics transliterated, collision-suffixed —
  there is NO frontend slugify in the repo and django `slugify` strips Vietnamese diacritics. Slug shown
  read-only; editable only while `status=draft`, frozen after first publish. **Publish is disabled in the
  UI unless ≥1 locale has a non-empty title** (Finding 13; server enforces it too). Contains `<TranslationTabs/>`.
- `translation-tabs.tsx` — VI/EN/KO tabs built on Propel `Tabs` (`@plane/propel/tabs`:
  `Tabs.Root/List/Trigger/Content` — inherits a11y + keyboard nav, do NOT hand-roll tab chrome); each
  tab = title `Input` + `<HelpRichTextEditor/>`; per-locale
  "missing translation" badge; save calls `upsertTranslation`. **Copy-between-locales action** (D4/g13):
  when a target locale is empty, show "Copy from <locale>" button that prefills title + content from a
  filled sibling locale (client-side; calls Phase-4 helper); author then edits + saves normally.
- `help-rich-text-editor.tsx` — `RichTextEditor` from `"@/components/editor/rich-text"` (NOT
  `"@plane/editor"`; `@plane/editor` exports only `RichTextEditorWithRef`). Props:
  `workspaceSlug: string`, `workspaceId: string` (resolve via
  `useWorkspace().getWorkspaceBySlug(workspaceSlug)?.id`; guard `if(!workspaceId) return null`),
  `projectId={undefined}`, `editable={true}`. Precedent:
  `apps/web/core/components/core/description-versions/modal.tsx` (~line 20, 58-61, 76, 127-138).
  Editable branch ALSO requires `uploadFile`, `duplicateFile`, `searchMentionCallback`
  (`apps/web/core/components/editor/rich-text/editor.tsx:31-39`). Wiring:
  - `uploadFile` = `FileService.uploadWorkspaceAsset(workspaceSlug, ...)` →
    `/api/assets/v2/workspaces/<slug>/` (`apps/web/core/services/file.service.ts:72`,
    `apps/api/plane/app/urls/asset.py:50` `WorkspaceFileAssetEndpoint`) — no project needed.
  - `duplicateFile` — pass a real duplicate handler or a noop stub (`async () => ""`).
  - `searchMentionCallback` — pass `async () => ({})` (trivial noop; no mention in help articles)
    OR add `"mention"` to `disabledExtensions`. Either silences the required-prop constraint.
  - The wrapper internally calls `getEditorFileHandlers({ projectId: undefined, uploadFile, duplicateFile,
  workspaceId, workspaceSlug })` (`apps/web/core/components/editor/rich-text/editor.tsx:80-86`);
    asset URLs resolve workspace-scoped (`packages/utils/src/editor/common.ts:23-27`).
    Load existing content with `isJSONContentEmpty(description_json) ? description_html : description_json`
    for edit fidelity (Finding 4 — never `json || html`). `onChange` → `{ description_html, description_json }`.
    Server sanitizes `description_html` (drops `style`); reader renders html only. Non-collaborative — fine
    for docs.
    **FIXED TOOLBAR (D4/g5 — critical for non-technical BA):** add an always-visible formatting toolbar
    above the editor (reuse `TOOLBAR_ITEMS` from `apps/web/core/constants/editor.ts:182`, incl. image
    at `:168-175` and table at `:178`); drive via `editorRef.executeMenuItemCommand / isMenuItemActive /
onStateChange` (pattern: `apps/web/core/components/editor/lite-text/toolbar.tsx:86-99`; always-visible
    wrap: `lite-text/editor.tsx:177-222`). Buttons: headings, bold/italic/underline/strike, lists, quote,
    code, link, image, table. BA must NOT be required to know slash-commands or bubble-menu pre-selection.
    **LIVE PREVIEW (D4/g9):** add a Preview toggle/tab that renders the current locale's content via
    `RichTextEditor editable={false}` fed the current `description_html`, so authors see the published
    read-view result (reader strips `style`; editor live view can differ slightly).
    **KNOWN LIMITATION (g15):** `custom-image` extension has no alt attribute
    (`packages/editor/src/core/extensions/custom-image/types.ts:11-19` — ID/WIDTH/HEIGHT/ASPECT_RATIO/
    SOURCE/ALIGNMENT/STATUS only). Image alt-text support deferred to Phase 9 enhancement (YAGNI).
- **g12 — Visual icon picker:** In `category-form.tsx`, replace hand-typed lucide name string with
  Propel's `EmojiIconPicker` (`packages/propel/src/emoji-icon-picker/`, `LUCIDE_ICONS_LIST` from
  `lucide-icons.tsx:165`, `iconType="lucide"`). Author picks icon visually; store still saves the icon
  name string — model unchanged.
- `reorder-list.tsx` — up/down (or dnd) computes a new `sort_order` between neighbors and calls
  `updateCategory/updateArticle` (mirror `apps/web/core/store/label.store.ts:242-274`) — NO bespoke
  reorder endpoint (Finding 12).
- `delete-confirm-modal.tsx` — Propel Dialog confirm.

Save flow: article metadata (category/slug/status) via `updateArticle`; each locale via
`upsertTranslation(slug, articleId, locale, {title, description_html, description_json})`. Show
saved/error toasts (`@plane/propel` toast/`setToast`).

## Related Code Files

- Modify: `apps/web/app/routes/extended.ts`
- Create: `apps/web/app/(all)/[workspaceSlug]/(projects)/help/{manage.tsx,manage-article.tsx}`
- Create: `apps/web/ce/components/help-center/authoring/*`
- Read for pattern:
  - `apps/web/core/components/cycles/quick-actions.tsx:50-56` (allowPermissions gate)
  - `apps/web/core/components/core/description-versions/modal.tsx:20,58-61,76,127-138`
    (read-only RichTextEditor + workspaceId resolve pattern; adapt for editable=true)
  - `apps/web/core/components/editor/rich-text/editor.tsx:22-40,80-86`
    (wrapper props + getEditorFileHandlers wiring)
  - `apps/web/core/components/editor/lite-text/toolbar.tsx:86-99` + `lite-text/editor.tsx:177-222`
    (always-visible toolbar pattern; drive editorRef API)
  - `apps/web/core/constants/editor.ts:168-175,178,182` (TOOLBAR_ITEMS incl. image + table)
  - `packages/propel/src/emoji-icon-picker/lucide-icons.tsx:165` (LUCIDE_ICONS_LIST for icon picker)
  - `apps/api/plane/app/views/webhook/base.py:21,38` (ADMIN-only WORKSPACE permission precedent)
  - Propel Dialog usage for confirm modal

## Implementation Steps

1. Read `apps/web/core/components/editor/rich-text/editor.tsx:22-40,80-86` and
   `apps/web/core/components/core/description-versions/modal.tsx:58-76` to understand prop contract;
   note that editable=true requires uploadFile + duplicateFile + searchMentionCallback.
2. Build `help-rich-text-editor.tsx`:
   a. Import `RichTextEditor` from `"@/components/editor/rich-text"`.
   b. Resolve workspaceId via `useWorkspace().getWorkspaceBySlug(workspaceSlug)?.id`; guard null.
   c. Pass `uploadFile=FileService.uploadWorkspaceAsset`, a real/noop `duplicateFile`, and
   `searchMentionCallback: async () => ({})` (or disable mention extension).
   d. Add always-visible fixed toolbar above editor using TOOLBAR_ITEMS + editorRef API
   (headings / bold / italic / underline / strike / lists / quote / code / link / image / table).
   e. Add Preview toggle: render `RichTextEditor editable={false}` with current `description_html`.
   f. Load content with json-first guard (Finding 4).
3. Add admin routes to `extended.ts` + permission guard + conditional "Manage" button on home.
4. Build `category-form.tsx` with EmojiIconPicker (iconType="lucide") replacing text-entry for icon.
5. Build `article-form.tsx` + `translation-tabs.tsx` incl. copy-between-locales action.
6. Build dashboard (lists + reorder + delete confirm); wire all store actions; toasts.
7. Verify image upload end-to-end with projectId=undefined: upload → stored → displayed in editor +
   preview + Reading UI.
8. Manually author a full article in 3 locales using toolbar only (no slash/markdown), publish, confirm
   it appears in Reading UI (Phase 5).

## Success Criteria

- [ ] Non-admins cannot see "Manage" / reach `/help/manage` (redirected); server rejects their writes
- [ ] Admin can create category + article, fill VI/EN/KO, publish; content shows in Reading UI per locale
- [ ] Publish blocked (UI + server) until ≥1 locale has a non-empty title (Finding 13)
- [ ] Slug generated server-side (Vietnamese diacritics transliterated, collisions suffixed); editable only while draft
- [ ] WYSIWYG supports headings/lists/images/links/tables; both html+json sanitized server-side
- [ ] **Author can format + insert image entirely via visible fixed toolbar buttons — no slash-command or
      markdown knowledge required (D4/g5)**
- [ ] **Preview toggle renders content in the same read-mode view as the public Reading UI (D4/g9)**
- [ ] **Category icon chosen via EmojiIconPicker (visual lucide picker), not hand-typed string (D4/g12)**
- [ ] **Empty locale can be prefilled from a sibling locale via "Copy from <locale>" action (D4/g13)**
- [ ] Image upload works with projectId=undefined; uploaded assets display in editor + preview + reader
- [ ] Reorder persists `sort_order` via `partial_update`; delete confirms + soft-deletes
- [ ] Locale tabs use Propel `Tabs`; text fields use Propel `Input`; actions use Propel `Button` (no `@plane/ui` legacy)
- [ ] Forms/toolbar use semantic tokens only (inputs `bg-layer-2`, container `bg-surface-1`); verified light + dark
- [ ] Components <150 LOC; CE only; no `core/` edits
- [ ] Image alt-text limitation documented in Phase 9 (not blocking this phase)

## Risk Assessment

- **RichTextEditor import source** → MUST import from `"@/components/editor/rich-text"` (web wrapper),
  NOT `"@plane/editor"` (which exports `RichTextEditorWithRef` only). Verified: `packages/editor/src/index.ts:8-13`.
- **Editable=true required props** → wrapper type-union enforces uploadFile + duplicateFile +
  searchMentionCallback when editable=true (`apps/web/core/components/editor/rich-text/editor.tsx:31-39`);
  omitting any causes TS error. Use noop stubs where needed.
- **Image upload (Validation decision 4)** → `FileService.uploadWorkspaceAsset` (`file.service.ts:72`,
  endpoint `/api/assets/v2/workspaces/<slug>/`) — workspace-scoped, projectId=undefined is fine
  (`packages/utils/src/editor/common.ts:23-27`). Validate end-to-end: upload → display in editor + reader.
- **Wrong permission ref** → do NOT use `apps/api/plane/app/views/page/base.py:475,485` as precedent
  (that is PROJECT-level, both ADMIN+MEMBER). Use `webhook/base.py:21,38` (WORKSPACE ADMIN-only).
- **Fixed toolbar scope** → toolbar drives the editorRef API; editor must be mounted before toolbar
  interactions. Render toolbar conditionally on `editorRef` availability.
- **Slug immutability vs typos** → allow slug edit only while status=draft and never after first publish.
- **Lost edits on tab switch** → keep per-locale form state in memory until explicit save; warn on unsaved nav.
- **Alt-text limitation** → custom-image extension has no alt attribute (`types.ts:11-19`); cannot
  surface alt-text input in this phase. Defer to Phase 9, document in known limitations.

## Security Considerations

- Client guard is UX only — server ADMIN permission (Phase 2) is the real boundary.
- All rich content sanitized server-side on write (Phase 2), not trusted from client.
