---
phase: 5
title: "Integration & Seed Run"
status: pending
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

- [ ] Full sequence runs clean on fresh DB
- [ ] 54 articles render in `/help`, categorized + ordered, with images
- [ ] Search hits new content (accent-folded)
- [ ] Whole sequence idempotent on re-run

## Success Criteria

- [ ] End-to-end pipeline reproducible + documented
- [ ] `/help` shows the complete VI guide (54 articles, 11 categories) with screenshots
- [ ] Light + dark render verified; no broken images/markup
- [ ] Idempotent re-run

## Risk Assessment

- **Order dependency** (inject needs articles + assets) → enforce + document the sequence.
- **Stale markers if a screenshot target was renamed** → inject logs unmatched NAMEs; treat as a gap to fix.
- **Empty-category edge** → an authored category with 0 published articles is hidden; ensure all 11 have ≥1 published.
