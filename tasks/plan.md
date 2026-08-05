# Implementation Plan: Claude-based CI Security Scan

Built from [`SPEC.md`](../SPEC.md). Domain vocabulary in [`CONTEXT.md`](../CONTEXT.md),
hard-to-reverse decisions in `docs/adr/0001` and `docs/adr/0002`. This plan covers
Phase 2 of the spec-driven workflow only — task breakdown (`tasks/todo.md`) with
per-task acceptance criteria is Phase 3, done after this plan is reviewed.

## Overview

Build the scanner bottom-up as a small dependency graph (types → parsing/chunking/API
client → Check registry → orchestrator → workflow files), then ship it as **two
vertical slices**: PR-mode end-to-end first (the everyday feedback loop, proven against
a real GitHub PR before it touches a protected branch), then Baseline mode second
(reuses everything PR-mode already built — new input framing and reporting surface
only). Every phase ends with a concrete checkpoint that must pass before the next
phase starts.

## Architecture Decisions

(Already made during grilling/spec — restated here only as they bound this plan's
task order, not re-argued.)

- Registry-of-Checks pattern (`registry.ts` + one `checks/<id>/` per Check) is the
  extensibility seam — Phase 2 exists specifically to prove this seam works before
  anything is built on top of it.
- `chunk.ts` is built generic over "content items" (not diff-specific), so Phase 5
  (Baseline mode, whole-file content) can reuse it unchanged from Phase 1 rather than
  needing its own chunking logic.
- Each Check's prompt is mode-agnostic (SPEC.md Code Style) — `run.ts` decides diff-hunk
  vs. whole-file framing at call time, the Check definition doesn't know which mode
  it's running under.
- The whole run is wrapped to always exit 0 and degrade to a "scan errored" note on any
  uncaught failure (ADR-0001: never block merge) — this is built in Phase 3, not
  bolted on later, because it's load-bearing for the advisory-only guarantee.

## Dependency Graph

```
types.ts (Check, Finding, ScanMode)
    │
    ├── lib/diff.ts ──────────┐
    ├── lib/chunk.ts ─────────┤  (independent of each other, parallelizable)
    ├── lib/claude-client.ts ─┘
    │
    ├── checks/multi-tenancy-isolation/{check.ts,prompt.md}
    │       │
    │       └── registry.ts
    │               │
    │               ├── run.ts --mode=pr ──── lib/report-pr-comment.ts
    │               │       │
    │               │       └── .github/workflows/security-scan-pr.yml
    │               │
    │               └── run.ts --mode=full ── lib/report-job-summary.ts
    │                       │
    │                       └── .github/workflows/security-scan-full.yml
```

Implementation follows this graph bottom-up. `--mode=pr` ships completely (through a
real PR verification) before `--mode=full` is started, per SPEC.md's PR-scan-first
framing of the objective.

## Task List

### Phase 0: Scaffolding

- [ ] Task 1: Add `@anthropic-ai/sdk` as a root `devDependency`; confirm `pnpm install`
      resolves it and that `tsx`/`vitest` (already in the catalog) run against a
      throwaway file in `.github/scripts/security-scan/`.
- [ ] Task 2: Create `types.ts` — `Check`, `Finding`, `ScanMode` shared types per
      SPEC.md's Project Structure and Code Style sections.

### Checkpoint 0: Scaffolding

- [ ] `pnpm exec tsx .github/scripts/security-scan/<throwaway>.ts` runs without
      module-resolution errors
- [ ] `pnpm exec vitest run .github/scripts` runs (even with zero tests) without
      config errors

### Phase 1: Core library (parallelizable — independent files, shared only via types.ts)

- [ ] Task 3: `lib/diff.ts` — parse a unified diff into per-file hunks; tests cover
      renamed files, binary files, and deleted files.
- [ ] Task 4: `lib/chunk.ts` — generic content chunker enforcing the size-cap constant
      (SPEC.md Open Question 1: placeholder ~60,000 chars); tests cover normal
      bin-packing and the "single item already exceeds the cap" case.
