# Plan: Issue Opinion (Activity Section)

> **Feature**: Thêm trường Opinion (ý kiến) vào phần Activity của Work Items, cho phép user đăng ký nhận xét có cấu trúc (không phải comment thông thường) kèm mức độ sentiment.

## Context

Hiện tại, phần Activity của Work Items gồm:

- **Activity log**: tự động ghi lại thay đổi field (state, assignee, priority...)
- **Comment**: rich-text comment thông thường (Tiptap editor)
- **Worklog**: ghi nhận thời gian làm việc

**Opinion** là một loại entry mới gắn trực tiếp vào **từng dòng activity**:

- Mỗi dòng activity (state change, assignee, v.v.) hiển thị **nút Opinion nhỏ** khi hover
- **Chỉ actor (người tạo dòng activity đó)** mới thấy và dùng được nút này
- Click nút → inline popup chọn sentiment (👍 Approve / → Neutral / 👎 Reject) + note ngắn
- Mỗi actor chỉ có **1 opinion per activity log entry** (1-to-1 với `IssueActivity`)
- Opinion hiển thị ngay dưới dòng activity tương ứng (không phải timeline item riêng)

## Architecture Decision

Opinion là một **model riêng** liên kết 1-1 với `IssueActivity`:

- Model: `IssueOpinion` (ProjectBaseModel) với FK `activity → IssueActivity`
- **Không** tạo timeline entry riêng — Opinion render ngay bên dưới dòng activity của nó
- Nút Opinion **chỉ render** khi `currentUser.id === activity.actor` (client-side guard)
- Backend cũng enforce: chỉ actor của activity đó mới POST/PATCH được opinion của row đó
- Upsert: 1 opinion per (activity, actor) → `UniqueConstraint(activity, actor)`

## Phase Table

| Phase | Name                | Scope                                                                 | Est. |
| ----- | ------------------- | --------------------------------------------------------------------- | ---- |
| 01    | Backend Model + API | Django model (FK → IssueActivity), migration, serializer, views, URLs | 2h   |
| 02    | Types + Service     | TypeScript types + API service class                                  | 30m  |
| 03    | MobX Store          | CE store `opinion.store.ts` (keyed by activityId) + root              | 45m  |
| 04    | Frontend Components | OpinionButton per activity row + OpinionPopover                       | 2h   |
| 05    | i18n                | en/ko/vi translations                                                 | 20m  |

## File Map

### Backend (Phase 01)

| Action | Path                                              |
| ------ | ------------------------------------------------- |
| CREATE | `apps/api/plane/db/models/opinion.py`             |
| MODIFY | `apps/api/plane/db/models/__init__.py`            |
| CREATE | `apps/api/plane/app/serializers/issue/opinion.py` |
| MODIFY | `apps/api/plane/app/serializers/__init__.py`      |
| CREATE | `apps/api/plane/app/views/issue/opinion.py`       |
| MODIFY | `apps/api/plane/app/views/__init__.py`            |
| MODIFY | `apps/api/plane/app/views/issue/__init__.py`      |
| MODIFY | `apps/api/plane/app/urls/issue.py`                |
| RUN    | `python manage.py makemigrations`                 |

### Frontend (Phase 02–04)

| Action | Path                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| MODIFY | `packages/types/src/issues/activity/issue_activity.ts` hoặc tạo `opinion.ts`                                                                   |
| MODIFY | `packages/types/src/index.ts`                                                                                                                  |
| CREATE | `apps/web/ce/services/issue-opinion.service.ts`                                                                                                |
| CREATE | `apps/web/ce/store/opinion.store.ts`                                                                                                           |
| MODIFY | `apps/web/ce/store/root.store.ts`                                                                                                              |
| CREATE | `apps/web/ce/hooks/store/use-opinion.ts`                                                                                                       |
| CREATE | `apps/web/ce/components/issues/opinion/opinion-button.tsx` — nút hover per activity row                                                        |
| CREATE | `apps/web/ce/components/issues/opinion/opinion-popover.tsx` — inline popup chọn sentiment                                                      |
| CREATE | `apps/web/ce/components/issues/opinion/opinion-display.tsx` — badge hiển thị opinion đã có                                                     |
| CREATE | `apps/web/ce/components/issues/opinion/index.ts`                                                                                               |
| MODIFY | `apps/web/core/components/issues/issue-detail/issue-activity/activity/actions/helpers/activity-block.tsx` — thêm `<OpinionButton>` vào mỗi row |

