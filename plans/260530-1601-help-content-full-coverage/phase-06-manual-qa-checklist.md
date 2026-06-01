---
phase: 6
title: "Manual QA Checklist — Help Center Reader Walk"
status: ready-for-signoff
---

# Phase 6: Manual QA Checklist (Reader Walk)

No FE/e2e harness exists for the `/help` reader, so the rendered guide is verified
by this sign-off checklist. Automated coverage (87 backend tests) gates the loader,
injection, read API, and search; this checklist gates the **rendered experience**.

**Pre-req (live instance):** `seed_help_center` run, screenshots injected
(`inject_help_screenshots`), `/help` reachable. Verified live (2026-05-30):
11 categories / 54 published articles / 20 screenshots injected; the static asset
chain returns `HTTP 200 image/png` (`/api/assets/v2/static/{id}/` → `/uploads` proxy → MinIO).

## Structure & navigation

- [ ] `/help` lists all **11 categories** in `sort_order` (Bắt đầu → … → Hướng dẫn Quản trị).
- [ ] No empty category shown (every category has ≥1 published article; verified: counts all ≥1).
- [ ] Open ≥1 article in **each** of the 11 categories; each renders title + body.
- [ ] Back-affordance returns from article → category/list without a full reload.

## Content fidelity (Vietnamese)

- [ ] Bodies render VI text; headings, lists, tables, blockquotes, code all display.
- [ ] "Shinhan Workspace" terminology throughout; the word "Plane" appears nowhere
      (asserted in tests; spot-check 5 articles visually).
- [ ] No raw `{{screenshot:...}}` tokens or empty marker boxes visible in any article.

## Screenshots (the 20 injected)

- [ ] Each injected `<img>` loads (no broken-image icon) — light theme.
- [ ] Each captured image matches the step it illustrates (right route/state, not stale).
- [ ] Articles whose placeholders are **not yet captured** still render cleanly (text
      only, no broken markup) — images are additive (~135 markers remain by design).

## Theme & search

- [ ] Toggle dark theme: text legible, images still load (capture is light-only;
      confirm no layout break in dark).
- [ ] In-page search returns expected articles for: `cycle`, `du an` (accent-folded),
      `quan ly` — accent-insensitive (asserted in tests; confirm in the UI box).
- [ ] Search on a term present only in a non-VI translation still resolves to VI display
      (multilingual search; asserted in tests).

## Sign-off

- [ ] Reviewer: __________________  Date: __________
- [ ] All boxes checked OR exceptions noted below with a follow-up ticket.

**Exceptions / notes:**
