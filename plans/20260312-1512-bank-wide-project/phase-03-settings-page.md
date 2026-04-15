# Phase 03: Project Settings — Sidebar Entry + Settings Page

## Overview

- **Priority**: Medium — phụ thuộc Phase 02
- **Status**: TODO
- **Goal**:
  1. Thêm entry "Bank-wide" vào sidebar Project Settings dưới category GENERAL
  2. Tạo trang settings `/settings/projects/[projectId]/bank-wide/` với toggle switch
  3. Chỉ ADMIN mới thấy và thao tác được

---

## Requirements

### Functional

- Sidebar Project Settings có thêm item "Bank-wide" dưới "General" category
- Route: `/{workspaceSlug}/settings/projects/{projectId}/bank-wide/`
- Trang settings hiển thị toggle `is_bank_wide` kèm mô tả
- Toggle onChange → gọi `updateProject()` → toast success/error
- Chỉ ADMIN (`EUserProjectRoles.ADMIN`) có quyền truy cập

### Non-functional

- Pattern giống các settings page hiện tại (`SettingsContentWrapper` + header)
- Component < 150 lines; nếu lớn thì tách thành sub-components

---

## Related Code Files

### Files to modify:

- `packages/constants/src/settings/project.ts` — thêm `bank_wide` vào `PROJECT_SETTINGS` và `GROUPED_PROJECT_SETTINGS`

### Files to create:

- `apps/web/ce/components/projects/settings/bank-wide/root.tsx` — settings component chính
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/bank-wide/page.tsx` — route page (header inlined, no separate header.tsx) <!-- Updated: Validation Session 2 - inline header, no header.tsx -->

### Files to verify:

- `apps/web/core/components/settings/project/sidebar/item-categories.tsx` — đọc từ `GROUPED_PROJECT_SETTINGS` → tự động hiển thị item mới

---

## Embedded Rules

### Rule 1: CE Settings Pattern — Layout phải có SettingsContentWrapper

```typescript
// Pattern từ page.tsx settings hiện tại:
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { PageHead } from "@/components/core/page-title";

return (
  <SettingsContentWrapper header={<BankWideSettingsHeader />}>
    <PageHead title={pageTitle} />
    <BankWideSettingsRoot projectId={projectId} workspaceSlug={workspaceSlug} isAdmin={isAdmin} />
  </SettingsContentWrapper>
);
```

### Rule 2: Permission check — ADMIN only

```typescript
// Pattern từ page.tsx settings:
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useUserPermissions } from "@/hooks/store/user";

const { allowPermissions } = useUserPermissions();
const isAdmin = allowPermissions(
  [EUserPermissions.ADMIN],
  EUserPermissionsLevel.PROJECT,
  workspaceSlug,
  projectId
);

