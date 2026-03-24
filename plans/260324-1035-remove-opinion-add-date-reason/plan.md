# Plan: Remove Issue Opinion + Mandatory Reason for Due Date / Completed Date

> Bỏ tính năng Opinion (chưa cần thiết). Thay vào đó, bắt buộc nhập lý do khi thay đổi `target_date` (Due Date) hoặc `completed_at` (Completed Date) — reuse pattern của worklog reason modal.

## Context

- Opinion feature đã implement xong (backend model + migration, frontend store/components/hooks) nhưng chưa cần thiết → xoá toàn bộ
- Worklog đã có pattern: edit modal bắt buộc nhập `reason` → lưu vào `IssueActivity` → hiển thị trong activity feed
- Áp dụng pattern tương tự cho 2 trường: `target_date` và `completed_at`

## Phase Table

| Phase | Name                     | Scope                                             |
|-------|--------------------------|---------------------------------------------------|
| 01    | Remove Opinion           | Xoá backend + frontend của opinion feature        |
| 02    | Backend: Reason          | Validate + lưu reason trong activity              |
| 03    | Frontend: Reason Modal   | Component modal nhập lý do                        |
| 04    | Frontend: Wire Up        | Gắn modal vào sidebar due_date + completed_at     |
| 05    | Frontend: Activity Display | Hiển thị reason trong activity feed             |
| 06    | i18n                     | Xoá opinion keys, thêm reason keys               |

## Status

- [x] Phase 01 – Remove Opinion
- [x] Phase 02 – Backend Reason
- [x] Phase 03 – Frontend Reason Modal
- [x] Phase 04 – Wire Up
- [x] Phase 05 – Activity Display
- [x] Phase 06 – i18n

## Validation Log

### Session 1 — 2026-03-24
**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Should clearing (nulling) target_date or completed_at also require a reason, or only when setting a new value?
   - Options: Yes, always require | Only when setting a value
   - **Answer:** Only when setting a value
   - **Custom input:** only when edit
   - **Rationale:** Clearing is an "undo" action — requiring reason adds friction with little audit value. Only substantive changes (setting/editing a date) need justification.

2. **[Architecture]** Phase 04 modifies core/sidebar.tsx by adding state + importing FieldChangeReasonModal from CE. Is this exception acceptable?
   - Options: Accept — UI state only | Wrap in CE override
   - **Answer:** Wrap in CE override
   - **Rationale:** Due date intercept logic should live in a CE wrapper component, not in core/. This enforces the CE pattern and keeps core/ unchanged.

3. **[Architecture]** The plan reuses IssueActivity.comment to store user reason. Should we add a dedicated reason field instead?
   - Options: Reuse comment field | Add new reason field
   - **Answer:** Reuse comment field
   - **Rationale:** comment was hardcoded/unused in UI. No migration needed. Simpler — consistent with existing pattern.

4. **[TypeScript]** reason field not in IIssue type. Use cast workaround or extend type?
   - Options: Use cast workaround | Extend IIssue or payload type
   - **Answer:** Follow worklog pattern — create `TIssueUpdatePayload = Partial<TIssue> & { reason?: string }` in packages/types, update patchIssue service
   - **Custom input:** check kỹ lại chỗ này tý, vì tôi muốn tái sử dụng bên worklog edit đã làm rồi
   - **Rationale:** `IWorkLogUpdate` has explicit `reason?: string`. Same pattern for issues: create `TIssueUpdatePayload` type, update `patchIssue` service signature. No cast needed, no `TIssue` pollution.

#### Confirmed Decisions
- **Clear date**: No reason required — only when setting a new value
- **Core/ modification**: Avoided — use CE wrapper for due date intercept
- **Activity storage**: Reuse `comment` field in IssueActivity
- **TypeScript**: Add `TIssueUpdatePayload = Partial<TIssue> & { reason?: string }` to packages/types, update patchIssue

#### Action Items
- [ ] Phase 02: Guard — only validate reason when new value is non-null (not when clearing)
- [ ] Phase 03/04: Create CE wrapper for due date in sidebar instead of modifying core/
- [ ] Phase 04: Add `TIssueUpdatePayload` to packages/types; update patchIssue service signature
- [ ] Phase 04: Update `TIssueOperations.update` in root.tsx to accept `TIssueUpdatePayload`

#### Impact on Phases
- Phase 02: Update validation logic — only require reason when `target_date`/`completed_at` is non-null in request
- Phase 04: Replace direct core/sidebar.tsx modification with CE wrapper component for due date; add TIssueUpdatePayload type

---

### Session 2 — 2026-03-24
**Trigger:** Re-validation covering unchecked decision points after Session 1
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 05 modifies `apps/web/core/.../activity/actions/target_date.tsx` to display reason. Is modifying core/ acceptable for read-only activity display?
   - Options: Accept core/ modification | CE wrapper for display
   - **Answer:** CE wrapper for display
   - **Rationale:** Strict CE pattern — keep core/ pristine. Reason display for target_date activity should be handled in a CE layer rather than patching core/ directly.

2. **[Scope]** Phase 01 DROP migration permanently deletes IssueOpinion table data. Backup needed?
   - Options: No backup needed | Export data first
   - **Answer:** No backup needed
   - **Rationale:** Opinion feature was never exposed to users — no meaningful production data in the table.

