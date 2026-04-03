# LLM Prompting Reference

## Prompt Architecture

### System Prompt Structure
```
You are [ROLE] with expertise in [DOMAIN].

## Context
[Background, constraints, tone]

## Instructions
[Step-by-step task breakdown]

## Output Format
[Exact structure with example]

## Constraints
- [Hard limits]
- [Guardrails]
```

### User Prompt Structure
```xml
<context>[Background information]</context>
<task>[Specific action required]</task>
<format>[Output structure]</format>
<constraints>[Additional limits]</constraints>
```

## Reasoning Techniques

### Chain of Thought (CoT)
| Variant | Trigger | Best For |
|---------|---------|----------|
| Zero-shot | "Think step by step" | Quick reasoning tasks |
| Few-shot | 2-3 reasoning examples | Complex multi-step |
| Auto-CoT | "Let's approach systematically" | General reasoning |

### Tree of Thoughts (ToT)
```
Explore 3 approaches to [problem]:
For each: 1) Method 2) Pros/cons 3) Success probability
Evaluate branches, select best path.
```

### Self-Consistency
Run same prompt 3-5x with temp=0.7, take majority answer. Best for: math, logic, factual.

### ReAct Pattern
```
Thought: [Current reasoning]
Action: [Tool/step to take]
Observation: [Result]
...repeat...
Final Answer: [Conclusion]
```

### Least-to-Most
```
Break [complex task] into subproblems.
Solve easiest first, build up.
```

## Instruction Optimization

### Self-Refine Pattern
```
1. Generate initial response
2. Critique: "What's wrong with this?"
3. Refine: "Fix identified issues"
4. Repeat until satisfactory
```

### Role Optimization
- **Expert persona**: "As a senior [role] with 20 years..."
- **Constraint persona**: "You only respond with..."
- **Teaching persona**: "Explain as if to a..."

### Task Decomposition
```
<subtasks>
1. [First step - output X]
2. [Second step - using X, output Y]
3. [Final step - using Y, output Z]
</subtasks>
```

## Output Control

### JSON Enforcement
```
Respond in valid JSON only:
{"field": "type", "required": true}
No markdown, no explanation, just JSON.
```

### Length Control
| Goal | Phrase |
|------|--------|
| Brief | "In 2-3 sentences" |
| Detailed | "Comprehensive analysis in 500 words" |
| Structured | "5 bullet points, max 20 words each" |

### Hallucination Reduction
- "Only use information from provided context"
- "If unsure, say 'I don't know'"
- "Cite sources for each claim"
- "Confidence: high/medium/low for each point"

## Model-Specific Tips

### Claude
- XML tags: `<thinking>`, `<answer>`, `<context>`
- Extended thinking: "Think deeply before responding"
- Prefill: Start assistant response to guide format

### GPT-4
- JSON mode: `response_format: {"type": "json_object"}`
- Function calling for structured output
- System message for persistent instructions

### Gemini
- Multimodal: Image + text in same prompt
- Grounding: Enable Google Search for facts
- Safety settings: Adjust thresholds

## Context Engineering

### RAG Prompt Pattern
```
<retrieved_context>
[Document chunks with sources]
</retrieved_context>

Answer based ONLY on context above.
If not in context, say "Not found in documents."
```

### Window Optimization
- Front-load critical info (primacy effect)
- Repeat key constraints at end (recency effect)
- Chunk long documents with summaries

## Few-Shot Examples

### Structure
```
Example 1:
Input: [representative input]
Output: [ideal output]

Example 2:
Input: [edge case]
Output: [handling]

Now apply to:
Input: [actual task]
```

### Selection Criteria
- Diverse examples > similar examples
- Include edge cases
- Match complexity of target task
- 2-5 examples optimal (diminishing returns beyond)
