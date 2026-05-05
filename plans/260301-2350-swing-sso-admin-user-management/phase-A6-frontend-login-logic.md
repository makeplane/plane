# Phase A6: Frontend Login Logic

## Context Links

- [Staff ID login form](../../apps/web/core/components/account/auth-forms/staff-id.tsx)
- [Auth root (parent)](../../apps/web/core/components/account/auth-forms/auth-root.tsx)
- [Instance base types](../../packages/types/src/instance/base.ts)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Add Swing SSO branch to `StaffIdLoginForm` — when Swing SSO enabled and staff ID detected, POST to `/auth/swing-sso/sign-in/`

## Key Insights

- Current flow has 3 branches: email → Plane auth, staffId+LDAP → LDAP, staffId+noLDAP → email transform
- Swing SSO adds 4th branch: staffId+SwingSSO → `/auth/swing-sso/sign-in/`
- Since LDAP and Swing SSO are mutually exclusive, logic is: check Swing SSO first, then LDAP
- `isSwingSSOEnabled` comes from `IInstanceConfig.is_swing_sso_enabled` (boolean)
- Parent component `auth-root.tsx` reads from `config` and passes as prop

## Requirements

**Functional:**

- New prop `isSwingSSOEnabled: boolean` on `StaffIdLoginForm`
- When staff ID + Swing SSO enabled → POST username+password to `/auth/swing-sso/sign-in/`
- When staff ID + LDAP enabled (Swing SSO disabled) → POST to `/auth/ldap/sign-in/` (unchanged)
- When staff ID + both disabled → email transform fallback (unchanged)
- Label text updates: include "Swing SSO" context when enabled

**Non-functional:**

- No breaking changes to existing LDAP/email flows
- Form submit pattern unchanged (native form POST with CSRF)

## Architecture

```
handleSubmit:
  if isEmail(identifier):
      → POST email → /auth/sign-in/                    (unchanged)
  elif isStaffId(identifier):
      if isSwingSSOEnabled:
          → POST username+password → /auth/swing-sso/sign-in/    (NEW)
      elif isLDAPEnabled:
          → POST username → /auth/ldap/sign-in/          (unchanged)
      else:
          → transform to sh{id}@swing.shinhan.com → /auth/sign-in/  (unchanged)
  else:
      if isLDAPEnabled:
          → POST username → /auth/ldap/sign-in/          (unchanged)
      else:
          → show error                                    (unchanged)
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/account/auth-forms/staff-id-helpers.ts` (extracted helpers ~50 lines)

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/account/auth-forms/staff-id.tsx` (import helpers, add Swing SSO prop)
- `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/account/auth-forms/auth-root.tsx` (pass isSwingSSOEnabled prop)

## Implementation Steps

### Step 1: Update `auth-root.tsx` — add `isSwingSSOEnabled` prop

In `auth-root.tsx`, after the `isLDAPEnabled` line:

```typescript
const isLDAPEnabled = config?.is_ldap_enabled || false;
const isSwingSSOEnabled = config?.is_swing_sso_enabled || false; // ADD
```

Pass to `StaffIdLoginForm`:

```typescript
<StaffIdLoginForm
  nextPath={nextPath || undefined}
  isLDAPEnabled={isLDAPEnabled}
  isSwingSSOEnabled={isSwingSSOEnabled} // ADD
  isSMTPConfigured={isSMTPConfigured}
/>
```

### Step 2: Update `staff-id.tsx` Props type

```typescript
type Props = {
  nextPath: string | undefined;
  isLDAPEnabled: boolean;
  isSwingSSOEnabled: boolean; // ADD
  isSMTPConfigured: boolean;
};
```

Destructure in component:

```typescript
const { nextPath, isLDAPEnabled, isSwingSSOEnabled, isSMTPConfigured } = props;
```

### Step 3: Update `handleSubmit` branching

Replace the current `else if (isStaffId(identifier) && !isLDAPEnabled)` block:

```typescript
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (isSubmitting || !identifier || !password) return;
  if (!validateIdentifier(identifier)) return;

  void (async () => {
    await handleCSRFToken();
    if (!formRef.current) return;

    if (isEmail(identifier)) {
      // Email mode: POST email directly to /auth/sign-in/
      const emailInput = formRef.current.querySelector<HTMLInputElement>("input[name=email]");
      if (emailInput) emailInput.value = identifier;
      formRef.current.action = `${API_BASE_URL}/auth/sign-in/`;
    } else if (isStaffId(identifier) && isSwingSSOEnabled) {
      // Swing SSO mode: POST username+password to /auth/swing-sso/sign-in/
      const usernameInput = formRef.current.querySelector<HTMLInputElement>("input[name=username]");
      if (usernameInput) usernameInput.value = identifier;
      formRef.current.action = `${API_BASE_URL}/auth/swing-sso/sign-in/`;
    } else if (isStaffId(identifier) && !isLDAPEnabled) {
      // Staff ID + no SSO/LDAP: transform to email, POST to /auth/sign-in/
      const emailInput = formRef.current.querySelector<HTMLInputElement>("input[name=email]");
      if (emailInput) emailInput.value = `${STAFF_EMAIL_PREFIX}${identifier}${STAFF_EMAIL_DOMAIN}`;
      formRef.current.action = `${API_BASE_URL}/auth/sign-in/`;
    } else {
      // LDAP mode: staff ID or username → POST to /auth/ldap/sign-in/
      const usernameInput = formRef.current.querySelector<HTMLInputElement>("input[name=username]");
      if (usernameInput) usernameInput.value = identifier;
      formRef.current.action = `${API_BASE_URL}/auth/ldap/sign-in/`;
    }

    setIsSubmitting(true);
    formRef.current.submit();
  })();
};
```

### Step 4: Update label text

```typescript
const getLabel = () => {
  if (isSwingSSOEnabled) return "Staff ID or Email";
  if (isLDAPEnabled) return "Staff ID, Email, or Username";
  return "Staff ID or Email";
};

