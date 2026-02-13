# Advanced Prompt Engineering

## Prompt Optimization

### DSPy Framework
Automatic prompt optimization through:
1. Define task with input/output signatures
2. Compile with optimizer (BootstrapFewShot, MIPRO)
3. Model learns optimal prompting strategy
4. Export optimized prompts for production

### Meta-Prompting
```
You are a prompt engineer. Create 5 variations for [task]:
1. Direct instruction approach
2. Role-based approach
3. Few-shot example approach
4. Chain of thought approach
5. Constraint-focused approach

Evaluate each, select best.
```

### Self-Refinement Loop
```
Generate: [Initial response]
Critique: "What's wrong? Score 1-10."
Refine: "Fix issues, improve score."
Repeat until score ≥ 8.
```

## Prompt Chaining

### Sequential Chain
```
Chain 1: [Input] → Extract key points
Chain 2: Key points → Create outline
Chain 3: Outline → Write draft
Chain 4: Draft → Edit and polish
```

### Parallel Chain
Run independent subtasks simultaneously, merge results.

### Conditional Chain
```
If [condition A]: Execute prompt variant 1
If [condition B]: Execute prompt variant 2
Else: Execute default prompt
```

### Loop Pattern
```
While not [success condition]:
    Generate attempt
    Evaluate against criteria
    If pass: break
    Else: refine with feedback
```

## Evaluation Methods

### LLM-as-Judge
```
Rate this [output] on:
1. Accuracy (1-10)
2. Completeness (1-10)
3. Clarity (1-10)
4. Relevance (1-10)

Provide reasoning for each score.
Final: Pass/Fail threshold = 7 average.
```

### A/B Testing Protocol
1. Single variable per test
2. 20+ samples minimum
3. Score on defined criteria
4. Statistical significance check (p < 0.05)
5. Document winner, roll out

### Regression Testing
- Maintain test set of critical examples
- Run before deploying prompt changes
- Compare scores to baseline
- Block deployment if regression detected

## Agent Prompting

### Tool Use Design
```
You have access to these tools:
- search(query): Search the web
- calculate(expression): Math operations
- code(language, code): Execute code

To use: <tool_name>arguments</tool_name>
Wait for result before continuing.
```

### Planning Prompt
```
Task: [Complex goal]

Before acting:
1. Break into subtasks
2. Identify dependencies
3. Plan execution order
4. Note potential blockers

Then execute step by step.
```

### Reflection Pattern
```
After each step:
- What worked?
- What didn't?
- Adjust approach for next step.
```

## Parameter Tuning

| Parameter | Low | High | Use Case |
|-----------|-----|------|----------|
| Temperature | 0.0-0.3 | 0.7-1.0 | Factual vs Creative |
| Top-P | 0.8 | 0.95 | Focused vs Diverse |
| Top-K | 10 | 100 | Conservative vs Exploratory |

**Rule**: Tune temperature first. Only adjust top-p if needed. Never both at once.

## Safety Patterns

### Output Filtering
```
Before responding, check:
- No PII exposure
- No harmful content
- No policy violations
- Aligned with guidelines

If any fail: "I can't help with that."
```

### Jailbreak Prevention
- Clear system boundaries upfront
- Repeat constraints at end
- "Ignore previous" pattern detection
- Role-lock: "You are ONLY [role], never anything else"

### Confidence Calibration
```
For each claim, provide:
- Confidence: High/Medium/Low
- Source: [citation if available]
- Caveat: [limitations]
```

## Production Patterns

### Version Control
- Git for prompt files
- Semantic versioning (1.0.0, 1.1.0)
- Changelog per version
- Rollback capability

### Caching
- Cache common queries
- TTL based on content freshness
- Invalidate on prompt update

### Fallbacks
```
Try: Primary prompt
If fail: Simplified fallback prompt
If still fail: Human escalation
Log all failures for analysis.
```

### Cost Optimization
- Shorter prompts = fewer tokens
- Remove redundant examples
- Use smaller model for simple tasks
- Batch similar requests
