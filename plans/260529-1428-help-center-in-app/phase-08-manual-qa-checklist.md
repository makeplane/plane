# Phase 8 — Manual QA Checklist (Help Center)

> **Why manual:** `apps/web` has **no JS unit-test runner** (no vitest/jest) and **no
> Playwright/e2e harness** (verified: no `vitest.config.*`, `jest.config.*`, `playwright.config.*`,
> no `e2e/` dir). Per phase-08 risk plan, the frontend store/service + author→read e2e flows become
> **named manual-QA steps that must be signed off before merge**. Backend behavior they would have
> exercised is covered by the automated contract suite (`test_help_center_read.py`,
> `test_help_center_admin.py`, `test_help_center_models.py` — 51 tests, all green).

Run logged-in. Reader = standalone **`/help`** (D7, no workspace prefix). Authoring = **God Mode**
(`apps/admin`, English chrome; content VI/EN/KO).

## A. Reading UI — standalone `/help` (P5 / D7)

- [ ] Navigate to `/help` directly (no `/<workspaceSlug>/` prefix) → loads, NOT a bare shell.
- [ ] "Back to {workspace}" affordance present; click returns to the last workspace; with no
      workspace it falls back to home/create-workspace (no dead link).
- [ ] Category grid renders responsive at 375 / 768 / 1440 (1 / 2 / 3 cols).
- [ ] Open a category → article list; open an article → content renders.
- [ ] In-article TOC: clicking a heading scrolls; active heading marked `aria-current="page"`.
- [ ] Prev/next + related-articles render and navigate.
- [ ] **g18 image render:** a published article with an uploaded inline image shows the image
      (HTTP 200 from `/api/assets/v2/static/{id}/`, no broken-image, no console asset-404) —
      with **no workspace context** in the URL.

## B. Locale (P3 / P5)

- [ ] Switch UI language VI → EN → KO; article + category names switch with it (`observer()` reactivity).
- [ ] Open an article missing the current locale → fallback notice shows; content is a usable fallback
      (requested → en → vi → any), not blank, not a crash.

## C. Authoring — God Mode (P6)

- [ ] Create a category (icon picker, ≥1 locale name) → appears in reader after a published article exists.
- [ ] Create an article; **g5 fixed toolbar** is always visible (no slash-command needed).
- [ ] **Insert an image via the toolbar image action** (not slash) → appears inline in the editor immediately.
- [ ] **g9 Preview toggle** → rendered preview matches the published reader view (bold / heading / image identical).
- [ ] Fill all 3 locales (VI/EN/KO); copy-between-locales helper works.
- [ ] Publish; verify it becomes visible in `/help`. Try publishing an article with no titled
      translation → blocked (matches backend 400 invariant).
- [ ] Non-instance-admin / workspace admin can NOT see God Mode authoring (matches backend 403).

## D. Discovery entry points (P7 / D5)

- [ ] Help "?" menu → "Help Center" opens `/help` (global, no `workspaceSlug` gating).
- [ ] Cmd+K → "Help Center" command navigates to `/help`.
- [ ] **D5 guard:** Cmd+K has **NO** help search-results group — typing a help term in Cmd+K does
      NOT surface article rows (all help search is the in-page `/help` box only).

## E. Theme + a11y

- [ ] Click through A–D in **light** and **dark** themes — semantic tokens adapt, no hardcoded colors,
      no contrast regressions.
- [ ] Keyboard-only: search box, category cards (real button/anchor), TOC links are reachable with
      visible focus.

---

**Sign-off:** _name / date_ — all boxes checked before merge to `develop`.
Owner note: g15 (no image alt-text), g19 (no video/iframe), g20 (no version history) are documented
**intentional limitations** (see `docs/help-center-authoring-guide.md`), not QA failures.
