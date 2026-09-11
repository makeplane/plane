# Source Ranking Algorithm

How to categorize, rank, and prioritize discovered brand sources.

## Source Categories

### AUTHORITATIVE
Official, approved brand documentation. Highest trust level.

**Signals:**
- Published style guides or brand books
- C-suite or marketing leadership authored/approved
- Lives in an official "Brand" folder or Confluence space
- Has version numbers or approval dates
- Referenced by other documents as "the brand guide"

**Examples:**
- "Acme Corp Brand Guidelines v3.2.pdf"
- "Official Style Guide" page in Confluence Marketing space
- Brand book in Google Drive with company-wide sharing
- Brand book in Box with company-wide sharing
- Official Style Guide in SharePoint Marketing site

**Trust weight:** 1.0 (baseline)

### OPERATIONAL
Brand applied in practice. Shows how guidelines manifest in real content.

**Signals:**
- Templates actively used by teams
- Sales playbooks with messaging guidance
- Email sequences with established tone
- Presentation templates with brand messaging

**Examples:**
- "Cold Email Templates Q4 2024"
- "Enterprise Sales Playbook"
- "Customer Success Response Templates"
- Pitch deck templates in Google Slides
- Email templates in Outlook
- Sales playbook on SharePoint

**Trust weight:** 0.8

### CONVERSATIONAL
Implicit brand voice from actual communications.

**Signals:**
- Sales call transcripts (especially successful ones)
- Meeting notes with customer-facing language
- Internal discussions about positioning
- Slack threads discussing brand decisions

**Examples:**
- Gong recordings of top performer calls
- Meeting notes from brand strategy sessions
- Customer success call transcripts
- Slack #brand channel discussions about tone

**Trust weight:** 0.6 (valuable for patterns, not prescriptive)

### CONTEXTUAL
Background information that informs brand but doesn't define it directly.

**Signals:**
- Design files without explicit brand guidelines
- Competitor analysis documents
- Industry reports
- Product documentation

**Examples:**
- Figma component library (visual only)
- "Competitive Landscape Q3 2024"
- Product feature specifications

**Trust weight:** 0.3

### STALE
Outdated content superseded by newer versions.

**Signals:**
- Older version when a newer version exists
- Pre-rebrand materials after a rebrand
- Documents explicitly marked as deprecated
- Content more than 2 years old without updates

**Examples:**
- "Brand Guidelines v1.0" when v3.2 exists
- "2022 Style Guide" when "2024 Brand Update" exists
- Documents in an "Archive" or "Deprecated" folder

**Trust weight:** 0.1 (flag for review, do not rely on)

## Ranking Algorithm

Apply these five ranking factors in order of priority:

### 1. Recency (Weight: 30%)

More recent sources are more likely to reflect current brand voice.

- **Score 1.0**: Updated within last 6 months
- **Score 0.7**: Updated within last year
- **Score 0.4**: Updated within last 2 years
- **Score 0.1**: Older than 2 years

When two sources conflict, the more recent one wins unless the older source is explicitly marked as the "official" guide.

Always prefer the most recent version of any document. When multiple sources cover the same topic, weight the newest one heavily. Flag any non-AUTHORITATIVE source older than 12 months in the discovery report.

### Recency Cutoffs

In addition to soft recency scoring, apply hard cutoffs to prevent stale content from polluting discovery:

**AUTHORITATIVE sources**: No hard cutoff. Official brand guides remain valid regardless of age unless explicitly superseded by a newer version.

**OPERATIONAL, CONVERSATIONAL, CONTEXTUAL sources**: Exclude from deep fetch if older than 12 months, with one exception: if zero sources in a category fall within the 12-month window, include the single most recent source from that category and flag it as potentially stale.

**STALE sources**: Exclude entirely from deep fetch. Include in the discovery report for reference only.

These cutoffs apply at the deep-fetch stage (Phase 3). All sources are still collected during broad discovery (Phase 1) and triage (Phase 2) — the cutoffs filter what gets fully retrieved and analyzed.

### 2. Explicitness (Weight: 25%)

Sources that explicitly define brand voice outrank those that merely demonstrate it.

- **Score 1.0**: Explicit brand instructions ("Our voice is...")
- **Score 0.7**: Documented tone guidelines ("Emails should be...")
- **Score 0.4**: Implicit patterns in templates or examples
- **Score 0.2**: Inferred from conversational patterns

### 3. Authority (Weight: 20%)

Higher organizational authority indicates more trustworthy brand definitions.

- **Score 1.0**: Official brand team or C-suite authored
- **Score 0.7**: Marketing leadership authored
- **Score 0.4**: Team leads or senior ICs
- **Score 0.2**: Individual contributor or unknown author

### 4. Specificity (Weight: 15%)

