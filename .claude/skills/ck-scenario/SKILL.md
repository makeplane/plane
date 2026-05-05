---
name: ck:scenario
description: "Generate comprehensive edge cases and test scenarios by decomposing features across 12 dimensions. Use before implementation or testing to catch issues early."
argument-hint: "<file path or feature description>"
metadata:
  author: claudekit
  attribution: "Scenario exploration pattern adapted from autoresearch by Udit Goenka (MIT)"
  license: MIT
  version: "1.0.0"
---

# ck:scenario — Edge Case & Scenario Explorer

Decompose any feature or code path across 12 dimensions to surface edge cases, risks, and test targets before implementation begins.

## When to Use

- Before implementing complex or stateful features
- Before writing tests (generates test targets)
- Risk assessment during planning or code review
- API design review — surface contract edge cases early

## When NOT to Use

- Trivial single-line changes or cosmetic UI tweaks
- Already well-tested, stable code with no recent modifications
- Pure configuration changes with no logic paths

---

## 12 Decomposition Dimensions

Not all 12 apply to every feature. Identify relevant dimensions first, then generate scenarios only for those.

| # | Dimension | What to Look For |
|---|-----------|------------------|
| 1 | **User Types** | admin, guest, banned, new user, power user, bot/scraper |
| 2 | **Input Extremes** | empty, null, max length, unicode, special chars, SQL/script injection |
| 3 | **Timing** | concurrent access, race conditions, timeout, slow network, retry storms |
| 4 | **Scale** | 0 items, 1 item, 1M items, pagination boundary, cursor wrap |
| 5 | **State Transitions** | first use, mid-flow abort, resume after crash, partial completion |
| 6 | **Environment** | mobile/low-end CPU, no JS, screen reader, proxy/VPN, different timezone/locale |
| 7 | **Error Cascades** | DB down, API timeout, disk full, OOM, network partition, partial write |
| 8 | **Authorization** | expired token, wrong role, shared/public link, CORS, CSRF, privilege escalation |
| 9 | **Data Integrity** | duplicate entries, orphan references, encoding mismatch, concurrent schema migration |
| 10 | **Integration** | webhook replay, API version mismatch, third-party outage, contract drift |
| 11 | **Compliance** | GDPR deletion request, audit logging gap, data retention, accidental PII exposure |
| 12 | **Business Logic** | edge pricing (zero/negative), coupon stacking, refund after partial delivery, free tier limits |

---

## Workflow

1. **Read** target file(s) or parse feature description from argument
2. **Filter dimensions** — mark which of the 12 apply; skip irrelevant ones explicitly
3. **Generate 3–5 scenarios** per relevant dimension
4. **Categorize severity** — Critical / High / Medium / Low
5. **Output** as structured table (see format below)
6. **Summarize** total scenario count by severity

### Severity Criteria

| Level | Meaning |
|-------|---------|
| **Critical** | Data loss, security breach, auth bypass, silent corruption |
| **High** | Feature broken for a subset of users, data inconsistency |
| **Medium** | Degraded UX, recoverable error not surfaced to user |
| **Low** | Minor visual glitch, non-blocking warning |

---

## Output Format

```
## Scenario Report: [target]

Dimensions analyzed: [list]
Dimensions skipped: [list + reason]

| # | Dimension | Scenario | Severity | Expected Behavior |
|---|-----------|----------|----------|-------------------|
| 1 | Input Extremes | Empty string for required name field | High | Return 400 with field error |
| 2 | Authorization | Expired JWT accessing protected route | Critical | Redirect to login, invalidate session |
| 3 | Timing | Two users submit same form simultaneously | High | Idempotency key or conflict error |

### Summary
- Critical: N
- High: N
- Medium: N
- Low: N
- Total: N scenarios across X dimensions
```

---

## Integration with Other Skills

| Next Step | Skill | How |
|-----------|-------|-----|
| Generate test cases from scenarios | `ck:test` | Pass scenario table as input context |
| Inform implementation plan risks | `ck:plan` | Paste Critical/High rows into risk assessment |
| Deep persona debate on top risks | `ck:predict` | Feed Critical scenarios as the change proposal |

---

## Example Invocations

```
/ck:scenario src/api/payment.ts
/ck:scenario "User registration with OAuth providers"
/ck:scenario src/middleware/auth.ts
/ck:scenario "Add multi-tenancy to the database layer"
```
