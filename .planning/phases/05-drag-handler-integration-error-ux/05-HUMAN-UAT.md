---
status: partial
phase: 05-drag-handler-integration-error-ux
source: [05-VERIFICATION.md]
started: 2026-05-04T15:10:00Z
updated: 2026-05-04T15:10:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Drag a Work Item without violation in Issue Gantt

expected: No predecessor/successor moves visually; no error toast; updateBlockDates routes through commitWithServerResult and returns success
result: [pending]

### 2. Drag rightward past successor's start_date

expected: Sibling block shifts during drag (preview), commit replaces with server response
result: [pending]

### 3. Drag with 3-node chain

expected: All 3 transitive shifts visible during preview; final state matches server
result: [pending]

### 4. DEPENDENCY_CYCLE — drag head of 3-node cycle

expected: ERROR toast「依存関係に循環があるため、この日程変更は適用できません。」(or English equivalent); block snaps back
result: [pending]

### 5. PROJECT_BOUNDARY_EXCEEDED — drag triggers cross-project relation

expected: ERROR toast「プロジェクト境界を越える伝播はサポートされていません。」; snap back
result: [pending]

### 6. INCOMPLETE_SCHEDULE — successor with cleared target_date

expected: ERROR toast「依存する作業項目に開始日または目標日が設定されていません。」; snap back
result: [pending]

### 7. PROPAGATION_LIMIT_EXCEEDED — 101-item chain

expected: ERROR toast「影響する作業項目が 100 件を超えるため、適用できません。…」; snap back
result: [pending]

### 8. SCHEDULE_CHANGED — concurrent PATCH mid-drag

expected: ERROR toast「他のユーザーがこの作業項目の日程を変更しました。…」; snap back
result: [pending]

### 9. PERMISSION_DENIED — GUEST user drag

expected: ERROR toast「影響する作業項目を更新する権限がありません。」; snap back
result: [pending]

### 10. INVALID_DATE_RANGE — direct API call with reversed dates

expected: ERROR toast「指定された日付の範囲が不正です。」
result: [pending]

### 11. Hidden-update notification — partial-view chain

expected: INFO toast「作業項目を更新しました」/ message「表示外の作業項目を N 件更新しました」with correct count
result: [pending]

### 12. Resize drag (left handle)

expected: Falls through D-01b; calls issues.updateIssueDates; no propagation toast
result: [pending]

### 13. Resize drag (right handle)

expected: Same as left handle
result: [pending]

### 14. Module Gantt drag

expected: No propagation; uses issues.updateIssueDates (D-01c — Module gantt does not wrap in PropagationCallbacksContext.Provider)
result: [pending]

### 15. Dependency-creation arrow drag

expected: UNCHANGED (CE files byte-identical, FE-09/PROP-18 inert)
result: [pending]

## Summary

total: 15
passed: 0
issues: 0
pending: 15
skipped: 0
blocked: 0

## Gaps
