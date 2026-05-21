---
phase: 5
title: "QA & Polish"
status: pending
priority: P2
effort: "0.5d"
dependencies: [1, 2, 3, 4]
---

# Phase 5: QA & Polish

## Overview

Cross-browser smoke testing, a11y pass, visual polish against design tokens, theme parity (light/dark/contrast), and translation review. Final review gate before PR.

## Requirements

- Functional:
  - All 3 tracks complete cleanly in Chrome, Firefox, Safari.
  - First-time onboarding still auto-launches and only auto-launches once.
  - Resume + skip + completion flags survive reload.
- Non-functional:
  - WCAG AA: contrast, focus visibility, keyboard-only completable, screen-reader announces step transitions.
  - Bundle delta < 10KB gz.
  - No theme regression (light, dark, light-contrast, dark-contrast).

## Implementation Steps

1. **Manual smoke test matrix**:
   - Chrome, Firefox, Safari × 3 tracks × {fresh user, resuming user, completed user}.
   - Mobile viewport (375px) at minimum — popovers reposition gracefully.
2. **A11y pass**:
   - Run axe-devtools on each step.
   - Tab/Shift+Tab cycles within step chrome.
   - Screen reader (VoiceOver) announces step indicator + title.
   - Focus restored to anchor element on `stop()`.
3. **Theme parity**:
   - Walk each step in all 4 themes (`light`, `dark`, `light-contrast`, `dark-contrast`).
   - Verify no hardcoded colors crept in — `grep -nE 'bg-(white|black|gray-|slate-)|text-(white|black)|#[0-9a-fA-F]{3,8}' apps/web/ce/components/onboarding/tour/`.
4. **Translation review**:
   - Native ko/vi speakers (or PR reviewers) read every step.
   - Pluralization handled where counts appear (`{count, plural, ...}` if any).
5. **Performance**:
   - Lighthouse delta vs main on a workspace page; engine code should not appear in initial bundle (lazy-loaded on `start`).
   - Confirm `driver.js` import dynamic.
6. **Cleanup**:
   - Remove unused assets / dead code paths from legacy `TourRoot`.
   - Update `apps/web/ce/components/onboarding/tour/README.md` (or inline jsdoc) explaining how to add a new track.
   - `pnpm check:lint`, `pnpm check:format`, type-check.
7. **PR description**: include before/after screenshots, list new i18n keys, call out localStorage schema, link this plan.

## Todo List

- [ ] Browser smoke matrix
- [ ] axe-devtools pass
- [ ] Keyboard-only walkthrough
- [ ] Screen-reader walkthrough
- [ ] Theme parity (4 themes)
- [ ] Hardcoded-color grep clean
- [ ] Translation review
- [ ] Lighthouse / bundle check
- [ ] Dynamic import verified
- [ ] README / jsdoc updated
- [ ] Lint/format/type clean
- [ ] PR description with screenshots

## Success Criteria

- [ ] Zero axe-devtools critical issues on any step.
- [ ] All 3 tracks completable keyboard-only.
- [ ] Bundle delta < 10KB gz (initial), driver.js dynamically loaded.
- [ ] Translation review signed off in PR.
- [ ] Visual sign-off in 4 themes.

## Risk Assessment

- **Late-discovered theme regression**: catch via theme parity pass, not at QA.
- **Translation quality concerns**: schedule native speaker review with enough lead time (1-2 days).
- **Mobile popover overflow**: driver.js auto-positions but verify on real device or emulator.

## Security Considerations

- Final review confirms no PII written to localStorage (only `userId` + `trackId` + numeric `stepIndex`).
- No external network requests added by driver.js (verify in Network tab).

## Next Steps

- Open PR to `develop`. Require 1 review.
- Consider future follow-up plan: backend per-step analytics + admin-editable tour content (explicitly out of scope here).
