# Flow: Image Check

Guided 5-step flow for assessing image authenticity and tracing origin.

---

## Flow Metadata

| Field      | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| Activation | `/flow image-check`                                            |
| Skill tier | Novice                                                         |
| Duration   | 5–10 min                                                       |
| Output     | Authenticity verdict with confidence level                     |
| Use cases  | Catfish detection, finding validation, AI-image identification |

---

## Step 1: Image Context

### 1a — Claimed Context

```
Image Check  |  Step 1 of 5

What claim is attached to this image?

Examples:
  "Sent by someone on a dating app"
  "Profile photo for a new business contact"
  "Evidence of an event"
  "Model portfolio"

Describe what you've been told about it: _
```

System logs all claims as verification targets.

### 1b — Initial User Observations

```
Before analysis — does anything seem off?

  • Does the person look unnaturally flawless?
  • Inconsistent lighting or shadows?
  • Background looks artificial or blurred unusually?
  • Repeated patterns in the background?
  • Anything else that caught your eye?

Your observations (or "nothing unusual"): _
```

User observations are weighted in the final verdict.

### 1c — Image Source

```
Where did this image come from?

  1. Sent to me directly (app, email, message)
  2. Found on a website or search result
  3. Submitted as documentation or finding
  4. Source unknown

(1–4):
```

| Source        | Risk Baseline     | Analysis Priority            |
| ------------- | ----------------- | ---------------------------- |
| Sent directly | Higher            | Stock/catfish check first    |
| Found online  | Medium            | Original source verification |
| Documentation | Context-dependent | Tampering detection          |
| Unknown       | Higher            | All checks equally           |

---

## Step 2: Technical Inspection

System extracts and evaluates embedded metadata and compression artifacts.

```
Step 2 of 5 — Technical Inspection
[████████░░] 80%

Extracting: camera data · timestamps · GPS · software history
```

### Results

**Metadata present:**

```
Camera:         iPhone 15 Pro
Captured:       2026-01-15  14:34
Location:       Miami Beach, FL  (GPS embedded)
Dimensions:     3024 × 4032 px
Edit software:  None detected  ✓
```

**Metadata absent:**

```
No metadata found.

Common causes:
  • Shared via messaging app (strips on send)
  • Posted to social media (auto-stripped)
  • Screenshot of another image
  • Intentional removal

Neutral finding — absent metadata is normal for shared images.
```

**Suspicious metadata:**

```
⚠ Metadata anomalies:

  Edit software: Photoshop 2025 (modified 3 days ago)
  Original capture date: 2021  (claimed "recent")
  Compression artifacts: multiple layers detected

Implications: Photo was edited and timeline may be fabricated.
Ask for an unedited original.
```

Claim consistency check:

```
Does this metadata match what you were told? (yes / no / unsure)
```

---

## Step 3: Reverse Image Trace

System queries Google Images, TinEye, Bing Visual, and Yandex.

```
Step 3 of 5 — Reverse Image Trace
[██████░░░░] 60%

Querying: Google · TinEye · Bing · Yandex
```

**No matches:**

```
Result: Image appears original.

Searched across 4 engines — 0 matches found.

  ✓ Not a stock photo
  ✓ Not circulating across profiles

Note: Uniqueness confirms the photo is not widely reused.
      It does not confirm the sender is the person in the photo.
```

**Matches found:**

```
⚠ Image found in 12 locations.

Matches:
  [1] Shutterstock — stock photo listing
  [2] Facebook — Maria G., 2018
  [3] Instagram — @maria_model
  [4] Dating app — "Sarah, 28"
  [5] Dating app — "Jessica, 32"
  [6–12] Additional sites

!! This is a stock photo used across multiple fake profiles.
The person sending it is almost certainly not the subject shown.

Recommended action: End communication. Report account.
```

**Stolen from real person:**

```
⚠ Photo belongs to another individual.

Found on:
  LinkedIn  — John Smith, real estate professional
  Facebook  — John Smith (public profile)
  Dating app — "Mike, 35, entrepreneur"

The original subject is real, but the person contacting you
is presenting as them fraudulently.
```

---

## Step 4: Authenticity Analysis

Detection of AI generation, composite editing, and filter manipulation.

```
Step 4 of 5 — Authenticity Analysis
[████████░░] 80%

Checking: AI generation · manipulation · lighting physics · compression
```

**AI-generated:**

```
!! AI generation detected.

Indicators:
  • Unnatural skin texture regularity
  • Hair detail inconsistencies near edges
  • Background tiling artifacts
  • Ear geometry anomalies

Confidence: 78% AI-generated.

The person in this photo may not exist.
Request: Video call, or a photo with a specific unusual action.
```

**Editing detected:**

```
⚠ Manipulation detected.

Found:
  • Clone stamp artifacts (left side, background)
  • Subject edge blending inconsistent with background
  • Color temperature mismatch between subject and scene

The background may have been substituted.
Ask for the unedited original.
```

**Appears authentic:**

```
✓ No manipulation detected.

  Natural texture and lighting  ✓
  Shadow physics consistent     ✓
  Compression pattern normal    ✓
  EXIF matches image content    ✓
```

**Verification suggestion:**

```
To confirm live authenticity, ask for a photo with a specific
unusual pose — something AI cannot generate from stock:

  "Can you hold a pen on your nose?"
  "Show me today's date written on your hand"
  "Give a thumbs-up with the left hand"

Request a video call for high-stakes situations.
```

---

## Step 5: Verdict

```
Step 5 of 5 — Image Check Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE CHECK RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Verdict Categories

| Verdict            | Confidence      | Meaning                                       |
| ------------------ | --------------- | --------------------------------------------- |
| LIKELY AUTHENTIC   | High (85%+)     | No issues found, metadata consistent          |
| REVIEW RECOMMENDED | Medium (50–84%) | Partial concerns, further verification needed |
| LIKELY FRAUDULENT  | High (85%+)     | Stock photo or multiple fake profile use      |
| AI-GENERATED       | High (80%+)     | Subject may not exist                         |

### Likely Authentic

```
Verdict: LIKELY AUTHENTIC  ✓
Confidence: 85%

  ✓ Metadata consistent with claims
  ✓ No matches elsewhere
  ✓ No manipulation detected

For high-stakes situations: still request a video call.
```

### Likely Fraudulent

```
Verdict: LIKELY FRAUDULENT  !!
Confidence: 92%

  !! Stock photo confirmed
  !! Used across multiple fake profiles
  !! Metadata conflicts with stated timeline

Action:
  1. Stop all communication
  2. Report the account to the platform
  3. Block the contact
  4. If money was requested, report to authorities
```

---

## Related Files

- `techniques/image-analysis.md` — manual image verification methods
- `analysis/ai-detection.md` — AI-generated image signals
- `experience/guidance-system.md` — risk alerts during the flow
