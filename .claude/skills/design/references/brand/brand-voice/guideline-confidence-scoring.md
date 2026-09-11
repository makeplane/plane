# Confidence Scoring Methodology

How to assign and interpret confidence scores for generated brand guidelines.

## Scoring Levels

### High Confidence
The guideline section is well-supported and actionable.

**Criteria (must meet at least 3):**
- 3+ corroborating sources
- Explicit guidance found in at least one AUTHORITATIVE source
- Consistent across document and conversation analysis
- Specific, actionable instructions (not just vague principles)
- No unresolved conflicts

**Example:** Voice attribute "Confident but not arrogant" appears in the official style guide, is demonstrated in email templates, and matches patterns in top performer calls.

### Medium Confidence
The section is reasonable but could benefit from more data or team confirmation.

**Criteria (must meet at least 2):**
- 1-2 corroborating sources
- Inferred from patterns rather than explicit instruction
- Minor inconsistencies resolved via recency or authority
- Actionable but some interpretation was required
- May have one unresolved conflict

**Example:** Tone for social media inferred from email templates and one Slack thread, but no official social media guidelines exist.

### Low Confidence
The section is a best-effort recommendation. Team review strongly recommended.

**Criteria (must meet at least 2):**
- Single source only
- Primarily inferred from indirect evidence
- Significant interpretation required
- Unresolved conflicts between sources
- Limited specificity

**Example:** Competitive positioning derived from a single sales call where a competitor was discussed, with no supporting documentation.

## Section-Level Scoring Guide

### Voice Attributes
- **High**: Attributes appear in official brand guide AND are demonstrated in templates or calls
- **Medium**: Attributes appear in one document type only, or are inferred from multiple conversations
- **Low**: Attributes inferred from a single source or from indirect evidence

### Messaging Framework
- **High**: Value propositions documented in official materials AND used consistently in sales conversations
- **Medium**: Documented but not observed in practice, OR observed but not documented
- **Low**: Extracted from a single pitch deck or single call

### Tone Matrix
- **High**: Explicit tone guidance exists for the context AND matches observed behavior
- **Medium**: Tone inferred from 3+ examples of content in that context
- **Low**: Tone inferred from 1-2 examples, or extrapolated from similar contexts

### Terminology
- **High**: Terms explicitly listed in a style guide or glossary
- **Medium**: Terms consistently used in templates and calls (pattern-based)
- **Low**: Terms observed in a single document or inferred from brand personality

### Language Patterns (from transcripts)
- **High**: Pattern observed in 5+ calls across multiple speakers
- **Medium**: Pattern observed in 3-4 calls or from a single top performer
- **Low**: Pattern observed in 1-2 calls only

### Transcript-Primary Scenarios

When guidelines are generated primarily from conversational sources (no AUTHORITATIVE documents available):
- Voice Attributes derived from 5+ transcripts = **Medium** (not Low)
- Messaging Framework from consistent patterns across 5+ calls = **Medium**
- Language Patterns weight increases from 10% to 20% in aggregate calculation (subtract 10% from Voice Attributes)

Note this in the guideline metadata: "Guidelines generated primarily from conversational sources — team review recommended to formalize."

## Aggregate Confidence

Calculate overall guideline confidence as the weighted average of section scores:

| Section | Weight |
|---------|--------|
| Voice Attributes | 30% |
| Messaging Framework | 25% |
| Tone Matrix | 20% |
| Terminology | 15% |
| Language Patterns | 10% |

Convert scores: High = 1.0, Medium = 0.6, Low = 0.3

**Example:**
- Voice Attributes: High (1.0 x 0.30 = 0.30)
- Messaging: Medium (0.6 x 0.25 = 0.15)
- Tone: Medium (0.6 x 0.20 = 0.12)
- Terminology: High (1.0 x 0.15 = 0.15)
- Language: Low (0.3 x 0.10 = 0.03)
- **Overall: 0.75 = Medium-High confidence**

**Aggregate score thresholds:**
- 0.85–1.0 = High
- 0.60–0.84 = Medium
- Below 0.60 = Low

## Presentation

Present confidence alongside each section header:

```markdown
## Voice Attributes (Confidence: High)
[content]

## Tone Matrix (Confidence: Medium)
[content — note: no official social media guidelines found, tone inferred from email patterns]
```

For Medium and Low confidence sections, include a brief note explaining why confidence is limited and what would raise it.

## Relationship to Open Questions

Low confidence sections should generate corresponding open questions:

- **Low confidence + conflict** = High Priority open question
- **Low confidence + gap** = Medium Priority open question
- **Medium confidence + minor inconsistency** = Low Priority open question

Every open question includes a recommendation that, if confirmed, would raise the section's confidence score.
