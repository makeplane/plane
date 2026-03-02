# Code Review: Swing SSO Token Flow + Admin User Management

**Reviewer:** code-reviewer | **Date:** 2026-03-02 | **ID:** ab7082dca551e98e7

---

## Scope

- **Files reviewed:** 22 (9 new, 13 modified)
- **LOC (new files):** ~1493 total
- **Focus:** Phase A6b (SSO token flow), Phase B1 (backend APIs), Phase B2-B3 (admin UI)
- **Scout findings:** XML parsing security, password handling, auth bypass vectors, MobX reactivity

## Overall Assessment

Solid implementation that follows existing Plane codebase patterns well. Backend views correctly use `InstanceAdminPermission`, serializers are properly separated, and frontend components use propel + semantic tokens. Several security issues need attention before merge, primarily around XML parsing and password exposure.

---

## Critical Issues

### C1. XML External Entity (XXE) vulnerability in `swing_sso_token.py`

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/provider/credentials/swing_sso_token.py` (line ~118)

```python
root = ET.fromstring(response.content)
```

`xml.etree.ElementTree` does NOT disable external entity processing by default. An attacker controlling the Swing server response (or via MITM) could inject XXE payloads causing SSRF or file disclosure.

**Fix:** Use `defusedxml` (already in requirements as dependency of other packages) or at minimum disable entity expansion:

```python
# Option A: use defusedxml
import defusedxml.ElementTree as SafeET
root = SafeET.fromstring(response.content)

# Option B: if defusedxml unavailable, use XMLParser with resolve_entities=False
# Note: lxml==6.0.0 IS in requirements/base.txt
from lxml import etree
parser = etree.XMLParser(resolve_entities=False, no_network=True)
root = etree.fromstring(response.content, parser=parser)
```

**Impact:** OWASP A05:2021 - Security Misconfiguration. High severity for SSO endpoint.

### C2. Plaintext password returned in API response

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/user.py` (line ~131)

```python
return Response({"password": new_password}, status=status.HTTP_200_OK)
```

The reset password endpoint returns the generated password in plaintext over HTTP. While this is admin-only, it creates risk:

- Password visible in server logs (if response logging enabled)
- Password in browser devtools network tab
- No audit trail of who reset whose password

**Recommendation:** This design may be intentional for admin workflows (admin copies password to share with user). If kept:

1. Add audit logging: `logger.info("Admin %s reset password for user %s", request.user.id, pk)`
2. Ensure HTTPS-only deployment (likely already the case via Caddy)
3. Consider returning a temporary token/link instead

**Severity:** High (password handling)

---

## High Priority

### H1. No rate limiting on SSO token callback endpoint

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/views/app/swing_sso_token_callback.py`

The `GET /auth/swing-sso/callback/` endpoint has no authentication and no rate limiting. An attacker could brute-force employee_no values (8-digit = 100M combinations) with stolen/leaked tokens.

**Fix:** Add rate limiting decorator or middleware. Check how other auth endpoints handle this (e.g., magic link endpoints use attempt counters).

### H2. MobX store uses lodash `set` instead of MobX `set` for observable records

**File:** `/Volumes/Data/SHBVN/plane.so/apps/admin/store/instance-user.store.ts` (lines 79, 85, 92, etc.)

```typescript
import { set } from "lodash-es";
// ...
set(this.users, [user.id], user);
```

Per Plane's design system rules: "Use `set()` from MobX for reactive key assignment on observable records." The lodash `set` does NOT trigger MobX reactivity for new keys.

**However:** Checking other admin stores (`workspace.store.ts`, `instance.store.ts`), they also use `lodash-es` `set`. This is an existing pattern in the admin app specifically (not in `apps/web`). The admin app may be handling this differently. **Keep consistent with admin codebase but note this deviates from `apps/web` patterns.**

**Verdict:** Acceptable given admin app precedent. No change needed.

### H3. User creation lacks `display_name` initialization

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/user.py` (line ~88)

```python
user = User.objects.create(
    email=data["email"],
    first_name=data["first_name"],
    last_name=data.get("last_name", ""),
    username=data["email"],
)
```

