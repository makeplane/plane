# Phase A5: God-Mode Admin UI — Swing SSO

## Context Links

- [LDAP config card (reference)](../../apps/admin/components/authentication/ldap-config.tsx)
- [LDAP page (reference)](<../../apps/admin/app/(all)/(dashboard)/authentication/ldap/page.tsx>)
- [LDAP form (reference)](<../../apps/admin/app/(all)/(dashboard)/authentication/ldap/form.tsx>)
- [Auth modes hook](../../apps/admin/hooks/oauth/core.tsx)
- [Auth list page](<../../apps/admin/app/(all)/(dashboard)/authentication/page.tsx>)
- [Admin routes](../../apps/admin/app/routes.ts)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Add Swing SSO config card on auth list, config detail page with form + test auth modal, mutual exclusion confirmation popup

## Key Insights

- Clone LDAP admin pattern: toggle card → config page → form with fields
- Mutual exclusion popup: when toggling ON Swing SSO while LDAP is active (or vice versa), show confirmation dialog
- Test Auth button: available after config is saved, opens modal with staffId/password input → calls `/auth/swing-sso/test/`
- Admin uses `useInstance()` store → `formattedConfig` for reading, `updateInstanceConfigurations` for saving
- File size limit: <150 lines per component — split into multiple files

## Requirements

**Functional:**

- Swing SSO card on authentication list page (toggle + configure link)
- Config detail page: header toggle + form (4 fields) + Test Auth button
- Test Auth modal: input state → loading → success/failure display
- Mutual exclusion confirmation popup when toggling conflicts
- Route: `/authentication/swing-sso`

<!-- Updated: Validation Session 3 - Hardcode English, no i18n for admin app -->

**Non-functional:**

- Use `@plane/propel` components (Button, Dialog, Input)
- Semantic color tokens only
- Hardcode English strings directly (admin app does not use i18n)

## Architecture

```
apps/admin/
├── components/authentication/
│   ├── swing-sso-config.tsx            # Toggle card for auth list
│   └── swing-sso-mutual-exclusion-popup.tsx  # Confirmation dialog
├── app/(all)/(dashboard)/authentication/
│   ├── page.tsx                        # MODIFY: add Swing SSO card
│   ├── swing-sso/
│   │   ├── page.tsx                    # Config page with header toggle
│   │   ├── form.tsx                    # Config form (4 fields)
│   │   └── test-auth-modal.tsx         # Test authentication dialog
├── hooks/oauth/
│   └── core.tsx                        # MODIFY: add swing-sso entry
└── app/routes.ts                       # MODIFY: add route
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/authentication/swing-sso-config.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/authentication/swing-sso-mutual-exclusion-popup.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/authentication/swing-sso/page.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/authentication/swing-sso/form.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/authentication/swing-sso/test-auth-modal.tsx`

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/hooks/oauth/core.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/authentication/page.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/routes.ts`

## Implementation Steps

### Step 1: Add route (`routes.ts`)

```typescript
route("authentication/swing-sso", "./(all)/(dashboard)/authentication/swing-sso/page.tsx"),
```

Add after the LDAP route line.

### Step 2: Add to auth modes hook (`hooks/oauth/core.tsx`)

2a. Import `SwingSSOConfiguration` component:

```typescript
import { SwingSSOConfiguration } from "@/components/authentication/swing-sso-config";
```

2b. Add entry to `getCoreAuthenticationModesMap` (after `ldap`):

```typescript
"swing-sso": {
    key: "swing-sso",
    name: "Swing SSO",
    description: "Authenticate members via Shinhan Swing SSO service.",
    icon: <Shield className="h-6 w-6 p-0.5 text-tertiary" />,
    config: <SwingSSOConfiguration disabled={disabled} updateConfig={updateConfig} />,
    enabledConfigKey: "IS_SWING_SSO_ENABLED",
},
```

2c. Update `TCoreInstanceAuthenticationModeKeys` union (already done in Phase A1 types).

### Step 3: Create toggle card (`swing-sso-config.tsx`)

Clone `ldap-config.tsx` pattern:

```typescript
// apps/admin/components/authentication/swing-sso-config.tsx
import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { ToggleSwitch } from "@plane/ui";
import type { TInstanceAuthenticationMethodKeys } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const SwingSSOConfiguration = observer(({ disabled, updateConfig }: Props) => {
  const { formattedConfig } = useInstance();

  const isSwingSSOConfigured =
    !!formattedConfig?.SWING_SSO_URL &&
    !!formattedConfig?.SWING_SSO_CLIENT_ID &&
    !!formattedConfig?.SWING_SSO_CLIENT_SECRET;

  const isSwingSSOEnabled = formattedConfig?.IS_SWING_SSO_ENABLED === "1";

  const handleToggle = () => {
    updateConfig("IS_SWING_SSO_ENABLED", isSwingSSOEnabled ? "0" : "1");
  };

  return (
    <div className="flex items-center gap-4">
      {isSwingSSOConfigured ? (
        <>
          <Link href="/authentication/swing-sso" className="text-sm font-medium text-color-accent-primary">
            Edit
          </Link>
          <ToggleSwitch value={isSwingSSOEnabled} onChange={handleToggle} disabled={disabled} />
        </>
      ) : (
        <Link href="/authentication/swing-sso" className="text-sm font-medium text-color-accent-primary">
          Configure
        </Link>
      )}
    </div>
  );
});
```

### Step 4: Create mutual exclusion popup (`swing-sso-mutual-exclusion-popup.tsx`)

```typescript
// apps/admin/components/authentication/swing-sso-mutual-exclusion-popup.tsx
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Button } from "@plane/propel/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  enablingMethod: "Swing SSO" | "LDAP";
  disablingMethod: "Swing SSO" | "LDAP";
};

