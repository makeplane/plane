# ck:predict — Chain modes

Chain modes extend the base 5-persona debate with a follow-on workflow that runs once the verdict is produced. Each mode is documented here and invoked via `--chain <mode>` on the predict invocation.

These chain modes absorb upstream `/autoresearch:reason` and `/autoresearch:probe` (see `uditgoenka/autoresearch`, MIT) — workflows that always chain off `/autoresearch:predict` and never run independently. Local design folds them into ck:predict rather than shipping standalone skills.

---

## `--chain reason` — Subjective Refinement Loop

Use when the predict verdict is **CAUTION** with subjective trade-offs (architecture polish, design coherence, argument quality) — places where there isn't a single mechanically-correct answer, only a "best so far" worth iterating on.

### Protocol

```
1. Generate candidate
   - Take the predict Recommendations as the seed proposal
   - Materialize ONE concrete refined version

2. Critique adversarially
   - Spawn 2 critic personas (independent of the original 5):
     • Sceptic — looks for holes, weak assumptions, hidden cost
     • Steel-Manner — produces the strongest counter-proposal
   - Each emits 3-5 sharp findings (not "looks fine")

3. Synthesize
   - Take strongest finding from each critic
   - Generate a NEW candidate that resolves them
   - Keep prior candidates in a lineage log (do not discard)

4. Blind judge
   - Present the latest 3 candidates anonymized (Candidate A/B/C — no order leak)
   - Score each on: clarity, robustness, simplicity, fit-to-constraint (1-5)
   - Select the winner BEFORE revealing which is which

5. Convergence check
   - If winner == previous winner OR all 3 candidates score within ±1 point → STOP, declare convergence
   - Else: feed winner back into step 2, repeat

6. Cap
   - Max 5 refinement rounds. Beyond that, surface the lineage and let the user pick.
```

### Output augmentation (appended to the base Prediction Report)

```
## Refinement Lineage (--chain reason)

| Round | Candidate | Critique Headlines | Judge Score |
|-------|-----------|-------------------|-------------|
| 1 | [seed = predict recs] | [top sceptic + steel-manner findings] | a/b/c/d → total |
| 2 | [synthesis 1] | ... | ... |
| ... | ... | ... | ... |

## Convergent Recommendation
[Final winner with rationale — replaces base Recommendations]
```

### When NOT to use `--chain reason`

- Predict verdict is **STOP** — fix the blocker first; refinement on a broken proposal wastes cycles
- Predict verdict is **GO** with all personas aligned — there's nothing subjective left to refine
- The decision is mechanically determinable (e.g. perf benchmark, security audit) — use `/ck:loop` or `/ck:security` instead

### Safety inheritance

Every refinement round commits to git as an atomic checkpoint, named `predict-chain-reason-round-N`. If a round produces a worse candidate (judge score regresses by >2), the round is reverted, not kept. Same Modify → Verify → Keep/Discard discipline as `/ck:loop`.

---

## `--chain probe` — Requirement Interrogation Loop

Use when the predict verdict is **CAUTION** or **STOP** because of "missing constraint" or "unstated assumption" findings — places where the proposal is incomplete because the requirements weren't fully harvested.

### Protocol

```
1. Seed
   - Take all predict findings tagged "assumption" / "constraint missing" / "unclear"
   - Convert each into a probe question:
     "What MUST be true about <X> for this proposal to work?"
     "What constraint on <Y> would invalidate this?"

2. Saturation generation
   - For each seed, generate 3-7 follow-up probe questions
   - Prefer probes that:
     • Surface negative requirements ("MUST NOT happen when...")
     • Surface boundary conditions ("at scale N, with concurrency M...")
     • Surface stakeholder gaps ("who needs to approve before this ships?")
   - Continue probe generation until two consecutive batches yield zero novel constraints (saturation reached)

3. Group + de-duplicate
   - Cluster probes by domain (data, security, ops, UX, billing)
   - Within each cluster: collapse synonyms, retain sharpest phrasing

4. Output as actionable constraints
   - Each surviving probe becomes a constraint card:
     • Question (the probe itself)
     • Why it matters (1 line)
     • Suggested next step: ASK (interview stakeholder) / TEST (run experiment) / DECIDE (commit to assumption)
```

### Output augmentation (appended to the base Prediction Report)

```
## Probe Findings (--chain probe)

### Constraints harvested

| Domain | Question | Why it matters | Next step |
|--------|----------|---------------|-----------|
| Data | What MUST be true about row growth for this query plan to hold? | Triggers index strategy decision | TEST |
| Security | What stakeholder approval is required for the new auth boundary? | Compliance gate | ASK |
| ... | ... | ... | ... |

### Open assumptions
[Bullet list of probes the user must close before implementation can begin.]
```

### When NOT to use `--chain probe`

- Proposal is already constrained by an existing PRD/spec — probes will rediscover what's already known
- Verdict is **GO** — no missing constraints; proceed
- User already explicitly said "I don't want a Q&A round, just give me the verdict"

### Coupling with `/ck:plan`

Probe output is shaped to feed directly into `/ck:plan` — each constraint card maps to a plan acceptance criterion. Recommended sequence: `/ck:predict ... --chain probe` → `/ck:plan` (passes the constraint table as input).

---

## Combining chains

`--chain reason --chain probe` is allowed but rarely useful — they target different failure modes:

| Verdict                            | Use                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| CAUTION (subjective)               | `--chain reason`                                                                                               |
| CAUTION/STOP (missing constraints) | `--chain probe`                                                                                                |
| Both                               | `--chain probe` first (harvest constraints) → re-run predict → `--chain reason` (refine with full constraints) |

Don't run both in a single invocation unless the user explicitly asks; the output gets noisy.

---

## Implementation note

These chain modes execute IN THE SAME predict session — they are not separate skills. The skill body in `SKILL.md` documents the trigger (`--chain` flag); this reference defines the protocol. Claude only loads this file when the user invokes one of the chain modes, so the eager cost on plain `/ck:predict` invocations is zero.

If a future use case demands invoking reason or probe **without** first running predict, the right move is to extract THIS file into a standalone skill (`ck-reason` or `ck-probe` directory under `claude/skills/`) at that time. Until then, folding keeps the catalog smaller and the user mental model cleaner.
