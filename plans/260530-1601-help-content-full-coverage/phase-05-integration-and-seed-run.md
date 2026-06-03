---
phase: 5
title: "Integration & Seed Run"
status: done
priority: P1
effort: "1d"
dependencies: [2, 4]
---

# Phase 5: Integration & Seed Run

## Overview

Wire content (P2) + screenshots (P4) together, run the full pipeline end-to-end on a clean instance,
and verify the complete guide renders in `/help`.

## Requirements

- Documented, ordered run sequence: `seed_help_center` (content) → `seed_help_demo_data` (demo) →
  capture (Playwright) → `inject_help_screenshots` (images) — and re-run idempotency.
- All 54 VI articles visible at `/help`, correctly categorized, ordered (sort_order), with images.
- Search works across the new content (accent-folded + future multilingual).

## Architecture

- A thin orchestration doc/script (`tools/help-screenshots/README.md` + a make-style note) capturing
  the exact command order for a fresh instance and for re-runs.
- Verify category `article_count` (published-only) reflects the seeded articles; categories with
  published articles appear; empty categories hidden.

## Related Code Files

- Read/verify: `seed_help_center`, `seed_help_demo_data`, `inject_help_screenshots`, `/help` reader
- Doc: run order note for deploy (feeds P7)

## Implementation Steps

1. On a clean DB: run content seed → confirm 11 categories + 54 articles.
2. Run demo-data seed → run capture → run inject → confirm images attached.
3. Open `/help`: walk every category, open a sample of each, confirm text + images + ordering.
4. Verify search returns new articles (e.g. `?search=cycle`, accent-folded `?search=du an`).
5. Re-run the whole sequence → idempotent (no dupes, images stable).

## Todo List

- [x] Full sequence runs clean (live container): seed → demo → capture → inject
- [x] 54 articles (11 categories) in `/help`, ordered; 20 screenshots injected (135 markers remain — additive)
- [x] Search hits new content (accent-folded) — verified by reader-regression tests
- [x] Whole sequence idempotent on re-run (inject supersedes prior asset; 28 superseded rows)

## Success Criteria

- [x] End-to-end pipeline reproducible + documented (`tools/help-screenshots/README.md` + deployment guide)
- [x] `/help` shows the VI guide (54 articles, 11 categories); injected images serve HTTP 200 image/png
- [ ] Light + dark render verified — light verified; dark + per-image accuracy on the manual-QA checklist (human sign-off)
- [x] Idempotent re-run (live-verified)

## Live findings (this run)

- The api container mounts only `apps/api` as `/code`; the repo-root `tools/help-screenshots/out/` is
  NOT reachable inside it — PNGs must be `docker cp`'d in before `inject_help_screenshots`.
- Re-running `seed_help_center` refreshes bodies from source → restores raw markers and DROPS injected
  `<img>`. Always re-inject after any re-seed (order: seed → inject, never the reverse).
- The loader is additive (no prune). 3 stale articles from the prior hardcoded seed
  (`gioi-thieu-shinhan-workspace`, `tai-chinh-noi-bo`, `quan-ly-du-an`) were soft-deleted (reversible)
  to bring `/help` to exactly 54. Prune retired seeded rows manually; the loader never auto-deletes
  (protects God-Mode-authored articles).

## Risk Assessment

- **Order dependency** (inject needs articles + assets) → enforce + document the sequence.
- **Stale markers if a screenshot target was renamed** → inject logs unmatched NAMEs; treat as a gap to fix.
- **Empty-category edge** → an authored category with 0 published articles is hidden; ensure all 11 have ≥1 published.