### i18n (Phase 05)

| Action | Path                                           |
| ------ | ---------------------------------------------- |
| MODIFY | `packages/i18n/src/locales/en/translations.ts` |
| MODIFY | `packages/i18n/src/locales/ko/translations.ts` |
| MODIFY | `packages/i18n/src/locales/vi/translations.ts` |

## Status

- [ ] Phase 01 – Backend
- [ ] Phase 02 – Types + Service
- [ ] Phase 03 – Store
- [ ] Phase 04 – Components
- [ ] Phase 05 – i18n

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan validation before coding begins
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture/Scope]** Opinion visibility: The plan's GET endpoint filters by `actor=request.user`. Should other project members be able to see the actor's opinion on an activity row?
   - Options: Private — actor only | Public — all members see actor's opinion
   - **Answer:** Public — all members see actor's opinion
   - **Rationale:** The GET endpoint must return the actor's opinion to ALL project members (not filtered by `request.user`). Requires a batch endpoint and removing the `actor=request.user` filter from per-activity GET.

2. **[Architecture]** Core file modification strategy: Phase 04 modifies `activity-block.tsx` in `core/` directly. Should we use a CE render slot instead?
   - Options: Modify core directly | CE override via render slot
   - **Answer:** CE override via render slot
   - **Rationale:** Add `actionSlot?: ReactNode` prop to `activity-block.tsx` (minimal core change, no CE imports). CE parent components inject `<OpinionButton>`. Keeps CE pattern clean.

3. **[Architecture/Performance]** Loading strategy: Lazy fetch (1 call per row on hover) vs batch load when activity feed opens.
   - Options: Lazy fetch (plan as-is) | Batch load on feed open
   - **Answer:** Batch load on feed open
   - **Rationale:** Add `GET /issues/<id>/activity-opinions/` batch endpoint returning all opinions for the issue. Store fetches once on activity feed mount. Better UX, fewer API calls.

#### Confirmed Decisions

- **Visibility**: Public — actor's opinion visible to all project members
- **Core integration**: `actionSlot?: ReactNode` prop in `activity-block.tsx`, CE injects `<OpinionButton>`
- **Loading**: Batch endpoint `GET .../issues/<id>/activity-opinions/` loaded once on feed mount

#### Action Items

- [ ] Phase 01: Add batch GET endpoint `GET .../issues/<issueId>/activity-opinions/`
- [ ] Phase 01: Per-activity GET returns opinion for ALL members (remove `actor=request.user` filter, return the actor's opinion)
- [ ] Phase 02: Add `listOpinionsForIssue()` to service + `TIssueOpinionByActivityMap` stays same shape
- [ ] Phase 03: Replace `fetchOpinion(activityId)` with `fetchOpinionsForIssue(issueId)` batch method
- [ ] Phase 04: Change `activity-block.tsx` to add `actionSlot?: ReactNode` prop; CE parents pass `<OpinionButton>`; `OpinionDisplay` shown for non-actors (read-only) when opinion exists

#### Impact on Phases

- Phase 01: Add batch endpoint; update per-activity GET to return actor's opinion to all members
- Phase 02: Add `listOpinionsForIssue()` service method
- Phase 03: Replace lazy `fetchOpinion` with batch `fetchOpinionsForIssue`
- Phase 04: Use `actionSlot` render slot pattern; show `OpinionDisplay` to all members (not just actor)
