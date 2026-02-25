---
title: "Unified Login Form — Merge Staff ID + LDAP + Email, Config-Aware"
description: "Single auto-detect login form routing by input type and LDAP admin config"
status: in-progress
priority: P1
effort: 1h
branch: preview
tags: [auth, login, ux, i18n]
created: 2026-02-21
updated: 2026-02-21
---

# Unified Login Form — Config-Aware Auto-Detect

## Context

Original login had 2 separate forms (Staff ID + LDAP) with ~80% duplicated code and Vietnamese labels. Merged into single form with smart routing based on input type AND `isLDAPEnabled` admin config.

## Routing Logic

| Input                      | LDAP=true                                 | LDAP=false                                            |
| -------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| 8 digits (e.g. `18506320`) | `/auth/ldap/sign-in/` username=`18506320` | `/auth/sign-in/` email=`sh18506320@swing.shinhan.com` |
| Email (e.g. `user@co.com`) | `/auth/sign-in/` email=`user@co.com`      | `/auth/sign-in/` email=`user@co.com`                  |
| Username (e.g. `john.doe`) | `/auth/ldap/sign-in/` username=`john.doe` | **Validation error**                                  |

**Detection order:** Email (`@` pattern) → Staff ID (8 digits) → LDAP username (fallback)

## Implementation

### 1. `staff-id.tsx` — Unified form (REWRITE)

- Props: `nextPath`, `isLDAPEnabled`
- Constants: `STAFF_ID_PATTERN=/^\d{8}$/`, `EMAIL_PATTERN=/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Dynamic labels based on `isLDAPEnabled`:
  - true: "Staff ID, Email, or Username"
  - false: "Staff ID or Email"
- Validation: numeric non-8-digit → error; LDAP off + non-email non-8-digit → error
- Submit routing: email → `/auth/sign-in/`; 8-digit+LDAP off → `/auth/sign-in/` (transformed email); else → `/auth/ldap/sign-in/`

### 2. `ldap.tsx` — DELETE

Merged into `staff-id.tsx`.

### 3. `auth-root.tsx` — EDIT

- Conditional rendering by `authMode`:
  - **SIGN_IN**: `StaffIdLoginForm` only (unified staff ID / LDAP / email auto-detect)
  - **SIGN_UP**: original `OAuthOptions` + `AuthFormRoot` (email → password/magic-code flow)
- Restored `OAuthOptions`, `useOAuthConfig`, `AuthFormRoot` imports for sign-up
- Restored `setEmail` setter for sign-up form state
- `noAuthMethodsAvailable` now includes `isOAuthEnabled` check
- Passes `isLDAPEnabled` prop to `StaffIdLoginForm`

## Files Changed

| File                                                        | Action                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/core/components/account/auth-forms/staff-id.tsx`  | REWRITE — unified config-aware form                                |
| `apps/web/core/components/account/auth-forms/ldap.tsx`      | DELETE                                                             |
| `apps/web/core/components/account/auth-forms/auth-root.tsx` | EDIT — sign-in: unified form; sign-up: original OAuth + email form |

## Phase 2 — Shinhan Bank Branding ([phase-02](./phase-02-shinhan-branding-login.md)) `pending`

- Add Shinhan Bank logo next to Plane logo (top-left header)
- Remove Zerodha/Sony/Dolby/Accenture brand logos from footer
- Add "Powered by Plane CE — Customized for Shinhan Bank Vietnam" attribution

### Files Changed (Phase 2)

| File                                               | Action                         |
| -------------------------------------------------- | ------------------------------ |
| `apps/web/app/assets/logos/shinhan-bank-logo.svg`  | CREATE — Shinhan Bank SVG logo |
| `apps/web/core/components/auth-screens/header.tsx` | EDIT — co-branded logos        |
| `apps/web/core/components/auth-screens/footer.tsx` | REWRITE — attribution text     |

## Verification

1. LDAP on + `18506320` → POST `/auth/ldap/sign-in/` username=`18506320`
2. LDAP off + `18506320` → POST `/auth/sign-in/` email=`sh18506320@swing.shinhan.com`
3. Any mode + `user@co.com` → POST `/auth/sign-in/` email=`user@co.com`
4. LDAP on + `john.doe` → POST `/auth/ldap/sign-in/` username=`john.doe`
5. LDAP off + `john.doe` → validation error
6. No OAuth buttons or email form visible on **login** page
7. Sign-up page (`/sign-up/`) shows email/password form + OAuth as before
8. Build: `pnpm turbo run build --filter=web` ✓
