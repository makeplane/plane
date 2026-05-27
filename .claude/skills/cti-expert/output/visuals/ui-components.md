# UI Components v1.0

Reusable UI elements for Free OSINT Expert text-based interface.

---

## 1. Header/Banner Styles

### Main Application Banner

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████  ███████ ███████ ███████ ████████  ██████  ██   ██ ████████       ║
║    ██    ██ ██      ██      ██         ██    ██    ██ ██   ██    ██          ║
║    ██    ██ █████   ███████ █████      ██    ██    ██ ███████    ██          ║
║    ██    ██ ██           ██ ██         ██    ██    ██ ██   ██    ██          ║
║     ██████  ███████ ███████ ███████    ██     ██████  ██   ██    ██          ║
║                                                                               ║
║                    I N V E S T I G A T O R    v 2 . 0                        ║
║                                                                               ║
║              Open Source Intelligence Framework for Researchers              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Compact Header

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  OSINT INVESTIGATOR v1.0  │  Case: PHOENIX  │  Status: ACTIVE  │  14:32:18 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Minimal Header

```
[OSINT-v2] PHOENIX | ACTIVE | 14:32
```

### Section Banners

**Main Section**:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           INVESTIGATION DASHBOARD                             ║
╠═══════════════════════════════════════════════════════════════════════════════╣
```

**Sub-Section**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIPS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
```

**Sub-Sub-Section**:

```
─── CONTACT INFORMATION ─────────────────────────────────────────────────────
```

### Decorative Dividers

**Heavy Divider**:

```
═══════════════════════════════════════════════════════════════════════════════
```

**Medium Divider**:

```
───────────────────────────────────────────────────────────────────────────────
```

**Light Divider**:

```
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
```

**Dotted Divider**:

```
···············································································
```

### Alert Banners

**Critical**:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  CRITICAL ALERT  ⚠️                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Immediate action required - Risk level escalated to CRITICAL                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Warning**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  WARNING: 3 entities have low confidence scores and need verification   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Info**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ℹ️  INFO: Daily automated scan completed successfully                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Success**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✓ SUCCESS: Report generated and saved to exports/                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Section Dividers

### Standard Dividers

**Full Width**:

```
───────────────────────────────────────────────────────────────────────────────
```

**Double Line**:

```
═══════════════════════════════════════════════════════════════════════════════
```

**With Title**:

```
─────────────────── SECTION TITLE ────────────────────────────────────────────
```

**Centered Title**:

```
────────────┬ SECTION TITLE ┬──────────────────────────────────────────────────
```

### Decorative Dividers

**Box Style**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SECTION HEADER                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Shadow Style**:

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

**Gradient Style**:

```
███████████████████████████████████████████████████████████████████████████████
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Content Separators

**Between Items**:

```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Sub-item**:

```
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

**Related Items**:

```
  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
```

---

## 3. Status Indicators

### Completion Status

| Status      | Symbol | Meaning                    |
| ----------- | ------ | -------------------------- |
| Complete    | ✓      | Task finished successfully |
| Verified    | ✓      | Information confirmed      |
| In Progress | ⏳     | Currently processing       |
| Pending     | ○      | Waiting to start           |
| Blocked     | ✗      | Cannot proceed             |
| Skipped     | ⊘      | Intentionally bypassed     |
| Unknown     | ?      | Status unclear             |

### Example Usage

```
TASK LIST:
  ✓ Initial reconnaissance completed
  ✓ Entity enumeration finished
  ⏳ Deep dive analysis in progress (75%)
  ○ Network mapping pending
  ○ Report generation pending
  ✗ Archive access blocked (credentials expired)
```

### Data Quality Indicators

| Quality   | Symbol | Meaning                     |
| --------- | ------ | --------------------------- |
| Excellent | ★★★★★  | Multiple verified sources   |
| Good      | ★★★★☆  | Primary source confirmed    |
| Fair      | ★★★☆☆  | Single source, no conflicts |
| Poor      | ★★☆☆☆  | Conflicting information     |
| Unknown   | ☆☆☆☆☆  | No assessment possible      |

### Example Usage

```
SOURCE QUALITY:
  ★★★★★ LinkedIn Profile (verified)
  ★★★★☆ Twitter/X Account (active)
  ★★★☆☆ Personal Blog (single source)
  ★★☆☆☆ Anonymous Forum (unverified)
  ☆☆☆☆☆ Rumored Connection (hearsay)
