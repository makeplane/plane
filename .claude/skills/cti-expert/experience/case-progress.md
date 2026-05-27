# Case Progress

Phase-based tracking for active cases. Shows what's complete, what's running, what's next.

---

## Case Phases

Every case moves through four phases. Progress is tracked per phase.

| Phase      | Description                                | Typical Duration |
| ---------- | ------------------------------------------ | ---------------- |
| Intake     | Scope definition, target validation        | 1–3 min          |
| Collection | Data gathering from all sources            | 2–30 min         |
| Analysis   | Cross-reference, pattern matching, scoring | 1–10 min         |
| Reporting  | Output generation, export                  | 1–5 min          |

---

## Progress Display Formats

### Standard (Practitioner default)

```
Case: example.com sweep
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Intake        Domain validated, scope: standard
⏳ Collection   [████████░░░░░░░░░░░░] 40%
  ✓ WHOIS · DNS · IP lookup
  ⏳ Subdomain scan (4 of 12 sources)
○ Analysis
○ Reporting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Items found: 31  |  Est. remaining: ~2 min
```

### Compact (Specialist)

```
[4/12 src] Collection 40% | 31 items | ~2m left
```

### Verbose (Novice)

```
I'm working on example.com.

So far I've searched 4 websites and found 31 items.
I'm now checking subdomains (sections of the website).

This should take about 2 more minutes.
```

---

## Time Estimates

| Progress      | Display Style | Example                 |
| ------------- | ------------- | ----------------------- |
| Under 30%     | Range         | "3–8 minutes remaining" |
| 30–70%        | Estimate      | "About 4 minutes left"  |
| Over 70%      | Countdown     | "50 seconds remaining"  |
| Unknown scope | Indefinite    | "Working…"              |

Time estimates are recalculated every 10 seconds using elapsed rate. Final 10% pads by 20% for slower completion tasks.

---

## Source Tracking

```
Collection sources:
  ✓ DNS records        (1,240 entries)
  ✓ WHOIS history      (registered 2010)
  ✓ IP geolocation     (AWS us-east-1)
  ⏳ Subdomain scan    (searching…)
  ○ Technology detect  (queued)
  ○ Exposure check     (queued)

Sources: 3 of 6  |  Findings: 42
```

---

## Phase Control

```
/pause              — suspend collection, save state
/resume             — continue from saved state
/skip-phase         — skip current phase (with confirmation)
/background         — push to background, free console
/foreground [id]    — bring background case forward
/cancel             — abort with partial-results offer
```

### Skip Confirmation

```
Skip Collection phase?

Skipping means:
  • Subdomain findings will be incomplete
  • Source coverage drops from 12 to 4
  • Phase can be re-run later: /phase collection

Type YES to skip, NO to continue.
```

### Cancel Confirmation

```
Cancel case?

Progress so far:
  • 3 phases partially complete
  • 12 findings collected

Options:
  save    — keep partial results
  discard — remove all findings
  back    — cancel the cancel
```

---

## Background Cases

```
/status

Active Cases:
  [1] example.com sweep     [████████░░] 80%  ~1 min
  [2] "Jane Smith" lookup   [████░░░░░░] 40%  ~6 min

Recent (last hour):
  ✓ Photo check     10:15
  ✓ WHOIS lookup    10:08
  ✓ Social sweep     9:45

System: All sources online  |  Avg response: 1.2s
/foreground 1 | /cancel 2 | /results 1
```

---

## Activity Proof

During long operations, the system emits periodic proof-of-life signals:

```
Still collecting… +3 items in last 10 seconds
Still collecting… checked 200 additional records
Still collecting… now scanning api.example.com
```

Signals emit every 15 seconds when no other output is produced.

---

## Progress Timing Rules

| Operation Duration | Display               |
| ------------------ | --------------------- |
| < 2 seconds        | No indicator          |
| 2–10 seconds       | Spinner only          |
| 10–60 seconds      | Bar + phase name      |
| 60s–5 min          | Full phase breakdown  |
| > 5 min            | Background mode offer |

Update frequency: every second under 10s, every 5s up to 60s, every 10s beyond.

---

## Case Completion

```
Novice:      "Done! I found 23 items for you."
Practitioner: "✓ Complete: 23 findings  2m 34s"
Specialist:   "✓ 23 | 2:34 | /view /export"
```

Auto-advance to results after 2 seconds unless `--no-advance` flag is set.

---

## Related Files

- `experience/skill-tiers.md` — tier controls display format
- `experience/guidance-system.md` — recovery during stalled phases
- `engine/collection-engine.md` — source orchestration logic
