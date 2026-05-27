# Render Engine

Multi-format text rendering for case output. Produces terminal-safe visuals using box drawing and block elements.

---

## Format Matrix

| Format            | Use                     | Width    |
| ----------------- | ----------------------- | -------- |
| Single-border box | Standard finding blocks | 78 chars |
| Double-border box | Critical exposures      | 78 chars |
| Compact row       | Table data, lists       | 78 chars |
| Progress bar      | Coverage meters, scores | 40 chars |
| Tree branch       | Hierarchy, connections  | variable |

---

## Character Reference

**Box Drawing — Single**

```
┌ ─ ┐   ├ ┤   └ ─ ┘   │
```

**Box Drawing — Double**

```
╔ ═ ╗   ╠ ╣   ╚ ═ ╝   ║
```

**Block Elements**

```
█ ▓ ▒ ░   ▀ ▄   ▌ ▐
```

**Status Glyphs**

```
● confirmed   ○ unverified   ◐ partial
✓ pass        ✗ fail         ⚠ flag
→ link        ← reverse      ↔ bidirectional
```

---

## Standard Templates

### Finding Block

```
┌─[ FINDING ]──────────────────────────────────────────────────┐
│ ID:     F-001                                                 │
│ Type:   [credential | infrastructure | identity | exposure]   │
│ Weight: [HIGH / MEDIUM / LOW]                                 │
│ Source: [url or tool]                                         │
│ Detail: [one line description]                                │
└───────────────────────────────────────────────────────────────┘
```

### Subject Block

```
┌─[ SUBJECT ]───────────────────────────────────────────────────┐
│ Label:       [name or handle]                                 │
│ Type:        [person | org | domain | ip | handle]            │
│ Confidence:  [●●●○○] 60%                                      │
│ Connections: [N]                                              │
└───────────────────────────────────────────────────────────────┘
```

### Critical Exposure Block

```
╔═[ CRITICAL EXPOSURE ]═════════════════════════════════════════╗
║ [description — one sentence]                                  ║
║ Remediation: [action]                                         ║
╚═══════════════════════════════════════════════════════════════╝
```

### Progress Bar

```
Coverage: [████████░░░░░░░░░░░░] 42%
Exposure: [████████████████░░░░] 78%
```

### Connection Tree

```
Subject: target-name
├── domain: target.com
│   ├── IP: 203.0.113.4
│   └── subdomain: mail.target.com
├── identity: jane.doe@target.com
│   └── platform: linkedin.com/in/janedoe
└── associate: partner-org.com
```

---

## Rendering Rules

1. Max width: 78 chars (with 1-space inner padding)
2. Max block height: 35 lines
3. Headers: center-aligned inside box, left-aligned in tree
4. Status glyphs precede data lines, never trail
5. Nest at most 2 levels inside a single box
6. Use double-border only for findings scored HIGH or CRITICAL

---

## Severity → Border Mapping

| Score    | Border style | Glyph |
| -------- | ------------ | ----- |
| CRITICAL | Double `╔═╗` | ⚠     |
| HIGH     | Double `╔═╗` | ●     |
| MEDIUM   | Single `┌─┐` | ◐     |
| LOW      | Single `┌─┐` | ○     |
| INFO     | Single `┌─┐` | →     |

---

---

## Connection Type ASCII Templates

All 6 connection types rendered as ASCII with box-drawing characters. Use these exact patterns for `/show-connections` and `/graph` output.

### owns (double-line — ownership, registration)

```
┌───────────────────────┐         ┌───────────────────────┐
│ 👤 John Doe    [4/5] │═══owns══▶│ 🌐 example.com [4/5] │
└───────────────────────┘         └───────────────────────┘
```

### uses (solid — platform account, tool usage)

```
┌───────────────────────┐         ┌───────────────────────┐
│ 👤 John Doe    [4/5] │───uses──▶│ @ twitter.com  [3/5] │
└───────────────────────┘         └───────────────────────┘
```

### works_at (dashed — employment, affiliation)

```
┌───────────────────────┐         ┌───────────────────────┐
│ 👤 John Doe    [4/5] │╌╌works╌╌▶│ 🏢 Acme Corp  [4/5] │
└───────────────────────┘         └───────────────────────┘
```

### linked_to (dotted — inferred, general association)

```
┌───────────────────────┐         ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ 👤 John Doe    [4/5] │···linked·▶│ 👤 Jane Doe   [2/5] │
└───────────────────────┘         └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### alias (dash-dot — same identity, different handle)

```
┌───────────────────────┐         ┌───────────────────────┐
│ @ johndoe99    [4/5] │─·alias·─▶│ @ jd_official  [3/5] │
└───────────────────────┘         └───────────────────────┘
```

### communicated_with (bidirectional — observed contact)

```
┌───────────────────────┐         ┌───────────────────────┐
│ 👤 John Doe    [4/5] │◄──comms──▶│ 👤 Bob Smith  [3/5] │
└───────────────────────┘         └───────────────────────┘
```

### Multi-Connection Example (Combined)

```
┌─────────────────────────────┐
│ 🎯 TARGET: John Doe  [5/5] │
└──┬──────────┬───────────┬───┘
   │ owns     │ works_at  │ uses
   ▼          ▼           ▼
┌──────────┐┌──────────┐┌──────────┐
│📧 john@  ││🏢 Acme  ││@ johndoe │
│ex.com    ││Corp     ││         │
│    [4/5] ││   [4/5] ││   [4/5] │
└────┬─────┘└─────────┘└────┬─────┘
     │ registered            │ alias
     ▼                       ▼
┌──────────┐          ┌──────────┐
│🌐 domain ││          │@ jd_alt  │
│.com [4/5]│          │    [3/5] │
└──────────┘          └──────────┘
```

---

_See also: [`output/visuals/case-dashboard.md`](./case-dashboard.md)_