// Sidebar constant: chỉ ADMIN có access
access: [EUserProjectRoles.ADMIN],
```

### Rule 3: Constants — Thêm đúng vào PROJECT_SETTINGS

```typescript
// packages/constants/src/settings/project.ts
// Thêm vào PROJECT_SETTINGS object:
bank_wide: {
  key: "bank_wide",
  i18n_label: "bank_wide_project.settings.title",
  href: `/bank-wide`,
  access: [EUserProjectRoles.ADMIN],
  highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/bank-wide/`,
},

// Thêm vào GROUPED_PROJECT_SETTINGS[GENERAL]:
[PROJECT_SETTINGS_CATEGORY.GENERAL]: [
  PROJECT_SETTINGS["general"],
  PROJECT_SETTINGS["members"],
  PROJECT_SETTINGS["worklogs"],
  PROJECT_SETTINGS["bank_wide"],  // ← thêm ở đây
],
```

> ⚠️ **QUAN TRỌNG**: `TProjectSettingsTabs` trong `@plane/types` cần được update để TypeScript không báo lỗi. Xem Step 1.

### Rule 4: ToggleSwitch pattern từ settings hiện tại

```typescript
// Pattern từ feature-control-item.tsx + auto-close-automation.tsx:
import { ToggleSwitch } from "@plane/ui";

const handleToggle = async () => {
  try {
    await updateProject(workspaceSlug, projectId, {
      is_bank_wide: !currentProject.is_bank_wide,
    });
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("toast.success"),
      message: t("bank_wide_project.settings.updated_success"),
    });
  } catch {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("toast.error"),
      message: t("bank_wide_project.settings.updated_error"),
    });
  }
};

<ToggleSwitch value={currentProject?.is_bank_wide ?? false} onChange={handleToggle} disabled={!isAdmin} size="sm" />;
```

### Rule 5: observer() trên MobX-reading components

```typescript
// ✅ BẮT BUỘC wrap observer nếu đọc từ MobX store
import { observer } from "mobx-react";

export const BankWideSettingsRoot = observer(function BankWideSettingsRoot(props) {
  const { currentProjectDetails } = useProject(); // MobX store
  // ...
});
```

### Rule 6: setToast() sau mutations — LUÔN LUÔN

```typescript
// Sau updateProject thành công:
setToast({ type: TOAST_TYPE.SUCCESS, title: t("toast.success"), message: t("...") });
// Sau updateProject thất bại:
setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("...") });
```

### Rule 7: Types — TProjectSettingsTabs

```typescript
// packages/types/src/settings/project.ts (hoặc tương đương)
// Cần thêm "bank_wide" vào TProjectSettingsTabs union type
// HOẶC dùng type assertion nếu không muốn chạm vào core
// ✅ Prefer: thêm vào TProjectSettingsTabs nếu nó là union type
```

---

## Implementation Steps

### Step 1: Extend TProjectSettingsTabs (nếu cần)

Tìm `TProjectSettingsTabs`:

```bash
grep -r "TProjectSettingsTabs" packages/types/src/
```

Thêm `"bank_wide"` vào union type:

```typescript
// Ví dụ pattern
export type TProjectSettingsTabs = "general" | "members" | ... | "bank_wide";
```

### Step 2: Thêm constants vào `project.ts`

Mở: `packages/constants/src/settings/project.ts`

**2a. Thêm "bank_wide" vào `PROJECT_SETTINGS`** (sau `worklogs`):

```typescript
bank_wide: {
  key: "bank_wide",
  i18n_label: "bank_wide_project.settings.title",
  href: `/bank-wide`,
  access: [EUserProjectRoles.ADMIN],
  highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/bank-wide/`,
},
```

**2b. Thêm vào `GROUPED_PROJECT_SETTINGS[GENERAL]`**:

```typescript
[PROJECT_SETTINGS_CATEGORY.GENERAL]: [
  PROJECT_SETTINGS["general"],
  PROJECT_SETTINGS["members"],
  PROJECT_SETTINGS["worklogs"],
  PROJECT_SETTINGS["bank_wide"],
],
```

### Step 3: Tạo Settings Component

Tạo: `apps/web/ce/components/projects/settings/bank-wide/root.tsx`

```tsx
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const BankWideSettingsRoot = observer(function BankWideSettingsRoot(props: Props) {
  const { workspaceSlug, projectId, isAdmin } = props;
  const { t } = useTranslation();
  const { currentProjectDetails, updateProject } = useProject();

  const handleToggle = async () => {
    if (!currentProjectDetails) return;
    try {
      await updateProject(workspaceSlug, projectId, {
        is_bank_wide: !currentProjectDetails.is_bank_wide,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("bank_wide_project.settings.updated_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("bank_wide_project.settings.updated_error"),
      });
    }
  };

  return (
    <div className={`w-full ${!isAdmin ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-4 py-4 border-b border-color-subtle">
        <div>
          <h4 className="text-sm font-medium text-color-primary">{t("bank_wide_project.settings.label")}</h4>
          <p className="text-sm text-color-secondary mt-1">{t("bank_wide_project.settings.description")}</p>
        </div>
        <ToggleSwitch
          value={currentProjectDetails?.is_bank_wide ?? false}
          onChange={handleToggle}
          disabled={!isAdmin}
          size="sm"
        />
      </div>
    </div>
  );
});
```

### Step 4: Tạo Page <!-- Updated: Validation Session 2 - inline header, redirect guard added, no separate header.tsx -->

Tạo: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/bank-wide/page.tsx`

```tsx
import { useEffect } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useProject } from "@/hooks/store/use-project";
import { useRouter } from "@/hooks/use-router"; // or "react-router"
import { useUserPermissions } from "@/hooks/store/user";
import { BankWideSettingsRoot } from "@/plane-web/components/projects/settings/bank-wide/root";
import type { Route } from "./+types/page";

function BankWideProjectSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { t } = useTranslation();
  const router = useRouter();
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  // Redirect non-ADMINs to general settings
  useEffect(() => {
    if (!isAdmin) {
      router.replace(`/${workspaceSlug}/settings/projects/${projectId}/general/`);
    }
  }, [isAdmin, workspaceSlug, projectId, router]);

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("bank_wide_project.settings.title")}`
    : undefined;

  const header = (
    <div>
      <h3 className="text-lg font-semibold text-color-primary">{t("bank_wide_project.settings.title")}</h3>
      <p className="text-sm text-color-secondary mt-1">{t("bank_wide_project.settings.header_description")}</p>
    </div>
  );

  return (
    <SettingsContentWrapper header={header}>
      <PageHead title={pageTitle} />
      <BankWideSettingsRoot workspaceSlug={workspaceSlug} projectId={projectId} isAdmin={isAdmin} />
    </SettingsContentWrapper>
  );
}

export default observer(BankWideProjectSettingsPage);
```

> **Note:** Check how other settings pages import router (`useRouter` from react-router or a custom hook). Mirror that pattern.

### Step 6: Verify Routes

React Router v7 file-based routing tự động pick up `bank-wide/page.tsx`. **Không cần sửa `extended.ts`.** <!-- Updated: Validation Session 1 - file-based routing confirmed -->

---

## Post-Phase Checklist

- [ ] `PROJECT_SETTINGS` có entry `bank_wide`
- [ ] `GROUPED_PROJECT_SETTINGS[GENERAL]` có `bank_wide` item
- [ ] Sidebar Project Settings hiển thị "Bank-wide" dưới GENERAL category
- [ ] Route `/{workspaceSlug}/settings/projects/{projectId}/bank-wide/` load được
- [ ] Trang hiển thị toggle với label + description
- [ ] non-ADMIN **không thấy** sidebar item "Bank-wide" (hidden, not disabled) <!-- Updated: Validation Session 1 - access array in PROJECT_SETTINGS controls visibility -->
- [ ] Toggle ON → project `is_bank_wide` = true + toast success
- [ ] Toggle OFF → project `is_bank_wide` = false + toast success
- [ ] observer() wrap đúng trên `BankWideSettingsRoot`
- [ ] setToast() sau mọi mutations
- [ ] Không có hardcoded strings, không có hardcoded colors

### Grep verification:

```bash
# Kiểm tra hardcoded strings
grep -n '"[A-Z]' apps/web/ce/components/projects/settings/bank-wide/root.tsx | grep -v 'import\|className'

# Kiểm tra wrong color tokens
grep -n 'text-tertiary\|border-subtle\|text-secondary' apps/web/ce/components/projects/settings/bank-wide/root.tsx

# Kiểm tra observer
grep -n 'observer' apps/web/ce/components/projects/settings/bank-wide/root.tsx
```

---

## Success Criteria

- Sidebar settings project có item "Bank-wide" xuất hiện cho ADMIN
- Trang settings Bank-wide load đúng với toggle
- Toggle thay đổi giá trị project trên server
- Toast hiển thị khi cập nhật
