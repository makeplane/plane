# Attack Surface Map

Spec for rendering a structured attack surface enumeration from case subjects. Groups exposed assets by exposure category and provides a risk summary.

---

## Command

```
/render attack-surface [--subject <org_or_domain>]
```

**Options:**

| Option                      | Default      | Description                                                         |
| --------------------------- | ------------ | ------------------------------------------------------------------- |
| `--subject <org_or_domain>` | all subjects | Restrict enumeration to subjects linked to a specific org or domain |

---

## Subject Type Mapping

| Subject Type | Surface Category |
| ------------ | ---------------- |
| DOMAIN       | EXTERNAL         |
| URL          | EXTERNAL         |
| NETWORK_ADDR | INFRASTRUCTURE   |
| ASN          | INFRASTRUCTURE   |
| EMAIL        | IDENTITIES       |
| USERNAME     | IDENTITIES       |
| INDIVIDUAL   | IDENTITIES       |
| PHONE        | IDENTITIES       |

Subject types not in this table (DOCUMENT, ORG) are listed in a separate METADATA section at the bottom.

---

## Exposure Level Grouping

Each subject's exposure score drives its risk tier label. Uses scores from `analysis/exposure-model.md`:

| Composite Score | Tier Label |
| --------------- | ---------- |
| 0–30            | LOW        |
| 31–65           | MEDIUM     |
| 66–80           | HIGH       |
| 81–100          | CRITICAL   |

Within each section, subjects are sorted descending by exposure score.

---

## ASCII Template

```
ATTACK SURFACE MAP — Case: {CASE_ID}
Generated: {YYYY-MM-DD HH:MM} UTC
Subjects Enumerated: {total}
════════════════════════════════════════════════════════════════

┌─ EXTERNAL ─────────────────────────────────────────────────┐
│  Domains and URLs visible from the open internet           │
│                                                            │
│  [{tier}] {domain_or_url:<40} score: {score:>3}           │
│  [{tier}] {domain_or_url:<40} score: {score:>3}           │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘

┌─ INFRASTRUCTURE ───────────────────────────────────────────┐
│  Network addresses and autonomous system numbers           │
│                                                            │
│  [{tier}] {addr_or_asn:<40} score: {score:>3}             │
│  [{tier}] {addr_or_asn:<40} score: {score:>3}             │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘

┌─ IDENTITIES ───────────────────────────────────────────────┐
│  Email addresses, usernames, individuals, phone numbers    │
│                                                            │
│  [{tier}] {identity:<40} score: {score:>3}                │
│  [{tier}] {identity:<40} score: {score:>3}                │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────
RISK SUMMARY
┌────────────────┬──────────┬──────────────┬──────────────┐
│ Category       │ Total    │ HIGH/CRITICAL│ Top Score    │
├────────────────┼──────────┼──────────────┼──────────────┤
│ EXTERNAL       │ {n}      │ {n_hc}       │ {max_score}  │
│ INFRASTRUCTURE │ {n}      │ {n_hc}       │ {max_score}  │
│ IDENTITIES     │ {n}      │ {n_hc}       │ {max_score}  │
├────────────────┼──────────┼──────────────┼──────────────┤
│ TOTAL          │ {total}  │ {total_hc}   │ {overall}    │
└────────────────┴──────────┴──────────────┴──────────────┘

Tier breakdown:  CRITICAL: {n_crit}  HIGH: {n_high}  MEDIUM: {n_med}  LOW: {n_low}
════════════════════════════════════════════════════════════════
```

**Tier label display:**

- `[CRITICAL]` — bold in terminal output (ANSI `\e[1;31m`)
- `[HIGH]` — red (`\e[31m`)
- `[MEDIUM]` — yellow (`\e[33m`)
- `[LOW]` — default

---

## Algorithm

```python
def render_attack_surface(case, subject_filter=None):
    subjects = case.subjects
    if subject_filter:
        subjects = filter_by_org_or_domain(subjects, subject_filter)

    sections = {
        "EXTERNAL":       [],
        "INFRASTRUCTURE": [],
        "IDENTITIES":     [],
    }

    for subj in subjects:
        category = SUBJECT_SURFACE_MAP.get(subj.type)
        if category:
            tier = score_to_tier(subj.exposure_score)
            sections[category].append((tier, subj.value, subj.exposure_score))

    for cat in sections:
        sections[cat].sort(key=lambda x: -x[2])  # descending score

    return render_ascii(sections, case.id)
```

---

## Integration

Reads from:

- **Subject registry** — `engine/subject-registry.md` — subject type, value, verified flag
- **Exposure scores** — `analysis/exposure-model.md` — composite score per subject
- **Workspace** — `engine/workspace-format.md` — case ID, metadata

Command registered in: `output/visuals/render-engine.md`

---

## Cross-References

- `output/visuals/attack-path-diagram.md` — complements with lateral movement tracing
- `analysis/exposure-model.md` — scoring definitions and grading scale
- `engine/subject-registry.md` — subject type enumeration
