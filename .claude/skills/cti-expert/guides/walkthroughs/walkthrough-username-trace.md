# Walkthrough: Username Trace

Step-by-step case example. Target handle: `nullvector88`
Scenario: Threat analyst tracing a handle that appeared in a credential dump discussion thread.

---

## Setup

Open case workspace. Add `nullvector88` as primary subject (type: handle).

---

## Step 1 — Platform Coverage Sweep

**Discovery paths:** Username enumeration tools + manual operator queries

**Operator queries:**

```
"nullvector88" site:github.com
"nullvector88" site:x.com OR site:twitter.com
"nullvector88" site:reddit.com
"nullvector88" site:gitlab.com
"nullvector88"
```

**Platform results:**

| Platform    | Status    | Profile URL                       | Activity                          |
| ----------- | --------- | --------------------------------- | --------------------------------- |
| GitHub      | FOUND     | github.com/nullvector88           | 18 repos, last active 2025-11     |
| Reddit      | FOUND     | u/nullvector88                    | 2 posts, dormant since 2023       |
| X / Twitter | NOT FOUND | —                                 | null                              |
| GitLab      | FOUND     | gitlab.com/nullvector88           | 3 projects (mirrored from GitHub) |
| HackForums  | FOUND     | thread reference only, no profile | [MEDIUM]                          |

---

## Step 2 — Platform Deep Dive

### GitHub (`nullvector88`)

**Findings logged:**

```
FND-001  Profile created: 2021-03-14  [INFO]
FND-002  Location field: "EU"  [LOW — not specific]
FND-003  Bio: "security research | ctf player"  [INFO]
FND-004  Repo: null-http-scanner — Python, 412 stars  [HIGH — authored tool]
FND-005  Repo commit email: nullvector88@proton.me  [HIGH — email extracted from commits]
FND-006  Repo: ctf-writeups — mentions events 2021–2024  [INFO]
```

**Key pivot:** FND-005 — email `nullvector88@proton.me`

---

## Step 3 — Email Pivot

**Discovery paths from `nullvector88@proton.me`:**

```
Operator query: "nullvector88@proton.me"
HaveIBeenPwned: check email in breach databases
Paste search: site:pastebin.com "nullvector88@proton.me"
```

**Findings logged:**

```
FND-007  Email not found in any known breach database  [NULL]
FND-008  Paste reference: nullvector88@proton.me listed in 2022 CTF team roster  [MEDIUM]
FND-009  CTF roster: team "ZeroByte" — 4 members listed  [MEDIUM — network expansion]
```

**New subjects added:** Team `ZeroByte` (SUB-002), 3 additional handles from roster (SUB-003–005)

---

## Step 4 — Forum Reference Trace

**HackForums reference (from Step 1):**

```
Operator query: site:hackforums.net "nullvector88"
```

**Findings logged:**

```
FND-010  Thread (2023-07): nullvector88 referenced in discussion about credential parsing tools  [HIGH]
FND-011  Thread context: educational discussion, not active offer of stolen data  [MEDIUM — lowers threat weight]
FND-012  Other handles in same thread: cross-reference pending  [INFO]
```

---

## Step 5 — Cross-Platform Correlation

**Consistency check across all platforms:**

| Attribute          | GitHub            | Reddit             | HackForums        |
| ------------------ | ----------------- | ------------------ | ----------------- |
| Handle exact match | ✓                 | ✓                  | ✓                 |
| Tone / focus       | Security research | Security questions | Tool discussion   |
| Activity window    | 2021–2025         | 2021–2023          | 2023 (single ref) |
| Location signal    | "EU"              | None               | None              |
| Real name          | None              | None               | None              |

**Assessment:** Single individual, security researcher profile, no confirmed malicious activity found.

---

## Step 6 — Summary

```
┌─[ SUBJECT RECORD: nullvector88 ]──────────────────────────────┐
│ Type: handle                                                   │
│ Confidence: PROBABLE (71/100)                                  │
│ Real identity: not established                                 │
│ Email pivot: nullvector88@proton.me  (Proton — anonymous)     │
│ Platforms: GitHub (primary), GitLab (mirror), Reddit          │
│ Network: ZeroByte CTF team (4 members)                        │
│ Threat assessment: LOW — researcher profile, no IOCs          │
│ Exposure: INFO                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Next steps if threat escalates:** pivot to CTF team handles (SUB-003–005), check tool null-http-scanner for weaponization indicators.

---

_See also: [`guides/walkthroughs/walkthrough-domain-sweep.md`](./walkthrough-domain-sweep.md) | [`handbook/operator-queries.md`](../../handbook/operator-queries.md)_
