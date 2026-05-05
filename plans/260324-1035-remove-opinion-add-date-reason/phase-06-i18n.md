# Phase 06: i18n

## Files to modify

- `packages/i18n/src/locales/en/translations.ts`
- `packages/i18n/src/locales/ko/translations.ts`
- `packages/i18n/src/locales/vi/translations.ts`

---

## REMOVE: Opinion keys

Remove entire `opinion: { ... }` block từ cả 3 file (bắt đầu từ `// Issue Opinion` comment).

---

## ADD: Issue reason + completed_at activity keys

Thêm vào `issue` object trong translations (hoặc top-level nếu cấu trúc flat):

### English (`en`)

```ts
// In `issue` namespace:
reason_modal_title: "Why are you changing the {{field}}?",
reason_label: "Reason for change",
reason_placeholder: "Explain why this date is being changed...",
reason_required: "A reason is required when changing this field.",
activity_reason: "Reason",
activity_completed_at_set: "set the completed date to",
activity_completed_at_removed: "removed the completed date",
```

### Korean (`ko`)

```ts
reason_modal_title: "{{field}}을(를) 변경하는 이유는 무엇인가요?",
reason_label: "변경 이유",
reason_placeholder: "이 날짜를 변경하는 이유를 설명해 주세요...",
reason_required: "이 필드를 변경하려면 이유가 필요합니다.",
activity_reason: "이유",
activity_completed_at_set: "완료 날짜를",
activity_completed_at_removed: "완료 날짜를 제거했습니다",
```

### Vietnamese (`vi`)

```ts
reason_modal_title: "Tại sao bạn thay đổi {{field}}?",
reason_label: "Lý do thay đổi",
reason_placeholder: "Giải thích lý do thay đổi ngày này...",
reason_required: "Cần có lý do khi thay đổi trường này.",
activity_reason: "Lý do",
activity_completed_at_set: "đặt ngày hoàn thành thành",
activity_completed_at_removed: "đã xóa ngày hoàn thành",
```

---

## Notes

- `worklog.activity_reason` key đã tồn tại → `issue.activity_reason` là key riêng cho issue fields (hoặc có thể reuse `worklog.activity_reason` nếu muốn DRY — tùy quyết định implementation)
- `reason_modal_title` dùng `{{field}}` interpolation → frontend truyền `fieldLabel` từ `t("common.order_by.due_date")` hoặc `t("common.completed_at")`
- Kiểm tra cấu trúc hiện tại của `issue` namespace trong từng file trước khi thêm (có thể là nested object hoặc flat keys với prefix)
