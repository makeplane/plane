---
phase: 2
title: "i18n Migration & Progress UX"
status: pending
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: i18n Migration & Progress UX

## Overview

Replace every hardcoded English string in the tour with `t()` keys (en/ko/vi). Add progress UX: step indicator (`{current}/{total}`), progress bar, skip-to-end, keyboard navigation (←/→/Esc), and resume-from-last-step.

## Requirements

- Functional:
  - Zero hardcoded user-facing strings in tour code (titles, descriptions, button labels, aria labels).
  - All 3 locales (en, ko, vi) populated; ko/vi must compile and read idiomatically.
  - Step indicator visible on every step (modal + spotlight).
  - Progress bar reflects `(index+1)/total`.
  - Skip button always visible; on click → `engine.stop()` + mark track completed.
  - Keyboard: `→` next, `←` prev, `Esc` close (confirm if mid-tour), `Enter` advance on welcome.
  - On reopen, resume at last viewed step.
- Non-functional:
  - i18n keys under `product_tour.*`.
  - Keyboard handlers cleaned up on unmount.
  - Focus trap inside modal steps (a11y).

## Architecture

```ts
product_tour: {
  step_indicator: "{current}/{total}",
  skip: "Skip tour",
  next: "Next",
  back: "Back",
  done: "Done",
  close_confirm_title: "Close tour?",
  close_confirm_message: "You can resume it anytime from the help menu.",
  tracks: {
    onboarding: { name: "Get started", description: "Tour the basics of Plane" },
    whats_new: { name: "What's new", description: "Latest features in this release" },
    feature_cycle: { name: "Create your first cycle", description: "..." },
  },
  steps: {
    welcome: { title: "Welcome to Plane, {firstName}", description: "..." },
    work_items: { title: "Plan with work items", description: "..." },
    // ...
  },
},
```

## Related Code Files

- Create:
  - `apps/web/ce/components/onboarding/tour/components/tour-keyboard-handler.tsx`
- Modify:
  - `apps/web/ce/components/onboarding/tour/components/tour-step-modal.tsx`
  - `apps/web/ce/components/onboarding/tour/components/tour-step-spotlight.tsx`
  - `apps/web/ce/components/onboarding/tour/components/tour-progress-bar.tsx`
  - `apps/web/ce/components/onboarding/tour/engine/use-tour-engine.ts`
  - `packages/i18n/src/locales/en/translations.ts`
  - `packages/i18n/src/locales/ko/translations.ts`
  - `packages/i18n/src/locales/vi/translations.ts`

## Implementation Steps

1. Draft the `product_tour` namespace in `en/translations.ts` covering chrome + tracks + steps (5 legacy step ids as starting set).
2. Mirror keys into `ko/translations.ts` and `vi/translations.ts` with idiomatic translations matching surrounding keys' style.
3. Replace hardcoded strings in `tour-step-modal.tsx` and `tour-step-spotlight.tsx` with `useTranslation()` `t()`. Use ICU args for `{firstName}`, `{current}`, `{total}`.
4. Build `tour-progress-bar.tsx`: thin bar (`bg-accent-primary` over `bg-layer-1`) + `{current}/{total}` label (`text-secondary text-11`).
5. Skip button (Propel `Button variant="link"`) visible on every step except final (final → "Done").
6. Build `tour-keyboard-handler.tsx`: `useEffect` on `window` keydown when tour is open; map to engine actions; cleanup on unmount.
7. Esc close: if `stepIndex < lastIndex` open Propel confirm dialog using `close_confirm_*` keys; else stop immediately.
8. `use-tour-engine.start(trackId)`: read `getResumePosition(userId, trackId)`; if not null and < track length, resume; else 0.
9. `engine.stop()`: write `setResumePosition(userId, trackId, stepIndex)`. Reaching last step + "Done" → `markCompleted` + clear resume.
10. `aria-label` via `t()` on all interactive elements (skip, next, back, close).
11. Focus trap inside modal step: reuse existing project pattern (check `apps/web/package.json` for focus-lock) before adding a new dep.
12. `pnpm check:lint`, typecheck, `pnpm format`.

## Todo List

- [ ] `product_tour` keys in en
- [ ] `product_tour` keys in ko
- [ ] `product_tour` keys in vi
- [ ] Modal renderer i18n
- [ ] Spotlight renderer i18n
- [ ] Progress bar component
- [ ] Skip button + Done state
- [ ] Keyboard handler
- [ ] Esc-with-confirm
- [ ] Resume position wired
- [ ] aria labels
- [ ] Focus trap
- [ ] Lint/typecheck/format clean

## Success Criteria

- [ ] No user-facing English strings remain in `apps/web/ce/components/onboarding/tour/`.
- [ ] Switching locale to ko or vi shows translated tour.
- [ ] Step indicator shows `n/N` correctly per step.
- [ ] →/←/Esc/Enter behave as specified.
- [ ] Closing mid-tour and reopening from help menu resumes at the same step.

## Risk Assessment

- **Translation quality**: ko/vi need real translations. Mitigation: write idiomatic copy matching nearby keys; flag in PR for native-speaker review.
- **Keyboard handler global leakage**: must scope to when tour is open; cleanup on unmount.
- **Focus trap dep bloat**: reuse existing library if present; avoid adding new one.

## Security Considerations

- No new endpoints. localStorage already in use. No PII serialized.
