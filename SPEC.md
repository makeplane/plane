# Spec: Claude-based CI Security Scan

Domain vocabulary (Check, Finding, Multi-Tenancy Isolation, IDOR, Baseline Scan) is
defined in [`CONTEXT.md`](./CONTEXT.md) — this spec assumes that glossary. The
reasoning behind the advisory-only gating and the `pull_request`-not-`pull_request_target`
trigger choice lives in [`docs/adr/0001-advisory-only-ci-security-scan.md`](./docs/adr/0001-advisory-only-ci-security-scan.md)
and [`docs/adr/0002-pull-request-not-target-for-ci-scan.md`](./docs/adr/0002-pull-request-not-target-for-ci-scan.md) —
not repeated here.

## Objective

Add a CI pipeline that uses the Claude API to statically analyze code changes for
security issues, starting with **multi-tenancy isolation** bugs (a user's
workspace/project/member-scoped resource access enforced server-side, independent
of any id the client supplies — see `CONTEXT.md`). Built as an extensible **registry
of Checks** so future check categories (unrelated to multi-tenancy) can be added by
registering a new Check definition, not by restructuring the scanner.

Two consumers of the same registry:

- **PR scan** — runs on every `pull_request`, evaluates only the PR's diff against
  each Check's target globs, posts a sticky summary comment. Fast, cheap, the
  everyday feedback loop.
- **Baseline Scan** — manually triggered (`workflow_dispatch`), evaluates full file
  contents under each Check's globs, reports to the job summary. Exists to surface
  pre-existing issues the PR scan will never see (nothing changed them).

Success looks like: a maintainer opens a PR that reintroduces a missing-ownership-check
bug in a Django view, and within a few minutes sees a PR comment naming the file, line,
and the specific gap — without the check ever blocking their merge.

## Tech Stack

- **Language/runtime**: TypeScript, executed directly via `tsx` (already in the pnpm
  catalog at `4.20.6`) — no compile/build step.
- **Anthropic SDK**: `@anthropic-ai/sdk`, added as a root `devDependency` (new to this
  repo).
- **Test framework**: `vitest` (matches `packages/codemods`, the closest existing
  analog to a standalone script package in this monorepo).
- **Package manager**: `pnpm`, matching the rest of the repo.
- **CI**: GitHub Actions, matching every other workflow in `.github/workflows/`.

## Commands

```
# Run the PR-mode scan locally against a diff (base ref defaults to origin/preview)
pnpm exec tsx .github/scripts/security-scan/run.ts --mode=pr [--base=<ref>]

# Run the full Baseline Scan locally
pnpm exec tsx .github/scripts/security-scan/run.ts --mode=full

# Unit tests for the runner/registry/chunking logic
pnpm exec vitest run .github/scripts

# Lint/format (already covers .github/scripts/**/*.ts via existing repo-wide config,
# no new config needed)
pnpm exec oxlint .github/scripts
pnpm exec oxfmt .github/scripts
```

`ANTHROPIC_API_KEY` must be set in the environment (or GitHub Actions secret) for any
mode that actually calls Claude; without it, PR-mode exits silently (see ADR-0002) and
full-mode fails loudly (a human triggered it on purpose).

## Project Structure

```
.github/
  workflows/
    security-scan-pr.yml       → pull_request trigger, calls run.ts --mode=pr
    security-scan-full.yml     → workflow_dispatch trigger, calls run.ts --mode=full
  scripts/
    security-scan/
      run.ts                   → CLI entrypoint; parses --mode, orchestrates a Scan Run
      registry.ts               → the array of registered Check definitions
      checks/
        multi-tenancy-isolation/
          check.ts             → Check definition (id, globs, output schema ref)
          prompt.md             → the detection-rule prompt (mode-agnostic, see below)
      lib/
        diff.ts                 → parses PR diff into per-file hunks
        chunk.ts                 → splits matched content into calls under the size cap
        claude-client.ts        → thin wrapper around @anthropic-ai/sdk + the
                                   report_findings tool schema
        report-pr-comment.ts    → sticky-comment create/update via GitHub REST API
        report-job-summary.ts   → writes Markdown to $GITHUB_STEP_SUMMARY
      types.ts                  → Check, Finding, ScanMode shared types
      tests/
        chunk.spec.ts
        diff.spec.ts
        registry.spec.ts
CONTEXT.md                      → domain glossary (already written)
docs/adr/                       → 0001, 0002 (already written)
```

Adding a second Check later means: one new `checks/<id>/check.ts` + `prompt.md`,
registered in `registry.ts`. Nothing else changes.

## Code Style

A Check definition — the extensibility seam the whole design hangs off of:

```typescript
// .github/scripts/security-scan/checks/multi-tenancy-isolation/check.ts
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Check } from "../../types";

export const multiTenancyIsolationCheck: Check = {
  id: "multi_tenancy_isolation",
  description:
    "Flags request-supplied ids used against workspace/project/member-scoped " +
    "resources without server-side ownership verification.",
  targetGlobs: [
    "apps/api/plane/**/views/**/*.py",
    "apps/api/plane/**/serializers/**/*.py",
    "apps/api/plane/**/permissions/**/*.py",
  ],
  prompt: readFileSync(path.join(__dirname, "prompt.md"), "utf-8"),
};
```

Conventions:

- Named exports only, no default exports (matches existing `packages/*` style).
- Every `Check` is a plain data object — no classes, no inheritance. The runner is
  the only thing with behavior.