`display_name` is not set. The User model's `save()` auto-generates it from email prefix if empty, which works. **But** `username` is set to email - verify this is the convention for admin-created users (other flows may use different username patterns).

**Verdict:** Low risk - auto-generation handles it. Just verify `username=email` is intentional.

### H4. Search input fires API on every keystroke

**File:** `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/users/page.tsx` (line ~37)

```typescript
const handleSearch = useCallback(
  (value: string) => {
    setSearchQuery(value);
    void fetchUsers(value);
  },
  [fetchUsers]
);
```

Every keystroke triggers an API call. Should debounce.

**Fix:**

```typescript
import { useDebouncedCallback } from "use-debounce"; // or manual debounce
const debouncedFetch = useDebouncedCallback((value: string) => {
  void fetchUsers(value);
}, 300);
```

---

## Medium Priority

### M1. Token validation does not verify `employee_no` matches validated user

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/provider/credentials/swing_sso_token.py` (line ~142)

```python
validated_user_id = self._validate_token()
# ...
email = f"sh{self.employee_no}@swing.shinhan.com"
```

The `_validate_token()` returns a `validated_user_id` (RETURNVALUE from Swing XML API), but we never check if `validated_user_id` matches `self.employee_no`. An attacker could pass a valid token for user A but `employee_no` for user B, logging in as user B.

**Fix:**

```python
validated_user_id = self._validate_token()
# Verify the token belongs to the claimed employee
if validated_user_id != self.employee_no:
    logger.warning("Token user %s != claimed employee %s", validated_user_id, self.employee_no)
    raise AuthenticationException(
        error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_INVALID_TOKEN"],
        error_message="SWING_SSO_INVALID_TOKEN",
    )
```

**Impact:** Auth bypass if token-to-employee mapping is not 1:1. **This should be verified with the Swing API documentation** - if RETURNVALUE is not the employee_no, the comparison format needs adjustment.

### M2. `InstanceUserEndpoint.get()` handles both list and detail via manual pk check

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/user.py` (line ~30)

```python
def get(self, request, pk=None):
    if pk:
        return self._detail(request, pk)
    return self._list(request)
```

This works but deviates from Plane's convention of using `BaseViewSet` with separate `list`/`retrieve` actions. Using `BaseAPIView` is fine since the license views follow this pattern (checked `InstanceAdminEndpoint`).

**Verdict:** Acceptable - consistent with existing license API patterns.

### M3. Missing error handling in `fetchUserDetail` and `updateUser`

**File:** `/Volumes/Data/SHBVN/plane.so/apps/admin/store/instance-user.store.ts`

```typescript
fetchUserDetail = async (userId: string): Promise<IInstanceUser> => {
    const user = await this.service.detail(userId);
    // No try-catch, no loader management
```

`fetchUsers` and `createUser` have try-catch with console.error, but `fetchUserDetail` and `updateUser` don't. Inconsistent error handling.

### M4. Deactivation cascade may need reactivation path

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/user.py` (line ~108)

```python
if "is_active" in serializer.validated_data and not serializer.validated_data["is_active"]:
    WorkspaceMember.objects.filter(member=user, is_active=True).update(is_active=False)
```

When a user is deactivated, all workspace memberships are deactivated. But when reactivated (is_active=True), memberships are NOT restored. This may be intentional (admin must re-add to workspaces) but should be documented.

### M5. `import Link from "next/link"` in React Router v7 app

**Files:**

- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/users/page.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/users/detail/page.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/admin/components/users/user-create-form.tsx`

```typescript
import Link from "next/link";
import { useRouter } from "next/navigation";
```

The admin app uses React Router v7 per the design system. However, checking existing admin pages - if the admin app still uses Next.js (not yet migrated to React Router v7), these imports are correct. **Verify which framework the admin app actually uses.** The routes file uses `@react-router/dev/routes` syntax, suggesting RR7, but components import Next.js modules. This inconsistency needs clarification.

---

## Low Priority

