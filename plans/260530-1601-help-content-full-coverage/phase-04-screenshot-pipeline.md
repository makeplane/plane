---
phase: 4
title: "Screenshot Capture & Injection (Playwright)"
status: pilot-done
priority: P2
effort: "2.5d"
dependencies: [3]
---

> **Done — 20 core shots live (2026-05-30):** Full pipeline built + proven end-to-end; **20 of 155**
> placeholders captured + injected (home, projects, issues, cycles, modules, pages, your-work, settings,
> members, notifications, stickies, bank-wide, HO dashboard, timesheet, capacity, + interactive
> create-work-item modal and Cmd+K palette via the `steps` mechanism). 135 markers remain (text ships
> regardless). Earlier pilot note:
> Components: `make_help_session` (session-cookie injection — the SPA needs an onboarded Profile, not
> just `/api/users/me/` 200), `tools/help-screenshots/` (Playwright capture, `url`-scoped cookie for
> both :3000/:8000, dynamic `{ws}/{pid}/{uid}` resolution via API), `inject_help_screenshots`
> (boto3 `put_object` upload — the custom `S3Storage` rejects `FileField.save()`; marker→`<img>` with a
> re-findable `data-help-screenshot` attr for idempotent re-runs). **Verified live:** images render in
> the `/help` reader (302 → 200 `/uploads/` via vite→MinIO, `<img>` 1440×900). **Scaling the remaining
> ~148 placeholders** (modals/popovers/Cmd+K/God-Mode) needs per-target interaction steps in
> `capture.mjs` — documented in `tools/help-screenshots/README.md`; text ships regardless (images additive).

# Phase 4: Screenshot Capture & Injection (Playwright)

> Highest-risk slice (new Playwright tooling + asset pipeline + HTML injection). Designed so article
> TEXT (P2) ships independently — images are additive via placeholders.

## Overview

Auto-capture screenshots for every `{{screenshot:NAME}}` target against the demo instance (P3), upload
them as instance-global help assets, and inject `<img>` into the seeded article HTML.

## Key Insights

- No Playwright harness exists yet (`apps/web` has none) — this introduces a scoped, standalone tool.
- Reader image model is workspace-less: `FileAsset(entity_type=HELP_ARTICLE_CONTENT, workspace=NULL)`
  served at `/api/assets/v2/static/{id}/` (`StaticFileAssetEndpoint`, AllowAny, 404 on soft-deleted/not-uploaded).
- Asset IDs are minted at upload (fresh UUIDs) → cannot be hardcoded in git. ONE instance serves the
  global guide, so **capture-once → inject** on that instance is stable.

## Requirements

- A **target registry** mapping `NAME → {route, optional selector/clip, viewport, theme, waitFor}` for
  every screenshot used in P2 (start with P1-priority articles).
- A **capture script** (Playwright/Node) that logs into the demo instance, visits each target, captures
  PNG (light theme default; dark optional per plan Q2), writes to `out/`.
- An **upload + inject** step: create `HELP_ARTICLE_CONTENT` assets (workspace NULL), upload PNGs to
  storage, mark uploaded, build a manifest `NAME → asset_id`, then replace each
  `<p data-help-screenshot="NAME"></p>` marker in the relevant article's `description_html` with
  `<img src="/api/assets/v2/static/{asset_id}/">` (re-derive stripped/search_text via instance .save()).

## Architecture

- Tool dir: `tools/help-screenshots/` (standalone Node + Playwright; own package.json) — keep out of
  `apps/web` build. Targets in `targets.ts`; capture in `capture.ts`; output PNGs + `targets.json`.
- Upload + inject as a **management command** `inject_help_screenshots`
  (`plane/db/management/commands/`) so it shares Django/storage/`S3Storage` config and DB access:
  reads PNG dir + target list → creates assets → uploads via `S3Storage` → patches article HTML by
  replacing markers. Idempotent (re-run replaces the same `NAME` asset/markers).
- Decouple from per-article binding: assets need not bind to a single article (a screenshot may appear
  in one article; `entity_identifier` = the owning article id, resolved from which article holds the marker).

## Related Code Files

- Create: `tools/help-screenshots/{package.json,targets.ts,capture.ts,README.md}`
- Create: `apps/api/plane/db/management/commands/inject_help_screenshots.py`
- Read for pattern: `InstanceHelpArticleAssetEndpoint` (presign/complete flow), `S3Storage`,
  `StaticFileAssetEndpoint`, `FileAsset` model

## Implementation Steps

1. Build `targets.ts` from the P2 screenshot placeholders (NAME → route/selector/viewport/theme).
2. Capture script: auth (demo creds), navigate, stabilize (wait on content not timeouts), screenshot → PNG.
3. `inject_help_screenshots`: per NAME → create FileAsset (HELP_ARTICLE_CONTENT, workspace NULL) →
   upload PNG → is_uploaded=True → record asset_id; then find the marker in article HTML, replace with
   `<img>`, save (re-derive). Manifest written for audit.
4. Run end-to-end on the demo instance; verify images load at `/help` (HTTP 200 static, no workspace).
5. Light + dark capture if confirmed (plan Q2); else light only.

## Todo List

- [ ] Target registry for P1 screenshot targets (then P2/P3)
- [ ] Playwright capture script → PNGs (stable, content-waited)
- [ ] `inject_help_screenshots` command (asset create + upload + marker replace, idempotent)
- [ ] Images render in `/help` reader via global static URL (no workspace)
- [ ] Manifest `NAME → asset_id` written; re-run replaces cleanly

## Success Criteria

- [ ] Screenshots captured for all P1 (and ideally all) targets, realistic content
- [ ] Uploaded as workspace-less `HELP_ARTICLE_CONTENT` assets; served 200 at `/api/assets/v2/static/{id}/`
- [ ] Markers replaced with `<img>`; reader shows images inline, light + (optional) dark
- [ ] Pipeline idempotent + documented for capture-once-per-instance

## Risk Assessment

- **Pipeline brittleness (auth/selectors/timing)** → article text already ships (P2); images additive.
  If capture slips, fall back to manual screenshot upload via God Mode for top articles; text unaffected.
- **Asset IDs instance-specific** → run capture+inject on the serving instance (or staging→prod copy);
  document in deploy guide; never hardcode IDs in git.
- **MinIO/S3 not reachable from tool** → inject runs as a Django command inside the api container (has
  `S3Storage` config), not from the Node tool — Node only captures PNGs.
- **Marker survives sanitize?** RESOLVED in P1: markers + the injected `<img>` (relative static URL)
  are added **post-sanitize**, so neither the `data-*` marker nor the relative `src` is stripped.
- **Dark mode doubles assets/effort** → default light-only unless confirmed.
