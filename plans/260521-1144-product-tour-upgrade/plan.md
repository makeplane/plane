---
title: "Product Tour Upgrade — i18n, Progress UX, Spotlight, Multi-Track"
description: "Modernize the product tour: i18n (en/ko/vi), progress UX (step indicator, skip, keyboard nav, resume), spotlight on real UI via driver.js, multiple tracks (onboarding, what's new, feature-specific) launchable from the help (?) menu."
status: pending
priority: P2
branch: "ngoc-feat/categories"
tags: [frontend, onboarding, i18n, ux]
blockedBy: []
blocks: []
created: "2026-05-21T05:17:10.426Z"
createdBy: "ck:plan"
source: skill
---

# Product Tour Upgrade — i18n, Progress UX, Spotlight, Multi-Track

## Overview

Current tour (`apps/web/ce/components/onboarding/tour/root.tsx`) is a 5-step modal with hardcoded English copy, no progress indicator, no skip-to-end, no resume, no anchoring to real UI, single track, mounted only on workspace home. The recent help-menu entry ("Start product tour") resets state but the experience underneath is dated.

This plan upgrades the tour into a multi-track engine: keep modal-style intro/outro screens, add spotlight (anchored tooltips on real sidebar/header buttons) for the middle steps, full i18n coverage, progress + skip + keyboard nav + resume position (localStorage), and three tracks selectable from the help (?) menu.

Scope **excludes**: backend per-step persistence, analytics events, remote-served tour definitions (kept code-driven with i18n keys).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Tour Engine & Spotlight Infra](./phase-01-tour-engine-spotlight-infra.md) | Pending |
| 2 | [i18n Migration & Progress UX](./phase-02-i18n-migration-progress-ux.md) | Pending |
| 3 | [New Tour Content & Tracks](./phase-03-new-tour-content-tracks.md) | Pending |
| 4 | [Help Menu Integration & Track Launcher](./phase-04-help-menu-integration-track-launcher.md) | Pending |
| 5 | [QA & Polish](./phase-05-qa-polish.md) | Pending |

## Key Decisions

- **Spotlight library:** `driver.js` v1 (~5KB, framework-agnostic, MIT). Avoid react-joyride (heavier, last release 2024). Wrap in a thin React hook so steps stay declarative.
- **Tour tracks:** `onboarding` (current+expanded), `whats-new` (recently shipped features — categories, workflow, dashboards v2), `feature-quickstart` (per-feature mini-tours; start with "Create your first cycle").
- **State model:** keep `Profile.is_tour_completed` (binary, server-side) for first-time auto-launch only. Per-track progress (current step, completed tracks) in `localStorage` keyed by `userId+trackId`. No new backend fields.
- **Content:** TS arrays per track, each step references i18n keys (no inline English).
- **Anchoring:** use stable `data-tour-id="<slug>"` attributes injected into real DOM nodes (sidebar nav, header buttons, command palette trigger). Driver.js looks them up by selector.
- **Mount point:** move TourRoot out of `WorkspaceHomeView` and into the workspace layout so any track can launch from any page.

## Dependencies

- No cross-plan blockers. Builds on the prior help-menu "Start product tour" item already merged (`apps/web/core/components/workspace/sidebar/help-section/root.tsx`).
- New dep: `driver.js` (~5KB gz). Adds to `apps/web/package.json`.

## Out of Scope

- Backend tracking of per-step events / analytics dashboards.
- Admin UI for editing tours.
- Translating to languages beyond en/ko/vi.
- Replacing existing tour images (re-use `apps/web/app/assets/onboarding/*.webp`).
