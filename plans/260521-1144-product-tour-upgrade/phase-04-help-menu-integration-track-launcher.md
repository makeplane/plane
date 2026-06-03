---
phase: 4
title: "Help Menu Integration & Track Launcher"
status: pending
priority: P2
effort: "0.5d"
dependencies: [1, 2, 3]
---

# Phase 4: Help Menu Integration & Track Launcher

## Overview

Replace the single "Start product tour" entry in the help (?) menu with a submenu / launcher modal that lets users pick a track (Get started / What's new / Create your first cycle). Wire each entry to `tourEngine.start(trackId)`. Drop the `router.push(/${workspaceSlug}/)` workaround from the prior implementation — engine now mounts globally and handles its own navigation.

## Requirements

- Functional:
  - Help menu shows "Product tours" entry; on click opens a small launcher (submenu or dialog) listing all available tracks with name + description + "completed" badge when applicable.
  - Selecting a track calls `tourEngine.start(trackId)`. If a resume position exists, secondary action "Start over" resets it.
  - "Get started" track also auto-launches on first sign-in (existing `is_tour_completed=false` behavior preserved, now routed through engine).
- Non-functional:
  - All copy via `t()`.
  - Launcher accessible (focusable, Esc closes).

## Architecture

Two viable shapes — pick at implementation:
- **Nested CustomMenu**: hover/click "Product tours" → nested CustomMenu with track items. Lightest weight, fits the existing menu.
- **Launcher dialog**: opens a small ModalCore with track cards. Richer (shows descriptions, completion badges).

Recommend **launcher dialog** since descriptions + badges don't fit cleanly in menu rows.

```
apps/web/core/components/workspace/sidebar/help-section/
├── root.tsx                       # modify: replace single entry with "Product tours" → opens launcher
└── product-tour-launcher.tsx      # new: dialog listing tracks
```

## Related Code Files

- Create:
  - `apps/web/core/components/workspace/sidebar/help-section/product-tour-launcher.tsx`
- Modify:
  - `apps/web/core/components/workspace/sidebar/help-section/root.tsx` — swap `handleStartProductTour` with `openLauncher`; remove `restartTour` + `router.push` workaround
  - `apps/web/core/store/user/profile.store.ts` — `restartTour` action can stay or be removed; keep `updateTourCompleted` for first-time completion. Engine now sets `is_tour_completed=true` only after the legacy/onboarding track completes.
  - `packages/i18n/src/locales/en|ko|vi/translations.ts` — add `product_tour.launcher.*` keys (title, restart, start, completed_badge)

## Implementation Steps

1. Build `product-tour-launcher.tsx`: ModalCore + list of track cards. Each card: `name`, `description`, status pill (`new` / `completed` / `in_progress` based on `tour-engine-storage`), primary button "Start" (or "Resume" if resume position exists) + secondary "Start over" (when applicable).
2. Wire card primary action → `tourEngine.start(trackId)`. Secondary → clear resume + `start(trackId)`.
3. Refactor `help-section/root.tsx`:
   - Remove `handleStartProductTour` + `restartTour` + `router.push` + `useUserProfile` import.
   - Replace `start_product_tour` menu item with `product_tours` (label "Product tours") that opens the launcher.
4. Decide on `restartTour` store action: keep for compatibility but mark deprecated, or remove if no other callers. `grep restartTour` to confirm.
5. Hook auto-launch: in `TourEngineProvider`, on mount with `currentUserProfile.is_tour_completed === false`, call `start("onboarding")`. On track completion, call `updateTourCompleted()` (existing store action) — only for the onboarding track.
6. Add i18n keys.
7. Lint/typecheck/format.

## Todo List

- [ ] `product-tour-launcher.tsx` dialog
- [ ] Track cards with status pills
- [ ] Help menu refactor
- [ ] Decide/handle `restartTour` deprecation
- [ ] Auto-launch wired in provider
- [ ] i18n keys (en/ko/vi)
- [ ] Lint/typecheck/format

## Success Criteria

- [ ] Help menu "Product tours" opens launcher.
- [ ] Each of 3 tracks startable from launcher.
- [ ] Resume vs Start-over correctly reflects localStorage state.
- [ ] First-time user still auto-sees onboarding on workspace entry.
- [ ] Onboarding completion flips `is_tour_completed=true` server-side exactly once.

## Risk Assessment

- **Dual completion sources**: server `is_tour_completed` (onboarding only) vs localStorage per-track `completed` flag. Document clearly in code that server flag is onboarding-specific.
- **Removing `restartTour`**: only safe after grep confirms no other callers. Otherwise keep but route through engine.

## Security Considerations

- Launcher is a read-only chooser. No new endpoints. No PII written.
