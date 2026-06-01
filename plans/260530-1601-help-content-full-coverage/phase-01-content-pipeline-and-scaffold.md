---
phase: 1
title: "Content Pipeline & Taxonomy Scaffold"
status: done
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Content Pipeline & Taxonomy Scaffold

> **Done (2026-05-30):** `mistune==3.0.2` added to `requirements/base.txt`; loader
> `plane/db/fixtures/help_center/loader.py` (MD→HTML→sanitize→**post-sanitize** screenshot markers,
> idempotent upsert with explicit `sort_order`); `categories.yaml` (11 categories ×3 locales);
> **54** article stub `.vi.md` (the synthesis's "44" was a miscount — per-category 4+12+5+4+3+4+4+3+4+5+6 = 54),
> 5 seeded articles migrated. `seed_help_center` rewired to the loader. Verified in container: seeds
> **11 categories / 54 articles / 54 VI translations**, idempotent (stable), HTML sanitized, screenshot
> marker `data-help-screenshot` survives. `test_help_center_seed.py` updated → **58 help tests green**;
> ruff clean. (Dev DB also has 3 pre-existing manual God-Mode test articles — not from fixtures, left untouched.)

## Overview

Turn the one-off inline seed into a **content loader** over a markdown source tree, and scaffold all
11 categories + 54 article stubs. This unblocks parallel authoring (P2) and the screenshot pipeline (P3/P4).

## Key Insights

- Existing `apps/api/plane/db/management/commands/seed_help_center.py` already proves the idempotent
  pattern (`get_or_create(slug)`, per-locale `translations.get_or_create`). Extend it; do not rewrite the contract.
- `sanitize_help_html` (`apps/api/plane/app/serializers/help_center.py`) is the canonical write-path
  sanitizer — reuse it so seeded HTML obeys the same allowlist (style stripped, script/iframe excluded).
- Reader renders stored `description_html` via the read-only `RichTextEditor` — content must be plain
  semantic HTML in the allowlist (`packages/.../content_validator.py:ATTRIBUTES`).

## Requirements

- Source tree `apps/api/plane/db/fixtures/help_center/` with: `categories.yaml` (11 categories:
  slug, icon Lucide name, color `#174EFD`, sort_order, names `{vi,en,ko}`) + per-article markdown
  `<category-slug>/<article-slug>.vi.md` carrying YAML frontmatter (`category, slug, sort_order,
status, title, screenshots: []`).
- Loader extension to `seed_help_center`: walk tree → parse frontmatter → render MD→HTML → replace
  `{{screenshot:NAME}}` with a stable marker `<p data-help-screenshot="NAME"></p>` → `sanitize_help_html`
  → upsert category + article + translation (idempotent by slug + locale).
- 54 article stubs created (frontmatter + a 1-line VI placeholder body) so the structure is real and seedable.

## Architecture

- **MD→HTML:** **VERIFIED — no markdown lib is installed** (absent from `apps/api/requirements/*` AND
  not importable in the container: mistune/markdown/commonmark/marko all MISSING). P1 MUST add one;
  recommend `mistune` (pure-python, fast). Render tables + fenced code to allowlist-safe HTML.
- **Pipeline ORDER (critical, verified):** `sanitize_help_html` uses a **static** allowlist
  (`HELP_ALLOWED_ATTRIBUTES`, `help_center.py:22`) — arbitrary `data-*` (e.g. `data-help-screenshot`)
  is **stripped**, and a relative/`screenshot:`-scheme `src` is dropped by `url_schemes`. Therefore the
  loader pipeline is: **MD → HTML → `sanitize_help_html` → THEN substitute** `{{screenshot:NAME}}` →
  marker. Doing substitution **post-sanitize** is what lets the marker (and later the injected `<img>`
  with a relative static URL) survive — the reader renders stored HTML without re-sanitizing.
  (Caveat: editing a seeded article in God Mode re-sanitizes and would strip markers/imgs — acceptable,
  content-as-code is the source of truth, documented in P7.)
- **Loader module split** (file <200 LOC): `seed_help_center.py` (command entry) +
  `plane/db/fixtures/help_center/loader.py` (parse + render + upsert helpers). Keep the command thin.
- **Idempotency:** category by `slug`; article by `slug`; translation by `(article, locale)`. Re-run
  must **update** `title`/`description_html` (content-as-code is source of truth) — differs from the
  current get_or_create-only seed; make the update explicit + safe (instance `.save()` so
  `description_stripped`/`search_text` re-derive).
- **Screenshot marker:** substituted post-sanitize as `<p data-help-screenshot="NAME"></p>` so P4 can
  find+replace it. (No need to fight the sanitizer — it already ran.)

## Related Code Files

- Modify: `apps/api/plane/db/management/commands/seed_help_center.py` (inline list → loader call)
- Create: `apps/api/plane/db/fixtures/help_center/categories.yaml`
- Create: `apps/api/plane/db/fixtures/help_center/loader.py` (parse/render/upsert)
- Create: 54 × `apps/api/plane/db/fixtures/help_center/<category>/<article>.vi.md` (stubs)
- Read for pattern: current `seed_help_center.py`, `sanitize_help_html`, `content_validator.py`

## Implementation Steps

1. Add `mistune` to `apps/api/requirements/*` (CONFIRMED absent); verify it renders the needed tags to allowlist-safe HTML.
2. Build `loader.py`: frontmatter parse, MD→HTML, screenshot-marker substitution, sanitize, upsert.
3. Migrate the existing 5 seeded articles into the new MD tree (no content loss; keep slugs).
4. Scaffold `categories.yaml` (11 categories) + 54 article stub `.vi.md` files (frontmatter + placeholder line).
5. Wire `seed_help_center` to the loader; keep `--help`, idempotent, summary output.
6. Run `python manage.py seed_help_center` (container) → 11 categories + 54 articles created.

## Todo List

- [ ] Add `mistune` to requirements (confirmed absent); MD→HTML allowlist-safe
- [ ] `loader.py` (parse + render + sanitize + idempotent upsert, body updates on re-run)
- [ ] `categories.yaml` (11 categories, icons/colors/sort_order/names)
- [ ] 54 article stub `.vi.md` (frontmatter + screenshots list)
- [ ] Existing 5 seeded articles migrated into the tree (slugs preserved)
- [ ] Seed runs in container → 11 cat + 54 articles; idempotent

## Success Criteria

- [ ] `seed_help_center` loads the tree, creates 11 categories + 54 articles (VI), idempotent (re-run = no dupes, body refreshed)
- [ ] Seeded HTML passes `sanitize_help_html` (no style/script); renders in `/help` reader
- [ ] Screenshot markers present + preserved through sanitize for P4 to target
- [ ] Loader files <200 LOC; "Shinhan Workspace" terminology in migrated seed content

## Risk Assessment

- **MD→HTML produces non-allowlist tags** → sanitize strips them silently; verify rendered output tag-set
  ⊆ allowlist; add a loader self-check that logs stripped tags.
- **Re-run overwrites authored fixes** → acceptable: content-as-code is source of truth; document that
  manual God-Mode edits to seeded articles are overwritten on re-seed.
- **`data-help-screenshot` stripped by sanitizer** → RESOLVED by design: markers are substituted
  **after** `sanitize_help_html` runs (verified the sanitizer would strip arbitrary `data-*`), so the
  marker is never sanitized. The injection (`<img>` with relative static URL) is likewise added
  post-sanitize. Only a God-Mode re-edit would strip them (documented as out-of-workflow).
