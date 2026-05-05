---
title: "Invite Modal: Support Search by Display Name"
description: "Update placeholder text and relax input validation so users know they can search members by name, not just email."
status: complete
priority: P2
effort: 1h
branch: develop
tags: [invite-modal, ux, i18n]
created: 2026-03-06
---

# Invite Modal: Search by Display Name

## Problem

Backend already supports searching by display_name/first_name/last_name. Frontend dropdown already shows avatar + name + email. But placeholder says "name@company.com", misleading users into thinking only email search works.

## Current Flow (Working)

1. User types >= 2 chars in input
2. `searchUsersForInvite` API called with debounced query
3. Backend matches against email, display_name, first_name, last_name (Q objects with `icontains`)
4. Dropdown shows avatar + full name + email
5. User clicks suggestion -> email auto-filled
6. Email regex validation runs (react-hook-form `rules.pattern`)

## What Needs to Change

| #   | Change                                           | File(s)                                           | Risk |
| --- | ------------------------------------------------ | ------------------------------------------------- | ---- |
| 1   | Update placeholder to "Enter name or email"      | en, vi, ko translations.ts (line ~1748/1759/1740) | None |
| 2   | Add `no_suggestions` key to vi + ko translations | vi/translations.ts, ko/translations.ts            | None |

## Phases

- [Phase 1: Update i18n and placeholder](./phase-01-update-i18n-and-placeholder.md) — 1h

## Notes

- **No backend changes needed** — API already supports name search
- **No component logic changes needed** — input type is "text", debounce search triggers on any input, dropdown renders results correctly
- **Email validation** only runs on form submit (react-hook-form validates on submit by default), so typing a name to search won't show validation errors until submit. When user picks a suggestion, email auto-fills, passing validation.
- The `no_suggestions` i18n key is missing from vi and ko locales — should add while touching those files