const getPlaceholder = () => {
  if (isSwingSSOEnabled) return "Enter 8-digit staff ID or email";
  if (isLDAPEnabled) return "Enter staff ID, email, or username";
  return "Enter staff ID or email";
};
```

Use in JSX:

```typescript
<label htmlFor="login-identifier" className="text-13 font-medium text-tertiary">
  {getLabel()}
</label>
// ...
<Input placeholder={getPlaceholder()} ... />
```

### Step 5: Update `noAuthMethodsAvailable` check in `auth-root.tsx`

```typescript
const noAuthMethodsAvailable = !isOAuthEnabled && !isEmailBasedAuthEnabled && !isLDAPEnabled && !isSwingSSOEnabled;
```

### Step 6: Extract helpers to separate file (MANDATORY — file size control)

`staff-id.tsx` is 217 lines. Adding Swing SSO pushes to ~230. Extract to keep under 200:

**Create `/apps/web/core/components/account/auth-forms/staff-id-helpers.ts`:**

```typescript
// staff-id-helpers.ts — extracted helpers for staff ID login form

import { API_BASE_URL } from "@plane/constants";

/** Resolve form action URL based on identifier type and enabled auth methods */
export const resolveFormAction = (
  identifier: string,
  isSwingSSOEnabled: boolean,
  isLDAPEnabled: boolean,
  isStaffId: (v: string) => boolean,
  isEmail: (v: string) => boolean
): { action: string; inputName: "email" | "username"; value: string } | null => {
  if (isEmail(identifier)) {
    return { action: `${API_BASE_URL}/auth/sign-in/`, inputName: "email", value: identifier };
  }
  if (isStaffId(identifier) && isSwingSSOEnabled) {
    return { action: `${API_BASE_URL}/auth/swing-sso/sign-in/`, inputName: "username", value: identifier };
  }
  if (isStaffId(identifier) && !isLDAPEnabled) {
    const email = `sh${identifier}@swing.shinhan.com`;
    return { action: `${API_BASE_URL}/auth/sign-in/`, inputName: "email", value: email };
  }
  // LDAP fallback
  return { action: `${API_BASE_URL}/auth/ldap/sign-in/`, inputName: "username", value: identifier };
};

/** Get label/placeholder text based on active auth method */
export const getIdentifierLabel = (isSwingSSOEnabled: boolean, isLDAPEnabled: boolean) => ({
  label: isLDAPEnabled ? "Staff ID, Email, or Username" : "Staff ID or Email",
  placeholder: isLDAPEnabled ? "Enter staff ID, email, or username" : "Enter 8-digit staff ID or email",
});

/** Validate identifier format based on active auth method */
export const validateStaffIdentifier = (
  value: string,
  isSwingSSOEnabled: boolean,
  isLDAPEnabled: boolean,
  isStaffId: (v: string) => boolean,
  isEmail: (v: string) => boolean
): string | undefined => {
  const isAllNumeric = /^\d+$/.test(value);
  if (isAllNumeric && value.length !== 8) return "Staff ID must be exactly 8 digits";
  if ((isSwingSSOEnabled || (!isLDAPEnabled && !isSwingSSOEnabled)) && !isStaffId(value) && !isEmail(value)) {
    return "Enter 8-digit staff ID or email address";
  }
  return undefined;
};
```

**Then in `staff-id.tsx`**, replace inline logic with imports:

```typescript
import { resolveFormAction, getIdentifierLabel, validateStaffIdentifier } from "./staff-id-helpers";
```

This should bring `staff-id.tsx` down to ~170 lines and `staff-id-helpers.ts` ~50 lines.

## Todo List

- [ ] Add `isSwingSSOEnabled` to `auth-root.tsx` (read from config, pass as prop)
- [ ] Add `isSwingSSOEnabled` to `StaffIdLoginForm` Props type
- [ ] Add Swing SSO branch in `handleSubmit` (before LDAP branch)
- [ ] Update label/placeholder text for Swing SSO mode
- [ ] Update `noAuthMethodsAvailable` check
- [ ] Create `staff-id-helpers.ts` — extract `resolveFormAction`, `getIdentifierLabel`, `validateStaffIdentifier`
- [ ] Refactor `staff-id.tsx` to import from helpers (~170 lines target)

## Success Criteria

- Staff ID + Swing SSO enabled → form POSTs to `/auth/swing-sso/sign-in/`
- Staff ID + LDAP enabled → form POSTs to `/auth/ldap/sign-in/` (unchanged)
- Email → always POSTs to `/auth/sign-in/` (unchanged)
- Staff ID + both disabled → email transform (unchanged)
- Label text reflects active auth method
- No regression in existing flows

## Risk Assessment

- **File size**: ~~`staff-id.tsx` is currently 217 lines~~ → **Resolved**: Step 6 extracts `resolveFormAction`, `getIdentifierLabel`, `validateStaffIdentifier` to `staff-id-helpers.ts` (~50 lines). `staff-id.tsx` target ~170 lines.
- **Mutual exclusion**: since backend enforces, only one of `isLDAPEnabled` / `isSwingSSOEnabled` can be true — but handle gracefully if both somehow true (Swing SSO takes priority).

## Security Considerations

- Password sent via native form POST with CSRF token — same security as LDAP/email flows
- No client-side password hashing — backend handles SHA-256 before sending to Swing API

## Next Steps

- Phase A7: Testing and verification
