---
title: "Invite Modal Search Enhancement"
description: "Show UPPER(FULL NAME) (StaffID) - Position, Department in invite modal search dropdown"
status: completed
priority: P2
effort: 2h
branch: develop
tags: [invite-modal, search, staff-id, ux]
created: 2026-03-13
completed: 2026-03-13
---

# Invite Modal Search Enhancement

## Goal

Enhance workspace invite modal search dropdown to display: **UPPER(FULL NAME)** + **(StaffID) - Position, Department** per suggestion. Enables Shinhan Bank users (2,500+) to quickly identify the correct person when inviting.

## Current State

- Search API (`GET /api/workspaces/{slug}/members/user-search/`) uses `UserAdminLiteSerializer`
- Serializer returns: id, first_name, last_name, avatar, avatar_url, is_bot, display_name, email, last_login_medium, department_name
- **Missing:** `staff_id` and `position` not in serializer response
- Frontend dropdown shows: Avatar + Full Name + Email + Department (3 lines)
- Performance: debounce 300ms, min 2 chars, max 5 results, server-side filtering — sufficient for 2.5k users
- Email format: `sh{staff_id}@swing.shinhan.com` — staff_id search partially covered by email search

## Phases

| #   | Phase                                                     | Status    | Effort | File                                               |
| --- | --------------------------------------------------------- | --------- | ------ | -------------------------------------------------- |
| 1   | Backend: Add `staff_id` + `position` to search serializer | completed | 45min  | [phase-01](phase-01-backend-staff-id-in-search.md) |
| 2   | Frontend: Update dropdown display format                  | completed | 45min  | [phase-02](phase-02-frontend-dropdown-display.md)  |

## Key Changes Summary

### Backend (Phase 1)

- Add `staff_id` and `position` fields to `UserAdminLiteSerializer` (resolve from `staff_profiles`)
- Add `staff_id` search filter to `user_search` view (Q filter on `staff_profiles__staff_id`)
- Add `staff_id` and `position` to `IUserLite` TypeScript type

### Frontend (Phase 2)

- Line 1: **UPPER(FULL NAME)** (bold, uppercase)
- Line 2: **(StaffID) - Position, Department** (subtitle, muted)
- Fallback: show email when no staff profile

## Dependencies

- `StaffProfile` model already has `staff_id` field (char(8), indexed, unique)
- `user_search` already does `prefetch_related("staff_profiles__department")`
- `IUserLite` type already has optional `department_name`

## Risks

| Risk                                           | Mitigation                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| Users without StaffProfile (non-staff)         | Graceful fallback: show email when staff_id is null                           |
| `IUserLite` type change breaks other consumers | `staff_id` and `position` are optional fields — additive, backward-compatible |

## Validation Log

### Session 1 — 2026-03-13

**Trigger:** Initial plan creation validation
**Questions asked:** 3

#### Questions & Answers

1. **[Display]** Confirm the dropdown display format. Is this correct?
   - Options: Yes, 2-line format | All on one line
   - **Answer:** Yes, 2-line format — UPPER(FULL NAME) + (StaffID) - Position, Department
   - **Rationale:** Clear visual hierarchy; uppercase name for quick scanning in 2.5k+ user list

2. **[Search scope]** Should search also match by department name and position?
   - Options: Add staff_id only | Add staff_id + department | Add staff_id + dept + position
   - **Answer:** Staff_id only is sufficient
   - **Custom input:** Email format is `sh{staff_id}@swing.shinhan.com` — typing staff_id already matches email via existing email search. Explicit staff_id filter still useful for direct matching.
   - **Rationale:** No need for department/position search; staff_id covers identification needs

3. **[CE pattern]** Should we modify core/ files directly?
   - Options: Modify core/ directly | Create CE overrides
   - **Answer:** Modify core/ directly
   - **Rationale:** Small enhancement to existing serializer/view/component, not a new feature

#### Confirmed Decisions

- Display: UPPER(FULL NAME) + (StaffID) - Position, Department
- Backend: Add `staff_id` + `position` to serializer (not just staff_id)
- Search: Keep existing + add explicit staff_id filter
- CE: Modify core/ directly

#### Action Items

- [x] Add `position` field to backend serializer (new requirement from validation)
- [x] Add `position` to IUserLite TypeScript type
- [x] Update frontend to uppercase full name
- [x] Update subtitle format to `(StaffID) - Position, Department`

#### Impact on Phases

- Phase 1: Add `position` SerializerMethodField + add to IUserLite type
- Phase 2: Change display format — uppercase name, subtitle = `(StaffID) - Position, Department`
