# Help Content Full Coverage — Phases 5–7: Integration, Tests, Docs

**Date:** 2026-05-30
**Plan:** `260530-1601-help-content-full-coverage` (phases 5–7)
**Branch:** `duonglx/feat/help-center`

## What shipped

Closed out the content-as-code Help Center: live end-to-end pipeline run (P5),
the missing automated tests for the loader + screenshot injection + reader
regression (P6), and the maintainer/deploy docs (P7). Backend suite: **88 help
tests green** (+33 this session).

### P6 — tests added

| File | Tests | Focus |
|------|-------|-------|
| `tests/unit/db/test_help_center_loader.py` (new) | 19 | `render_body` MD→HTML (headings/lists/links/table/code/strikethrough), raw HTML **escaped** (no live script/style), `{{screenshot:NAME}}` → marker survival (block `<p>`, inline `<span>`), frontmatter + locale parsing |
| `tests/contract/app/test_help_center_injection.py` (new) | 5 | `inject_help_screenshots` with S3Storage mocked: marker→`<img>` at `/api/assets/v2/static/{id}/`, workspace-less `HELP_ARTICLE_CONTENT` asset, idempotent supersede (live=1 / soft-deleted=1, surviving img references the *new* asset), derived `search_text`/`description_stripped` refresh, unmatched-PNG + missing-dir no-ops |
| `tests/contract/app/test_help_center_seed.py` (extended) | +3 | Reader regression: seed → all 11 categories visible (count≥1), known slug retrievable, accent-folded VI search hits real titles |

### P7 — docs

- `docs/help-center-authoring-guide.md`: added a content-as-code maintainer path (source tree, add category/article, screenshot placeholder, seed/inject order) alongside the existing God-Mode-UI path.
- `docs/deployment-guide.md`: full per-instance run order + `docker cp` step + re-inject-after-re-seed rule + instance-specific asset-id note.
- `docs/system-architecture.md`: content pipeline paragraph (MD→HTML→sanitize→markers→asset injection); removed a stale `Phase 9` plan ref that had leaked in earlier.
- `tools/help-screenshots/README.md`: idempotency & cleanup note (re-seed wipes injects; loader is additive/non-pruning).

## Key decisions & findings

### Run-order is load-bearing (found live)
Re-running `seed_help_center` refreshes article bodies from the markdown source,
which restores the raw `data-help-screenshot` markers and **drops any injected
`<img>`**. I reproduced this by re-seeding mid-session (injected count went 20→0).
The correct order is **seed → inject, always**; re-inject after any re-seed.
Inject is idempotent (supersedes the prior asset per article+name), so re-running
it is safe. Documented in README + deployment guide.

### Container path mismatch (found live)
`inject_help_screenshots` runs inside `planeso-api-1`, whose `/code` mounts only
`apps/api`. The repo-root `tools/help-screenshots/out/` is **not** visible there,
so PNGs must be `docker cp`'d into the container first. The pilot had done this;
it wasn't obvious from the command's default `--dir tools/help-screenshots/out`.

### Orphan cleanup — soft-delete, not auto-prune
The live DB carried 57 articles: the 54 authored + 3 stale rows from the *old*
hardcoded seed (`gioi-thieu-shinhan-workspace`, `tai-chinh-noi-bo`,
`quan-ly-du-an`, created before the content tree existed). The loader is
deliberately **additive** — it never prunes, so it can't delete God-Mode-authored
articles. Asked the user; per their choice I **soft-deleted** the 3 (reversible
`deleted_at`), bringing `/help` to exactly 54. Did **not** add pruning to the
loader (would risk deleting UI-authored content).

### Test correctness: mistune escapes raw HTML
My first sanitization assertions assumed markdown passed raw HTML through to the
sanitizer. It doesn't — the loader's mistune instance is configured without
raw-HTML passthrough, so `<script>`/`<p style>` in source are **escaped to inert
text** before sanitize even runs (a stronger property). Corrected the tests to
assert the real contract (no live tag forms; escaped text remains).

### Code-review strengthenings (applied)
`code-reviewer` flagged three non-blocking test weaknesses, all fixed:
- The search-refresh test's negative assertions could pass on a silent injection
  no-op → added a positive "injection occurred" precondition.
- The idempotency test proved single-img + supersede but not that the surviving
  img points at the *new* asset → added that assertion.
- The raw-style test coupled to exact escape bytes → made it structural (no live
  `<p style`, content preserved). (The reviewer's literal suggestion `"style=" not
  in html` would have failed — escaped source text still contains `style=`; applied
  the corrected structural form.)

## Verification

- 88/88 help-center backend tests pass in-container (`--reuse-db --nomigrations`).
- Live: `seed_help_center` → 11 cat / 54 articles; `inject_help_screenshots` → 20
  injected, 20 live workspace-less assets, 28 superseded.
- Static asset chain: `:3000/api/assets/v2/static/{id}/` → 302 `/uploads` proxy →
  MinIO returns **HTTP 200 image/png, 64,835 bytes**. Object confirmed in bucket
  via `head_object`.
- Docs scanned clean of plan/finding artifacts; "Shinhan Workspace" terminology.

## Honest trade-offs / follow-ups

- **Manual QA pending human sign-off** — no FE/e2e harness for the reader; the
  checklist (`phase-06-manual-qa-checklist.md`) is the gate for dark-mode render +
  per-screenshot accuracy.
- **~135 screenshot markers uncaptured** — only 20 of 155 targets shot so far.
  Text ships regardless (images are additive); remaining interactive/God-Mode
  targets need per-target `steps` in `capture.mjs`.
- **EN/KO deferred** — adding `<article>.en.md`/`.ko.md` beside the VI file makes
  the loader seed them; until then the reader locale-fallback shows VI.

## Status: DONE

P5/P6/P7 complete. Backend ready to merge; manual-QA sign-off + screenshot scaling
are the remaining additive follow-ups.
