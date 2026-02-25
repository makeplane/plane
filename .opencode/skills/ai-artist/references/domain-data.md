# Data & Analysis Patterns

## Structured Extraction
```
Extract from text:
<text>[content]</text>

Return JSON:
{
  "field1": "value or null",
  "field2": ["array"]
}

Rules:
- Exact matches only
- Confidence score if uncertain
- null for missing
```

## Document Analysis
```
Analyze [document type]:
1. Summary (2-3 sentences)
2. Key entities (people, orgs, dates)
3. Main topics (ranked)
4. Sentiment: positive/neutral/negative
5. Action items
```

## Comparison
```
Compare [A] and [B]:
| Criterion | A | B |
|-----------|---|---|
| [Factor 1] | | |
| [Factor 2] | | |

Recommendation: [choice] for [use case]
```

## Problem Solving
```
Problem: [description]

Analyze:
1. Root cause (5 whys)
2. Contributing factors
3. Options (pros/cons)
4. Recommendation
5. Implementation steps
6. Risk mitigation
```

## Data Transformation
```
Transform data:
- Input format: [CSV/JSON/etc]
- Output format: [target]
- Rules: [mapping logic]
- Validation: [constraints]

Handle: missing values, type mismatches.
```

## Summarization
```
Summarize [content]:
- Length: [sentences/words]
- Focus: [key themes]
- Audience: [technical/general]
- Preserve: [critical details]
```