```

### Activity Indicators

| Activity   | Symbol | Meaning                |
| ---------- | ------ | ---------------------- |
| Added      | ●      | New item created       |
| Updated    | ▲      | Existing item modified |
| Removed    | ▼      | Item deleted           |
| Connected  | →      | Link established       |
| Discovered | ⚡     | Found during scan      |
| Verified   | ✓      | Confirmed authentic    |
| Failed     | ✗      | Error occurred         |

### Example Usage

```
RECENT ACTIVITY:
  14:32 ● New entity discovered: "Acme Corp"
  14:15 ▲ Entity updated: "John Doe" - email added
  13:58 ✓ Source verified: LinkedIn profile confirmed
  11:47 ⚡ Automated scan completed
  10:23 → Connection found: John Doe → Acme Corp
  09:15 ✗ Source failed: Website timeout
```

---

## 4. Confidence Level Displays

### Percentage Bars

**Standard Bar (20 chars)**:

```
Confidence: 85% [████████████████████░░░░░░░░░░░░░░░░]
```

**Compact Bar (10 chars)**:

```
Confidence: 85% [████████░░]
```

**Block Bar**:

```
Confidence: 85% [████████████████████░░░░░░░░░░░░░░░░]
                  ████ = Verified  ░░░░ = Uncertain
```

**Gradient Bar**:

```
Confidence: 85% [████████████████████░░░░░░░░░░░░░░░░]
                High ████████████████████ Medium ░░░░░░ Low
```

### Confidence Tiers

**Tier Display**:

```
CONFIDENCE ASSESSMENT:
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Tier         │ Range      │ Indicator    │ Count │ Distribution    │
  ├─────────────────────────────────────────────────────────────────────┤
  │ Certain      │ 95-100%    │ ████████████ │   12  │ ████████████░░░ │
  │ High         │ 80-94%     │ ██████████   │    8  │ ████████░░░░░░░ │
  │ Moderate     │ 60-79%     │ ████████     │    7  │ ███████░░░░░░░░ │
  │ Fair         │ 40-59%     │ ██████       │    6  │ ██████░░░░░░░░░ │
  │ Low          │ 20-39%     │ ████         │    4  │ ████░░░░░░░░░░░ │
  │ Speculative  │ 0-19%      │ ██           │    3  │ ███░░░░░░░░░░░░ │
  │ Unknown      │ N/A        │ ??           │   10  │ ██████████░░░░░ │
  └─────────────────────────────────────────────────────────────────────┘
```

### Source Confidence Matrix

```
CONFIDENCE BY SOURCE TYPE:
  ┌────────────────────┬───────────┬─────────────────────────────────────────┐
  │ Source Type        │ Avg Conf  │ Distribution                            │
  ├────────────────────┼───────────┼─────────────────────────────────────────┤
  │ Official Records   │ 92%       │ [████████████████████████████████░░░░] │
  │ Social Media       │ 78%       │ [██████████████████████████░░░░░░░░░░] │
  │ Professional Sites │ 85%       │ [██████████████████████████████░░░░░░] │
  │ News Articles      │ 72%       │ [████████████████████████░░░░░░░░░░░░] │
  │ Forums/Comments    │ 45%       │ [██████████████░░░░░░░░░░░░░░░░░░░░░░] │
  │ Derived/Inferred   │ 35%       │ [██████████░░░░░░░░░░░░░░░░░░░░░░░░░░] │
  └────────────────────┴───────────┴─────────────────────────────────────────┘
```

### Confidence Alerts

```
LOW CONFIDENCE ALERTS:
  ⚠️  3 entities below 40% confidence require verification
  ⚠️  5 entities derived from single sources
  ⚠️  2 entities with conflicting information across sources

RECOMMENDATIONS:
  → Cross-reference "John Doe" with additional sources
  → Verify "Acme Corp" registration documents
  → Re-assess relationship between entities 7 and 12
```

---

## 5. Risk Level Indicators

### Risk Score Display

**Numerical with Bar**:

```
RISK SCORE: 73/100 [████████████████████████████░░░░░░░░]
                   ▲
                   HIGH RISK
```

**With Trend**:

```
RISK SCORE: 73/100 [████████████████████████████░░░░░░░░] ↑ +12
                                    ▲
                              ↑ from 61 (Day 18)
