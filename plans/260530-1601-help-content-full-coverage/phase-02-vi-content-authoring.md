---
phase: 2
title: "VI Content Authoring (54 articles)"
status: done
priority: P1
effort: "5d"
dependencies: [1]
---

# Phase 2: VI Content Authoring (54 articles)

> **Done (2026-05-30):** All **54** VI article bodies authored (11-agent workflow, one per category,
> each grounded in the taxonomy report + live routes/components). **4,472 content lines**, 57–155 lines
> per article, **155 screenshot placeholders** for P4. QA pass: frontmatter intact, no stubs, valid
> tokens, no raw HTML; 2 stray "Plane gốc" comparative refs reworded to "Shinhan Workspace" (+ dropped a
> "bản CE" jargon leak). Re-seed renders cleanly (h2/h3, lists, code, tables, `/help/a/` cross-links
> survive sanitize, markers preserved, zero "Plane"). 58 help tests green.

## Overview

Write the actual Vietnamese bodies for all 54 articles, feature-accurate to the codebase, into the
MD source tree from P1. This is the bulk of the work. Content grounded in the taxonomy report's
per-article key-points + features_covered.

## Key Insights

- The taxonomy report (`plans/reports/from-workflow-to-planner-help-content-taxonomy-260530-report.md`)
  is the authoritative article list: 11 categories, each article's VI title, key points,
  features_covered, screenshot_targets, priority. Author against it; do NOT invent features absent from code.
- Re-verify each feature against the actual UI/route before describing it (avoid documenting stock-Plane
  behavior the fork changed). Cite the route/component when unsure.

## Requirements

- 54 `.vi.md` bodies, each following a consistent **article template** (below), in plain markdown.
- `{{screenshot:NAME}}` placeholders at the points where P4 screenshots belong (names = the
  report's screenshot_targets).
- "Shinhan Workspace" terminology; bank-staff tone (clear, task-oriented, non-technical).
- Honour the documented limitations (no image alt-text, images-only, no version history) where relevant.

## Article Template (each article)

```
1. Mục đích (1–2 câu: bạn sẽ làm được gì)
2. Khi nào dùng / Yêu cầu (vai trò, feature toggle nếu có)
3. Các bước (numbered, imperative) + {{screenshot:...}} tại bước quan trọng
4. Mẹo & lưu ý (edge cases, giới hạn)
5. Liên quan (link tới article khác cùng chủ đề)
```

## Authoring Order (by category — P1 priority first)

1. **Core daily (P1 articles first):** `bat-dau` (4), `du-an-cong-viec` (12), `cycles-modules` (5),
   `trang-tai-lieu` (4), `xem-va-bo-cuc` (4), `thong-bao-va-cong-viec-cua-ban` (3).
2. **Settings & profile:** `cai-dat` (3), `tim-kiem-va-dieu-huong` (4), `ho-so-va-tai-khoan` (4).
3. **Fork-custom + admin:** `tinh-nang-shbvn` (5), `huong-dan-quan-tri` (6 — describe the English God
   Mode UI; screenshots show the English panel).

## Related Code Files

- Create/fill: 54 × `apps/api/plane/db/fixtures/help_center/<category>/<article>.vi.md`
- Read for grounding: the routes/components named in the taxonomy report per article
- Reference: the taxonomy report (article list + key points + screenshot targets)

## Implementation Steps

1. For each category, open the referenced routes/components, confirm current behavior, write the VI body
   per template, place screenshot placeholders.
2. Keep each article focused; merge tiny sub-features (DRY) per the report.
3. Cross-link related articles by slug.
4. Re-seed after each category group; spot-check rendering in `/help`.
5. Terminology pass: grep the tree for "Plane" → 0 in shipped bodies.

## Todo List (by category)

- [ ] `bat-dau` (4) · [ ] `du-an-cong-viec` (12) · [ ] `cycles-modules` (5) · [ ] `trang-tai-lieu` (4)
- [ ] `cai-dat` (3) · [ ] `xem-va-bo-cuc` (4) · [ ] `tim-kiem-va-dieu-huong` (4)
- [ ] `thong-bao-va-cong-viec-cua-ban` (3) · [ ] `ho-so-va-tai-khoan` (4)
- [ ] `tinh-nang-shbvn` (5) · [ ] `huong-dan-quan-tri` (6)

## Success Criteria

- [ ] All 54 `.vi.md` bodies written, feature-accurate, template-consistent
- [ ] Screenshot placeholders present at the report's screenshot_targets
- [ ] 0 "Plane" references; "Shinhan Workspace" throughout
- [ ] Re-seed renders every article cleanly in `/help` (VI), no broken markup
- [ ] Cross-links resolve to real slugs

## Risk Assessment

- **Documenting stock behavior the fork changed** → verify against live routes; mark `[CUSTOM]` articles
  with the actual fork behavior (e.g. due-date reason capture, task categories, HO dashboard).
- **Scope creep per article** → cap to the report's key_points; defer deep edge cases.
- **Volume fatigue → inconsistency** → enforce the template; review in category batches.
