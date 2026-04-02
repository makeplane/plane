# Guard Pattern & Noise-Aware Verification

## Guard Pattern (Regression Prevention)

The verify command measures improvement. The guard command confirms nothing else broke.

**Separation of concerns:**
- Verify = "did the target metric improve?"
- Guard = "did anything else break?"

### How It Works

1. Baseline run: guard command must exit 0 before loop starts (establishes clean baseline)
2. After verify succeeds (Phase 5.5), run guard command — BEFORE the keep/discard decision
3. If guard exits non-zero: trigger recovery flow

### Guard Recovery Flow

```
Guard fails →
  revert to previous commit →
  rework attempt 1 (different approach) →
    if guard fails again →
  rework attempt 2 (minimal change) →
    if guard fails again →
  discard (log status: guard-failed)
```

**Rule:** If guard cannot pass at baseline, fix it before starting the loop — never relax the guard.

**Rule:** Guard files are READ-ONLY. Never modify test files, spec files, or guard scripts as part of an optimization attempt.

**Rule:** Guard failure means the optimization is wrong, not that the guard is wrong.

### Common Guard Commands

| Stack | Guard Command | Notes |
|-------|--------------|-------|
| Node.js | `npm test` | Runs Jest/Vitest suite |
| Python | `pytest` | Full test suite |
| Go | `go test ./...` | All packages |
| Rust | `cargo test` | Unit + integration |
| TypeScript | `tsc --noEmit && npm test` | Type check then tests |
| Any | `npm run lint && npm test` | Lint + test combined |

### Guard Command Selection Heuristic

- If optimizing runtime code → guard = full test suite
- If optimizing build/bundle → guard = `tsc --noEmit` + smoke test
- If optimizing ML pipeline → guard = test suite + data schema validation
- Default when unsure → `npm test` / `pytest` / `go test ./...`

---

## Noise-Aware Verification

Noisy metrics produce false positives. A "5% improvement" that's really measurement variance leads to keeping bad changes.

### Noise Levels

| Level | Description | Strategy |
|-------|-------------|----------|
| Low | Deterministic output (LOC, type errors, lint count) | Single run, trust result |
| Medium | Slight variance (build time ±5%, unit test timing) | 2 runs, use worse result |
| High | High variance (API latency, benchmark, ML accuracy) | 3-5 runs, use median |

### Multi-Run Median (High Noise)

```
runs = []
repeat 3-5 times:
  result = run verify command
  runs.append(result)
metric = median(runs)
```

Use median, not mean — median is resistant to single outlier spikes.

### Min-Delta Threshold

Only keep an attempt if improvement exceeds the threshold:

```
improvement = previous_best - new_metric   # for "lower is better"
if improvement < min_delta:
  status = no-op   # do not keep, but not a failure
```

**Default thresholds by noise level:**
- Low noise: 0 (any improvement counts)
- Medium noise: 1-2% of baseline
- High noise: 3-5% of baseline

### Confirmation Run

For high-stakes metrics (final 3 iterations, or improvement > 20%), re-verify before committing:

```
candidate looks good →
  run verify one more time →
  compare to initial measurement this iteration →
  if within 2% → confirm keep
  if outside 2% → treat as medium noise, average the two
```

### Environment Pinning (User Responsibility)

ck:loop cannot control the environment. User must ensure:
- Fixed random seeds for ML workloads
- Warmed caches (or cold caches) consistently
- No background processes competing for CPU
- Same input data across runs

### Config Examples

**Low noise (lint errors):**
```
verify: eslint src --format json | jq '[.[] | .errorCount] | add'
noise: low
min_delta: 0
guard: npm test
```

**Medium noise (build time):**
```
verify: { start=$(date +%s%N); npm run build; echo $(( ($(date +%s%N) - start) / 1000000 )); }
noise: medium
runs: 2
min_delta: 200   # ms
guard: tsc --noEmit
```

**High noise (API latency):**
```
verify: wrk -t2 -c10 -d10s http://localhost:3000/api/health | grep 'Latency' | awk '{print $2}' | sed 's/ms//'
noise: high
runs: 5
min_delta: 5   # ms
guard: npm test
```