```

**Historical**:

```
RISK HISTORY (30 days):
  Day  1-10: ████████░░░░░░░░░░░░░░ 35  LOW
  Day 11-15: ████████████░░░░░░░░░░ 45  MEDIUM
  Day 16-20: ██████████████████░░░░ 65  MEDIUM
  Day 21-25: ██████████████████████ 73  HIGH
  Day 26-30: ██████████████████████ 78  HIGH
```

### Risk Level Badges

**Standard Badges**:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  RISK LEVELS                                                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ CRITICAL  ████████████████████████████████████████████████████████ │     ║
║  │           Score: 90-100 | Immediate action required                │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ HIGH      ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░ │     ║
║  │           Score: 70-89 | Address within 24 hours                   │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ MEDIUM    ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ║
║  │           Score: 40-69 | Monitor and plan mitigation               │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ LOW       ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ║
║  │           Score: 20-39 | Acceptable, document only                 │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ MINIMAL   ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ║
║  │           Score: 0-19 | No action required                         │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Risk Distribution

```
RISK DISTRIBUTION:
  CRITICAL (90-100)  ████████████████████████████████  3 findings
  HIGH (70-89)       ████████████████████████          1 finding
  MEDIUM (40-69)     ████████████████████████████████  4 findings
  LOW (20-39)        ████████████████████████████████  5 findings
  MINIMAL (0-19)     ██████████████████████            2 findings
```

### Risk Factor Breakdown

```
RISK FACTORS:
  ┌───────────────────────┬─────────┬──────────────────────────────────────────┐
  │ Factor                │ Score   │ Details                                  │
  ├───────────────────────┼─────────┼──────────────────────────────────────────┤
  │ Financial Fraud Ind.  │ 25/25   │ Multiple suspicious transactions         │
  │ Identity Exposure     │ 20/25   │ PII found on 3 public sources            │
  │ Network Compromise    │ 15/25   │ Suspicious IP activity detected          │
  │ Reputational Risk     │ 8/15    │ Negative mentions in news                │
  │ Physical Security     │ 5/10    │ Location data exposed                    │
  ├───────────────────────┼─────────┼──────────────────────────────────────────┤
  │ TOTAL                 │ 73/100  │ HIGH RISK                                │
  └───────────────────────┴─────────┴──────────────────────────────────────────┘
