# Eval JSON Schemas

All JSON schemas used by the eval infrastructure.

## evals.json — Test Cases

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 0,
      "prompt": "User task prompt",
      "expected_output": "Description of correct output",
      "files": [],
      "assertions": [
        {"id": "assertion-1", "text": "Output contains valid JSON"},
        {"id": "assertion-2", "text": "All rows processed correctly"}
      ]
    }
  ]
}
```

## eval_metadata.json — Per-Test Metadata

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name",
  "prompt": "Task prompt",
  "assertions": [
    {"id": "assertion-1", "text": "Output contains valid JSON"}
  ]
}
```

## grading.json — Grader Output

```json
{
  "expectations": [
    {"text": "Output contains valid JSON", "passed": true, "evidence": "File output.json parsed successfully"}
  ],
  "pass_rate": 0.75,
  "metrics": {
    "execution_time_ms": 12500,
    "tokens_used": 8400,
    "tool_calls": 5
  },
  "claims": ["Additional observations beyond assertions"],
  "critique": "Evaluation feedback on criteria quality"
}
```

**Field names are exact** — viewer depends on: `text` (not name), `passed` (not met), `evidence` (not details).

## benchmark.json — Aggregated Stats

```json
{
  "metadata": {"skill_name": "example", "timestamp": "..."},
  "runs": [{"eval_id": 0, "config": "with_skill", "pass_rate": 0.85}],
  "summaries": {
    "with_skill": {"mean_pass_rate": 0.85, "stddev": 0.05},
    "without_skill": {"mean_pass_rate": 0.45, "stddev": 0.10}
  },
  "deltas": {"pass_rate_delta": 0.40, "tokens_delta": -2000}
}
```

## timing.json — Duration & Tokens

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

Must capture immediately from subagent notifications — data not persisted elsewhere.

## feedback.json — Human Reviews

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "User comment", "timestamp": "..."}
  ],
  "status": "complete"
}
```

## comparison.json — Blind A/B Results

```json
{
  "winner": "output_a",
  "reasoning": "Detailed explanation with citations",
  "scores": {"output_a": 8, "output_b": 6},
  "content_score": {"correctness": 4, "completeness": 5},
  "structure_score": {"organization": 4, "formatting": 3}
}
```

## history.json — Optimization Iterations

```json
{
  "versions": [
    {
      "description": "Current description text",
      "pass_rate": 0.85,
      "precision": 0.90,
      "recall": 0.80,
      "iteration": 1
    }
  ]
}
```
