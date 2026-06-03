# Layered Detail

Output reveals information in four layers, from summary to raw. Users control depth.

---

## The Four Layers

| Layer | Name      | Contents                               | Default For         |
| ----- | --------- | -------------------------------------- | ------------------- |
| 1     | Summary   | Single finding, confidence indicator   | Novice              |
| 2     | Context   | Finding + source count + related items | Practitioner        |
| 3     | Technical | Full analysis, timestamps, all sources | Specialist          |
| 4     | Raw       | Unprocessed data + full metadata       | Specialist (`/raw`) |

---

## Navigation Commands

| From      | Command        | Result            |
| --------- | -------------- | ----------------- |
| Summary   | `/context`     | Layer 2           |
| Context   | `/technical`   | Layer 3           |
| Technical | `/raw`         | Layer 4           |
| Any layer | `/summary`     | Return to Layer 1 |
| Any layer | `/layer [1-4]` | Jump directly     |

---

## Layer Format Examples

### Layer 1 — Summary

```
Email: john.doe@example.com
Confidence: High  |  Sources: 3
/context for more  |  /raw for data
```

### Layer 2 — Context

```
Email: john.doe@example.com
Type: Professional  |  Confidence: 87%
First seen: 2019  |  Last verified: 2024
Sources: 3 (LinkedIn, company site, conference bio)
Related: 2 phone numbers, 1 address
/technical for full analysis
```

### Layer 3 — Technical

```
━━━ FINDING: Email ━━━
Value:         john.doe@example.com
Classification: Professional
Confidence:    87%
Seen:          2019-03-15 → 2024-01-20

Source Chain:
  [1] linkedin.com/in/johndoe (verified 2024-01-20)
  [2] example.com/team (scraped 2023-11-10)
  [3] techconf.org/speakers-2019 (archived 2019-03-15)

Pattern: firstname.lastname@domain — corporate standard
Risk:    None
Linked:  2 phones · 1 address · 4 social profiles
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/summary | /raw | /export | /chrono
```

### Layer 4 — Raw

```
{"type":"email","value":"john.doe@example.com",
 "confidence":0.87,"first_seen":"2019-03-15",
 "last_verified":"2024-01-20","classification":"professional",
 "sources":[{"url":"...","scraped":"..."},...],
 "risk_indicators":[],"linked_findings":["ph:+1...","addr:..."]}
```

---

## Reveal Triggers

Detail layers surface automatically when conditions are met.

| Condition            | Layer Revealed                |
| -------------------- | ----------------------------- |
| Risk score ≥ 8       | Technical (Layer 3) forced    |
| Conflicting sources  | Context (Layer 2) auto-shown  |
| User types `/why`    | Context for that finding      |
| Export requested     | Technical minimum enforced    |
| Case template active | Layer set per template config |

---

## Terminology Translation Table

Specialist terms are rendered in plain language in Novice tier.

| Specialist Term | Novice Rendering          |
| --------------- | ------------------------- |
| Reconnaissance  | Subject information sweep |
| Pivot           | Follow a connection       |
| Dork            | Targeted search query     |
| EXIF            | Photo origin data         |
| WHOIS           | Domain ownership record   |
| Subdomain       | Sub-section of a site     |
| Geolocation     | Physical location data    |
| Sock puppet     | Fabricated identity       |
| PII             | Personal identifiers      |
| IOC             | Threat indicator          |
| TTPs            | Behavioral signatures     |

Translation format in output:

```
We found EXIF data (photo origin information) embedded in the file.
```

---

## User Preference Memory

The system tracks per-command layer preferences across a session.

| Tracked Signal                         | Adaptation                  |
| -------------------------------------- | --------------------------- |
| User reached Layer 3 on `/sweep` twice | Default `/sweep` to Layer 2 |
| User declined `/context` 3 times       | Default stays Layer 1       |
| User always types `/raw` after `/scan` | Pre-fetch Layer 4           |

---

## Finding Explanation — /clarify

Decomposes a single finding into plain language at Layer 1 depth, regardless of current layer setting.

### Command

```
/clarify [finding_id]
```

### Behavior

1. Fetch the finding by ID from the active case
2. Resolve source reliability grade (A–F) from `analysis/confidence-scoring.md`
3. Determine next recommended action based on trust_score and finding type
4. Render using tier-appropriate template below

### Output Templates

**Novice — full template with glossary:**

```
[What]:       We found [desc].
[Where]:      From [source_label] (reliability: [A-F grade]).
[Confidence]: [label] ([score]/5).
[Action]:     [next step].

Glossary: [any specialist terms used, translated per terminology table]
```

**Practitioner — 2 sentences:**

```
[desc] — sourced from [source_label] (reliability: [A-F]), confidence [label].
Next: [next step].
```

**Specialist — one-liner:**

```
[F-id] [type]: [desc] | [source_label] [A-F] | [score]/5 | [next step]
```

### Source Reliability Grades

| Grade | Meaning                   |
| ----- | ------------------------- |
| A     | Primary / official record |
| B     | Verified third-party      |
| C     | Credible but unverified   |
| D     | Single unconfirmed source |
| E     | Known unreliable source   |
| F     | Fabricated or disputed    |

### Example (Novice)

```
/clarify F-003

[What]:       We found an email address: john.doe@example.com.
[Where]:      From LinkedIn (reliability: B — verified third-party).
[Confidence]: High (4/5).
[Action]:     Run /pivot --email john.doe@example.com to find linked accounts.

Glossary: "pivot" means follow a connection to find more information.
```

---

## Related Files

- `experience/skill-tiers.md` — tier controls default layer
- `experience/guidance-system.md` — hints when to go deeper
- `analysis/confidence-scoring.md` — confidence values shown at each layer
