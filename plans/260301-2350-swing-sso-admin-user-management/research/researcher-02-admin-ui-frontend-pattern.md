# Admin UI & Frontend Login Patterns — Research Report

## Auth Settings Page Structure

`apps/admin/app/(all)/(dashboard)/authentication/`

- `page.tsx` — main list of all auth methods (toggle each)
- `ldap/page.tsx` + `ldap/form.tsx`
- `github/`, `gitlab/`, `google/`, `gitea/` — same pattern

Routes registered in `apps/admin/app/routes.ts` (flat, no nested layout for auth sub-pages).

---

## Pattern: Auth Method Toggle (main page)

**File:** `authentication/page.tsx`

- Uses `useInstance()` → `formattedConfig` (computed from `instanceConfigurations[]`)
- `useSWR("INSTANCE_CONFIGURATIONS", fetchInstanceConfigurations)` for data fetching
- Each method rendered via `AuthenticationMethodCard` + config component
- `updateConfig(key, value)` calls `updateInstanceConfigurations({ [key]: "1"|"0" })`
- Guard: `canDisableAuthMethod()` prevents disabling the last active method
- Config saved with `setPromiseToast` (loading/success/error feedback)

Auth methods map (`hooks/oauth/core.tsx`):

```
"unique-codes" → ENABLE_MAGIC_LINK_LOGIN
"passwords-login" → ENABLE_EMAIL_PASSWORD
"google" → IS_GOOGLE_ENABLED
"github" → IS_GITHUB_ENABLED
"gitlab" → IS_GITLAB_ENABLED
"gitea" → IS_GITEA_ENABLED
"ldap"  → IS_LDAP_ENABLED
```

All rendered via `getCoreAuthenticationModesMap()` hook factory.

---

## Pattern: LDAP Config (detail page)

**Files:** `ldap/page.tsx`, `ldap/form.tsx`, `components/authentication/ldap-config.tsx`

### ldap/page.tsx

- Toggle `IS_LDAP_ENABLED` inline at page header via `ToggleSwitch`
- Passes `formattedConfig` to `<InstanceLDAPConfigForm />`
- Separate `updateConfig("IS_LDAP_ENABLED", "0"|"1")` distinct from form save

### ldap/form.tsx