- [ ] Task 5: `lib/claude-client.ts` — thin `@anthropic-ai/sdk` wrapper making a forced
      tool-use call with the `report_findings` schema (SPEC.md Open Question 2); tests
      mock the SDK and assert request shape + response validation (well-formed,
      malformed, and partial tool-call payloads all handled without throwing).

### Checkpoint 1: Core library

- [ ] `pnpm exec vitest run .github/scripts` green, all Phase 1 tests passing
- [ ] Human skim of `claude-client.ts`'s response-validation branch — this is the
      seam ADR-0001's "never block merge" guarantee depends on; confirm it truly
      can't throw past this module

### Phase 2: First Check + registry

- [ ] Task 6: `checks/multi-tenancy-isolation/prompt.md` — the detection-rule prompt
      (missing/weak authorization on request-supplied ids against workspace/project/
      member-scoped resources; covers IDOR-style spoofing and other isolation gaps
      like missing queryset filters, per the grilling session and `CONTEXT.md`).
- [ ] Task 7: `checks/multi-tenancy-isolation/check.ts` — the `Check` definition
      (id `multi_tenancy_isolation`, target globs `apps/api/plane/**/{views,
    serializers,permissions}/**/*.py`).
- [ ] Task 8: `registry.ts` + `tests/registry.spec.ts` — glob-matching tests against
      representative real paths (e.g. an `apps/api/plane/app/views/workspace/
    member.py` path should match; an `apps/web/...` path should not).

### Checkpoint 2: Check + registry

- [ ] `registry.spec.ts` passing against representative paths pulled from the real
      `apps/api` tree
- [ ] Human review of `prompt.md` wording before it's ever sent to Claude — this is
      the actual detection logic; worth reading closely once, not just testing

### Phase 3: PR-mode orchestration (vertical slice 1, part A)

- [ ] Task 9: `run.ts --mode=pr` — resolve the diff against `--base`, run it through
      `diff.ts`, filter to the registered Check's matching files, `chunk.ts`, one
      batched `claude-client.ts` call per Check, collect `Finding[]`.
- [ ] Task 10: Wrap the full run in error handling that always exits 0 — any uncaught
      exception degrades to a "scan errored" note rather than a failed/crashed step
      (ADR-0001, SPEC.md Boundaries "Never do").
- [ ] Task 11: Add a `--dry-run` flag that prints the would-be comment body to stdout
      instead of calling the GitHub API — needed for local iteration without a real PR.

### Checkpoint 3: PR-mode logic, pre-GitHub-integration

- [ ] `pnpm exec tsx run.ts --mode=pr --base=<ref> --dry-run` run locally against a
      real diff in this repo, output inspected by a human for sensible Finding content
      and correctly formatted comment body
- [ ] Confirm the size-cap constant (Open Question 1) survives contact with a real
      diff — note whether it needs adjusting before Phase 4

### Phase 4: PR-mode workflow wiring (vertical slice 1, part B)

- [ ] Task 12: `lib/report-pr-comment.ts` — sticky comment create/update via GitHub
      REST API (find-or-create pattern reused from `react-doctor.yml`'s proven
      approach), including the "✅ no issues found" and "check skipped: diff too
      large" / "check skipped: no matching files" messages.
- [ ] Task 13: `.github/workflows/security-scan-pr.yml` — `pull_request` trigger
      across all apps, draft-PR skip, concurrency group, `contents:read` +
      `pull-requests:write` permissions, conditioned to silently no-op when
      `secrets.ANTHROPIC_API_KEY` is absent (ADR-0002 fork-PR behavior).

### Checkpoint 4 (major — human review required): End-to-end PR scan

- [ ] Open a real throwaway test PR with a deliberately planted missing-ownership-check
      bug in an `apps/api/plane/**/views` file — confirm the expected finding appears
      in the sticky comment
- [ ] Open a real clean test PR touching the same paths — confirm the
      "no issues found" comment, not silence
- [ ] Open a test PR that doesn't touch any matching path — confirm the check
      no-ops with no wasted API call
- [ ] Validate fork-PR skip behavior — either against a real external PR, or by
      running the workflow with `ANTHROPIC_API_KEY` intentionally withheld
- [ ] SPEC.md Success Criteria 1–3 all verified before this workflow is enabled
      against a protected branch

