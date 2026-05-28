# Guidance System

Proactive and reactive guidance that keeps cases moving without interrupting flow.

---

## Guidance Types

| Type                 | Trigger                              | Delivery         | Dismissable             |
| -------------------- | ------------------------------------ | ---------------- | ----------------------- |
| Inline hint          | After 3 consecutive similar commands | Single line      | Yes                     |
| Recovery guide       | Error condition                      | Structured block | No (until resolved)     |
| Confirmation gate    | Destructive or bulk operation        | Prompt           | Yes (Specialist tier)   |
| Risk alert           | Finding with risk ≥ 8                | Flagged block    | Requires acknowledgment |
| Next-step suggestion | Operation completes                  | Footer line      | Yes                     |

---

## Confirmation Gates

### When Required

**Always prompt:**

- Deleting saved cases
- Exporting data with PII
- Bulk operations (>50 results affected)
- Running resource-heavy sweeps
- Sharing findings externally

**Never prompt (Novice override):**

- Read-only queries
- Status checks
- Navigation
- Help requests

### Gate Formats

**Standard gate:**

```
Confirm: Delete case "Q4 Vendor Check" ?

This removes:
  - 23 saved findings
  - Associated timeline
  - Case notes

Type YES to confirm, or NO to cancel.
```

**Destructive gate:**

```
DESTRUCTIVE ACTION

Purging all case history removes:
  • 156 case records
  • 2,340 findings
  • All saved timelines

This cannot be reversed.

To proceed, type: PURGE-ALL
To cancel: NO
```

### Confirmation Shortcuts by Tier

| Tier         | Confirm         | Cancel         |
| ------------ | --------------- | -------------- |
| Novice       | Full word "yes" | "no" or Escape |
| Practitioner | "y" or "yes"    | "n" or "no"    |
| Specialist   | "y"             | "n" or Ctrl+C  |

---

## Recovery Guidance

### Error Template Structure

Each error delivers: what failed → plain-language reason → fix steps → alternative path.

**Unknown command:**

```
Unrecognized: "rekcon example.com"
Did you mean: /sweep example.com

Try: /sweep example.com
List all commands: /help
```

**Missing parameter:**

```
/sweep requires a target.

Try:
  /sweep example.com        (domain)
  /sweep user@example.com   (email)
  /sweep "Jane Smith"       (subject name)
```

**Rate limit:**

```
Request rate exceeded. Pause: 45 seconds.

While waiting:
  /results     — review current findings
  /status      — check case progress
  /help tips   — efficiency techniques
```

**No results:**

```
No records found for "xyzabc123456".

Possible causes:
  • Spelling variation
  • Target has minimal online presence
  • Too new to be indexed

Alternatives:
  /sweep with broader terms
  /dork for specialized search
  /help search-techniques
```

---

## Risk Alerts

### Alert Levels

| Level         | Icon | Trigger           | Required Action       |
| ------------- | ---- | ----------------- | --------------------- |
| Informational | —    | Context note      | None                  |
| Caution       | ⚠    | Ambiguous finding | Review suggested      |
| High          | !    | Risk score ≥ 7    | Acknowledge           |
| Critical      | !!   | Risk score ≥ 9    | Explicit confirmation |

### Alert Templates

**Caution (multiple subjects match):**

```
⚠ Multiple subjects match "John Smith" — Boston area.
Verify target identity before proceeding.
/verify-subject for help
```

**High (sensitive data in scope):**

```
! Sensitive data in scope:
  • Home address
  • Family member details
  • Private contact information

Handle per your jurisdiction's data regulations.
Type ACKNOWLEDGE to continue.
```

**Critical (protected subject):**

```
!! Subject may be a protected individual.
Review applicable laws before proceeding.
You accept full legal responsibility for this case.
Type: I-ACCEPT-RESPONSIBILITY  or  /abort
```

---

## Proactive Hints

Hints appear after behavioral patterns, not on a timer.

| Pattern                            | Hint                                                |
| ---------------------------------- | --------------------------------------------------- |
| Three `/sweep` runs on same target | "Try `/connections` to map linked accounts"         |
| Email found without domain         | "Run `/sweep [domain]` to find the associated site" |
| Timeline has gaps >2 years         | "Use `/dork` with date ranges to fill gaps"         |
| Same command used 5+ times         | "Save as case template: `/template save [name]`"    |
| High error rate                    | "Switch to guided flow: `/flow [type]`"             |

### Hint Preferences

```
/hints on      — enable proactive hints
/hints off     — hints only on /hint command
/hints quiet   — hints stored, review with /hints review
```

System suppresses hints that were dismissed within the last 2 minutes or declined 3+ times.

---

## Success Signals

### Completion Format

```
Done: 23 findings for example.com  (2m 34s)

  5 emails  |  8 subdomains  |  3 documents  |  1 security flag

/summary | /timeline | /export
```

### Partial Completion

```
Done (partial): 15 findings — 2 sources unavailable.

  Skipped: LinkedIn (rate limited)  ·  Twitter API (maintenance)

Results may be incomplete. Retry skipped sources: /retry-skipped
```

---

## Message Tokens

| Token | Meaning          |
| ----- | ---------------- |
| `✓`   | Step completed   |
| `○`   | Step pending     |
| `⏳`  | Step in progress |
| `⚠`   | Caution          |
| `!`   | High risk        |
| `!!`  | Critical         |
| `—`   | Informational    |

---

## Related Files

- `experience/skill-tiers.md` — tier controls gate and hint frequency
- `experience/case-progress.md` — progress display during active operations
- `engine/error-handling.md` — error classification and routing
