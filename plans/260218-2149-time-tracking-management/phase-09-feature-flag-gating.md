# Phase 9: Feature Flag Gating & UX Guards

## Context Links

- Plan: [plan.md](plan.md)
- Feature toggle pattern: `apps/web/core/components/settings/project/content/feature-control-item.tsx`
- Sidebar nav: `apps/web/ce/components/sidebar/project-navigation-root.tsx`
- Route guard ref: Views layout pattern
- Worklog button: `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx`

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 2h
- Gate all Time Tracking UI behind `is_time_tracking_enabled` project flag, matching how Views/Cycles/Modules toggle on/off.

## Codebase Verification (2026-03-04)

| Item                   | Status       | Evidence                                                                             |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------ |
| Backend model field    | ✅ EXISTS    | `project.py` L98: `is_time_tracking_enabled = BooleanField(default=True)`            |
| API serializer         | ✅ EXISTS    | Both `ProjectCreateSerializer` and `ProjectUpdateSerializer` include field           |
| Settings toggle page   | ✅ EXISTS    | `/features/time-tracking/page.tsx` with `featureProperty="is_time_tracking_enabled"` |
| Settings constant      | ✅ EXISTS    | `packages/constants/src/settings/project.ts` L110-116                                |
| Activity helper        | ✅ EXISTS    | `helper.tsx` handles `is_time_tracking_enabled` toggle activity                      |
| TypeScript type        | ❌ MISSING   | `IPartialProject` does NOT have `is_time_tracking_enabled`                           |
| Sidebar nav gate       | ❌ NEEDS FIX | `shouldRender: true` hardcoded (L39), comment says "no feature flag exists yet"      |
| Route guard            | ❌ MISSING   | `time-tracking/layout.tsx` has no feature check                                      |
| i18n disabled strings  | ❌ MISSING   | Only toggle strings exist, no disabled state messages                                |
| "Log Time" button gate | ❌ NEEDS FIX | Accepts `disabled` prop but no internal flag check or popup                          |

## Key Insights

- Backend + Settings toggle fully implemented — only frontend gating remains
- Sidebar nav has comment acknowledging the gap: "no feature flag exists yet"
- Other features use `!!project?.{flag}` in `shouldRender` — direct pattern to follow
- "Log Time" button currently returns `null` when `disabled` — needs popup instead
- Route guard should use EmptyState (confirmed Validation Session 10)

## Requirements

### Functional

1. **Sidebar**: hide "Time Tracking" nav when `is_time_tracking_enabled === false`
2. **"Log Time" button**: show friendly info popup when feature disabled (not hide, not error)
3. **Route guard**: `/time-tracking/*` pages show EmptyState with disabled message
4. **Popup message** (i18n EN/VI/KO): "Dự án/Nhóm này không yêu cầu chấm công. Nếu cần, hãy liên hệ Project Admin để bật trong Project Settings → Features."

### Non-functional

- Follow existing toggle patterns exactly (Views, Cycles, Modules)
- i18n for EN, VI, KO

## Related Code Files

### Files to Modify (6 files)

1. `packages/types/src/project/projects.ts` — add `is_time_tracking_enabled: boolean` to `IPartialProject`
2. `apps/web/ce/components/sidebar/project-navigation-root.tsx` — change `shouldRender: true` → `shouldRender: !!project?.is_time_tracking_enabled`
3. `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx` — check flag, show popup instead of returning null
4. `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/layout.tsx` — add EmptyState route guard
5. `packages/i18n/src/locales/en/translations.ts` — add disabled popup strings
6. `packages/i18n/src/locales/vi/translations.ts` — Vietnamese disabled strings
7. `packages/i18n/src/locales/ko/translations.ts` — Korean disabled strings

### Files to Create

- None (all modifications to existing files)

## Implementation Steps

### Step 1: Add TypeScript type

In `packages/types/src/project/projects.ts`, add to `IPartialProject`:

```typescript
is_time_tracking_enabled: boolean;
```

### Step 2: Gate sidebar navigation

In `apps/web/ce/components/sidebar/project-navigation-root.tsx` (L39):

```typescript
// FROM
shouldRender: true,
// TO
shouldRender: !!project?.is_time_tracking_enabled,
```

### Step 3: Add i18n strings

Add to EN/VI/KO translations under `time_tracking` group:

**EN:**

```typescript
disabled_title: "Time tracking is not enabled",
disabled_description: "Time tracking is not enabled for this project. Contact a project admin to enable it in Project Settings → Features.",
```

**VI:**

```typescript
disabled_title: "Chấm công chưa được bật",
disabled_description: "Dự án này không yêu cầu chấm công. Nếu cần, hãy liên hệ Project Admin để bật trong Cài đặt dự án → Tính năng.",
```

**KO:**

```typescript
disabled_title: "시간 추적이 활성화되지 않았습니다",
disabled_description: "이 프로젝트에서는 시간 추적이 활성화되지 않았습니다. 프로젝트 설정 → 기능에서 활성화하려면 프로젝트 관리자에게 문의하세요.",
```

### Step 4: Update "Log Time" button

In `worklog-create-button.tsx`:

- Get `currentProjectDetails` from project store
- If `is_time_tracking_enabled === false`: show `AlertDialog` or `toast` with i18n disabled message
- If `is_time_tracking_enabled === true`: open WorklogModal as current behavior
- Remove `if (disabled) return null` — replace with popup behavior

### Step 5: Add route guard

<!-- Updated: Validation Session 10 - EmptyState pattern confirmed -->

In `time-tracking/layout.tsx`:

```typescript
const { currentProjectDetails } = useProject();

if (currentProjectDetails?.is_time_tracking_enabled === false) {
  return <EmptyState title={t("time_tracking.disabled_title")} description={t("time_tracking.disabled_description")} />;
}
```

### Step 6: Verify worklog property sidebar

Check `IssueWorklogProperty` in issue detail sidebar — should also respect the flag (hide when disabled).

## Todo List

- [x] Add `is_time_tracking_enabled` to `IPartialProject` TypeScript type
- [x] Gate sidebar nav item: `shouldRender: !!project?.is_time_tracking_enabled`
- [x] Add i18n disabled strings (EN, VI, KO)
- [x] Update "Log Time" button: show popup when disabled instead of returning null
- [x] Add EmptyState route guard to time-tracking layout
- [x] Check & gate worklog property in issue sidebar
- [ ] Test toggle on/off flow end-to-end

## Success Criteria

- Toggle off → sidebar "Time Tracking" menu disappears
- Toggle off → "Log Time" button shows friendly popup (not hidden)
- Toggle off → direct URL `/time-tracking` shows EmptyState with message
- Toggle on → everything works as before
- All strings translated (EN, VI, KO)

## Risk Assessment

- **Low risk**: follows established patterns exactly
- **Backend confirmed**: `ProjectDetailSerializer` includes `is_time_tracking_enabled` ✅
- **Default=True**: existing projects work without migration issues

## Security Considerations

- Backend already includes `is_time_tracking_enabled` in project serializer
- API endpoints for worklogs should also check the flag server-side (verify in ViewSet)
- Frontend gating is UX only — backend must enforce independently