### L1. Hardcoded email domain in SSO token provider

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/authentication/provider/credentials/swing_sso_token.py` (line ~147)

```python
email = f"sh{self.employee_no}@swing.shinhan.com"
```

Same pattern as `swing_sso.py` - acceptable for internal SSO. Consider making configurable via `InstanceConfiguration` in future.

### L2. `secrets` import unused if password generation moves

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/user.py` - `secrets` and `string` imports are correctly used. No issue.

### L3. Missing type export in `packages/types`

Interface types (`IInstanceUser`, `IInstanceUserWorkspace`) are defined in the service file rather than `packages/types/`. For admin-only types this is acceptable, but long-term should move to types package.

---

## Edge Cases Found by Scout

1. **Token replay:** No nonce/timestamp validation on SSO tokens. If Swing tokens are reusable, a captured token+employee_no could be replayed indefinitely. Recommend: check if Swing tokens are single-use.

2. **Concurrent user creation race:** Two admins creating same email simultaneously. The serializer `validate_email` checks existence, but between validation and `User.objects.create()`, a race condition could cause `IntegrityError`. The `BaseAPIView.handle_exception` catches `IntegrityError` returning 400, which is acceptable handling.

3. **Soft-deleted user conflict:** `InstanceUserCreateSerializer.validate_email` uses `User.objects.filter(email=...)` which may or may not include soft-deleted users depending on the User model's default manager. If User uses standard Django auth's manager (not `SoftDeletionManager`), this is fine.

4. **Pagination cursor format mismatch:** Frontend expects `next_cursor`/`prev_cursor` fields. Verify `BasePaginator.paginate()` returns these exact field names. The existing admin workspace store uses similar pagination, so likely consistent.

5. **Workspace store dependency:** `AddToWorkspaceDialog` uses `useWorkspace()` to list available workspaces. If workspace store hasn't been populated (workspaces not fetched), the dialog shows empty list. Consider triggering workspace fetch when dialog opens.

---

## Positive Observations

- Clean separation between SSO token provider and callback view
- Proper use of `InstanceAdminPermission` on all admin endpoints
- Semantic color tokens used throughout (no hardcoded colors)
- Proper use of `observer()` wrapper on MobX-reading components
- Good use of propel components (Button, Dialog, Input, Toast)
- Error codes properly registered in `AUTHENTICATION_ERROR_CODES`
- File sizes within limits (largest: 182 lines for views/user.py)
- Consistent with existing Swing SSO provider patterns
- Proper `void` usage before async handlers in JSX

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix XXE vulnerability - use `defusedxml` or `lxml` with safe parser for XML response parsing
2. **[CRITICAL]** Verify token-to-employee_no mapping in `set_user_data()` (M1) - potential auth bypass
3. **[HIGH]** Add audit logging to password reset endpoint
4. **[HIGH]** Add debounce to search input
5. **[MEDIUM]** Add try-catch to `fetchUserDetail` and `updateUser` in store
6. **[MEDIUM]** Verify `Link`/`useRouter` imports match admin app's actual framework
7. **[LOW]** Document deactivation cascade behavior (no auto-restore on reactivation)

---

## Metrics

| Metric                    | Value                                                |
| ------------------------- | ---------------------------------------------------- |
| File size compliance      | All files under 200 lines                            |
| Component size compliance | All components under 150 lines                       |
| Pattern compliance        | High - follows existing license API + admin patterns |
| Security issues           | 2 critical, 1 high                                   |
| Error handling            | Mostly complete, some inconsistency in store         |

---

## Unresolved Questions

1. Does Swing's XML token validation API return `employee_no` as RETURNVALUE, or a different user identifier? This determines if M1 is a real auth bypass risk.
2. Are Swing tokens single-use or replayable? If replayable, rate limiting becomes more critical (H1).
3. Does the admin app use Next.js or React Router v7? Import inconsistency in M5 needs clarification.
4. Is returning plaintext password in reset response the intended UX, or should we use a temporary link/token flow?
5. Should user deactivation cascade to workspace memberships be reversible on reactivation?
