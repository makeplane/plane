# Phase 04: i18n — Translations (en/ko/vi)

## Overview

- **Priority**: Low — có thể song song với Phase 02-03 nếu dùng placeholder keys
- **Status**: TODO
- **Goal**: Thêm tất cả translation keys cho feature Bank-wide Project vào 3 file locale: `en`, `ko`, `vi`

---

## Requirements

### Functional

- Tất cả string visible trong UI phải có translation key
- 3 file locale phải được cập nhật: `en`, `ko`, `vi`
- Key structure theo namespace `bank_wide_project`

### Non-functional

- Files là TypeScript module (`.ts`), KHÔNG phải JSON
- Ko/vi dùng English làm placeholder nếu chưa có bản dịch chính thức

---

## Related Code Files

### Files to modify:

- `packages/i18n/src/locales/en/translations.ts`
- `packages/i18n/src/locales/ko/translations.ts`
- `packages/i18n/src/locales/vi/translations.ts`

---

## Embedded Rules

### Rule 1: Translation file là TypeScript module

```typescript
// ✅ ĐÚNG — .ts TypeScript module
export default {
  bank_wide_project: {
    label: "Bank-wide Project",
    // ...
  }
};

// ❌ SAI — JSON file
{
  "bank_wide_project": { "label": "Bank-wide Project" }
}
```

### Rule 2: Thêm keys vào CẢ 3 file locale

```
packages/i18n/src/locales/en/translations.ts  ← English (canonical)
packages/i18n/src/locales/ko/translations.ts  ← Korean (dùng English nếu chưa có bản dịch)
packages/i18n/src/locales/vi/translations.ts  ← Vietnamese (dùng English nếu chưa có bản dịch)
```

### Rule 3: Nested key structure

```typescript
// Dùng namespace lồng nhau để tổ chức rõ ràng
bank_wide_project: {
  label: "Bank-wide Project",        // dùng trong create form switch label
  settings: {
    title: "Bank-wide Project",      // dùng trong sidebar + page title
    label: "Bank-wide Project",      // dùng trong settings toggle label
    description: "...",              // mô tả ngắn
    header_description: "...",       // mô tả dài hơn trong page header
    updated_success: "...",          // toast success message
    updated_error: "...",            // toast error message
  }
}
```

---

## Keys to Add

Dưới đây là danh sách đầy đủ translation keys cần thêm:

```typescript
bank_wide_project: {
  label: "Bank-wide Project",
  settings: {
    title: "Bank-wide Project",
    label: "Bank-wide Project",
    description: "Mark this project as a bank-wide project visible to all members across the organization.",
    header_description: "Configure bank-wide project settings.",
    updated_success: "Bank-wide project setting updated successfully.",
    updated_error: "Failed to update bank-wide project setting. Please try again.",
  },
},
```

---

## Implementation Steps

### Step 1: Thêm vào English locale

Mở: `packages/i18n/src/locales/en/translations.ts`

Tìm vị trí phù hợp (theo thứ tự alphabet hoặc theo feature) và thêm block `bank_wide_project`:

```typescript
// Thêm tại vị trí alpha-order (trước 'c' hoặc cuối namespace)
bank_wide_project: {
  label: "Bank-wide Project",
  settings: {
    title: "Bank-wide",
    label: "Mark as Bank-wide Project",
    description: "Designate this project as a bank-wide project, making it visible and relevant to all members across the organization.",
    header_description: "Configure Bank-wide Project settings for this project.",
    updated_success: "Bank-wide project setting has been updated.",
    updated_error: "Failed to update bank-wide project setting. Please try again.",
  },
},
```

### Step 2: Thêm vào Korean locale

Mở: `packages/i18n/src/locales/ko/translations.ts`

Thêm keys với English làm placeholder (cập nhật bản dịch Korean sau khi có):

```typescript
bank_wide_project: {
  label: "Bank-wide Project",
  settings: {
    title: "Bank-wide",
    label: "Mark as Bank-wide Project",
    description: "Designate this project as a bank-wide project, making it visible and relevant to all members across the organization.",
    header_description: "Configure Bank-wide Project settings for this project.",
    updated_success: "Bank-wide project setting has been updated.",
    updated_error: "Failed to update bank-wide project setting. Please try again.",
  },
},
```

### Step 3: Thêm vào Vietnamese locale

Mở: `packages/i18n/src/locales/vi/translations.ts`

Thêm keys với bản dịch tiếng Việt:

```typescript
bank_wide_project: {
  label: "Dự án toàn ngân hàng",
  settings: {
    title: "Dự án toàn ngân hàng",
    label: "Đánh dấu là Dự án toàn ngân hàng",
    description: "Đánh dấu dự án này là dự án toàn ngân hàng, hiển thị và liên quan đến tất cả thành viên trong tổ chức.",
    header_description: "Cấu hình cài đặt Dự án toàn ngân hàng cho dự án này.",
    updated_success: "Cài đặt dự án toàn ngân hàng đã được cập nhật.",
    updated_error: "Cập nhật cài đặt dự án toàn ngân hàng thất bại. Vui lòng thử lại.",
  },
},
```

### Step 4: Verify keys được dùng đúng trong code

Chạy grep để đảm bảo tất cả keys trong code đã có trong translation files:

```bash
# Tìm tất cả t() calls với bank_wide_project
grep -rn 'bank_wide_project' apps/web/ --include="*.tsx" --include="*.ts"

# So sánh với keys trong translation file
grep -n 'bank_wide_project' packages/i18n/src/locales/en/translations.ts
```

---

## Post-Phase Checklist

- [ ] `bank_wide_project` block thêm vào `en/translations.ts`
- [ ] `bank_wide_project` block thêm vào `ko/translations.ts`
- [ ] `bank_wide_project` block thêm vào `vi/translations.ts`
- [ ] Tất cả keys được dùng trong code (`t("bank_wide_project.xxx")`) đều có trong translation files
- [ ] Files là `.ts` TypeScript modules, KHÔNG phải JSON
- [ ] Không có syntax error trong translation files (TypeScript compiler check)

### Build verification:

```bash
# Kiểm tra TypeScript compile không có lỗi trong i18n package
cd packages/i18n && npx tsc --noEmit
```

---

## Success Criteria

- Tất cả text trong UI Bank-wide Project feature đều được load từ translation files
- Chuyển ngôn ngữ sang Vietnamese → text hiển thị tiếng Việt
- Chuyển ngôn ngữ sang Korean → text hiển thị (English placeholder nếu chưa có bản dịch)
- Không có TypeScript errors trong i18n package