Detailed, actionable guidance outranks vague principles.

- **Score 1.0**: Specific rules with examples ("Use 'platform' not 'tool'")
- **Score 0.7**: Detailed guidelines ("Tone should be warm but professional")
- **Score 0.4**: General principles ("Be authentic")
- **Score 0.2**: Abstract values only ("We believe in innovation")

### 5. Cross-Source Consistency (Weight: 10%)

Elements corroborated across multiple sources rank higher.

- **Score 1.0**: Appears in 3+ independent sources
- **Score 0.7**: Appears in 2 independent sources
- **Score 0.4**: Appears in 1 source only
- **Score 0.1**: Contradicted by another source

## Composite Score Calculation

```
final_score = (recency × 0.30) + (explicitness × 0.25) + (authority × 0.20)
            + (specificity × 0.15) + (consistency × 0.10)
```

Multiply by category trust weight:
```
ranked_score = final_score × category_trust_weight
```

### Example Scoring

**Source: "Brand Voice Guidelines v3.2" (Confluence, updated 3 months ago)**
- Recency: 1.0 (3 months old)
- Explicitness: 1.0 (explicit brand instructions)
- Authority: 1.0 (marketing VP authored)
- Specificity: 0.7 (good guidelines, some gaps)
- Consistency: 0.7 (corroborated by email templates)
- Category: AUTHORITATIVE (1.0)
- **Final: (1.0×0.30 + 1.0×0.25 + 1.0×0.20 + 0.7×0.15 + 0.7×0.10) × 1.0 = 0.925**

**Source: "Top Performer Call — Enterprise Close" (Gong, 2 months ago)**
- Recency: 1.0
- Explicitness: 0.2 (implicit patterns only)
- Authority: 0.4 (senior AE)
- Specificity: 0.7 (specific phrases used)
- Consistency: 0.4 (single source)
- Category: CONVERSATIONAL (0.6)
- **Final: (1.0×0.30 + 0.2×0.25 + 0.4×0.20 + 0.7×0.15 + 0.4×0.10) × 0.6 = 0.345**

## Adaptive Scoring: No Authoritative Sources

When discovery finds **zero AUTHORITATIVE sources**, the scoring algorithm adapts to reflect that conversational and operational sources are the primary brand evidence.

### Adjusted Trust Weights (No Authoritative Sources)

| Category | Default Weight | Adapted Weight | Rationale |
|----------|---------------|----------------|-----------|
| AUTHORITATIVE | 1.0 | 1.0 | (n/a — none found) |
| OPERATIONAL | 0.8 | 0.9 | Templates become primary explicit evidence |
| CONVERSATIONAL | 0.6 | 0.85 | Transcripts are the best signal for how the brand actually communicates |
| CONTEXTUAL | 0.3 | 0.4 | Design and competitive context more valuable without formal docs |
| STALE | 0.1 | 0.2 | Even old docs matter more when nothing current exists |

### Adjusted Explicitness Scoring (No Authoritative Sources)

When no authoritative sources exist, conversational patterns carry more prescriptive weight:

- **Score 0.2 → 0.5**: "Inferred from conversational patterns" — these ARE the brand evidence now
- **Score 0.4 → 0.6**: "Implicit patterns in templates or examples"
- Other explicitness scores unchanged

### Example: Transcript Scoring With Adaptation

**Source: "Top Performer Call — Enterprise Close" (Gong, 2 months ago)**
- Recency: 1.0
- Explicitness: 0.5 (adapted from 0.2 — patterns are primary evidence)
- Authority: 0.4 (senior AE)
- Specificity: 0.7 (specific phrases used)
- Consistency: 0.4 (single source)
- Category: CONVERSATIONAL (0.85 adapted)
- **Adapted score: (1.0×0.30 + 0.5×0.25 + 0.4×0.20 + 0.7×0.15 + 0.4×0.10) × 0.85 = 0.552**

This puts the transcript well above the 0.5 deep-fetch threshold, ensuring conversational sources meaningfully contribute to guideline generation.

### When to Apply

Apply adaptive scoring when:
- Phase 2 triage produces zero AUTHORITATIVE sources
- Flag in the discovery report: "No formal brand guidelines found — scoring adapted to weight conversational and operational sources higher"

## Triage Decision Criteria

### Include in Deep Fetch (Top 5-15 sources)
- Ranked score > 0.5
- All AUTHORITATIVE sources regardless of score
- At least one source per category if available (this overrides the score threshold)
- At least one source per platform if available

### Flag for Review
- Sources with conflicting information
- STALE sources that may still be referenced by teams
- Sources with high specificity but low authority

### Exclude
- Ranked score < 0.1
- Clearly irrelevant results (e.g., "brand" used in product name, not brand guidelines)
- Duplicate content already captured from another platform
