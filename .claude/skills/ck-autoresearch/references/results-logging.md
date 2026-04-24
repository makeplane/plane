# Results Logging

## TSV Format

One row per iteration. Tab-separated. Header row required.

```
iteration	commit	metric	delta	status	description
```

### Column Definitions

| Column | Type | Notes |
|--------|------|-------|
| iteration | integer | 0-indexed. 0 = baseline. |
| commit | string | Short SHA (7 chars) or `-` if discarded/crashed |
| metric | float | Measured value from verify command |
| delta | float | Signed change from previous best. Negative = improvement for "lower is better". `-` for baseline. |
| status | enum | See status values below |
| description | string | One sentence: what was attempted |

### Status Values

| Status | Meaning |
|--------|---------|
| `baseline` | Initial measurement before any changes |
| `keep` | Improvement passed guard, committed |
| `keep (reworked)` | Failed guard on first attempt, reworked, then passed |
| `discard` | No improvement or below min-delta threshold |
| `guard-failed` | Metric improved but guard command exited non-zero; reverted |
| `crash` | Verify command errored or timed out |
| `no-op` | Improvement below min-delta threshold (not a failure, just insufficient) |

### Example Log

```tsv
iteration	commit	metric	delta	status	description
0	a1b2c3d	842	-	baseline	Initial bundle size measurement
1	e4f5a6b	810	-32	keep	Tree-shake unused lodash imports
2	-	798	-44	discard	Remove dead CSS — metric improved but below min-delta
3	c7d8e9f	771	-71	keep	Replace moment.js with day.js
4	-	-	-	crash	Build script errored on dynamic import rewrite
5	1a2b3c4	751	-91	guard-failed	Inline critical CSS — bundle smaller but tests failed
6	5d6e7f8	758	-84	keep (reworked)	Inline critical CSS with fallback (guard-safe version)
7	9a0b1c2	741	-101	keep	Lazy-load admin panel chunk
```

---

## Progressive Summaries

### Every-5-Iteration Summary

Print after iterations 5, 10, 15, ...:

```
--- Progress @ iteration 5 ---
Best so far: 751 (baseline: 842, -10.8%)
Kept: 3  |  Discarded: 1  |  Crashed: 1  |  Guard-failed: 1
Top strategy: dependency replacement (moment→day.js: -71)
```

### Final Summary

Print at loop end (budget exhausted or goal reached):

```
--- Final Summary ---
Baseline → Final: 842 → 741  (-11.9%, -101 units)
Iterations: 7 total  |  Kept: 4  |  Discarded: 1  |  Crashed: 1  |  Guard-failed: 1
Best single iteration: #7 lazy-load admin chunk (-20)
Worst outcome: #4 crash (build script)
Key insight: Dependency replacement yielded most gains; CSS inlining required guard-safe rework
```
