# Help Center — Phase 6: God Mode Authoring UI + Global Image Assets

**Date:** 2026-05-30
**Branch:** `duonglx/feat/help-center`
**Scope:** P6 of the in-app Help Center plan (`plans/260529-1428-help-center-in-app/`).

## What shipped

Authoring for the instance-global Help Center, built in **`apps/admin` (God Mode)** — NOT `apps/web/ce`.
The phase-06 file's original workspace-admin design was superseded by the D6 pivot (instance-global) and
D7 (standalone reader); the authoritative design is the global-redesign report (§2 P6, §4 assets).

- **Backend image assets (D7-required):** `HELP_ARTICLE_CONTENT` added to `FileAsset.EntityTypeContext`
  with an `asset_url` branch returning the workspace-agnostic `/api/assets/v2/static/{id}/`; allowlisted in
  `StaticFileAssetEndpoint` + a new `is_deleted`→404 guard; a God Mode presigned-upload endpoint
  (`InstanceHelpArticleAssetEndpoint`, create + mark-uploaded). No migration needed — `entity_type` is a
  plain `CharField` (no DB `choices`).
- **Editor port:** added `@plane/editor` to admin + styles import; a thin `HelpRichTextEditor`
  (`RichTextEditorWithRef`) with an admin-local file handler (global static src, mentions stubbed off), an
  always-visible fixed toolbar, and a live preview (read-only render). Mirrors the `apps/space` pattern.
- **Data layer:** shared types (`packages/types`), instance service (`packages/services`), admin MobX store
  + hook + root-store registration.
- **UI:** page + sidebar + route; category & article lists with up/down reorder (sort_order midpoint, no
  bespoke endpoint); category form (VI/EN/KO Propel Tabs + visual lucide icon picker); article editor panel
  (slug editable only while draft, publish blocked until ≥1 titled translation); per-locale translation tabs
  with copy-between-locales.
- **Reader cleanup (L2):** `help-content-renderer.tsx` now resolves global static image URLs via a
  help-only read file handler — the standalone `/help` reader has zero workspace dependency.

## Decisions & rationale

- **Editor: full WYSIWYG port (kept locked decision D4)** rather than a plaintext fallback — confirmed with
  the user. `apps/space` proved `@plane/editor` is consumable outside `apps/web` with a thin wrapper.
- **Image src resolution:** the web `getAssetSrc` only passes through `http://` URLs and otherwise rebuilds
  a *workspace-scoped* path — wrong for global help images. So both the admin editor and the web reader use
  a help-specific file handler resolving a bare asset id → the static endpoint. The custom-image extension
  re-derives src from the stored attribute via `getAssetSrc`, so the handler is the single source of truth.
- **No image delete/restore endpoints:** orphan-on-delete accepted (infrequent God Mode authoring; tiny
  images). The `is_deleted`→404 guard is defensive depth even though active rows never hit it.

## Verification

admin + web `tsc` clean; admin eslint 0 errors; `manage.py check` ok; URL reverse + `asset_url` verified
live in the container; backend unit suite 240 pass (2 failures + 24 errors all pre-existing, unrelated).
Code review: ship-ready; the one Medium (delete modal swallowed errors) was fixed.

## Follow-ups (Phase 8)

Live/e2e QA: image upload round-trip (author → static URL → reader render), light/dark, locale switch,
publish-guard server enforcement, and the first automated help-center backend tests.

## Note for commit

`apps/web/package.json` (xlsx reorder + `tailwindcss`/`@tailwindcss/postcss` devDeps) was already modified
before this session — it is NOT part of P6 and should be committed separately / by its author.
