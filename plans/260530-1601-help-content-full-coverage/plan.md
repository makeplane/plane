---
title: "Help Content Full Coverage — Shinhan Workspace (54 articles, VI-first, auto-screenshots)"
description: "Author the complete in-app help guide covering every staff-facing feature of the Plane fork, produced content-as-code (seed command) with Playwright-captured screenshots"
status: done
priority: P2
branch: "duonglx/feat/help-center"
tags: [help-center, content, documentation, i18n, seed, screenshots]
created: "2026-05-30T16:01:00+07:00"
createdBy: "ck:plan"
source: skill
---

# Help Content Full Coverage — Shinhan Workspace

## Overview

The Help Center **system** is already shipped (instance-global `/help`, God Mode authoring,
per-article VI/EN/KO, accent-folded search). This plan produces the **content**: a complete,
feature-accurate user guide so SHBVN staff can learn Shinhan Workspace end-to-end. Content is
authored **as code** (markdown source → extended `seed_help_center` loader → DB), VI-first, with
**Playwright-auto-captured screenshots** injected via the instance-global asset pipeline.

Grounding: `plans/reports/from-workflow-to-planner-help-content-taxonomy-260530-report.md`
(203 features inventoried → **54 articles / 11 categories**, incl. SHBVN-custom + Admin/God-Mode).

## Locked Decisions (user-confirmed 2026-05-30 — do NOT reverse)

| ID  | Decision                     | Detail                                                                                                                                                                                         |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Content-as-code**          | Articles authored as markdown source in-repo; extended `seed_help_center` renders MD→HTML→sanitize→upsert (idempotent, instance-global, run once per instance). NOT hand-authored in God Mode. |
| C2  | **VI-first (full 54)**       | Vietnamese bodies for all 54 now; EN/KO deferred (reader locale-fallback covers gaps). Same MD tree gains `.en.md`/`.ko.md` later.                                                             |
| C3  | **Auto-screenshots**         | Playwright captures screenshots from a running instance (against seeded demo data), uploaded as `HELP_ARTICLE_CONTENT` assets, injected into article HTML via placeholders.                    |
| C4  | **Full scope (54 / 11 cat)** | All categories incl. Admin/God-Mode (6) + SHBVN-custom (5). "Shinhan Workspace" terminology, never "Plane".                                                                                    |

## Phases

| Phase | Name                                                                                | Priority | Effort | Status                                              |
| ----- | ----------------------------------------------------------------------------------- | -------- | ------ | --------------------------------------------------- |
| 1     | [Content Pipeline & Taxonomy Scaffold](./phase-01-content-pipeline-and-scaffold.md) | P1       | 1.5d   | Done — loader + 11 cat/54 stubs, 58 tests green     |
| 2     | [VI Content Authoring (54 articles)](./phase-02-vi-content-authoring.md)            | P1       | 5d     | Done — 54 VI articles (4,472 lines), 58 tests green |
| 3     | [Demo Data Seed (for screenshots)](./phase-03-demo-data-seed.md)                    | P2       | 1d     | Done — `seed_help_demo_data` (demo workspace populated) |
| 4     | [Screenshot Capture & Injection (Playwright)](./phase-04-screenshot-pipeline.md)    | P2       | 2.5d   | Pilot done — pipeline proven, 7 shots live; scaling documented |
| 5     | [Integration & Seed Run](./phase-05-integration-and-seed-run.md)                    | P1       | 1d     | Done — live: 11 cat/54 articles, 20 shots, images serve 200; run order documented |
| 6     | [Testing](./phase-06-testing.md)                                                    | P1       | 1d     | Done — 88 backend tests green (+33: loader/injection/reader-regression); manual-QA checklist ready |
| 7     | [Documentation (+ EN/KO path)](./phase-07-documentation.md)                         | P3       | 0.5d   | Done — authoring guide + deployment + system-architecture updated (content-as-code, run order, EN/KO path) |

**Estimated effort: ~12.5 dev-days** (authoring is the bulk; screenshot pipeline is the highest-risk slice).

## Dependency Graph

```
01 ──┬─> 02 ─────────────┐
     └─> 03 ──> 04 ──────┴─> 05 ──> 06 ──> 07
```

- P1 establishes the loader + source structure + 54 stubs → unblocks all.
- P2 (VI authoring) and P3→P4 (demo data → screenshots) run in parallel after P1.
- P5 wires content + images, runs the full seed, verifies `/help`. P6 tests. P7 docs.

## Key Technical Decisions (grounded)

- **Loader:** extend `apps/api/plane/db/management/commands/seed_help_center.py` from an inline list
  into a tree-walking loader over `apps/api/plane/db/fixtures/help_center/`. Reuse `sanitize_help_html`
  (write-path sanitizer) and the existing idempotent `get_or_create(slug)` + per-locale upsert.
- **MD→HTML:** render markdown to allowlist-safe HTML (h1–h6, p, ul/ol/li, strong/em, a, img,
  blockquote, pre/code, table). **VERIFIED: no markdown lib installed** (requirements + container both
  lack mistune/markdown/commonmark/marko) → P1 adds `mistune`. HTML must render in the read-only
  `RichTextEditor` (`@/components/editor/rich-text`).
- **Sanitize ORDER (verified):** `sanitize_help_html` uses a **static** allowlist that strips arbitrary
  `data-*` and relative/`screenshot:`-scheme `src`. So the loader runs **MD→HTML→sanitize→THEN inserts
  screenshot markers**; the injected `<img>` (relative static URL) is likewise added post-sanitize. The
  reader renders stored HTML without re-sanitizing, so markers/images survive.
- **Screenshots:** captured PNGs uploaded as `FileAsset(entity_type=HELP_ARTICLE_CONTENT, workspace=NULL)`
  → served from the public static endpoint `/api/assets/v2/static/{id}/` (parity with the reader's
  workspace-less image model). Article MD carries `{{screenshot:NAME}}` → post-sanitize marker
  `<p data-help-screenshot="NAME"></p>` → `inject_help_screenshots` replaces it with
  `<img src=".../static/{id}/">`. Asset IDs are instance-specific (one instance serves the global
  guide), so capture-once → inject.
- **No new core edits.** All work in `plane/db` (loader + fixtures), a new Playwright script dir, and
  `docs/`. Reader/serializers/models UNCHANGED.

## Conventions

- File naming kebab-case; markdown content files under `fixtures/help_center/<category>/<article>.vi.md`.
- "Shinhan Workspace" everywhere, never "Plane". `[CUSTOM]` articles document SHBVN-specific features.
- No plan/phase/finding refs in shipped content or code comments — self-contained "why".
- Branch `duonglx/feat/help-center` → develop (PR) → preview (PR). Use `/git`.

## Open Questions (defaults applied; confirm at impl)

1. **Admin/God-Mode category visibility** — instance-global guide shows it to all staff; write articles
   generically (default) vs. add a future role-gate (out of scope now).
2. **Screenshot theme** — capture light only (default) vs. light+dark (doubles assets).
3. **Demo data** — dedicated throwaway demo workspace for capture (default) vs. capture against a
   curated real workspace (privacy risk — avoid).
4. **Markdown lib** — RESOLVED: none installed; P1 adds `mistune` (pure-python, fast).