```

---

## 6. Color Code Mappings

### ANSI Color Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TERMINAL COLOR CODES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TEXT COLORS:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Default    │ \033[0m  │ Reset to default                          │    │
│  │ Black      │ \033[30m │ Dark text, low emphasis                   │    │
│  │ Red        │ \033[31m │ Errors, critical alerts, high risk        │    │
│  │ Green      │ \033[32m │ Success, verified, low risk               │    │
│  │ Yellow     │ \033[33m │ Warnings, medium risk, attention          │    │
│  │ Blue       │ \033[34m │ Links, references, info headers           │    │
│  │ Magenta    │ \033[35m │ Special elements, highlights              │    │
│  │ Cyan       │ \033[36m │ Neutral info, timestamps                  │    │
│  │ White      │ \033[37m │ High emphasis, headers                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  BRIGHT VARIANTS (add 60):                                                   │
│  │ Bright Red     │ \033[91m │ Critical emphasis                        │    │
│  │ Bright Green   │ \033[92m │ Strong success indicator                 │    │
│  │ Bright Yellow  │ \033[93m │ Urgent warnings                          │    │
│  │ Bright Blue    │ \033[94m │ Active links                             │    │
│  │ Bright Magenta │ \033[95m │ Special calls-to-action                  │    │
│  │ Bright Cyan    │ \033[96m │ Active timestamps                        │    │
│  │ Bright White   │ \033[97m │ Primary headers                          │    │
│                                                                              │
│  BACKGROUND COLORS (add 10):                                                 │
│  │ Red BG     │ \033[41m │ Critical highlight background            │    │
│  │ Green BG   │ \033[42m │ Success highlight background             │    │
│  │ Yellow BG  │ \033[43m │ Warning highlight background             │    │
│  │ Blue BG    │ \033[44m │ Info section background                  │    │
│  │ Magenta BG │ \033[45m │ Special section background               │    │
│  │ Cyan BG    │ \033[46m │ Neutral section background               │    │
│  │ White BG   │ \033[47m │ High contrast background                 │    │
│                                                                              │
│  TEXT STYLES:                                                                │
│  │ Bold       │ \033[1m  │ Headers, emphasis                          │    │
│  │ Dim        │ \033[2m  │ Secondary text, metadata                   │    │
│  │ Underline  │ \033[4m  │ Links, interactive elements                │    │
│  │ Blink      │ \033[5m  │ Urgent alerts (use sparingly)              │    │
│  │ Reverse    │ \033[7m  │ Selection highlight                        │    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Semantic Color Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SEMANTIC COLOR USAGE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RISK LEVELS:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ CRITICAL │ \033[91m (Bright Red)  │ Text + background for alerts        │    │
│  │ HIGH     │ \033[31m (Red)         │ Text, borders                       │    │
│  │ MEDIUM   │ \033[33m (Yellow)      │ Text, warnings                      │    │
│  │ LOW      │ \033[32m (Green)       │ Text, confirmations                 │    │
│  │ MINIMAL  │ \033[36m (Cyan)        │ Text, neutral info                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  CONFIDENCE LEVELS:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 95-100%  │ \033[32m (Green)       │ High confidence indicators          │    │
│  │ 80-94%   │ \033[92m (Bright Green)│ Good confidence                     │    │
│  │ 60-79%   │ \033[36m (Cyan)        │ Moderate confidence                 │    │
│  │ 40-59%   │ \033[33m (Yellow)      │ Fair confidence                     │    │
│  │ <40%     │ \033[31m (Red)         │ Low confidence                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  UI ELEMENTS:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Headers      │ \033[1m\033[97m (Bold White)   │ Main section titles                 │    │
│  │ Subheaders   │ \033[1m\033[37m (Bold Default) │ Subsection titles                   │    │
│  │ Links        │ \033[4m\033[34m (Underline Blue)│ Clickable references               │    │
│  │ Timestamps   │ \033[2m\033[36m (Dim Cyan)     │ Time information                    │    │
│  │ Metadata     │ \033[2m (Dim)          │ Secondary information               │    │
│  │ Success      │ \033[32m (Green)        │ Success messages                    │    │
│  │ Error        │ \033[31m (Red)          │ Error messages                      │    │
│  │ Warning      │ \033[33m (Yellow)       │ Warning messages                    │    │
│  │ Info         │ \033[34m (Blue)         │ Informational messages              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  INTERACTIVE STATES:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Active/Hover  │ \033[7m (Reverse)      │ Selected or hovered item           │    │
│  │ Focused       │ \033[1m\033[7m (Bold+Reverse) │ Currently focused element          │    │
│  │ Disabled      │ \033[2m (Dim)          │ Unavailable option                  │    │
│  │ Pending       │ \033[33m (Yellow)       │ In-progress operation               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Color Combination Examples

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLOR USAGE EXAMPLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RISK ALERT (Critical):                                                      │
│  \033[1m\033[91m⚠️  CRITICAL RISK DETECTED\033[0m                                                  │
│  \033[91mEntity "John Doe" has been flagged for financial fraud.\033[0m                      │
│                                                                              │
│  CONFIRMATION (Success):                                                     │
│  \033[1m\033[32m✓ VERIFICATION COMPLETE\033[0m                                                     │
│  \033[32mSource has been confirmed through 3 corroborating sources.\033[0m                  │
│                                                                              │
│  WARNING:                                                                    │
│  \033[1m\033[33m⚠️  CONFIDENCE GAP\033[0m                                                          │
│  \033[33m3 entities require additional verification.\033[0m                                 │
│                                                                              │
│  INFORMATION:                                                                │
│  \033[1m\033[34mℹ️  SYSTEM NOTICE\033[0m                                                           │
│  \033[34mDaily automated scan will run at 02:00 UTC.\033[0m                                │
│                                                                              │
│  HEADER:                                                                     │
│  \033[1m\033[97m═══════════════════════════════════════════════════════════════════════\033[0m    │
│  \033[1m\033[97m  ENTITY RELATIONSHIP ANALYSIS                                          \033[0m    │
│  \033[1m\033[97m═══════════════════════════════════════════════════════════════════════\033[0m    │
│                                                                              │
│  METRIC:                                                                     │
│  \033[1mConfidence:\033[0m \033[32m85%\033[0m \033[32m[████████████████████░░░░░░░░]\033[0m                           │
│                                                                              │
│  TIMESTAMP:                                                                  │
│  \033[2m\033[36mLast updated: 2024-01-27 14:32:18 UTC\033[0m                                      │
│                                                                              │
│  LINK:                                                                       │
│  \033[4m\033[34mView full report: https://example.com/intel-report/12345\033[0m                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Monochrome Fallback

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONOCHROME MODE (No Color Support)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  When color is not available, use these patterns:                            │
│                                                                              │
│  RISK INDICATORS:                                                            │
│    CRITICAL: !!! TEXT !!!  or  *** TEXT ***                                 │
│    HIGH:     ! TEXT !      or  ** TEXT **                                   │
│    MEDIUM:   ! TEXT        or  * TEXT                                       │
│    LOW:      ( TEXT )      or  - TEXT -                                     │
│                                                                              │
│  CONFIDENCE INDICATORS:                                                      │
│    HIGH:     [YES]  or  [+++++]                                             │
│    MEDIUM:   [MAYBE]  or  [+++]                                              │
│    LOW:      [WEAK]  or  [+]                                                │
│    UNKNOWN:  [???]  or  [--]                                                │
│                                                                              │
│  STATUS INDICATORS:                                                          │
│    COMPLETE: [OK]  or  [X]                                                  │
│    PENDING:  [..]  or  [ ]                                                  │
│    FAILED:   [ERR]  or  [!]                                                 │
│                                                                              │
│  EMPHASIS:                                                                   │
│    HEADERS:    === TEXT ===  or  *** TEXT ***                               │
│    IMPORTANT:  >> TEXT <<                                                   │
│    NOTE:       (i) TEXT  or  -> TEXT                                        │
│                                                                              │
│  EXAMPLE:                                                                    │
│    !!! CRITICAL RISK DETECTED !!!                                           │
│    Entity "John Doe" flagged for financial fraud                            │
│    Confidence: [YES] [+++++] 85%                                            │
│    Status: [OK] Verified                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Component Library

### Buttons

**Standard Button**:

```
┌──────────────┐
│  [ACTION]    │
└──────────────┘
```

**Primary Button**:

```
╔══════════════╗
║  [ACTION]    ║
╚══════════════╝
```

**Disabled Button**:

```
┌──────────────┐
│  [disabled]  │
└──────────────┘
```

**Button Group**:

```
┌──────────┐┌──────────┐┌──────────┐
│  [Save]  ││ [Cancel] ││ [Delete] │
└──────────┘└──────────┘└──────────┘
```

### Input Fields

**Text Input**:

```
Label: [________________________]
```

**Text Input with Value**:

```
Label: [John Doe________________]
```

**Number Input**:

```
Confidence: [85%____] [+][-]
```

**Dropdown**:

```
Entity Type: [Person ▼]
```

**Multi-line Text**:

```
Description:
[________________________________]
[________________________________]
[________________________________]
```

### Cards

**Info Card**:

```
┌────────────────────────────────┐
│  Title                         │
│  ────────────────────────────  │
│  Content line 1                │
│  Content line 2                │
│  Content line 3                │
│                    [Action]    │
└────────────────────────────────┘
```

**Metric Card**:

```
┌──────────────────┐
│    ENTITIES      │
│                  │
│       47         │
│   [████████]     │
│   +5 today       │
└──────────────────┘
```

**Alert Card**:

```
╔════════════════════════════════╗
║  ⚠️  WARNING                   ║
╠════════════════════════════════╣
║  Something requires your       ║
║  attention. Please review.     ║
║                    [Dismiss]   ║
╚════════════════════════════════╝
```

### Lists

**Bullet List**:

```
  • Item one
  • Item two
  • Item three
```

**Numbered List**:

```
  1. First item
  2. Second item
  3. Third item
```

**Definition List**:

```
  Term 1
    → Definition of term 1

  Term 2
    → Definition of term 2
```

**Table List**:

```
  ┌──────────┬──────────┬──────────┐
  │ Column 1 │ Column 2 │ Column 3 │
  ├──────────┼──────────┼──────────┤
  │ Data 1   │ Data 2   │ Data 3   │
  │ Data 4   │ Data 5   │ Data 6   │
  └──────────┴──────────┴──────────┘
```

### Navigation

**Breadcrumbs**:

```
Home > Cases > PHOENIX > Entities > John Doe
```

**Pagination**:

```
[< Previous] Page 3 of 12 [Next >]
```

**Tabs**:

```
[Overview] [Entities] [Sources] [Timeline] [Reports] [Settings]
          ═══════════════════════════════════════════════════
          Active tab content here
```

**Vertical Menu**:

```
  ┌─────────────────────┐
  │ > Dashboard         │
  │   Entities          │
  │   Sources           │
  │   Findings          │
  │   Reports           │
  │   Settings          │
  └─────────────────────┘
```

---

_Version: 1.0 | Components: 50+ | Last Updated: 2026-02-27_
