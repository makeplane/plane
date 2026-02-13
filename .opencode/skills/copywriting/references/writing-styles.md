# Writing Styles Guide

Define, extract, and apply consistent writing voices across content.

## Style Dimensions Framework

Every writing style can be mapped across these dimensions:

| Dimension | Spectrum | Description |
|-----------|----------|-------------|
| Tone | Formal ↔ Casual | How official or relaxed |
| Pace | Fast ↔ Measured | Sentence length, rhythm |
| Vocabulary | Simple ↔ Technical | Word complexity level |
| Emotion | Reserved ↔ Expressive | Emotional intensity |
| Humor | Serious ↔ Playful | Use of wit, jokes |
| Perspective | Third-person ↔ First-person | Pronoun usage |
| Authority | Peer ↔ Expert | Positioning relative to reader |

## Pre-Built Style Definitions

### Casual Conversational

**Best for:** Indie hackers, startups, personal brands

**Dimensions:**
- Tone: Casual
- Pace: Fast
- Vocabulary: Simple
- Emotion: Expressive
- Humor: Playful
- Perspective: First-person

**Characteristics:**
- Contractions ("you're", "isn't")
- Short sentences, fragments OK
- Personal pronouns ("I", "you")
- Informal transitions ("So here's the thing...")
- Emoji usage acceptable

**Example:**
> "Look, I get it. Marketing feels overwhelming. But here's what I learned after burning through $10k on ads that didn't work—it doesn't have to be complicated."

---

### Professional Authoritative

**Best for:** Enterprise SaaS, B2B, consulting

**Dimensions:**
- Tone: Formal
- Pace: Measured
- Vocabulary: Technical
- Emotion: Reserved
- Humor: Serious
- Perspective: Third-person / We

**Characteristics:**
- Complete sentences
- Industry terminology
- Data-driven claims
- Formal transitions
- No emoji

**Example:**
> "Organizations that implement structured content strategies outperform competitors by 3.5x in lead generation. This comprehensive guide examines the frameworks that drive measurable results."

---

### Edgy Provocative

**Best for:** Disruptor brands, hot takes, thought leadership

**Dimensions:**
- Tone: Casual-to-Formal (varies)
- Pace: Fast
- Vocabulary: Simple with punchy terms
- Emotion: Expressive
- Humor: Playful but sharp
- Perspective: First-person

**Characteristics:**
- Bold claims
- Contrarian positions
- Short, punchy sentences
- Pattern interrupts
- Strategic use of questions

**Example:**
> "Everything you know about content marketing is wrong. Seriously. The 'best practices' everyone follows? They're why you're invisible. Let me show you what actually works."

---

### Luxe Minimalist

**Best for:** Premium products, luxury brands, high-end services

**Dimensions:**
- Tone: Formal
- Pace: Measured, spacious
- Vocabulary: Elegant, selective
- Emotion: Reserved but refined
- Humor: Subtle or absent
- Perspective: Second-person

**Characteristics:**
- Fewer words, more impact
- White space between ideas
- Refined vocabulary
- Understated confidence
- No hard sell

**Example:**
> "Exceptional results require exceptional attention. We work with founders who understand that true growth cannot be rushed. By invitation only."

---

### Warm Supportive

**Best for:** Wellness, coaching, education, community

**Dimensions:**
- Tone: Casual
- Pace: Measured
- Vocabulary: Simple
- Emotion: Expressive
- Humor: Gentle
- Perspective: First-person plural ("we")

**Characteristics:**
- Empathetic language
- Inclusive pronouns
- Encouraging tone
- Validation before advice
- Gentle CTAs

**Example:**
> "It's okay if you're feeling stuck. We've all been there. The journey isn't always linear, and that's completely normal. Let's explore some gentle ways to move forward together."

---

### Technical Educator

**Best for:** Developer content, technical tutorials, documentation

**Dimensions:**
- Tone: Neutral-to-Casual
- Pace: Measured
- Vocabulary: Technical but explained
- Emotion: Reserved
- Humor: Dry/nerdy
- Perspective: Second-person

**Characteristics:**
- Code examples
- Step-by-step structure
- Precise terminology
- Assumes competence
- Occasional dry humor

**Example:**
> "Here's the thing about async/await—it's not magic, it's just syntactic sugar over Promises. Let's break down what's actually happening under the hood, and why your code isn't working the way you expect."

## Style Extraction Prompt

Use this prompt to analyze existing content and extract its style:

```
Analyze this content and extract the writing style:

[PASTE CONTENT]

Provide:
1. Tone (formal ↔ casual):
2. Pace (fast ↔ measured):
3. Vocabulary (simple ↔ technical):
4. Emotion (reserved ↔ expressive):
5. Humor (serious ↔ playful):
6. Perspective (pronoun usage):
7. Sentence structure patterns:
8. Signature phrases/patterns:
9. What to DO in this style:
10. What to AVOID in this style:
```

## Style Application Prompt

Use this prompt to write in a specific style:

```
Write [CONTENT TYPE] in the following style:

**Tone:** [casual/formal]
**Pace:** [fast/measured]
**Vocabulary:** [simple/technical]
**Emotion:** [reserved/expressive]
**Perspective:** [first/second/third person]

**DO:**
- [specific patterns to use]

**DON'T:**
- [patterns to avoid]

Topic: [TOPIC]
```

## Writing Style File Format

Store custom styles in `assets/writing-styles/`:

```yaml
# assets/writing-styles/indie-hacker.yaml
name: Indie Hacker
description: Authentic, scrappy, behind-the-scenes vibe

dimensions:
  tone: casual
  pace: fast
  vocabulary: simple
  emotion: expressive
  humor: self-deprecating
  perspective: first-person

patterns:
  - Short sentences
  - Fragments for emphasis
  - Numbers and specifics
  - "Here's what I learned"
  - Behind-the-scenes honesty

avoid:
  - Corporate speak
  - Passive voice
  - Vague claims
  - Salesy language

examples:
  - "Shipped v1 in 48 hours. It was broken. People loved it anyway."
  - "Revenue last month: $4,293. Not life-changing, but real."
```

## Integration

Use with:
- `brand-guidelines` skill - Align with brand voice
- `/youtube:blog` command - Apply style to video-to-article
- `/content:good` command - Style-aware content generation
