---
phase: 3
title: "New Tour Content & Tracks"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1, 2]
---

# Phase 3: New Tour Content & Tracks

## Overview

Define three tour tracks with real, current content. Inject `data-tour-id` anchors into real UI (sidebar nav items, header buttons, command palette) so spotlight steps land on the right elements. Expand coverage beyond the original 5 steps to surface features that have shipped since the original tour (dashboards v2, workspaces, command palette, work-item detail panel, notifications inbox).

## Requirements

- Functional:
  - 3 tracks shipped: `onboarding`, `whats_new`, `feature_cycle`.
  - `onboarding`: welcome → workspace overview → sidebar → command palette → work items → cycles → modules → views → pages → dashboards → outro. ~10 steps total. Mix of modal (intro/outro) + spotlight (middle).
  - `whats_new`: 3-5 spotlight steps highlighting recently shipped features (dashboards v2, workflows, categories — confirm at implementation time from CHANGELOG).
  - `feature_cycle`: 4-step quickstart on creating a cycle (navigate to cycles → "+ New cycle" button → name/date inputs → save).
  - Every track resumable, skippable, fully i18n.
- Non-functional:
  - Anchors stable: `data-tour-id` uses semantic slugs (`sidebar-nav-cycles`, `header-command-palette-trigger`).
  - Fallback behavior: if anchor not in DOM (route mismatch, gated feature), engine auto-skips that step with a one-time warning.

## Architecture

```
apps/web/ce/components/onboarding/tour/
└── tracks/
    ├── tour-tracks-registry.ts            # exports { onboarding, whats_new, feature_cycle }
    ├── tour-track-onboarding.ts
    ├── tour-track-whats-new.ts
    └── tour-track-feature-cycle.ts
```

Each track:

```ts
export const onboardingTrack: TTourTrack = {
  id: "onboarding",
  nameKey: "product_tour.tracks.onboarding.name",
  descriptionKey: "product_tour.tracks.onboarding.description",
  steps: [
    { id: "welcome",        kind: "modal",     i18nKey: "welcome",      image: WelcomeImg },
    { id: "sidebar",        kind: "spotlight", anchor: "sidebar-nav",   i18nKey: "sidebar" },
    { id: "command-palette",kind: "spotlight", anchor: "header-command-palette-trigger", i18nKey: "command_palette" },
    // ...
    { id: "outro",          kind: "modal",     i18nKey: "outro" },
  ],
};
```

Anchor injection: minimal, surgical edits — add `data-tour-id="<slug>"` to existing JSX nodes. No structural changes.

## Related Code Files

- Create:
  - `apps/web/ce/components/onboarding/tour/tracks/tour-tracks-registry.ts`
  - `apps/web/ce/components/onboarding/tour/tracks/tour-track-onboarding.ts`
  - `apps/web/ce/components/onboarding/tour/tracks/tour-track-whats-new.ts`
  - `apps/web/ce/components/onboarding/tour/tracks/tour-track-feature-cycle.ts`
- Modify (anchor injection — list illustrative, confirm via scout at implementation time):
  - `apps/web/core/components/workspace/sidebar/sidebar-menu-items.tsx` — anchors per nav item
  - `apps/web/core/components/workspace/sidebar/help-section/root.tsx` — `data-tour-id="help-menu-trigger"`
  - Header / command-palette trigger component — `data-tour-id="header-command-palette-trigger"`
  - Work-item list / detail panel root — anchor for "work item detail" step
  - Dashboards page root — anchor for dashboards step
- Modify (i18n — extend Phase 2 namespace):
  - `packages/i18n/src/locales/en|ko|vi/translations.ts` — add new step keys + `whats_new` + `feature_cycle` step copy

## Implementation Steps

1. Scout exact files for anchor targets. `grep -n "Sidebar\|CommandPalette\|navigation" apps/web/core/components/workspace/sidebar/ apps/web/ce/components/navigations/`. Verify each before editing.
2. Add `data-tour-id` attributes to each anchor target. Keep slugs in a shared constant `TOUR_ANCHOR_IDS` exported from `tracks/tour-tracks-registry.ts` so tracks and JSX share the same source.
3. Author `tour-track-onboarding.ts` with full step list. Reuse existing webp assets where applicable (work-items, cycles, modules, views, pages); use no image for spotlight steps.
4. Author `tour-track-whats-new.ts`:
   - Confirm 3-5 most recent shipped features from `docs/project-changelog.md` / git log.
   - Anchor each to its primary entry point (dashboards button, workflow indicator, categories menu).
5. Author `tour-track-feature-cycle.ts`:
   - Step 1: navigate to project cycles route (engine helper `router.push` if not already there).
   - Steps 2-4: spotlight "+ New cycle" → name/date inputs → save button.
6. Extend i18n namespace with all new step keys in en/ko/vi (idiomatic translations).
7. Engine fallback for missing anchor: in `use-tour-engine.ts`, if `document.querySelector('[data-tour-id="X"]')` returns null on a spotlight step → `console.warn` once and advance to next step automatically.
8. Add "navigation steps" mechanism: allow a step to declare `beforeShow: (router) => router.push(...)` so feature tracks can change routes mid-tour. Wait for the anchor to mount (poll with `requestAnimationFrame` up to ~1s) before showing popover.
9. Smoke-test each track manually: start from help menu → walk every step → resume mid-tour → completion clears resume.

## Todo List

- [ ] Scout + confirm anchor targets
- [ ] `TOUR_ANCHOR_IDS` constant
- [ ] Inject `data-tour-id` attributes
- [ ] `tour-tracks-registry.ts`
- [ ] Onboarding track
- [ ] What's-new track
- [ ] Feature-cycle track
- [ ] i18n keys (en/ko/vi)
- [ ] Engine missing-anchor fallback
- [ ] `beforeShow` route hook + anchor wait
- [ ] Manual smoke test each track

## Success Criteria

- [ ] All 3 tracks complete end-to-end without error.
- [ ] Spotlight lands on the correct DOM element for every spotlight step.
- [ ] Missing anchor on any step → engine advances; no crash.
- [ ] Feature-cycle track routes the user into project cycles even from a non-project page.
- [ ] All step copy renders in all 3 locales.

## Risk Assessment

- **Anchor drift**: feature teams may rename/remove anchored elements. Mitigation: shared `TOUR_ANCHOR_IDS` constant + lint comment near each `data-tour-id` site referencing the constant.
- **Route-changing tracks**: navigation mid-tour can race with anchor mount. Mitigation: poll for anchor up to ~1s with `requestAnimationFrame` before opening popover.
- **Spotlight on absent feature**: CE may gate some "what's new" features. Mitigation: missing-anchor fallback skips the step gracefully.
- **Content staleness**: "what's new" goes stale. Mitigation: convention — review whenever a release ships major UI; flagged in QA phase checklist.

## Security Considerations

- `data-tour-id` is non-sensitive metadata. No auth implications.
- Navigation steps must check user permission for the destination route; if denied, skip the step.