export const MutualExclusionPopup = ({ open, onClose, onConfirm, enablingMethod, disablingMethod }: Props) => (
  <Dialog open={open} onClose={onClose} modal>
    <Dialog.Panel width={EDialogWidth.MD}>
      <Dialog.Title>Confirm Authentication Change</Dialog.Title>
      <div className="p-5 space-y-3">
        <p className="text-sm text-color-secondary">
          You can only activate one of these methods: LDAP or Swing SSO. Enabling <strong>{enablingMethod}</strong> will
          automatically disable <strong>{disablingMethod}</strong>.
        </p>
        <p className="text-sm text-color-secondary">Do you want to continue?</p>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t border-color-subtle">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Dialog.Panel>
  </Dialog>
);
```

### Step 5: Create config page (`swing-sso/page.tsx`)

Clone `ldap/page.tsx`. Key differences:

- Toggle `IS_SWING_SSO_ENABLED` instead of `IS_LDAP_ENABLED`
- Check if LDAP is enabled — if so, show `MutualExclusionPopup` before toggling ON
- Render `<SwingSSOConfigForm />` component

```typescript
// swing-sso/page.tsx
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/propel/toast";
import { ToggleSwitch, Loader } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { MutualExclusionPopup } from "@/components/authentication/swing-sso-mutual-exclusion-popup";
import { SwingSSOConfigForm } from "./form";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

function SwingSSOPage() {
  const { formattedConfig, updateInstanceConfigurations } = useInstance();
  const [showMutualExclusionPopup, setShowMutualExclusionPopup] = useState(false);

  const isSwingSSOEnabled = formattedConfig?.IS_SWING_SSO_ENABLED ?? "";
  const isLDAPEnabled = formattedConfig?.IS_LDAP_ENABLED === "1";

  const updateConfig = async (value: string) => {
    const promise = updateInstanceConfigurations({ IS_SWING_SSO_ENABLED: value });
    setPromiseToast(promise, {
      loading: "Updating...",
      success: { title: value === "1" ? "Swing SSO is now active" : "Swing SSO disabled" },
      error: { title: "Failed to update" },
    });
    await promise;
  };

  const handleToggle = () => {
    const newValue = isSwingSSOEnabled === "1" ? "0" : "1";
    if (newValue === "1" && isLDAPEnabled) {
      setShowMutualExclusionPopup(true);
      return;
    }
    void updateConfig(newValue);
  };

  const handleMutualExclusionConfirm = () => {
    setShowMutualExclusionPopup(false);
    void updateConfig("1");
  };

  // ... render PageWrapper with header toggle + SwingSSOConfigForm
  // ... include MutualExclusionPopup
}

