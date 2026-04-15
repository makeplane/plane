---
title: "Contact Point Modal in Help Menu"
description: "Show static hardcoded Name, Email, Phone in a modal when clicking Contact Point in the Help sidebar menu"
status: pending
priority: P2
effort: 1h
branch: develop
tags: [frontend, modal, help-menu, i18n]
created: 2026-02-26
---

# Contact Point Modal — Help Menu

## Overview

Replace the current `mailto:` link in the Help menu "Contact Point" item with a modal dialog that shows static hardcoded contact info: Full Name, Email, Phone Number.

## Phases

| #   | Phase                   | Status     | File                                              |
| --- | ----------------------- | ---------- | ------------------------------------------------- |
| 1   | i18n Translation Keys   | ⏳ Pending | [phase-01](./phase-01-i18n-translations.md)       |
| 2   | UI: Modal + Root update | ⏳ Pending | [phase-02](./phase-02-ui-modal-implementation.md) |

## Validation Log

### Session 1 — 2026-02-26

**Trigger:** Initial plan validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Assumptions]** What are the actual hardcoded contact values to display?
   - Options: Use placeholders for now | I'll provide real values
   - **Answer:** Use placeholders for now
   - **Rationale:** Values can be updated after initial implementation; placeholders are sufficient for the modal structure.

2. **[Scope]** Should the copy-to-clipboard button be included for each field?
   - Options: Yes, include copy buttons | No, display only
   - **Answer:** Yes, include copy buttons
   - **Rationale:** Copy buttons improve UX for phone/email fields; 1.5s checkmark feedback confirmed.

3. **[Architecture]** Should clicking 'Contact Point' only open the modal, or keep the mailto link?
   - Options: Modal only — remove mailto | Modal + mailto inside | Keep mailto separately
   - **Answer:** Modal only — remove mailto
   - **Rationale:** `onClick` replaces `window.open("mailto:sales@plane.so", "_blank")` entirely; cleaner UX.

#### Confirmed Decisions

- Contact values: placeholder values (`"Support Team"` / `"support@shbvn.com"` / `"+84 123 456 789"`)
- Copy buttons: included with 1.5s checkmark feedback
- mailto removal: `window.open(mailto)` removed, replaced by modal open

#### Action Items

- [ ] No plan changes required — all decisions match current plan

#### Impact on Phases

- None — plan confirmed as-is

---

## Key Files

- `apps/web/core/components/workspace/sidebar/help-section/root.tsx` — trigger modal
- `apps/web/core/components/workspace/sidebar/help-section/contact-point-modal.tsx` — NEW modal
- `apps/web/core/components/workspace/sidebar/help-section/index.ts` — exports
- `packages/i18n/src/locales/en/translations.ts` — EN keys
- `packages/i18n/src/locales/ko/translations.ts` — KO keys
- `packages/i18n/src/locales/vi/translations.ts` — VI keys
