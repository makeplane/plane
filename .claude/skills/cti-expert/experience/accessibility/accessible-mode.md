# Accessible Mode

Display and interaction settings for users who need adjusted output format, reduced cognitive load, or assistive technology support.

---

## Activation

```
/accessible            — open settings menu
/accessible [option]   — toggle specific setting directly
/accessible reset      — restore defaults
```

---

## Settings Overview

| Setting          | Command                                     | Default |
| ---------------- | ------------------------------------------- | ------- |
| Text size        | `/accessible text [normal\|large\|xl]`      | normal  |
| Contrast         | `/accessible contrast [normal\|high\|dark]` | normal  |
| Screen reader    | `/accessible reader [on\|off]`              | off     |
| Simple commands  | `/accessible commands [on\|off]`            | off     |
| Natural language | `/accessible natural [on\|off]`             | off     |
| Confirm actions  | `/accessible confirm [on\|off]`             | on      |
| Step narration   | `/accessible narrate [on\|off]`             | off     |

---

## Text Size

### Large Text

```
/accessible text large

Changes:
  Base size:       18pt  (default: 12pt)
  Headings:        24pt  (default: 16pt)
  Line spacing:    1.8   (default: 1.4)
  Max line width:  60 chars
  Paragraph gaps:  1.5em
```

**Comparison:**

Normal:

```
Found 5 emails for example.com: admin@example.com, support@example.com
```

Large:

```
━━━━━━━━━━━━━━━━━━
RESULTS

Found 5 emails for
example.com:

1. admin@example.com
2. support@example.com
━━━━━━━━━━━━━━━━━━
```

---

## Contrast Modes

### High Contrast

```
/accessible contrast high

Background: #FFFFFF
Text:       #000000
Accents:    #0000FF
Warnings:   #CC0000
Success:    #006600
```

All indicators use **both** symbol and color:

```
✓ Complete   (symbol + green text)
✗ Error      (symbol + red text)
⚠ Caution    (symbol + amber text)
— Info        (symbol + blue text)
```

### Dark Mode High Contrast

```
/accessible contrast dark

Background: #000000
Text:       #FFFFFF
Accents:    #FFFF00
Warnings:   #FF4444
Success:    #44FF44
```

---

## Screen Reader Mode

```
/accessible reader on
```

Optimizes all output for assistive technology:

**Standard output:**

```
Found 5. admin@example.com support@example.com …
```

**Screen reader output:**

```
Search complete. Found 5 email addresses.
First: admin at example dot com.
Second: support at example dot com.
Say NEXT to hear more, or STOP to end.
```

### Navigation Keys

| Key | Action               |
| --- | -------------------- |
| R   | Read current section |
| N   | Next item            |
| P   | Previous item        |
| S   | Stop reading         |
| H   | Hear available help  |
| 1–9 | Jump to section      |

### Audio Descriptions for Visuals

```
Timeline showing:
  2018 — entry-level role
  2020 — promotion
  2022 — moved to current employer
  Trajectory: consistent upward progression.
```

---

## Simplified Commands

```
/accessible commands on
```

Enables short-form aliases for all core commands:

| Full Command     | Alias              | Action                   |
| ---------------- | ------------------ | ------------------------ |
| `/sweep`         | `/look-up`         | Search for a subject     |
| `/dork`          | `/search`          | Run a web query          |
| `/flow`          | `/guide-me`        | Start a guided flow      |
| `/chrono`        | `/history`         | Show timeline            |
| `/verify`        | `/check`           | Verify a finding         |
| `/define`        | `/what-is`         | Look up a term           |
| `/status`        | `/whats-happening` | Show case status         |
| `/cancel`        | `/stop`            | Cancel current operation |
| `/case-template` | `/guide`           | Run a case template      |

### Natural Language Input

```
/accessible natural on
```

Accepts conversational phrasing:

```
"I want to check if this photo is real"
  → activates: /flow image-check

"Look up acme.com for me"
  → activates: /sweep acme.com

"What does metadata mean?"
  → activates: /define metadata

"Stop what you're doing"
  → activates: /cancel
```

---

## Step Narration

```
/accessible narrate on
```

Adds explicit framing around each operation step.

**Without narration:**

```
/sweep example.com
Found 5 emails.
```

**With narration:**

```
Starting lookup for example.com.

Step 1 — Checking the domain registration…
Step 2 — Looking for contact information…
Step 3 — Searching for email addresses…

Done. I found 5 emails.

Here's what was discovered:

  1. admin@example.com
     This is likely the primary administrative contact.

  2. support@example.com
     This is the customer-facing support address.

Would you like to look at any of these, or move on to something else?
```

---

## Error Handling in Accessible Mode

Errors are rephrased to avoid technical jargon and always include a recovery path.

**Standard:**

```
ERR_UNKNOWN_COMMAND: rekcon
```

**Accessible:**

```
That command wasn't recognized.

You typed: "rekcon"

I think you meant: /sweep

To search for information on a domain or person, try:
  /sweep example.com

Or type /guide-me for step-by-step help.
```

---

## Print-Friendly Output

```
/print             — full case formatted for printing
/print --summary   — key findings on one page
```

Print output uses:

- Black text on white background
- No decorative elements
- Page breaks between sections
- Date and page number in footer

---

## Accessibility Settings Menu

```
/accessible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCESSIBLE MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEXT SIZE
  ( ) Normal  (•) Large  ( ) Extra Large

CONTRAST
  ( ) Normal  (•) High   ( ) Dark

READING ASSISTANCE
  [✓] Explain terms on first use
  [✓] Show step narration
  [ ] Screen reader mode

COMMANDS
  [ ] Simple command aliases
  [ ] Natural language input
  [✓] Confirm before important actions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Save]  [Reset to Defaults]
```

Settings persist across sessions and are stored in the user profile.

---

## Related Files

- `experience/accessibility/glossary.md` — term definitions
- `experience/skill-tiers.md` — Novice tier enables accessible defaults
- `experience/guidance-system.md` — error recovery messaging
