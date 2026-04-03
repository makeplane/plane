# Eval Infrastructure Guide

Quantitative skill evaluation using parallel testing, grading, and human-in-the-loop feedback.

## Overview

Eval infrastructure tests skills via:
1. **Trigger accuracy** — Does skill activate on correct queries?
2. **Output quality** — Do outputs meet assertions?
3. **Performance comparison** — With-skill vs baseline metrics

## Workspace Structure

```
<skill-name>-workspace/
├── iteration-1/
│   ├── eval-0-descriptive-name/
│   │   ├── with_skill/outputs/
│   │   ├── without_skill/outputs/
│   │   └── eval_metadata.json
│   ├── eval-1-another-test/
│   ├── benchmark.json
│   ├── benchmark.md
│   └── timing.json
├── iteration-2/
└── feedback.json
```

## Step-by-Step Evaluation

### 1. Create Test Cases

Write `evals/evals.json`:
```json
{
  "skill_name": "my-skill",
  "evals": [
    {
      "id": 0,
      "prompt": "User task description",
      "expected_output": "What correct output looks like",
      "files": [],
      "assertions": [
        {"id": "a-1", "text": "Output is valid JSON"},
        {"id": "a-2", "text": "All input rows present in output"}
      ]
    }
  ]
}
```

### 2. Spawn Parallel Runs (CRITICAL)

**MUST** spawn with-skill AND baseline runs simultaneously in same turn.
- Sequential spawning = unfair timing comparison
- Capture timing data from subagent notifications immediately (only opportunity)
- Draft assertions while runs execute

### 3. Grade Outputs

Use grader agent template (`agents/grader.md`):
- Evaluates outputs against assertions
- Returns pass/fail with evidence for each assertion
- Output: `grading.json`

### 4. Aggregate Results

Run `scripts/aggregate_benchmark.py`:
- Consolidates multiple run results
- Calculates mean, stddev, min, max per metric
- Generates `benchmark.json` + `benchmark.md`

### 5. Launch Viewer

Run `scripts/generate_review.py`:
- Interactive HTML with two tabs:
  - **Outputs** — qualitative review, feedback textbox, prev/next
  - **Benchmark** — quantitative metrics, analyst observations
- Auto-saves feedback to `feedback.json`

### 6. Iterate

Read `feedback.json`, generalize from patterns:
- Don't overfit to test examples
- Keep prompts lean — remove ineffective instructions
- Scale test set to 5-10 cases for production skills

## Assertion Design

**Good (objective, discriminating):**
- "Output is valid JSON"
- "All input rows present in output"
- "Execution completes in <5 seconds"

**Bad (subjective, non-discriminating):**
- "Output is well-written" (subjective)
- "Skill executes" (passes with or without skill)
- "Output file exists" (too vague)

## Performance Metrics

| Metric | Description |
|--------|-------------|
| pass_rate | % of assertions passing (0.0-1.0) |
| tokens_used | Total input+output tokens |
| execution_time_ms | Wall-clock duration |
| tool_calls | Number of tool invocations |
| files_created | Output file count |

**Expected improvements:**
- Code generation: +40-70% pass rate, -20-30% tokens
- Data processing: +50-80% pass rate, -30-50% time
- Analysis: +30-50% pass rate

## Environment Adaptations

### Claude Code (Full)
- Spawn parallel with+without runs
- Full benchmarking + viewer
- Description optimization available

### Claude.ai (No subagents)
- Run tests sequentially
- Skip baseline runs
- Skip quantitative benchmarking

### Cowork (No browser)
- Use `--static <output_path>` for standalone HTML
- Download feedback.json from viewer
