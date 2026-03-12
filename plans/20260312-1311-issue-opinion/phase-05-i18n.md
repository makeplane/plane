# Phase 05: i18n Translations

## Overview

- **Priority**: Must (mọi string phải được dịch)
- **Status**: Not started
- Thêm translation keys cho Opinion feature vào 3 locales: en, ko, vi

## Related Code Files

### Sửa đổi

- `packages/i18n/src/locales/en/translations.ts`
- `packages/i18n/src/locales/ko/translations.ts`
- `packages/i18n/src/locales/vi/translations.ts`

## Embedded Rules

1. **Translation files là `.ts` modules** — KHÔNG phải JSON. Dùng nested object literal.
2. **`t()` cho MỌI string** — Phase 04 dùng keys `"opinion.*"` — đây là nơi khai báo.
3. **3 locales bắt buộc** — en, ko, vi đều phải có đủ keys.
4. **Vị trí** — thêm `opinion` object cùng level với `worklog` trong translations.

## Translation Keys dùng trong Phase 04

| Key                            | Dùng ở                         |
| ------------------------------ | ------------------------------ |
| `opinion.approve`              | OpinionDisplay, OpinionPopover |
| `opinion.neutral`              | OpinionDisplay, OpinionPopover |
| `opinion.reject`               | OpinionDisplay, OpinionPopover |
| `opinion.your_opinion`         | OpinionButton (nút thêm)       |
| `opinion.add_opinion`          | OpinionButton tooltip          |
| `opinion.content_placeholder`  | OpinionPopover input           |
| `opinion.saved`                | toast title sau upsert         |
| `opinion.saved_successfully`   | toast message sau upsert       |
| `opinion.save_failed`          | toast message khi lỗi          |
| `opinion.deleted`              | toast title sau delete         |
| `opinion.deleted_successfully` | toast message sau delete       |
| `opinion.delete_failed`        | toast message khi lỗi delete   |

## Implementation Steps

### English (`en/translations.ts`)

```typescript
opinion: {
  approve: "Approve",
  neutral: "Neutral",
  reject: "Reject",
  your_opinion: "Opinion",
  add_opinion: "Add your opinion",
  content_placeholder: "Add a note... (optional)",
  saved: "Opinion saved",
  saved_successfully: "Your opinion has been saved.",
  save_failed: "Failed to save opinion.",
  deleted: "Opinion removed",
  deleted_successfully: "Your opinion has been removed.",
  delete_failed: "Failed to remove opinion.",
},
```

### Korean (`ko/translations.ts`)

```typescript
opinion: {
  approve: "승인",
  neutral: "중립",
  reject: "반대",
  your_opinion: "의견",
  add_opinion: "의견 추가",
  content_placeholder: "메모 추가... (선택 사항)",
  saved: "의견 저장됨",
  saved_successfully: "의견이 저장되었습니다.",
  save_failed: "의견 저장에 실패했습니다.",
  deleted: "의견 삭제됨",
  deleted_successfully: "의견이 삭제되었습니다.",
  delete_failed: "의견 삭제에 실패했습니다.",
},
```

### Vietnamese (`vi/translations.ts`)

```typescript
opinion: {
  approve: "Đồng ý",
  neutral: "Trung lập",
  reject: "Từ chối",
  your_opinion: "Ý kiến",
  add_opinion: "Thêm ý kiến của bạn",
  content_placeholder: "Thêm ghi chú... (tùy chọn)",
  saved: "Đã lưu ý kiến",
  saved_successfully: "Ý kiến của bạn đã được lưu.",
  save_failed: "Lưu ý kiến thất bại.",
  deleted: "Đã xóa ý kiến",
  deleted_successfully: "Ý kiến của bạn đã được xóa.",
  delete_failed: "Xóa ý kiến thất bại.",
},
```

## Post-Phase Checklist

- [ ] Keys `opinion.*` tồn tại trong cả 3 file (en, ko, vi)
- [ ] Đủ 12 keys cho tất cả các string dùng trong Phase 04
- [ ] Files là `.ts` (không phải `.json`)
- [ ] Không có syntax error trong object literal
- [ ] Thêm vào đúng vị trí (cùng level với `worklog`)

## Success Criteria

- `t("opinion.approve")` trả về đúng text theo locale hiện tại
- Không có missing translation warning trong console
- Ko / Vi tự nhiên, chính xác