### Phase 5: Baseline Scan mode (vertical slice 2 — reuses Phase 1–2 building blocks)

- [ ] Task 14: Extend `run.ts` with `--mode=full` — walk the working tree for each
      Check's target globs, feed whole-file content through the same `chunk.ts` and
      `claude-client.ts`, same mode-agnostic `prompt.md`.
- [ ] Task 15: `lib/report-job-summary.ts` — writes Markdown findings to
      `$GITHUB_STEP_SUMMARY`.
- [ ] Task 16: `.github/workflows/security-scan-full.yml` — `workflow_dispatch` only,
      `contents:read` permission only (no PR comment surface needed).

### Checkpoint 5: Baseline Scan

- [ ] Manually trigger the workflow once against `preview`; confirm the job summary
      renders sensibly and the run completes in a reasonable time
- [ ] Use this run's real chunk count/timing to close Open Question 1 (size cap) for
      real, not just for PR-sized diffs

### Phase 6: Closure

- [ ] Task 17: Run `vitest --coverage`; confirm 80%+ on scoped files per SPEC.md
      Testing Strategy (excluding `run.ts` CLI glue and `report-*.ts`).
- [ ] Task 18: Update SPEC.md's Open Questions section with the values validated in
      Checkpoints 3 and 5; leave Open Question 3 (who provisions the secret) as an
      explicit manual follow-up in the PR description.
- [ ] Task 19: Final pass confirming every SPEC.md Success Criterion is met and
      nothing violates ADR-0001/ADR-0002's boundaries.

### Checkpoint 6: Complete

- [ ] All SPEC.md Success Criteria met
- [ ] Ready for human review / merge

## Risks and Mitigations

| Risk                                                                                  | Impact                                                          | Mitigation                                                                                                                                                      |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude returns malformed/non-schema tool output                                       | Medium — could crash the run or silently drop findings          | Strict validation inside `claude-client.ts`; caught centrally by Task 10's error wrapper, never throws past the module (Checkpoint 1 reviews this specifically) |
| Size-cap constant (~60k chars) wrong for real PR/Baseline sizes                       | Medium — too small skips useful scans, too large is slow/costly | Not treated as final until Checkpoints 3 and 5 exercise it against real content                                                                                 |
| High false-positive rate erodes trust in the tool                                     | High, long-term                                                 | ADR-0001 keeps it advisory-only regardless; Checkpoint 4's clean-PR test explicitly checks for false positives, not just true positives                         |
| Fork-PR skip path untested until a real external PR arrives                           | Low–Medium                                                      | Checkpoint 4 simulates it by withholding the secret in a test run                                                                                               |
| Sticky-comment find-or-create has edge cases (e.g. comment deleted by a user)         | Low                                                             | Reuse `react-doctor.yml`'s already-proven pattern rather than inventing new logic                                                                               |
| `.github/scripts` isn't a workspace package — `@anthropic-ai/sdk` resolution unproven | Low                                                             | Verified explicitly in Task 1/Checkpoint 0 before any code imports it                                                                                           |

## Parallelization Notes

- Phase 1 (Tasks 3–5) is the one place with genuine parallel opportunity — three
  independent files sharing only `types.ts`.
- Everything from Phase 2 onward is sequential for a single implementer: each phase's
  checkpoint gates the next, and Phase 5 touches `run.ts`'s mode dispatch that Phase 3
  already established, so running Phase 3/4 and Phase 5 concurrently risks merge
  conflicts in one file. If multiple people/agents are available, Phase 5's three
  tasks could start once Phase 2's registry lands, in a separate branch, and be
  rebased in after Checkpoint 4 — but that's an explicit tradeoff to opt into, not
  the default plan.

## Open Questions

Carried over from SPEC.md, resolved by specific checkpoints above rather than by
further discussion here:

- Size-cap constant → Checkpoints 3 and 5
- `report_findings` tool schema exact shape → Checkpoint 1 (may gain a "matched code
  excerpt" field if file/line proves too sparse during Checkpoint 4's real-PR test)
- Who provisions `ANTHROPIC_API_KEY` → Task 18, explicit manual follow-up
