# Code Review — Help Center Phase 6 (Authoring UI + Global Image Assets)

Date: 2026-05-30 | Branch: duonglx/feat/help-center | Reviewer: code-reviewer
Scope: uncommitted P6 changes (backend asset strategy, admin authoring UI, web reader cleanup)

## Verdict

Ship-ready. No Critical/High issues. Backend shared-code changes are regression-safe (empirically verified against live DB). One Medium (delete-modal swallows errors → no user feedback) and a few Low/informational items.

## Scope reviewed

- Backend: `asset.py` (enum + asset_url), `app/views/asset/v2.py` (is_deleted guard + allowlist), `license/api/views/help_center.py` (upload endpoint), `license/api/urls/help_center.py`
- Admin: store + hook + root.store, `helpers/editor.helper.ts`, 15 files under `app/(all)/(dashboard)/help-center/`, sidebar/route registration
- Shared: `packages/types/src/help-center.ts`, `packages/services/src/instance-help-center/*`
- Web: `ce/components/help-center/help-content-renderer.tsx`

---

## Critical

None.

---

## High

None.

---

## Medium

### M1 — Delete failures are silent (no catch, modal stays open, no error toast)
`apps/admin/app/(all)/(dashboard)/help-center/components/delete-confirm-modal.tsx:22-30`

