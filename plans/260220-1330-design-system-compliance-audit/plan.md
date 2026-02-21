# Design System Compliance Audit & Fix Plan

**Created**: 2026-02-20
**Status**: Complete
**Priority**: High — ensures UI/UX consistency and maintainability

## Overview

Custom features (Dashboard Pro, Department & Staff Management, LDAP Auth) were developed before the Plane design system rules were established. This plan audits and fixes all violations to align with `plane-design-system.md` and `plane-backend-architecture.md`.

## Phases

| Phase   | Description                                   | Status       | Risk   |
| ------- | --------------------------------------------- | ------------ | ------ |
| Phase 1 | Frontend — Propel migration & semantic tokens | [x] Complete | Low    |
| Phase 2 | Frontend — i18n compliance                    | [x] Complete | Low    |
| Phase 3 | Backend — Activity tracking                   | [x] Complete | Low    |
| Phase 4 | Frontend — File size & modularization         | [x] Complete | Medium |
| Phase 5 | Architecture — CE override pattern            | [x] Complete | High   |

---

## Phase 1 — Propel Migration & Semantic Tokens

→ [phase-01-propel-migration.md](./phase-01-propel-migration.md)

## Phase 2 — i18n Compliance

→ [phase-02-i18n-compliance.md](./phase-02-i18n-compliance.md)

## Phase 3 — Backend Activity Tracking

→ [phase-03-backend-activity-tracking.md](./phase-03-backend-activity-tracking.md)

## Phase 4 — File Size & Modularization

→ [phase-04-file-modularization.md](./phase-04-file-modularization.md)

## Phase 5 — CE Override Pattern

→ [phase-05-ce-override-pattern.md](./phase-05-ce-override-pattern.md)

---

## Success Criteria

- [x] Zero `@plane/ui` imports for components that exist in `@plane/propel`
- [x] Zero hardcoded colors (`bg-white`, `text-gray-*`, `border-gray-*`)
- [x] All user-facing strings use `useTranslation()`
- [x] All mutation endpoints fire `model_activity.delay()`
- [x] All component files <150 lines
- [x] All custom stores/services in `ce/` directory
- [x] Linting passes: `pnpm check:lint`
- [x] Dark mode verified for all custom features (manual)
