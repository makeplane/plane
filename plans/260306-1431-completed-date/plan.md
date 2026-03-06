---
title: "Add Completed Date display to work item sidebar"
description: "Show read-only completed_at datetime in issue detail & peek-overview sidebars when state is done"
status: completed
priority: P2
effort: 30m
branch: ngoc-feat/work-items
tags: [frontend, ui, work-items, sidebar]
created: 2026-03-06
---

# Add Completed Date to Work Item Sidebar

## Summary

Backend already has `completed_at` auto-populated on state → "completed" group transition. Task is purely frontend: display the field as read-only in both sidebars.

## Phases

| #   | Phase                           | Status       | File                                           |
| --- | ------------------------------- | ------------ | ---------------------------------------------- |
| 1   | Add to issue detail sidebar     | ✅ completed | [phase-01](./phase-01-issue-detail-sidebar.md) |
| 2   | Add to peek-overview properties | ✅ completed | [phase-02](./phase-02-peek-overview.md)        |
| 3   | Add to list view & board cards  | ✅ completed | [phase-03](./phase-03-list-board-cards.md)     |

## Validation Log

### Session 1 — 2026-03-06

**Trigger:** Initial plan creation validation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Which icon should be used for the Completed At property row?
   - Options: DueDatePropertyIcon | Done/check icon
   - **Answer:** DueDatePropertyIcon
   - **Rationale:** Consistent with the Due Date row in the same sidebar; avoids importing a new icon.

2. **[Architecture]** How should the completed_at value be displayed?
   - Options: Date + time | Date only
   - **Answer:** Date + time (e.g. "Mar 6, 2026 2:30 PM")
   - **Rationale:** Full precision is appropriate for an audit/timestamp field; use `renderFormattedDate` + `renderFormattedTime("12-hour")`.

3. **[Scope]** Where in the properties list should the Completed At row appear?
   - Options: After Due Date row | End of properties list
   - **Answer:** After Due Date row
   - **Rationale:** Chronological grouping (Created → Due → Completed) is most intuitive.

#### Confirmed Decisions

- Icon: `DueDatePropertyIcon` — consistent with existing Due Date row
- Format: date + time (12-hour) — full timestamp display
- Placement: immediately after Due Date `SidebarPropertyListItem`

#### Action Items

- [ ] Place block directly after Due Date row in both `sidebar.tsx` and `peek-overview/properties.tsx`

#### Impact on Phases

- Phase 1: Insert after Due Date row (not end of list)
- Phase 2: Same placement decision applies

### Session 2 — 2026-03-06

**Trigger:** Re-validation before implementation — CE pattern compliance review
**Questions asked:** 3

#### Questions & Answers

1. **[CE Pattern]** The plan modifies `core/` files directly (`sidebar.tsx`, `peek-overview/properties.tsx`). Project rules say never modify `core/` except router layouts and store hooks. Is this an approved exception?
   - Options: Yes, approved exception | No, create CE overrides
   - **Answer:** No, create CE overrides
   - **Rationale:** Core/ modifications are prohibited by project rules. CE wrapper/override components must be created instead of editing `core/` sidebar files directly.

2. **[Display Condition]** The implementation checks `issue.completed_at !== null` for display. But a state could revert from completed (leaving completed_at set). Should visibility be tied to the value alone, or also check current state group?
   - Options: `completed_at` value only | Also check state group == done
   - **Answer:** `completed_at` value only
   - **Rationale:** Backend auto-clears `completed_at` on state revert; simple null check is sufficient and correct.

3. **[i18n]** The `common.completed_at` i18n key exists in EN translations. Should we also verify it exists in KO and VI locales?
   - Options: Yes, verify all locales | No, EN only for now
   - **Answer:** Yes, verify all locales
   - **Rationale:** KO/VI are active locales; missing key falls back to key string, not English text. Must add if missing.

#### Confirmed Decisions

- CE overrides: create CE wrapper components instead of modifying `core/` sidebar files directly
- Display condition: `issue.completed_at !== null` (no state group check)
- i18n: verify and add `common.completed_at` to KO/VI locales if missing

#### Action Items

- [ ] Investigate CE override mechanism for `sidebar.tsx` and `peek-overview/properties.tsx`
- [ ] Verify `common.completed_at` key in KO and VI translation files; add if absent
- [ ] Update phase files to reflect CE override approach

#### Impact on Phases

- Phase 1: Use CE override instead of modifying `core/components/issues/issue-detail/sidebar.tsx`
- Phase 2: Use CE override instead of modifying `core/components/issues/peek-overview/properties.tsx`

### Session 3 — 2026-03-06

**Trigger:** Re-validation — resolve contradiction between Key Facts (modify core/) and Session 2 (CE override)
**Questions asked:** 3

#### Questions & Answers

1. **[Core vs CE]** plan.md Key Facts says 'modify core/ directly' but Session 2 confirmed 'create CE overrides'. Which approach applies?
   - Options: Modify core/ directly | CE override | Investigate first
   - **Answer:** CE override
   - **Rationale:** Strictly follows CE pattern rules; create wrapper components in `ce/components/issues/` instead of touching `core/`.

2. **[Phase files]** The Implementation Steps in Phase 1 still reference modifying core/ sidebar.tsx directly (not CE wrapper). Should the phase files be rewritten for CE override, or left as-is?
   - Options: Rewrite for CE override | Leave as-is, implement directly
   - **Answer:** Rewrite for CE override
   - **Rationale:** Phase files must accurately describe the approach before implementation begins.

3. **[i18n scope]** Session 2 decided to verify common.completed_at in KO/VI locales. Should this be done as part of Phase 1 or as a separate step?
   - Options: Part of Phase 1 | Separate final step
   - **Answer:** Part of Phase 1
   - **Rationale:** Inline verification during sidebar implementation avoids a separate pass.