`handleConfirm` wraps `await onConfirm()` in try/**finally** with NO catch. If the delete API rejects:
- `onClose()` (line 26) never runs → modal stays open (acceptable),
- but the rejection is swallowed by `void handleConfirm()` (line 42) → **no error toast**, and the parent's success toast also never fires. User sees the spinner stop and nothing else; the failed delete looks like a no-op.

All three call sites depend on this modal and none of them wrap their own `onConfirm` body in try/catch (`page.tsx:106-112`, `page.tsx:118-123`, `article-editor-panel.tsx:123-128`).

Fix (one place, in the modal):
```tsx
const handleConfirm = async () => {
  setIsDeleting(true);
  try {
    await onConfirm();
    onClose();
  } catch {
    setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete. Please try again." });
  } finally {
    setIsDeleting(false);
  }
};
```
(Contrast: every other mutation in this feature — reorder, save, publish, slug — already has a catch + error toast. This modal is the only gap.)

---

## Low / Informational

### L1 — `is_deleted` 404 guard is regression-safe but dead code
`apps/api/plane/app/views/asset/v2.py:451-455`

The default manager is `SoftDeletionManager` (`mixins.py:54-56`) which filters `deleted_at__isnull=True`. `FileAsset` carries a **separate** `is_deleted` BooleanField (`asset.py:60`). Every code path that sets `is_deleted=True` for static-served entity types (avatars/logos/covers) also sets `deleted_at` in the same save (`v2.py:36-38, 193-197, 242-244, 402-406`), so those rows are already excluded by `FileAsset.objects.get(...)` at line 439 before the new guard can run.

Empirical confirmation against live DB:
- `is_deleted = true AND deleted_at IS NULL` → **0 rows** (whole table)
- static entity types (USER_AVATAR/WORKSPACE_LOGO/PROJECT_COVER/USER_COVER): every active row has `is_deleted = false`

Conclusion: the guard **cannot** break serving of active avatars/logos/covers (regression-safe, requirement b satisfied), but it never fires in practice. Keep as defensive depth (the comment already frames it that way) or drop it — no functional impact either way. Not blocking.

### L2 — `asset_url` HELP branch does not affect other entity types — confirmed
`apps/api/plane/db/models/asset.py:83-92`: the HELP_ARTICLE_CONTENT case is added to the existing static-URL branch (same `/api/assets/v2/static/{id}/` shape as avatars). The ISSUE_ATTACHMENT / *_DESCRIPTION branches below are untouched. No contract change for other types. Requirement b satisfied.

### L3 — Duplicated asset-src resolver across apps (DRY-borderline, accepted)
`apps/admin/helpers/editor.helper.ts:18-24` (`getHelpEditorAssetSrc`) and `apps/web/ce/components/help-center/help-content-renderer.tsx:18-22` (`resolveHelpAssetSrc`) are byte-for-byte equivalent. They live in different apps (admin vs web) with no shared help package, so de-duping would require a new shared module. Given the 6-line size and app boundary, leaving both is the pragmatic call (YAGNI). Note only.

### L4 — Rapid reorder clicks can interleave stale indices
`article-list.tsx:28-36`, `category-list.tsx:32-40`

`reorder(index, dir)` computes the new sort value from the current `ordered` snapshot, then awaits `updateArticle`. Fast double-clicks fire multiple concurrent updates whose indices were computed against the pre-update list, which can yield a non-intuitive final order. Self-corrects on next single move and matches the locked "infrequent God-Mode authoring" posture — acceptable. Optional hardening: disable the row's buttons while a reorder is in flight.

### L5 — Article create `published` path skips the publish guard (safe today)
`license/api/views/help_center.py:110-112`: on create, `status=="published"` is applied without calling `has_titled_translation`. Safe because create already rejects payloads with no titled translation (lines 97-99), so the invariant holds implicitly. The admin UI only ever creates drafts. Note for future-proofing if create ever accepts untitled drafts.

### L6 — Unrelated `apps/web/package.json` changes in this diff (confirm intent)
`apps/web/package.json`: adds `tailwindcss@4.1.17` + `@tailwindcss/postcss@4.1.17` to devDependencies and reorders `xlsx`. These are outside the stated P6 surface. Plausibly required because admin now `@import "@plane/editor/styles"` and the web postcss config re-exports `@plane/tailwind-config/postcss.config.js` (which needs `@tailwindcss/postcss` resolvable). Web tsc/build reported clean, so likely a workspace-resolution fix — but it is an undocumented scope addition. Confirm it is intentional before commit. (`xlsx` reorder is cosmetic.)

### L7 — Presigned-post None case (inherited, not P6)
`license/api/views/help_center.py:209-213` returns 200 with `upload_data` = whatever `generate_presigned_post` returns; on `ClientError` that helper returns `None` (`storage.py`), and the client would then throw accessing `.fields`. This mirrors the existing issue-attachment upload flow, so it is a pre-existing robustness gap, not introduced by P6. No action required for this phase.

---

## Verified good (evidence)

- **Security / authz (req c):** `InstanceHelpArticleAssetEndpoint` inherits `license/api/views/base.py:42` → `permission_classes = [InstanceAdminPermission]` + `BaseSessionAuthentication`. File-type allowlist enforced (`help_center.py:201-205`), size clamped to `FILE_SIZE_LIMIT` (`:206`), and the client sends signature-detected MIME (`services/file/helper.ts getFileMetaDataForUpload` → `validateAndDetectFileType`), not the browser-reported type. Parent article existence enforced via `HelpArticle.objects.get(pk=pk)` (`:194`) → `ObjectDoesNotExist` → 404 by `base.py handle_exception`. Public AllowAny static endpoint is the locked D-2 decision (not flagged).
- **Presigned 3-step flow:** POST presign → S3 `uploadFile(upload_data.url, payload)` → PATCH confirm (`is_uploaded=True`). Returns `asset_id`; `TFileSignedURLResponse` shape (`asset_id` / `upload_data.url` / `upload_data.fields`) matches backend + `generateFileUploadPayload`. S3 `content-length-range` condition double-caps size. Correct.
- **Editor file-handler contract:** `TFileHandler.upload: (blockId, file) => Promise<string>` (`config.ts:19`); adapter `(_blockId, file) => uploadArticleImage(article.id, file)` (`translation-tabs.tsx:106`) returns the asset id, which `getHelpEditorAssetSrc` resolves to the static URL on render. Bare-id vs absolute-path branch handled. Correct.
- **MobX reactivity:** store uses `makeObservable` with explicit annotations, `runInAction` around every async mutation, `set` from `lodash-es` (not mobx), `delete` inside `runInAction`. `fetchAll` resets+repopulates atomically inside one `runInAction`. All store-reading components wrapped in `observer`. Web reader correctly **drops** `observer` (no observable access after `useWorkspace` removed).
- **Publish guard (patch):** `help_center.py:152-158` blocks publish when `not has_titled_translation`; helper uses a fresh query (`base.py:108-113`) avoiding stale prefetch. UI mirrors it (`article-editor-panel.tsx:62-64`, button `disabled` :106).
- **Reorder math:** `reorder-helper.ts` midpoint/edge-STEP logic is correct for both directions incl. boundaries; returns null on no-op. Float-collapse only after many reorders — accepted YAGNI.
- **HTML sanitization:** server-side `sanitize_help_html` (nh3, `style` stripped, script/iframe excluded by default tag set, 10MB cap) applied on every translation upsert (`base.py:93`). Reader trusts `description_html` only, never json.
- **Pattern adherence (req e):** admin English-only (zero i18n imports — grep clean), Propel `Dialog` + `onOpenChange` everywhere, semantic tokens only (no hardcoded colors — grep clean), `bg-layer-2` on all inputs/selects, all 15 files <200 LOC (max 136).
- **Contract integrity (req d):** new types appended to barrel; new service/store/route/sidebar registered in both `RootStore` constructor + `resetOnSignOut`; no existing endpoint/serializer signature changed.

---

## Unresolved questions

1. L6: are the `tailwindcss` / `@tailwindcss/postcss` additions to `apps/web/package.json` an intended workspace-resolution fix for `@plane/editor/styles`, or accidental staging? Confirm before commit.
2. L1: keep the `is_deleted` static-endpoint guard as defensive depth, or remove it as dead code? Either is correct; preference call.