- Prompts live as sibling `prompt.md` files, never as inline string literals, so
  they're reviewable/diffable on their own.
- Functions stay small and single-purpose (diff parsing, chunking, and API calls are
  three separate modules, not one "do everything" file) — per this repo's existing
  `apps/api` convention of thin views delegating to focused helpers.

## Testing Strategy

- **Framework**: `vitest`, run via `pnpm exec vitest run .github/scripts`.
- **Unit tests** (the bulk of coverage): `diff.ts` (diff parsing edge cases — renamed
  files, binary files, deleted files), `chunk.ts` (size-cap bin-packing, including the
  "matched content already exceeds the cap on its own" case), `registry.ts` (glob
  matching against representative file paths).
- **No integration tests against the live Claude API** — the `claude-client.ts` wrapper
  is the seam; tests mock the SDK call and assert the request shape (prompt assembly,
  forced tool schema) and response parsing (valid/invalid/partial tool-call payloads).
- **No E2E test of the GitHub Actions workflow itself** — validated manually by opening
  a real test PR against a throwaway branch before merging the workflow files, per this
  skill's "for UI or frontend changes... test in a browser" principle applied to CI:
  a workflow file's correctness can only really be confirmed by watching it run.
- Coverage target: 80%+ on `.github/scripts/**/*.ts` excluding `run.ts`'s CLI glue and
  the two `report-*.ts` modules (thin GitHub API I/O, not worth mocking exhaustively).

## Boundaries

- **Always do**: validate Claude's tool-call response against the Finding schema before
  using it (never trust it's well-formed); truncate/skip per the size-cap guardrail
  rather than silently sending an oversized request; keep every Check's prompt in its
  own file; run `oxlint`/`oxfmt` before committing (existing repo-wide pre-commit hook
  already enforces this).
- **Ask first**: adding a second Check category beyond `multi_tenancy_isolation`
  (confirm scope/detection-rule the same way this one was grilled); changing the model
  from Claude Sonnet 5; changing the size-cap constant once real PR data suggests a
  different number; adding a suppression/dismissal mechanism (explicitly deferred, see
  grilling transcript); flipping gating from advisory-only to blocking (would reopen
  ADR-0001); switching `pull_request` to `pull_request_target` (would reopen ADR-0002 —
  do not do this to "fix" fork-PR coverage without re-deriving that trade-off).
- **Never do**: send whole-repo content to Claude on the PR-scan path (diff-only is
  the contract); let a scan failure/exception fail the PR check (advisory-only per
  ADR-0001 — wrap the whole run in a try/catch that still exits 0 and posts a
  "scan errored" note rather than a red X); commit `ANTHROPIC_API_KEY` or any secret
  value into the repo; run this workflow via `pull_request_target`.

## Success Criteria

- Opening a PR that touches `apps/api/plane/**/views` (or `serializers`/`permissions`)
  with a real missing-ownership-check bug produces a sticky PR comment naming the
  check, file, and line within one workflow run.
- Opening a PR with no matching files, or a clean PR, produces the "✅ no issues found"
  (or "check skipped: no matching files") comment — never silence.
- A PR from a fork produces no comment and no failed check — confirmed by testing
  against an actual fork PR before considering this shippable.
- Manually running the Baseline Scan against `preview` produces a job summary listing
  every current `multi_tenancy_isolation` finding across the full `apps/api` tree.
- No scan run — PR or Baseline — ever turns the check red / blocks merge, regardless
  of findings (per ADR-0001).
- `pnpm exec vitest run .github/scripts` passes with 80%+ coverage on the scoped files
  above.

## Open Questions

1. ~~**Size-cap constant**~~ — **Resolved: 150,000 chars (~37k tokens).** Measured
   against this repository rather than guessed:
   - _PR mode_: across the last 42 squash-merged PRs touching `apps/api` with
     matching content, the largest matched diff was 19,215 chars (median 1,761,
     p90 5,592, p99 10,630). The cap leaves ~7.8× headroom, so a check should
     effectively never be skipped for size on a real PR.
   - _Baseline mode_: 175 matched files, 1,514,886 chars total. The original
     60,000 placeholder would have **silently skipped
     `apps/api/plane/api/views/issue.py` (101,511 chars) on every run** — the
     largest and among the most security-relevant files in scope. At 150,000 the
     whole set is covered in 12 Claude calls (down from 30 at the old cap), so the
     larger cap is both more complete and cheaper.
   - A file exceeding the cap is reported as skipped rather than truncated, so a
     future regression past this ceiling shows up in the report instead of being
     silent.
2. **`report_findings` tool schema exact shape** — _still open._ The schema is
   implemented and unit-tested against well-formed, malformed, and partial payloads,
   but has not yet been exercised against a real Claude response, which requires an
   `ANTHROPIC_API_KEY` (see item 3). Confirm at Checkpoint 4 whether file + line +
   description is enough for a reviewer to act on, or whether a "matched code
   excerpt" field is needed. The prompt already asks for an excerpt in prose; if it
   proves useful it should become a first-class schema field.
3. **Who adds the `ANTHROPIC_API_KEY` GitHub secret** — _still open, and now the
   blocking item._ Repo-admin action outside this spec's scope. Both workflows read
   `secrets.ANTHROPIC_API_KEY`; until it is provisioned, the PR scan detects the
   missing key and exits quietly (the same path fork PRs take), and the Baseline
   Scan has nothing to call. No live Claude call has been made yet, so Checkpoint 3
   (real dry-run) and Checkpoint 4 (real PR verification) are both still outstanding.
