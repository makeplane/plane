---
phase: 1
title: "Tour Engine & Spotlight Infra"
status: pending
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Tour Engine & Spotlight Infra

## Overview

Lay the foundation: install `driver.js`, build a thin React hook wrapper, define the track/step type system, add `data-tour-id` anchoring helpers, and move `TourRoot` mount point so tours can launch from any page in the workspace.

## Requirements

- Functional:
  - Engine can run a "track" (ordered list of steps) consisting of `modal` and `spotlight` step types.
  - Spotlight steps anchor to DOM via `data-tour-id="<slug>"`; fall back to centered modal if anchor missing.
  - Engine exposes: `start(trackId)`, `stop()`, `next()`, `prev()`, `goTo(index)`, with state available to React.
  - Resume position persisted to `localStorage` per `{userId}:{trackId}`.
- Non-functional:
  - <10KB additional gz bundle.
  - Engine SSR-safe (lazy import driver.js in `useEffect`).
  - `observer()` wrappers on any MobX-touching consumer.

## Architecture

```
apps/web/ce/components/onboarding/tour/
├── engine/
│   ├── tour-engine-types.ts        # TTourTrack, TTourStep, TTourStepKind
│   ├── use-tour-engine.ts          # Hook: wraps driver.js, exposes state + actions
│   ├── tour-engine-storage.ts      # localStorage read/write for resume position
│   └── tour-engine-context.tsx     # React context + provider (single engine per app)
├── components/
│   ├── tour-step-modal.tsx         # Modal step renderer (welcome/outro screens)
│   ├── tour-step-spotlight.tsx     # Driver.js popover renderer (overrides default UI)
│   └── tour-progress-bar.tsx       # Shared progress UI (Phase 2 finalizes)
└── root.tsx                        # Existing — refactored to consume engine
```

Data flow:
1. Track registry (`tour-tracks.ts`, Phase 3) exports tracks keyed by `TTourTrackId`.
2. `TourEngineProvider` mounted once in workspace layout. Holds active track + step index.
3. Consumer (help menu, first-time auto-launch) calls `tourEngine.start("onboarding")`.
4. Engine renders `tour-step-modal.tsx` for `kind: "modal"` steps, drives `driver.js` for `kind: "spotlight"`.

## Related Code Files

- Create:
  - `apps/web/ce/components/onboarding/tour/engine/tour-engine-types.ts`
  - `apps/web/ce/components/onboarding/tour/engine/use-tour-engine.ts`
  - `apps/web/ce/components/onboarding/tour/engine/tour-engine-storage.ts`
  - `apps/web/ce/components/onboarding/tour/engine/tour-engine-context.tsx`
  - `apps/web/ce/components/onboarding/tour/components/tour-step-modal.tsx`
  - `apps/web/ce/components/onboarding/tour/components/tour-step-spotlight.tsx`
- Modify:
  - `apps/web/package.json` — add `driver.js` ^1.x
  - `apps/web/ce/components/onboarding/tour/root.tsx` — refactor to thin wrapper over engine (modal step renderer remains)
  - `apps/web/core/components/home/root.tsx` — REMOVE inline `TourRoot` mount; auto-launch logic moves to engine
  - Workspace layout file (`apps/web/app/(all)/[workspaceSlug]/layout.tsx` or equivalent) — mount `<TourEngineProvider />`

## Implementation Steps

1. `pnpm add driver.js -F web` (workspace filter).
2. Define `TTourStepKind = "modal" | "spotlight"`, `TTourStep` (with optional `anchor`, `i18nKey`, `image`), `TTourTrack` (id, steps, optional `autoStartIf`).
3. Implement `tour-engine-storage.ts`:
   - `getResumePosition(userId, trackId): number | null`
   - `setResumePosition(userId, trackId, index): void`
   - `markCompleted(userId, trackId): void` + `isCompleted(userId, trackId): boolean`
4. Build `use-tour-engine.ts`:
   - Lazy-imports driver.js on `start()`.
   - Holds `activeTrack`, `stepIndex`, `isOpen` state.
   - On spotlight step: instantiate driver instance with single step, override popover render via `onPopoverRender` callback rendering `tour-step-spotlight.tsx`.
   - On modal step: render `tour-step-modal.tsx` in a Portal.
   - Cleanup driver instance on `stop()` / unmount.
5. `tour-engine-context.tsx`: provider exposing engine via context. `useTourEngine()` hook.
6. Refactor `apps/web/ce/components/onboarding/tour/root.tsx` to render `tour-step-modal.tsx` for current 5 hardcoded steps as a single track `legacy-onboarding` (i18n in Phase 2, real new content in Phase 3).
7. Move auto-launch logic: when `currentUserProfile.is_tour_completed === false`, provider calls `engine.start("onboarding")` after mount. Delete the conditional `<TourRoot/>` from `core/components/home/root.tsx`.
8. Add `data-tour-id` attribute support: just a passthrough — no helper needed yet. (Anchors added to real components in Phase 3.)
9. Wrap consumers in `observer()`. Verify SSR by checking `typeof window !== "undefined"` before driver import.
10. Run `pnpm check:lint` + `pnpm tsc -p apps/web` (or workspace check).

## Todo List

- [ ] Add `driver.js` dep
- [ ] Types file
- [ ] Storage helpers
- [ ] `use-tour-engine` hook
- [ ] Context + provider
- [ ] Modal step renderer
- [ ] Spotlight step renderer
- [ ] Refactor `TourRoot` to legacy-onboarding track
- [ ] Move provider mount to workspace layout
- [ ] Remove `TourRoot` from home root
- [ ] Type-check + lint clean

## Success Criteria

- [ ] Existing 5-step modal flow still works end-to-end (regression baseline).
- [ ] First-time users (is_tour_completed=false) still auto-see onboarding.
- [ ] `tourEngine.start("legacy-onboarding")` callable from anywhere.
- [ ] Bundle delta < 10KB gz.
- [ ] No new TS / ESLint errors in changed files.

## Risk Assessment

- **driver.js styling collisions**: default driver popover may clash with Plane tokens → override via `onPopoverRender` from day one, never ship default UI.
- **SSR breakage**: driver.js touches `document` → guard with `useEffect`-only import.
- **Provider mount churn**: moving auto-launch out of `home/root.tsx` risks regression for first-time UX → keep `is_tour_completed` check identical, just relocated.

## Security Considerations

- No auth / data changes. Read-only access to `currentUser.id` for localStorage key. No PII written to storage.