export default observer(SwingSSOPage);
```

### Step 6: Create config form (`swing-sso/form.tsx`)

Clone `ldap/form.tsx`. 4 fields:

- `SWING_SSO_URL` (text, required)
- `SWING_SSO_CLIENT_ID` (text, required)
- `SWING_SSO_CLIENT_SECRET` (password, required)
- `SWING_SSO_COMPANY_CODE` (text, required, default "sh")

Add "Test Authentication" button after Save — disabled if not all fields filled.

```typescript
// swing-sso/form.tsx — react-hook-form Controller pattern
// Fields: SWING_SSO_URL, SWING_SSO_CLIENT_ID, SWING_SSO_CLIENT_SECRET, SWING_SSO_COMPANY_CODE
// Save: updateInstanceConfigurations(payload)
// Test button: opens TestAuthModal
```

### Step 7: Create test auth modal (`swing-sso/test-auth-modal.tsx`)

Three states: `input` | `success` | `failure`

```typescript
// swing-sso/test-auth-modal.tsx
// Input state: Employee No (8 digits) + Password fields + [Cancel] [Test]
// Loading: spinner on Test button
// Success state: green badge, response table (result_code, auth_result, employee_no, etc.), raw JSON collapsible
// Failure state: red badge, error details, [Try Again] [Close]
// Connection error: yellow badge, error message, [Try Again] [Close]
//
// API call: POST /auth/swing-sso/test/ with { username, password }
// Uses fetch/axios with admin session cookie
```

### Step 8: Update auth list page (`authentication/page.tsx`)

The page already renders all entries from `getCoreAuthenticationModesMap`. After adding `"swing-sso"` in Step 2, the card will auto-appear.

However, need to add mutual exclusion handling to the main page toggle:

- When toggling Swing SSO ON from list page and LDAP is enabled → show popup
- When toggling LDAP ON from list page and Swing SSO is enabled → show popup
- Import and render `MutualExclusionPopup` in the auth list page

### ~~Step 9: Add i18n translations~~ (REMOVED — Validation Session 3)

Admin app hardcodes English strings. No translation keys needed.

## Todo List

- [ ] Add route to `routes.ts`
- [ ] Add `"swing-sso"` entry to `getCoreAuthenticationModesMap`
- [ ] Create `swing-sso-config.tsx` toggle card
- [ ] Create `swing-sso-mutual-exclusion-popup.tsx`
- [ ] Create `swing-sso/page.tsx` config page
- [ ] Create `swing-sso/form.tsx` config form (4 fields)
- [ ] Create `swing-sso/test-auth-modal.tsx`
- [ ] Update `authentication/page.tsx` for mutual exclusion on list toggle
- [ ] Add LDAP page mutual exclusion (when toggling LDAP ON while Swing SSO is active)
- [ ] ~~Add i18n translations~~ (REMOVED — hardcode English)
- [ ] Verify all components under 150 lines

## Success Criteria

- Swing SSO card visible on authentication list page
- Configure link → navigates to `/authentication/swing-sso`
- Form saves 4 config values
- Toggle ON/OFF works with toast feedback
- Mutual exclusion popup appears when conflict detected
- Test Auth modal: shows success/failure states correctly
- All components under 150 lines

## Risk Assessment

- **Component size**: test-auth-modal may be close to limit — split states into sub-components if needed
- **Admin API for test**: ensure `/auth/swing-sso/test/` is accessible from admin app (CORS/session)
- **Mutual exclusion UI**: must handle both directions (Swing→LDAP and LDAP→Swing)

## Security Considerations

- Test auth endpoint admin-only — password sent over HTTPS
- Config form masks `SWING_SSO_CLIENT_SECRET` as password field
- No secrets displayed in test auth success response (raw_response may contain them — consider filtering)

## Next Steps

- Phase A6: Frontend login logic (web app)
