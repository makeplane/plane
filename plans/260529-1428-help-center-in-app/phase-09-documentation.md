---
phase: 9
title: "Documentation"
status: done
priority: P3
effort: "0.5d"
dependencies: [8]
---

# Phase 9: Documentation

> **Done (2026-05-30):** Updated `docs/system-architecture.md` (Help Center subsystem: 3-layer split,
> 4-table data model, locale + accent-folded multilingual search, read-path sanitization, global image
> assets, discovery), `docs/codebase-summary.md` (new backend/frontend/admin paths + seed command),
> `docs/deployment-guide.md` (migration `0178_help_center`; NO pg_trgm/unaccent prerequisite; optional
> idempotent `python manage.py seed_help_center` post-deploy). Created `docs/help-center-authoring-guide.md`
> (Vietnamese; "Shinhan Workspace" throughout, 0 "Plane"; documents no-alt-text / images-only /
> destructive-overwrite limitations in plain language). Seed command
> `apps/api/plane/db/management/commands/seed_help_center.py` (instance-global, idempotent, 5 cats + 5
> articles × vi/en/ko) verified by `tests/contract/app/test_help_center_seed.py` (4 tests). Shipped docs
> swept clean of plan/finding/phase codes.

## Overview

Update project docs to reflect the new Help Center (architecture, API, deployment/migration) and
write a short authoring guide for content admins (non-technical). Seed starter help content so the
feature ships non-empty (full build, D4).

**Decided (D2 — 2026-05-29):** The Help Center documents ONE unified platform "Shinhan Workspace".
No custom-vs-stock distinction, no `is_custom` field, no badge, no reserved category. All user-facing
help text (authoring guide + seed content article bodies) must use "Shinhan Workspace" — never "Plane".
Seed categories are generic functional areas (fine as-is).

**Decided (D3 — 2026-05-29):** Content is GREENFIELD. No bulk-import path, no legacy-doc importer,
no migration of existing docs is in scope. Admins author all articles fresh via the UI.

## Requirements

- Functional: `./docs` updated; an authoring guide explaining how staff/BA create/translate/publish
  articles; deployment note for the new migration.
- Non-functional: concise, accurate, cross-referenced; no plan/phase refs in shipped docs code/comments.

## Architecture

Docs to touch (delegate to `docs-manager`):

- `docs/system-architecture.md` — Help Center component (CE models + API + FE module + locale flow).
- `docs/codebase-summary.md` — new dirs: `apps/api/.../help_center`, `apps/web/ce/components/help-center`,
  `apps/web/ce/store/help-center`.
- `docs/deployment-guide.md` — note the new help-center migration (number assigned at impl time, not
  hardcoded). NO pg_trgm/extension prerequisite (search is icontains — Finding 3).
- New: `docs/help-center-authoring-guide.md` — for admins: how to add a category, write an article,
  fill 3 locales, publish, reorder, what fallback means. Written in Vietnamese (primary audience).
  Must use "Shinhan Workspace" throughout — not "Plane" (D2). Must note the following known
  limitations and intentional constraints:
  - **g15 — No alt-text on images (known limitation):** The `custom-image` editor extension has no
    `alt` attribute (`ECustomImageAttributeNames` in packages/editor/src/core/extensions/custom-image/types.ts:11-19
    contains ID/WIDTH/HEIGHT/ASPECT_RATIO/SOURCE/ALIGNMENT/STATUS only). Admins cannot add alt text
    via the UI. Accessibility note: include descriptive captions in the paragraph below images as a
    workaround. Enhancement deferred (YAGNI).
  - **g19 — Images only, no video/iframe embeds (intentional security decision):** The editor does
    not support video or iframe embeds in help articles. This prevents embedding untrusted third-party
    content in a Workspace admin context. Use image screenshots + external links instead.
  - **g20 — No version history (known limitation):** Articles have NO version history. Saving
    (publishing) a translation overwrites the previous body; the overwrite is destructive. Admins
    should draft content carefully before publishing. A `HelpArticleTranslationVersion` history table
    is deferred (YAGNI); the Pages model at `apps/api/plane/db/models/page.py` provides a revertable
    pattern if this becomes required in future.

Starter content seed (D4 — full build): a management command `seed_help_center.py` creating a
starter category + article set ("Bắt đầu", "Dự án & Công việc", "Cycles/Modules", "Trang & Tài
liệu", "Cài đặt") so Help Center is non-empty at launch. All article bodies must reference "Shinhan
Workspace" (D2), not "Plane". Guardrails: **idempotent** (`get_or_create` by `(workspace, slug)` —
no duplicate-slug `IntegrityError`); **seed all 3 locales** (`vi`, `en`, `ko`) for every
category and article (so launch never shows the fallback notice as a perceived bug); NOT auto-run in
migrations (invoke explicitly per workspace, documented in authoring guide). Content is GREENFIELD
(D3) — seed provides starter scaffolding only, not a migration of any prior docs.

## Related Code Files

- Modify: `docs/system-architecture.md`, `docs/codebase-summary.md`, `docs/deployment-guide.md`
- Create: `docs/help-center-authoring-guide.md`
- Optional create: `apps/api/plane/management/commands/seed_help_center.py` (idempotent starter content)
- Read for pattern: existing `docs/*` structure + an existing management command

## Implementation Steps

1. Delegate `docs-manager` to update the three docs + write the Vietnamese authoring guide.
   - Guide uses "Shinhan Workspace" throughout (D2); no "Plane" references.
   - Guide documents g15 (no alt-text), g19 (no video/iframe), g20 (destructive overwrite) as
     known limitations / intentional decisions per above notes.
2. Write idempotent `seed_help_center` command; all 3 locales (`vi`/`en`/`ko`) per item;
   article bodies in "Shinhan Workspace" terminology (D2). Document invocation in authoring guide.
3. Verify links/paths; ensure no plan-artifact references leaked into shipped docs.
4. PR description must note g15/g19/g20 explicitly as reviewer callouts.

## Success Criteria

- [ ] `docs/` reflects Help Center architecture, new paths, and migration/deploy note
- [ ] `docs/help-center-authoring-guide.md` exists (Vietnamese), uses "Shinhan Workspace" (D2),
      covers create→translate→publish, and documents g15/g19/g20 limitations
- [ ] Seed command runs idempotently for all 3 locales; article bodies reference "Shinhan Workspace"
- [ ] No plan/phase/finding references in shipped docs
- [ ] g15 (no alt-text), g19 (no video), g20 (destructive overwrite) documented in guide + PR notes

## Risk Assessment

- **Docs drift** → update as part of this phase, not later; cross-check against final code paths.
- **Terminology drift (D2)** → authoring guide and seed content reviewed for any "Plane" references
  before merge; search-replace check in PR.
- **Seed missing locales** → if a locale is absent the Help Center shows fallback-notice on first
  launch, appearing as a bug; seed must cover `vi`/`en`/`ko` for every seeded record.
- **g20 data loss** → no undo for overwritten article body; document prominently in authoring guide;
  admins should use draft-before-publish workflow; future enhancement tracked but deferred.
- **g15 accessibility gap** → no alt text; workaround (caption paragraph) documented; no regression
  risk since no alt was ever supported by the extension.
