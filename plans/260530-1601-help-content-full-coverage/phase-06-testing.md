---
phase: 6
title: "Testing"
status: done
priority: P1
effort: "1d"
dependencies: [5]
---

# Phase 6: Testing

## Overview

Automated tests for the content loader + screenshot injection, plus a manual QA pass on the rendered
guide. Extends the existing `test_help_center_seed.py`.

## Architecture

**Backend (`apps/api`, run in container — `docker exec planeso-api-1 python -m pytest ...`):**

- Loader (`seed_help_center`): seeds **11 categories + 54 articles**; idempotent (re-run no dupes,
  body updates not skipped); every article has VI translation; categories carry icon/color/sort_order;
  "Plane" absent from all bodies; HTML passes `sanitize_help_html` (no style/script).
- MD→HTML: a sample markdown (headings/list/table/link/bold) renders to allowlist-safe HTML; the
  screenshot marker `data-help-screenshot` survives sanitize (or the chosen carrier does).
- Injection (`inject_help_screenshots`, storage mocked): a marker is replaced by an `<img>` pointing at
  `/api/assets/v2/static/{id}/`; the asset is `HELP_ARTICLE_CONTENT`, `workspace_id is None`; re-run
  idempotent (no duplicate `<img>`, stable asset per NAME); `description_stripped`/`search_text` re-derive.
- Reader contract regression: seeded published articles appear in the global list; categories with ≥1
  published article visible; accent-folded search finds a known seeded title.

**Manual QA checklist** (no FE/e2e harness for the reader UI):

- `/help` walk: all 11 categories present + ordered; open ≥1 article per category; text + images render
  (HTTP 200 static, no broken image), light + dark; in-page search returns expected articles; VI locale
  correct; back-affordance works.
- Screenshot accuracy: each captured image matches the step it illustrates (no stale/wrong route).

## Related Code Files

- Modify/extend: `apps/api/plane/tests/contract/app/test_help_center_seed.py`
- Create: loader unit tests (MD→HTML, marker survival) + injection test (storage mocked)
- Create: `phase-06-manual-qa-checklist.md` (reader walk)

## Implementation Steps

1. Extend the seed test to 11 cat / 54 articles + idempotency-updates-body assertion.
2. Add loader MD→HTML + marker-survival unit tests.
3. Add injection test (mock `S3Storage`); assert `<img>` + workspace-less asset + idempotency.
4. Run backend suite in container; fix failures (no skips/mocks-to-pass).
5. Execute the manual QA checklist; sign off before merge.
6. Delegate a final run to `tester`; finish only when green.

## Success Criteria

- [x] Loader tests: 11 cat / 54 articles, idempotent (body refreshed), no "Plane", sanitized HTML
- [x] Loader unit tests: MD→HTML (headings/list/table/code/strikethrough), raw HTML escaped, marker survival (block `<p>` + inline `<span>`)
- [x] Injection test: marker→`<img>`, workspace-less `HELP_ARTICLE_CONTENT`, idempotent (supersede proven), derived cols refresh, unmatched/missing-dir handled
- [x] Reader regression: seeded articles listed, all 11 categories visible (count≥1), accent-folded search hits real VI titles
- [ ] Manual QA checklist signed off (text + images + light/dark + search, all categories) — checklist ready, awaiting human sign-off
- [x] Backend suite green in container; no fakes — 88 help-center tests pass (`--reuse-db --nomigrations`)

## Risk Assessment

- **Injection test hitting real storage** → mock `S3Storage`; assert DB + HTML only.
- **54-article fixtures slow tests** → keep loader tests on a small fixture subset for unit speed; the
  full-count assertion runs once.
- **Manual QA the only image-render check** → no reader e2e harness; checklist is the gate (sign-off required).