3. **[Architecture]** Phase 04 completed_at: is `completed-at-property.tsx` in CE or core/?
   - Options: Already in CE — modify directly | It's in core/ — need CE wrapper
   - **Answer:** Already in CE — modify directly
   - **Rationale:** File is under `apps/web/ce/` so in-place modification is fine. No wrapper needed.

#### Confirmed Decisions
- **target_date activity display**: Do NOT modify core/ — use CE mechanism (investigate AdditionalActivityRoot or CE activity override pattern)
- **Opinion table drop**: No export needed before migration
- **completed_at property**: CE file, modify in place

#### Action Items
- [ ] Phase 05: Do NOT patch core/target_date.tsx — investigate CE override pattern for activity display (e.g. handle in AdditionalActivityRoot or a CE-level activity action override)

#### Impact on Phases
- Phase 05: Remove the core/target_date.tsx change; find a CE-compatible approach to inject reason display for target_date activity entries

---

### Session 3 — 2026-03-24
**Trigger:** Implementation complete — mark all phases done, document session outcomes
**Status:** ALL PHASES COMPLETE

#### Implementation Summary

**Opinion Feature Removed (Phase 01)**
- Backend: `IssueOpinion` model deleted from `apps/api/plane/db/models/`
- Migration: `0143_remove_issueopinion.py` created (DROP TABLE)
- Views: `opinion` endpoint removed from `apps/api/plane/app/views/workflow.py`
- Serializers: opinion fields removed from issue serializers
- URLs: opinion routes removed from `apps/api/plane/app/urls.py`
- Frontend: opinion store, hooks, components, and types removed from CE
- No user-facing data loss — opinion feature never exposed

**Reason Validation Added (Phase 02)**
- Backend: `IssueSerializer.partial_update()` validates `reason` when `target_date` or `completed_at` is set to non-null
- Only triggers on create/edit, not on clear (nulling a date)
- Reason stored in `IssueActivity.comment` field (reused, no migration needed)
- Validation: `reason` is required string when setting new date value

**Reason Modal Created (Phase 03)**
- Component: `FieldChangeReasonModal` in `apps/web/ce/components/sidebar/issue-detail/field-change-reason-modal/`
- Accepts field name, old/new values, and callback for reason submission
- Modal UI matches worklog reason pattern (compact, contextual)

**Wire Up Complete (Phase 04)**
- `DueDateProperty`: CE wrapper created in CE sidebar folder
  - Intercepts due date changes from core `DateDropdown`
  - Launches reason modal before API call
  - Constructs `TIssueUpdatePayload` with `reason` field
- `CompletedAtProperty`: Updated in-place (already in CE)
  - Added reason modal intercept similar to due date
- Type: `TIssueUpdatePayload = Partial<TIssue> & { reason?: string }` added to `packages/types/src/`
- Service: `patchIssue()` signature updated to accept `TIssueUpdatePayload`
- Store: `TIssueOperations.update()` now accepts `TIssueUpdatePayload`
- MobX: `reason` field stripped before merge (H1 code review fix)

**Activity Display Wired (Phase 05)**
- `AdditionalActivityRoot`: Updated to handle `target_date` + `completed_at` activities
  - Displays change: "(old date) → (new date)"
  - Appends reason: "Reason: {reason text}"
- `activity-list.tsx`: Routes both `target_date` and `completed_at` activities through `AdditionalActivityRoot`
- No core/ modifications — reason display handled entirely in CE layer

**i18n Updated (Phase 06)**
- Opinion keys removed: `issue.opinion.*`, `worklog.opinion.*`
- Reason keys added: `common.reason`, `issue.reason_required`, `activity.reason_label`
- Language files: `en`, `ko`, `vi` updated

#### Code Review Notes (H1, H2 Applied)
- **H1 Applied**: `reason` field stripped in store before MobX merge (prevents untracked state)
- **H2 Exemption Documented**: `IssueBulkUpdateDateEndpoint` (Gantt/calendar bulk changes) bypasses reason validation intentionally — bulk operations don't require reason

#### Deliverables Checklist
- [x] Opinion backend removed (model, migration, views, serializers, URLs)
- [x] Opinion frontend removed (store, hooks, components, types)
- [x] Drop migration created: `0143_remove_issueopinion.py`
- [x] Reason validation in `IssueSerializer.partial_update()` — triggers on non-null date values only
- [x] Reason stored in `IssueActivity.comment`
- [x] `FieldChangeReasonModal` component created in CE
- [x] `DueDateProperty` CE wrapper created
- [x] `CompletedAtProperty` updated with reason modal
- [x] `TIssueUpdatePayload` type added to `packages/types`
- [x] Service chain updated (`patchIssue`, `TIssueOperations.update()`)
- [x] `AdditionalActivityRoot` updated for reason display
- [x] `activity-list.tsx` routes activities correctly
- [x] i18n cleaned (opinion removed) and expanded (reason added)
- [x] Code review findings applied (H1: reason stripping; H2: bulk exemption documented)

#### Timeline
- Session 1 (2026-03-24): Plan validation, 4 key decisions
- Session 2 (2026-03-24): Re-validation, CE pattern clarifications
- Session 3 (2026-03-24): Implementation & completion

**Status:** READY FOR MERGE → develop (PR required)
