# Project Development

Design and build LLM-powered projects from ideation to deployment.

## Task-Model Fit

**LLM-Suited**: Synthesis, subjective judgment, NL output, error-tolerant batches
**LLM-Unsuited**: Precise computation, real-time, perfect accuracy, deterministic output

## Manual Prototype First

Test one example with target model before automation.

## Pipeline Architecture

```
acquire → prepare → process → parse → render
 (fetch)  (prompt)   (LLM)   (extract) (output)
```

Stages 1,2,4,5: Deterministic, cheap | Stage 3: Non-deterministic, expensive

## File System as State

```
data/{id}/
├── raw.json      # acquire done
├── prompt.md     # prepare done
├── response.md   # process done
└── parsed.json   # parse done
```

```python
def get_stage(id):
    if exists(f"{id}/parsed.json"): return "render"
    if exists(f"{id}/response.md"): return "parse"
    # ... check backwards
```

**Benefits**: Idempotent, resumable, debuggable

## Structured Output

```markdown
## SUMMARY
[Overview]

## KEY_FINDINGS
- Finding 1

## SCORE
[1-5]
```

```python
def parse(response):
    return {
        "summary": extract_section(response, "SUMMARY"),
        "findings": extract_list(response, "KEY_FINDINGS"),
        "score": extract_int(response, "SCORE")
    }
```

## Cost Estimation

```python
def estimate(items, tokens_per, price_per_1k):
    return len(items) * tokens_per / 1000 * price_per_1k * 1.1  # 10% buffer
# 1000 items × 2000 tokens × $0.01/1k = $22
```

## Case Studies

**Karpathy HN**: 930 items, $58, 1hr, 15 workers
**Vercel d0**: 17→2 tools, 80%→100% success, 3.5x faster

## Single vs Multi-Agent

| Factor | Single | Multi |
|--------|--------|-------|
| Context | Fits window | Exceeds |
| Tasks | Sequential | Parallel |
| Tokens | Limited | 15x OK |

## Guidelines

1. Validate manually before automating
2. Use 5-stage pipeline
3. Track state via files
4. Design structured output
5. Estimate costs first
6. Start single, add multi when needed

## Related

- [Context Optimization](./context-optimization.md)
- [Multi-Agent Patterns](./multi-agent-patterns.md)
