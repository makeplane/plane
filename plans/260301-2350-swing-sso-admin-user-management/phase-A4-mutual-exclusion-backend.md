# Phase A4: Mutual Exclusion Backend

## Context Links

- [Instance config view](../../apps/api/plane/license/api/views/instance.py)
- [InstanceConfiguration model](../../apps/api/plane/license/models/instance.py)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** When enabling Swing SSO, auto-disable LDAP, and vice versa. Backend enforcement ensures only one can be active.

<!-- Updated: Validation Session 3 - Backend auto-disable confirmed as required approach -->

## Key Insights

- `InstanceConfigurationEndpoint.patch()` handles config updates — this is where mutual exclusion logic goes
- Config values are strings: `"0"` (disabled) / `"1"` (enabled)
- Both LDAP and Swing SSO use same user email pattern (`sh{id}@swing.shinhan.com`), so mutual exclusion prevents conflicts
- Frontend also enforces via confirmation popup, but backend is the authoritative guard

## Requirements

**Functional:**

- When `IS_SWING_SSO_ENABLED` set to `"1"` → auto-set `IS_LDAP_ENABLED` to `"0"`
- When `IS_LDAP_ENABLED` set to `"1"` → auto-set `IS_SWING_SSO_ENABLED` to `"0"`
- Only trigger when value changes TO `"1"` (not on `"0"` or other updates)

**Non-functional:**

- Atomic: both updates in same DB operation
- No race conditions: single request thread

## Architecture

```
PATCH /api/instances/configurations/
  → InstanceConfigurationEndpoint.patch()
    → for each key/value in payload:
        if key == "IS_SWING_SSO_ENABLED" and value == "1":
            InstanceConfiguration.objects.filter(key="IS_LDAP_ENABLED").update(value="0")
        if key == "IS_LDAP_ENABLED" and value == "1":
            InstanceConfiguration.objects.filter(key="IS_SWING_SSO_ENABLED").update(value="0")
```

## Related Code Files

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/instance.py`

**Files to reference:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/models/instance.py`

## Implementation Steps

### Step 1: Find the config update method

Locate `InstanceConfigurationEndpoint` in `instance.py`. Find the `patch` method where config key-value pairs are iterated and saved.

### Step 2: Add mutual exclusion logic

After the existing save/update logic for each config key, add:

```python
# Mutual exclusion: LDAP ⊕ Swing SSO
from plane.license.models.instance import InstanceConfiguration

# Inside the loop/logic that processes config updates:
if key == "IS_SWING_SSO_ENABLED" and value == "1":
    InstanceConfiguration.objects.filter(
        key="IS_LDAP_ENABLED"
    ).update(value="0")

if key == "IS_LDAP_ENABLED" and value == "1":
    InstanceConfiguration.objects.filter(
        key="IS_SWING_SSO_ENABLED"
    ).update(value="0")
```

### Step 3: Verify the response includes updated values

The PATCH response should reflect the mutual exclusion. If the endpoint returns all configurations after update, the disabled key will already show `"0"`. If it only returns the updated keys, ensure the auto-disabled key is also included in the response.

Check the current response pattern — if it re-fetches all configs, no extra work needed.

## Todo List

- [ ] Locate config update method in `instance.py`
- [ ] Add mutual exclusion for `IS_SWING_SSO_ENABLED` → disable LDAP
- [ ] Add mutual exclusion for `IS_LDAP_ENABLED` → disable Swing SSO
- [ ] Verify response includes both updated values
- [ ] Test: enable Swing SSO when LDAP is on → both reflected correctly

## Success Criteria

- Enable Swing SSO via API → LDAP auto-disabled in DB
- Enable LDAP via API → Swing SSO auto-disabled in DB
- Disable either → no side effect on the other
- GET `/api/instances/` reflects correct boolean values after mutual exclusion

## Risk Assessment

- **Low risk**: simple DB update, no complex logic
- **Edge case**: bulk update with both keys set to `"1"` — last-write-wins is acceptable (admin UI sends one at a time)

## Security Considerations

- Only instance admins can update configurations (existing permission check)
- No user data affected — only config flags

## Next Steps

- Phase A5: Admin UI (frontend enforcement with confirmation popup)