- `useForm<LDAPConfigFormValues>` with `defaultValues` from `config` prop
- Fields: `LDAP_SERVER_URI`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_USER_SEARCH_BASE`, `LDAP_USER_FILTER`, `LDAP_USE_TLS`
- Rendered via `ControllerInput` (text/password) + `ControllerSwitch` (boolean "0"/"1")
- `onSubmit` → `updateInstanceConfigurations(payload)` → `reset()` with response values
- Dirty-check guard: if `isDirty`, intercept "Go back" link → `ConfirmDiscardModal`
- `Button` disabled when `!isDirty`

### ldap-config.tsx (card in main auth list)

- Shows "Configure" link if not configured (missing server/bind_dn/search_base)
- Shows "Edit" + `ToggleSwitch` when configured
- `isLdapConfigured = !!LDAP_SERVER_URI && !!LDAP_BIND_DN && !!LDAP_USER_SEARCH_BASE`

---

## Instance Store Pattern

**File:** `apps/admin/store/instance.store.ts`

- `instanceConfigurations: IInstanceConfiguration[]` — raw array `{key, value}`
- `formattedConfig` (computed) — reduces to `Record<TInstanceConfigurationKeys, string>`
- `updateInstanceConfigurations(data)` → `instanceService.updateConfigurations(data)` → merges response back into array
- Config values stored as strings: `"0"` / `"1"` for booleans, not actual booleans
- Pattern for booleans: `Boolean(parseInt(value))` or `value === "1"`

---

## Frontend Login Form (staff-id.tsx)

**File:** `apps/web/core/components/account/auth-forms/staff-id.tsx`

### Props

```typescript
{
  nextPath: string | undefined;
  isLDAPEnabled: boolean;
  isSMTPConfigured: boolean;
}
```

`isLDAPEnabled` comes from `IInstanceConfig.is_ldap_enabled` (boolean, lowercase snake_case — different from admin's string "1"/"0").

### Auth Flow Branching (3 paths)

```
identifier input
├── isEmail(value)              → POST email to /auth/sign-in/
├── isStaffId(value) && !ldap   → transform to sh{id}@swing.shinhan.com → POST to /auth/sign-in/
└── else (ldap enabled)         → POST username to /auth/ldap/sign-in/
```

### Implementation Details

- Native HTML `<form>` with hidden inputs: `csrfmiddlewaretoken`, `email`, `username`
- CSRF token fetched via `authService.requestCSRFToken()` on mount
- Form action URL set dynamically before `formRef.current.submit()`
- Staff ID constants: prefix `"sh"`, domain `"@swing.shinhan.com"`, pattern `/^\d{8}$/`
- Identifier validation: numeric-only but not 8 digits → error; LDAP-off + not email/staffId → error
- Forgot password: if email → pre-fill; if staff ID → pre-fill transformed email; else blank

### Label text (LDAP-aware)

```
isLDAPEnabled ? "Staff ID, Email, or Username" : "Staff ID or Email"
placeholder:   isLDAPEnabled ? "Enter staff ID, email, or username" : "Enter staff ID or email"
```

---

## Types Reference

**`packages/types/src/instance/auth.ts`**

- `TInstanceAuthenticationMethodKeys` — 8 toggle keys (IS_LDAP_ENABLED, etc.)
- `TInstanceLDAPAuthenticationConfigurationKeys` — 6 LDAP config keys
- `TCoreLoginMediums` — `"email" | "magic-code" | "github" | "gitlab" | "google" | "gitea"` (no "ldap" yet)
- `TExtendedLoginMediums = never` (EE placeholder, currently unused)

**`packages/types/src/instance/base.ts`**

- `IInstanceConfig` — public config from `/api/instances/` (booleans): `is_ldap_enabled: boolean`
- `IFormattedInstanceConfiguration` — admin config map (strings): `IS_LDAP_ENABLED: string`

---

## Key Insights for SSO/User Management Implementation

1. **Adding a new auth method**: add key to `TInstanceAuthenticationMethodKeys`, add config keys type, add to `getCoreAuthenticationModesMap`, create `components/authentication/my-config.tsx`, create `authentication/my-method/page.tsx` + `form.tsx`, add route to `routes.ts`.

2. **Config stored as strings** in admin (`"0"/"1"`); exposed as booleans in `IInstanceConfig` for frontend consumption.

3. **`formattedConfig`** is the single source of truth in admin — all forms read from it, all saves go through `updateInstanceConfigurations`.

4. **Frontend login** uses native form submit (not fetch) — CSRF token injected before submit. Any new auth path must have a Django URL endpoint.

5. **No "ldap" in `TCoreLoginMediums`** — LDAP auth posts to `/auth/ldap/sign-in/` but login medium tracking may not yet record "ldap" as a medium type.

6. **`canDisableAuthMethod`** guard exists — SSO toggle must pass this check; ensure at least one other method stays enabled.

---

## Unresolved Questions

- Where is `StaffIdLoginForm` mounted? Need to check which page renders it and how `isLDAPEnabled` prop is passed (likely from `IInstanceConfig` fetched on login page).
- `TExtendedLoginMediums = never` suggests EE has extended login mediums — SSO token type may need adding here for session tracking.
- `IInstanceConfig` does not have `is_sso_enabled` — needs adding for SSO feature parity with LDAP pattern.

---

## 1. Admin App Routing

`apps/admin/app/routes.ts` — React Router v7 flat config:

- `/authentication` → `authentication/page.tsx` (list of all methods)
- `/authentication/ldap` → `authentication/ldap/page.tsx` (LDAP config detail)
- Each provider has its own route: `github`, `gitlab`, `google`, `gitea`, `ldap`

---

## 2. Authentication List Page (`authentication/page.tsx`)

- Uses `useInstance()` store → `formattedConfig`, `updateInstanceConfigurations`
- SWR fetches `INSTANCE_CONFIGURATIONS` on mount
- `updateConfig(key, value)` — validates "at least one method must stay enabled" via `canDisableAuthMethod()` before calling `updateInstanceConfigurations()`
- Renders `AuthenticationMethodCard` per method using `useAuthenticationModes()` hook
- LDAP card shows `LDAPConfiguration` component (from `ldap-config.tsx`)

---

## 3. LDAP Config Component (`components/authentication/ldap-config.tsx`)

**Props**: `{ disabled: boolean, updateConfig: (key, value) => void }`

**Logic**:

- `isLdapConfigured` = truthy when `LDAP_SERVER_URI` + `LDAP_BIND_DN` + `LDAP_USER_SEARCH_BASE` all present
- If configured → shows "Edit" link + ToggleSwitch for IS_LDAP_ENABLED
- If NOT configured → shows "Configure" link button only (no toggle)
- Toggle calls `updateConfig("IS_LDAP_ENABLED", "0" | "1")`

**Key insight**: Toggle only appears after LDAP is fully configured — prevents enabling incomplete config.

---

## 4. LDAP Detail Page (`authentication/ldap/page.tsx`)

**Pattern**: Same as other provider pages (GitHub, Google, etc.)

- Reads `formattedConfig?.IS_LDAP_ENABLED ?? ""`
- Has its own local `updateConfig` that calls `updateInstanceConfigurations({ IS_LDAP_ENABLED: value })`
- Toggle in `PageWrapper` custom header — always visible (can enable/disable from detail page too)
- Renders `InstanceLDAPConfigForm` when `formattedConfig` loaded, else `<Loader>`

---

## 5. LDAP Config Form (`authentication/ldap/form.tsx`)

**Type**: `LDAPConfigFormValues = Record<TInstanceLDAPAuthenticationConfigurationKeys, string>`

**Fields** (via `ControllerInput` component):
| Key | Type | Required |
|-----|------|----------|
| `LDAP_SERVER_URI` | text | yes |
| `LDAP_BIND_DN` | text | yes |
| `LDAP_BIND_PASSWORD` | password | yes |
| `LDAP_USER_SEARCH_BASE` | text | yes |
| `LDAP_USER_FILTER` | text | yes |
| `LDAP_USE_TLS` | switch (ControllerSwitch) | — |

**Validation**: `react-hook-form` field-level errors only; required fields enforced by `required: true`

**Save flow**:

1. `handleSubmit(onSubmit)` → `updateInstanceConfigurations(payload)`
2. On success: `setToast(SUCCESS)` + `reset()` with server-returned values
3. Dirty-check on "Go back": if `isDirty` → `ConfirmDiscardModal`, else navigate

---

## 6. Types (`packages/types/src/instance/auth.ts`)

**`TInstanceAuthenticationMethodKeys`** — toggle keys:

```
ENABLE_SIGNUP | ENABLE_MAGIC_LINK_LOGIN | ENABLE_EMAIL_PASSWORD
| IS_GOOGLE_ENABLED | IS_GITHUB_ENABLED | IS_GITLAB_ENABLED | IS_GITEA_ENABLED | IS_LDAP_ENABLED
```

**`TInstanceLDAPAuthenticationConfigurationKeys`**:

```
LDAP_SERVER_URI | LDAP_BIND_DN | LDAP_BIND_PASSWORD | LDAP_USER_SEARCH_BASE | LDAP_USER_FILTER | LDAP_USE_TLS
```

**`TInstanceAuthenticationModeKeys`** (sidebar nav keys): `unique-codes | passwords-login | google | github | gitlab | gitea | ldap`

**`IInstanceConfig`** (public config served to web app):

- `is_ldap_enabled: boolean` — tells login page whether LDAP is active
- `is_smtp_configured: boolean` — controls "Forgot password" link visibility

---

## 7. Frontend Login Form (`staff-id.tsx`)

**Props**: `{ nextPath, isLDAPEnabled, isSMTPConfigured }`

**isLDAPEnabled** is passed down from parent (reads `IInstanceConfig.is_ldap_enabled`)

**Auth flow branching** (3 paths):

```
handleSubmit
  ├── isEmail(identifier)
  │     → set hidden email input = identifier
  │     → POST /auth/sign-in/
  ├── isStaffId(identifier) && !isLDAPEnabled
  │     → set hidden email input = "sh{8digits}@swing.shinhan.com"
  │     → POST /auth/sign-in/
  └── else (LDAP mode: staff ID or any username)
        → set hidden username input = identifier
        → POST /auth/ldap/sign-in/
