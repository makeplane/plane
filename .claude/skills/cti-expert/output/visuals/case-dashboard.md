# Case Dashboard

Terminal dashboard layout for active case monitoring.

---

## Layout — 80×24 Terminal

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  CASE WORKSPACE  [ALPHA]              analyst: ops1       2026-03-30  09:14 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ║
║ │   SUBJECTS     │ │   FINDINGS     │ │  CONNECTIONS   │ │   EXPOSURE     │ ║
║ │      12        │ │      28        │ │      41        │ │   HIGH (74)    │ ║
║ │  [██████░░░░]  │ │  [████████░░]  │ │  [█████░░░░░]  │ │ [████████████] │ ║
║ │   +3 today     │ │   +7 today     │ │   +5 today     │ │    ↑ +6 pts    │ ║
║ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ ║
║ ┌───────────────────────────────────────┐ ┌──────────────────────────────┐  ║
║ │         RECENT FINDINGS FEED          │ │       QUICK COMMANDS         │  ║
║ │  09:14  ● new subject linked          │ │  [A] Add subject             │  ║
║ │  08:52  ✓ finding confirmed           │ │  [F] Log finding             │  ║
║ │  08:31  ⚠ exposure score raised       │ │  [C] Map connection          │  ║
║ │  07:44  → discovery path completed    │ │  [S] Start sweep             │  ║
║ │  07:12  ● connection established      │ │  [R] Generate report         │  ║
║ │                                       │ │  [X] Export case             │  ║
║ │  [M] more...                          │ │  [Q] Quit  [/] Search        │  ║
║ └───────────────────────────────────────┘ └──────────────────────────────┘  ║
║ ┌──────────────────────────────────────────────────────────────────────────┐ ║
║ │  SWEEP PROGRESS: [██████████████████████░░░░░] 86%  Phase: DEEP SWEEP   │ ║
║ │  Next: Map associate network  |  ETA: 2h                                │ ║
║ └──────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Widget Specs

| Widget              | Position    | Data source        | Refresh         |
| ------------------- | ----------- | ------------------ | --------------- |
| Header bar          | Row 1       | Case metadata      | on change       |
| Subjects counter    | TL quadrant | subject registry   | on add          |
| Findings counter    | TL quadrant | findings log       | on add          |
| Connections counter | TL quadrant | connection map     | on add          |
| Exposure gauge      | TL quadrant | scoring engine     | on score update |
| Feed                | BL panel    | event log (last 5) | live            |
| Commands            | BR panel    | static             | —               |
| Sweep bar           | Bottom row  | discovery paths    | on milestone    |

---

## Exposure Gauge Thresholds

| Score  | Label    | Visual                   |
| ------ | -------- | ------------------------ |
| 0–24   | MINIMAL  | `[░░░░░░░░░░░░░░░░░░░░]` |
| 25–49  | LOW      | `[████░░░░░░░░░░░░░░░░]` |
| 50–69  | MODERATE | `[██████████░░░░░░░░░░]` |
| 70–84  | HIGH     | `[████████████████░░░░]` |
| 85–100 | CRITICAL | `[████████████████████]` |

---

## Feed Event Types

| Glyph | Type          | Trigger                             |
| ----- | ------------- | ----------------------------------- |
| ●     | subject event | new subject added, subject merged   |
| ✓     | verification  | finding confirmed, subject verified |
| ⚠     | exposure      | score change ≥ 5 pts                |
| →     | discovery     | discovery path completed            |
| ✗     | dead end      | path returned null result           |

---

## Compact Mode (40-col)

```
┌──────────────────────────────────────┐
│ CASE [ALPHA]              09:14      │
├──────────────────────────────────────┤
│ Subjects: 12   Findings: 28          │
│ Connections: 41  Exposure: HIGH(74)  │
├──────────────────────────────────────┤
│ ● subject linked        09:14        │
│ ✓ finding confirmed     08:52        │
│ ⚠ exposure raised       08:31        │
├──────────────────────────────────────┤
│ Sweep: [███████████████░░] 86%       │
└──────────────────────────────────────┘
```

---

_See also: [`output/visuals/render-engine.md`](./render-engine.md)_