#### Confirmed Decisions

- Approach: CE override — no `core/` modifications
- Phase files: rewrite to describe CE wrapper approach
- i18n: verify KO/VI as part of Phase 1

#### Action Items

- [x] Fix contradiction in Key Facts section (remove "modify directly")
- [ ] Rewrite Phase 1 implementation steps for CE override approach
- [ ] Rewrite Phase 2 implementation steps for CE override approach

#### Impact on Phases

- Phase 1: Rewrite Implementation Steps for CE wrapper pattern
- Phase 2: Rewrite Implementation Steps for CE wrapper pattern

### Session 4 — 2026-03-06

**Trigger:** Re-validation — edge case: state revert from done to another state
**Questions asked:** 1

#### Questions & Answers

1. **[Display Condition]** Khi state đổi từ done → trạng thái khác, backend set `completed_at = None`. Nhưng nếu frontend store không re-fetch issue sau update, giá trị cũ có thể vẫn còn trong memory. Cần xử lý edge case này không?
   - Options: Không cần — store tự update | Cần — thêm check state group | Cần — điều tra store trước
   - **Answer:** Không cần — store tự update
   - **Rationale:** Issue store đã xử lý optimistic/live update sau state change; API response trả về `completed_at = null` và store sync đúng. Null check đơn giản là đủ.

#### Confirmed Decisions

- State revert edge case: handled by backend (`completed_at = None`) + store auto-sync → no frontend workaround needed
- Display condition remains: `issue.completed_at !== null` only

#### Action Items

- (none — existing plan is correct)

#### Impact on Phases

- (none — no phase changes required)

### Session 5 — 2026-03-06

**Trigger:** Re-validation — edge case: state revert + optimistic UI + backend verify
**Questions asked:** 3

#### Questions & Answers

1. **[Backend Verify]** Session 4 concluded backend tự clear `completed_at = None` khi state revert. Bạn đã verify điều này trong backend code chưa?
   - Options: Đã verify | Chưa verify (assumed) | Cần thêm check state group
   - **Answer:** Chưa verify (assumed)
   - **Rationale:** Backend behavior chưa được xác nhận — cần kiểm tra `Issue.save()` hoặc signal trước khi rely vào assumption này.

2. **[Display Condition]** Nếu user đổi state từ done → in-progress rồi lập tức xem sidebar (trước khi API response về), completed_at row vẫn hiện do optimistic update chưa clear. Cần handle?
   - Options: Không cần | Cần — check cả state group
   - **Answer:** Cần — check cả state group
   - **Rationale:** Thêm `issue.state?.group === 'completed'` vào display condition để row không hiện khi state đã đổi optimistically, ngay cả trước khi API response clear `completed_at`.

3. **[Test Coverage]** Cần thêm manual test step để verify "row disappears when state changes back" không?
   - Options: Có — thêm test step | Không cần
   - **Answer:** Có — thêm test step
   - **Rationale:** Success Criteria yêu cầu verify explicitly; không có test step thì không có confidence.

#### Confirmed Decisions

- Display condition: `issue.completed_at && issue.state?.group === 'completed'` (dual check)
- Backend verify: add step to check `Issue.save()` / Django signal clears `completed_at` on state revert
- Test: add explicit test step for state revert → row disappears

#### Action Items

- [ ] Update display condition in Phase 1 and Phase 2 snippets to dual check
- [ ] Add backend verification step to Phase 1 Todo
- [ ] Add manual test step for state revert to Phase 1 Todo

#### Impact on Phases

- Phase 1: Update display condition + add backend verify step + add manual test step
- Phase 2: Update display condition

### Session 6 — 2026-03-06

**Trigger:** Final pre-implementation validation
**Questions asked:** 3

#### Questions & Answers

1. **[CE Strategy]** If no CE override file exists for the issue detail sidebar, how should we proceed?
   - Options: Create new CE wrapper | Modify core/ as exception | Investigate first
   - **Answer:** Create new CE wrapper
   - **Rationale:** Always follow CE pattern — compose a new CE sidebar component that renders core sidebar + injects completed_at block.

2. **[State Shape]** Does the issue object in the sidebar context include the full state object with group, or only state_id?
   - Options: Full state object | Only state_id | Unknown
   - **Answer:** Full state object — `issue.state.group` is available; dual condition works as written.
   - **Rationale:** No store lookup needed; display condition `issue.completed_at && issue.state?.group === 'completed'` is valid.

3. **[Scope]** Should completed_at appear anywhere beyond the two sidebars?
   - Options: Sidebars only | Also in list/board cards
   - **Answer:** Also in list/board cards
   - **Rationale:** Scope expanded — need a Phase 3 to add completed_at to list view and board card properties.

#### Confirmed Decisions

- CE strategy: create new wrapper if override doesn't exist
- State shape: full object available — no store lookup needed
- Scope: list/board cards included → add Phase 3

#### Action Items

- [ ] Add Phase 3 for list/board card completed_at display

#### Impact on Phases

- Phase 1 & 2: unchanged
- Phase 3 (new): add completed_at to list view column and board card properties

---

## Key Facts

- **No backend changes** — field exists, auto-set in `Issue.save()`
- **No new i18n** — `common.completed_at: "Completed at"` exists (translations.ts:728); verify KO/VI
- **No new icon** — reuse `DueDatePropertyIcon` (calendar-check shape)
- Formatters: `renderFormattedDate` + `renderFormattedTime` from `@plane/utils`
- **CE override required** — do NOT modify `core/` sidebar or peek-overview files directly