```

**CSRF handling**: Pre-fetches token via `authService.requestCSRFToken()` on mount; injects into hidden field before native form submit.

**UI conditional on isLDAPEnabled**:

- Label: "Staff ID, Email, or Username" (LDAP on) vs "Staff ID or Email" (LDAP off)
- Placeholder adapts accordingly
- Validation: LDAP off → only 8-digit staff ID or email accepted; LDAP on → any non-email string accepted as username

**Forgot password**: Only shown when `isSMTPConfigured=true`; staff ID auto-transforms to email in the forgot-password URL.

---

## 8. Patterns to Replicate for SSO

For a new SSO provider (e.g., Swing SSO / SAML):

| Step | Where                                                      | What                                                                                             |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1    | `packages/types/src/instance/auth.ts`                      | Add `IS_SSO_ENABLED` to `TInstanceAuthenticationMethodKeys`; add `TInstanceSSOConfigurationKeys` |
| 2    | `packages/types/src/instance/base.ts`                      | Add `is_sso_enabled: boolean` to `IInstanceConfig`                                               |
| 3    | `apps/admin/components/authentication/sso-config.tsx`      | Toggle + "Configure" link (copy ldap-config pattern)                                             |
| 4    | `apps/admin/app/(all)/(dashboard)/authentication/sso/`     | `page.tsx` + `form.tsx` (copy ldap pattern)                                                      |
| 5    | `apps/admin/app/routes.ts`                                 | Add `route("authentication/sso", ...)`                                                           |
| 6    | `apps/web/core/components/account/auth-forms/staff-id.tsx` | Add SSO branch — redirect to `/auth/sso/` or show SSO button                                     |

---

## Unresolved Questions

1. Where does `useAuthenticationModes()` hook construct the `TInstanceAuthenticationModes[]` array? Need to find that hook to know where to register a new SSO entry in the admin list page.
2. How does `formattedConfig` differ from raw `IInstanceConfiguration[]`? Need to see the store's `formatConfig` logic.
3. Is there an `IsSSOEnabled` EE-only gating pattern (like `unavailable` flag on auth method card)?
4. What parent component passes `isLDAPEnabled` to `StaffIdLoginForm`? Need to trace `apps/web/core/components/account/` auth page to confirm prop source.
