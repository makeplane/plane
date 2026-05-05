# Phase 02: Types + Create Project Form Switch

## Overview

- **Priority**: Medium — phụ thuộc Phase 01
- **Status**: TODO
- **Goal**:
  1. Extend `TProject` CE type với `is_bank_wide?: boolean`
  2. Thêm switch "Bank-wide Project" vào `ProjectAttributes` trong Create Project popup

---

## Requirements

### Functional

- Switch "Bank-wide Project" xuất hiện trong Create Project dialog, bên cạnh Network và Project Lead
- Switch default `false` (off)
- Khi submit form, `is_bank_wide` được gửi cùng payload tạo project
- Switch có label i18n: `t("bank_wide_project.label")`

### Non-functional

- Component < 150 lines
- Dùng `ToggleSwitch` từ `@plane/ui` (đã được dùng rộng rãi trong codebase)
- Semantic color tokens only

---

## Related Code Files

### Files to modify:

- `apps/web/ce/types/projects/projects.ts` — extend TProject với `is_bank_wide`
- `apps/web/ce/components/projects/create/attributes.tsx` — thêm Controller + ToggleSwitch

### Files to verify (không sửa):

- `apps/web/ce/components/projects/create/root.tsx` — form submit đã dùng `formData` spread → field mới tự động gửi
- `apps/web/ce/components/projects/create/utils.ts` — xem `getProjectFormValues` có cần thêm default không

---

## Embedded Rules

### Rule 1: Search before build — ToggleSwitch đã tồn tại

```typescript
// ✅ DÙNG từ @plane/ui (không tạo mới)
import { ToggleSwitch } from "@plane/ui";

// Pattern từ existing code (auto-close-automation.tsx):
<ToggleSwitch value={value} onChange={handleToggle} size="sm" disabled={!isAdmin} />;
```

### Rule 2: observer() + Controller pattern

```typescript
// ✅ Wrap component với observer() nếu đọc MobX store
// ✅ Dùng react-hook-form Controller cho mọi form field
import { Controller, useFormContext } from "react-hook-form";
const { control } = useFormContext<TProject>();

<Controller
  name="is_bank_wide"
  control={control}
  render={({ field: { value, onChange } }) => <ToggleSwitch value={value ?? false} onChange={onChange} size="sm" />}
/>;
```

### Rule 3: i18n — KHÔNG hardcode strings

```typescript
// ✅ ĐÚNG
const { t } = useTranslation();
<span>{t("bank_wide_project.label")}</span>

// ❌ SAI
<span>Bank-wide Project</span>
```

### Rule 4: Semantic color tokens

```typescript
// ✅ ĐÚNG
className = "text-color-primary";
className = "text-color-secondary";
className = "border-color-subtle";

// ❌ SAI
className = "text-gray-500";
className = "text-tertiary"; // thiếu "color-"
className = "border-subtle"; // thiếu "color-"
```

### Rule 5: CE Type Extension Pattern

```typescript
// apps/web/ce/types/projects/projects.ts
// Extend IProject từ @plane/types để thêm CE-specific fields
import type { IPartialProject, IProject } from "@plane/types";

export type TPartialProject = IPartialProject;

// Thêm CE field vào type
export type TProject = TPartialProject &
  IProject & {
    is_bank_wide?: boolean;
  };
```

### Rule 6: Form default values

```typescript
// Kiểm tra getProjectFormValues() trong:
// apps/web/ce/components/projects/create/utils.ts
// Thêm is_bank_wide: false vào default values nếu chưa có
```

---

## Implementation Steps

### Step 1: Extend TProject type

Mở: `apps/web/ce/types/projects/projects.ts`

Thay thế:

```typescript
export type TProject = TPartialProject & IProject;
```

Bằng:

```typescript
export type TProject = TPartialProject &
  IProject & {
    is_bank_wide?: boolean;
  };
```

**Apply Rule 5**: CE type extension pattern.

### Step 2: Kiểm tra default values

Mở: `apps/web/ce/components/projects/create/utils.ts`

Xem hàm `getProjectFormValues()`, thêm `is_bank_wide: false` vào object nếu chưa có:

```typescript
export function getProjectFormValues(): Partial<TProject> {
  return {
    // ... existing fields
    is_bank_wide: false,
  };
}
```

### Step 3: Thêm switch vào ProjectAttributes

Mở: `apps/web/ce/components/projects/create/attributes.tsx`

**Thêm import** (sau import `getTabIndex`):

```typescript
import { ToggleSwitch } from "@plane/ui";
```

**Thêm Controller** trong JSX, sau Controller `project_lead`:

```tsx
<Controller
  name="is_bank_wide"
  control={control}
  render={({ field: { value, onChange } }) => (
    <div
      className="flex-shrink-0 h-7 flex items-center gap-2 rounded border border-color-subtle px-2 cursor-pointer"
      onClick={() => onChange(!value)}
    >
      <span className="flex-grow truncate leading-5 text-left text-body-xs-medium">{t("bank_wide_project.label")}</span>
      <ToggleSwitch value={value ?? false} onChange={() => onChange(!value)} size="sm" />
    </div>
  )}
/>
```

**Apply Rule 2**: Controller pattern + **Rule 3**: i18n + **Rule 4**: semantic tokens.

> **Lưu ý**: Nếu space trong attributes bar quá chật, có thể đặt Bank-wide switch trên một row riêng bên dưới attributes bar hiện tại.

> **QUAN TRỌNG (Validation Session 3)**: Switch `is_bank_wide` chỉ hiển thị cho ADMIN. Kiểm tra `isAdmin` (tương tự permission check ở Phase 03) và ẩn/disable switch cho non-ADMIN. <!-- Updated: Validation Session 3 - ADMIN only in create form -->

---

## Post-Phase Checklist

- [ ] `TProject` đã có `is_bank_wide?: boolean`
- [ ] `getProjectFormValues()` trả về `is_bank_wide: false` làm default
- [ ] Switch hiển thị trong Create Project dialog (chỉ ADMIN)
- [ ] Switch state được bind đúng với form (toggle → value thay đổi)
- [ ] Khi submit form với `is_bank_wide: true`, payload gửi lên API có field này
- [ ] Không có hardcoded strings — tất cả dùng `t()`
- [ ] Không có hardcoded colors
- [ ] File `attributes.tsx` < 150 lines

### Grep verification:

```bash
# Kiểm tra hardcoded strings trong attributes.tsx
grep -n '"[A-Z][a-z].*"' apps/web/ce/components/projects/create/attributes.tsx | grep -v 'import\|className\|//\|console'

# Kiểm tra wrong color tokens
grep -n 'text-tertiary\|text-secondary\|border-subtle' apps/web/ce/components/projects/create/attributes.tsx
```

---

## Success Criteria

- Create Project popup hiển thị switch "Bank-wide Project"
- Switch default = off (false)
- Tạo project với switch ON → project được lưu với `is_bank_wide: true`
- Tạo project với switch OFF → project được lưu với `is_bank_wide: false`
