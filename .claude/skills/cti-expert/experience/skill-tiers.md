# Skill Tiers

Three tiers adapt output density and automation to user proficiency.

---

## Tier Overview

| Tier         | Profile                                 | Output Density   | Automation     | Explanations        |
| ------------ | --------------------------------------- | ---------------- | -------------- | ------------------- |
| Novice       | First cases, unfamiliar with OSINT      | Minimal, curated | High           | Built-in, always on |
| Practitioner | Recurring use, knows core commands      | Moderate detail  | Selective      | On request          |
| Specialist   | Daily operator, builds custom workflows | Full data dump   | Off by default | Reference only      |

---

## Novice Tier

### Behavior Specs

| Parameter            | Value                      |
| -------------------- | -------------------------- |
| Findings per screen  | Max 3, ranked by relevance |
| Technical vocabulary | Translated on first use    |
| Next-step prompts    | Always provided            |
| Error handling       | Full recovery path         |
| Confirmation gates   | All operations             |

### Sample Output

```
/sweep example.com

Novice output:
  Located 3 social accounts for example.com.
  [1] Twitter: @example
  [2] LinkedIn: Example Inc
  [3] Facebook: Example Co

  Which should I examine first?
  Type 1, 2, or 3 — or /skip to move on.
```

### Auto-Explain Triggers

- Any command not used this session
- Operations with 3+ parameters
- Findings with threat score above 7
- Any operation running longer than 30 seconds
- All error conditions

---

## Practitioner Tier

### Behavior Specs

| Parameter            | Value                        |
| -------------------- | ---------------------------- |
| Findings per screen  | Up to 10 with context        |
| Technical vocabulary | Defined via `/define [term]` |
| Next-step prompts    | Suggested when relevant      |
| Error handling       | Short recovery steps         |
| Confirmation gates   | Bulk operations only         |

### Sample Output

```
/sweep example.com

Practitioner output:
  3 social accounts — example.com:
  - Twitter @example: 50K followers, active since 2010
  - LinkedIn Example Inc: ~500 staff
  - Facebook Example Co: 12K engagements

  Continue: /dig 1  or  /chrono for activity pattern.
```

---

## Specialist Tier

### Behavior Specs

| Parameter            | Value                                       |
| -------------------- | ------------------------------------------- |
| Findings per screen  | Raw structured data                         |
| Technical vocabulary | Not defined                                 |
| Next-step prompts    | Only via `/hint`                            |
| Error handling       | Status codes only                           |
| Confirmation gates   | Disabled (add `/confirm` flag to re-enable) |

### Sample Output

```
/sweep example.com

Specialist output:
  [ACCTS:3]
  [0] TW:@example | F:50K | EST:2010 | R:0.82
  [1] LI:Example Inc | EMP:500 | R:0.91
  [2] FB:Example Co | ENG:12K | R:0.76
```

---

## Tier Switching

### Manual

```
/tier novice
/tier practitioner
/tier specialist
/tier auto          # reset to auto-detect
```

### Auto-Detection Signals

| Signals → Novice                | Signals → Specialist     |
| ------------------------------- | ------------------------ |
| First session                   | Rapid command sequences  |
| Full-sentence input             | Advanced flag usage      |
| Repeated similar commands       | Custom dork construction |
| High `/help` rate (>3 in 5 min) | Pipeline chaining        |
| Syntax errors > 2 consecutive   | OSINT cert mention       |

### Tier Mismatch Prompts

| Condition                                 | Prompt                                                         |
| ----------------------------------------- | -------------------------------------------------------------- |
| Specialist + frequent `/help`             | "Switch to Practitioner? `/tier practitioner`"                 |
| Novice + advanced commands used correctly | "Try Practitioner tier? `/tier practitioner`"                  |
| Novice + declining all explanations       | "Speed things up with Practitioner mode? `/tier practitioner`" |

### Persistence

- Tier persists for the session
- Stored in subject profile
- Override per-command with `--tier [level]` flag

---

## Tier Feature Matrix

| Feature                | Novice        | Practitioner       | Specialist |
| ---------------------- | ------------- | ------------------ | ---------- |
| Output verbosity       | Curated       | Moderate           | Raw        |
| Auto-explanation       | Always        | Never (on request) | Never      |
| Operation confirmation | All           | Bulk only          | None       |
| Error detail           | Full guide    | Steps              | Code       |
| Progress display       | Visual + text | Text               | None       |
| Examples shown         | Always        | On demand          | Never      |
| Glossary links         | Auto-injected | Manual             | None       |
| Tutorial offers        | Frequent      | Rare               | Never      |

---

## Related Files

- `experience/layered-detail.md` — controls output depth per tier
- `experience/guidance-system.md` — proactive hints by tier
- `engine/command-router.md` — tier-aware command dispatch
