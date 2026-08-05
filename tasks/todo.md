# Task List: Claude-based CI Security Scan

Derived from [`tasks/plan.md`](./plan.md). Task numbers match the plan's Phase 0–6
task numbers. Commands are from `SPEC.md`'s Commands section.

---

## Task 1: Add `@anthropic-ai/sdk` and confirm the toolchain resolves in `.github/scripts`

**Description:** Add `@anthropic-ai/sdk` as a root `devDependency`. Confirm `pnpm
install` resolves it and that the existing catalog `tsx`/`vitest` versions can run a
throwaway file placed under `.github/scripts/security-scan/`, before any real code
depends on either.

**Acceptance criteria:**

- [ ] `@anthropic-ai/sdk` appears in root `package.json` `devDependencies` and
      `pnpm-lock.yaml`
- [ ] A throwaway `.github/scripts/security-scan/_smoke.ts` importing
      `@anthropic-ai/sdk` runs via `pnpm exec tsx` without module-resolution errors,
      then is deleted

**Verification:**

- [ ] Manual check: `pnpm install` completes clean; `pnpm exec tsx
    .github/scripts/security-scan/_smoke.ts` runs and exits 0

**Dependencies:** None

**Files likely touched:**

- `package.json`
- `pnpm-lock.yaml`

**Estimated scope:** Small (1-2 files)

---

## Task 2: Define shared types

**Description:** Create `types.ts` with the `Check`, `Finding`, and `ScanMode` types
that every other module in this plan depends on, per `SPEC.md`'s Project Structure
and Code Style sections.

**Acceptance criteria:**

- [ ] `Check` type has `id`, `description`, `targetGlobs`, `prompt` fields
- [ ] `Finding` type has `checkId`, `file`, `lineStart`, `lineEnd`, `description`,
      `confidence` (`"low" | "medium" | "high"`), `severity` (`"low" | "medium" |
    "high"`) fields
- [ ] `ScanMode` is a union of `"pr" | "full"`

**Verification:**

- [ ] Build succeeds: `pnpm exec tsx --check
    .github/scripts/security-scan/types.ts` (or equivalent type-check)

**Dependencies:** Task 1

**Files likely touched:**

- `.github/scripts/security-scan/types.ts`

**Estimated scope:** Small (1 file)

---

## Checkpoint 0: Scaffolding

- [ ] `pnpm exec vitest run .github/scripts` runs (zero tests yet) without config errors
- [ ] `types.ts` compiles clean

---

## Task 3: Diff parser

**Description:** Implement `lib/diff.ts`, parsing a unified diff (as produced by `git
diff`) into per-file hunks the rest of the pipeline can consume. Must handle the
messy edge cases a real PR diff can contain, not just the happy path.

**Acceptance criteria:**

- [ ] Parses added/changed lines per file into a structured hunk list
- [ ] Renamed files are handled (old path vs. new path don't get silently dropped)
- [ ] Binary files are skipped, not passed through as garbage text
- [ ] Deleted files are excluded from the output (nothing to scan)

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run .github/scripts/security-scan/tests/diff.spec.ts`

**Dependencies:** Task 2

**Files likely touched:**

- `.github/scripts/security-scan/lib/diff.ts`
- `.github/scripts/security-scan/tests/diff.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Task 4: Content chunker

**Description:** Implement `lib/chunk.ts` as a generic chunker — takes a list of
named content items (diff hunks in PR mode, whole files in Baseline mode) and groups
them into batches under the size-cap constant (`SPEC.md` Open Question 1, placeholder
~60,000 chars), so it works unchanged for both scan modes.

**Acceptance criteria:**

- [ ] Groups multiple small items into as few chunks as possible without exceeding
      the cap
- [ ] A single item that already exceeds the cap on its own becomes its own
      over-cap chunk, flagged so the caller can skip-and-note it rather than silently
      sending an oversized request
- [ ] Cap is a single named exported constant, not a magic number inline

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run .github/scripts/security-scan/tests/chunk.spec.ts`

**Dependencies:** Task 2

**Files likely touched:**

- `.github/scripts/security-scan/lib/chunk.ts`
- `.github/scripts/security-scan/tests/chunk.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Task 5: Claude API client wrapper

**Description:** Implement `lib/claude-client.ts`, a thin wrapper around
`@anthropic-ai/sdk` that makes a forced tool-use call against the `report_findings`
schema (`SPEC.md` Open Question 2) for a given Check's prompt and content, and
validates the response before returning `Finding[]`.

**Acceptance criteria:**

- [ ] Constructs a request using Claude Sonnet 5, the Check's prompt, and the given
      content, forcing the `report_findings` tool
- [ ] A well-formed tool-call response is parsed into `Finding[]`
- [ ] A malformed/partial tool-call response is caught and returns an empty result
      with an error indicator — never throws past this module
- [ ] The Anthropic API key is read from `process.env.ANTHROPIC_API_KEY`, never
      hardcoded

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run
    .github/scripts/security-scan/tests/claude-client.spec.ts` (SDK call mocked —
      no live API calls in unit tests)

**Dependencies:** Task 2

**Files likely touched:**

- `.github/scripts/security-scan/lib/claude-client.ts`
- `.github/scripts/security-scan/tests/claude-client.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Checkpoint 1: Core library

- [ ] `pnpm exec vitest run .github/scripts` green across Tasks 3–5
- [ ] Human skim of `claude-client.ts`'s response-validation branch — confirm it
      truly cannot throw past this module (this is what ADR-0001's "never block
      merge" guarantee depends on downstream)

---

## Task 6: Multi-tenancy isolation detection prompt

**Description:** Write `checks/multi-tenancy-isolation/prompt.md` — the mode-agnostic
detection-rule prompt instructing Claude to flag request-supplied ids used against
workspace/project/member-scoped resources without server-side ownership verification,
per the grilling session's decision (covers IDOR-style spoofing and other isolation
gaps like a queryset missing a workspace/project filter).

**Acceptance criteria:**

- [ ] Prompt explicitly describes this codebase's authorization idioms (e.g.
      `allow_permission` decorator, `ROLE` enum, `WorkspaceMember`/`ProjectMember`
      checks) so Claude can recognize when a check is present vs. absent
- [ ] Prompt instructs Claude to cite file + line + a short excerpt for each finding
- [ ] Prompt is written to work whether it's handed a diff hunk or a whole file
      (no hardcoded "here is the diff" framing baked into the prompt text itself —
      that framing is added by `run.ts` at call time)

**Verification:**

- [ ] Manual check: a human reads the prompt end-to-end and confirms it matches the
      detection rule agreed in the grilling session and `CONTEXT.md`

**Dependencies:** Task 2

**Files likely touched:**

- `.github/scripts/security-scan/checks/multi-tenancy-isolation/prompt.md`

**Estimated scope:** Small (1 file)

---

## Task 7: Multi-tenancy isolation Check definition

**Description:** Implement `checks/multi-tenancy-isolation/check.ts`, the `Check`
object wiring together the id, description, target globs, and the prompt from Task 6.

**Acceptance criteria:**

- [ ] `id` is `multi_tenancy_isolation`
- [ ] `targetGlobs` matches `apps/api/plane/**/views/**/*.py`,
      `apps/api/plane/**/serializers/**/*.py`, `apps/api/plane/**/permissions/**/*.py`
      and nothing outside `apps/api`
- [ ] Prompt is loaded from the sibling `prompt.md`, not inlined

**Verification:**

- [ ] Covered by Task 8's registry glob-matching tests (no standalone test needed for
      this file alone)

**Dependencies:** Task 6

**Files likely touched:**

- `.github/scripts/security-scan/checks/multi-tenancy-isolation/check.ts`

**Estimated scope:** Small (1 file)

---

## Task 8: Check registry

**Description:** Implement `registry.ts`, the array of registered `Check`s (just the
one, for now), and prove glob-matching works against real paths from this repo.

**Acceptance criteria:**

- [ ] `registry.ts` exports an array containing the Task 7 Check
- [ ] Glob matching correctly matches a real path like
      `apps/api/plane/app/views/workspace/member.py`
- [ ] Glob matching correctly excludes a real path like
      `apps/web/core/components/workspace/settings.tsx`

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run
    .github/scripts/security-scan/tests/registry.spec.ts`

**Dependencies:** Task 7

**Files likely touched:**

- `.github/scripts/security-scan/registry.ts`
- `.github/scripts/security-scan/tests/registry.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Checkpoint 2: Check + registry

- [ ] `registry.spec.ts` passing against representative real paths
- [ ] Human review of `prompt.md` wording completed (Task 6's manual check) before
      it's ever sent to Claude for real

---

## Task 9: PR-mode orchestration core

**Description:** Implement the `--mode=pr` path of `run.ts`: resolve the diff against
a `--base` ref, parse it via `diff.ts`, filter to each registered Check's matching
files, batch via `chunk.ts`, make one `claude-client.ts` call per Check, collect all
`Finding[]`.

**Acceptance criteria:**

- [ ] `run.ts --mode=pr --base=<ref>` produces a `Finding[]` (possibly empty) by
      wiring Tasks 3, 4, 5, and 8 together
- [ ] A Check with no matching files in the diff is skipped with zero API calls
- [ ] A Check whose matched content is chunked produces one Claude call per chunk,
      not one call per file

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run
    .github/scripts/security-scan/tests/run-pr-mode.spec.ts` (with `diff.ts` fed a
      fixture diff and `claude-client.ts` mocked)

**Dependencies:** Tasks 3, 4, 5, 8

**Files likely touched:**

- `.github/scripts/security-scan/run.ts`
- `.github/scripts/security-scan/tests/run-pr-mode.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Task 10: Always-exit-0 error handling

**Description:** Wrap the entire `run.ts` execution so any uncaught exception
(network failure, unexpected API shape, filesystem error) degrades to a "scan
errored" note rather than a failed workflow step. This is the concrete mechanism
behind ADR-0001's "never block merge" guarantee at the orchestration level.

**Acceptance criteria:**

- [ ] Throwing an error anywhere inside the scan (simulated in a test) results in
      `run.ts` exiting 0 with an error note captured for reporting, not an uncaught
      exception
- [ ] The error note is distinguishable from a legitimate "no findings" result when
      it reaches the reporting layer

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run
    .github/scripts/security-scan/tests/run-error-handling.spec.ts`

**Dependencies:** Task 9

**Files likely touched:**

- `.github/scripts/security-scan/run.ts`
- `.github/scripts/security-scan/tests/run-error-handling.spec.ts`

**Estimated scope:** Small (1-2 files)

---

## Task 11: `--dry-run` flag

**Description:** Add a `--dry-run` flag to `run.ts` that prints the would-be PR
comment body to stdout instead of calling the GitHub API, so the pipeline can be
iterated on locally without needing a real PR.

**Acceptance criteria:**

- [ ] `run.ts --mode=pr --base=<ref> --dry-run` prints a formatted comment body and
      makes no GitHub API calls
- [ ] Without `--dry-run`, behavior is unchanged (still calls the GitHub API in
      Task 12/13's flow)

**Verification:**

- [ ] Manual check: run locally against a real diff, confirm output is readable and
      makes no network calls other than to Claude

**Dependencies:** Task 10

**Files likely touched:**

- `.github/scripts/security-scan/run.ts`

**Estimated scope:** Small (1 file)

---

## Checkpoint 3: PR-mode logic, pre-GitHub-integration

- [ ] `pnpm exec tsx run.ts --mode=pr --base=<ref> --dry-run` run locally against a
      real diff in this repo; output inspected for sensible Finding content
- [ ] Size-cap constant (Open Question 1) checked against this real diff's size —
      note whether it needs adjusting before Phase 4

---

## Task 12: Sticky PR comment reporting

**Description:** Implement `lib/report-pr-comment.ts` — find-or-update a single
sticky comment on the PR summarizing findings grouped by Check, reusing the
find-or-create pattern already proven in this repo's `react-doctor.yml`. Covers the
clean-scan and skipped-check messages, not just the findings-present case.

**Acceptance criteria:**

- [ ] First run on a PR creates one comment; subsequent runs update the same comment
      (not a new one each time)
- [ ] Zero findings across all Checks produces a "✅ no issues found" message, not
      silence
- [ ] A Check skipped for exceeding the size cap produces an explicit
      "check skipped: diff too large" line
- [ ] A Check with no matching files produces no mention (not worth calling out per
      PR — distinct from the size-cap skip, which is worth flagging)

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run
    .github/scripts/security-scan/tests/report-pr-comment.spec.ts` (GitHub API
      client mocked)

**Dependencies:** Task 9

**Files likely touched:**

- `.github/scripts/security-scan/lib/report-pr-comment.ts`
- `.github/scripts/security-scan/tests/report-pr-comment.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Task 13: PR-scan workflow file

**Description:** Write `.github/workflows/security-scan-pr.yml` — `pull_request`
trigger across all apps, draft-PR skip, concurrency group, minimal permissions
(`contents: read`, `pull-requests: write`), invoking `run.ts --mode=pr` and silently
no-op'ing when `secrets.ANTHROPIC_API_KEY` is absent (ADR-0002's fork-PR behavior).

**Acceptance criteria:**

- [ ] Triggers on `pull_request` (opened, synchronize, reopened, ready_for_review),
      not `pull_request_target`
- [ ] Draft PRs are skipped (matches `pull-request-build-lint-api.yml`'s
      `github.event.pull_request.draft == false` convention)
- [ ] Concurrency group cancels in-flight runs for the same PR on new pushes
- [ ] Step invoking `run.ts` is conditioned so a missing `ANTHROPIC_API_KEY` secret
      results in a clean no-op, not a failed step

**Verification:**

- [ ] Manual check: workflow YAML is valid (`actionlint` or GitHub's own syntax
      check on push); full behavioral verification happens in Checkpoint 4

**Dependencies:** Tasks 11, 12

**Files likely touched:**

- `.github/workflows/security-scan-pr.yml`

**Estimated scope:** Small (1 file)

---

## Checkpoint 4 (major — human review required): End-to-end PR scan

- [ ] Real throwaway test PR with a deliberately planted missing-ownership-check bug
      in an `apps/api/plane/**/views` file → expected finding appears in the sticky
      comment
- [ ] Real clean test PR touching the same paths → "no issues found" comment appears
      (not silence, not a false positive)
- [ ] Test PR touching no matching path → check no-ops, no wasted API call
- [ ] Fork-PR skip behavior validated (real external PR, or the secret intentionally
      withheld in a test run)
- [ ] `SPEC.md` Success Criteria 1–3 all verified before this workflow is enabled
      against a protected branch

---

## Task 14: Baseline-mode orchestration

**Description:** Extend `run.ts` with the `--mode=full` path: walk the working tree
for each Check's `targetGlobs`, feed whole-file content (not diff hunks) through the
same `chunk.ts` and `claude-client.ts`, reusing the same mode-agnostic prompt from
Task 6 unchanged.

**Acceptance criteria:**

- [ ] `run.ts --mode=full` produces a `Finding[]` covering every file under
      `multi_tenancy_isolation`'s target globs, not just recently changed ones
- [ ] Uses the exact same `chunk.ts`/`claude-client.ts` code paths as `--mode=pr` —
      no duplicated chunking or API-calling logic
- [ ] Large matched sets are chunked into multiple calls per Check, per the shared
      size cap

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run
    .github/scripts/security-scan/tests/run-full-mode.spec.ts`

**Dependencies:** Tasks 8, 10

**Files likely touched:**

- `.github/scripts/security-scan/run.ts`
- `.github/scripts/security-scan/tests/run-full-mode.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Task 15: Job summary reporting

**Description:** Implement `lib/report-job-summary.ts` — writes findings as Markdown
to `$GITHUB_STEP_SUMMARY`, grouped by Check, for the Baseline Scan's workflow-run-page
reporting surface.

**Acceptance criteria:**

- [ ] Output is valid Markdown grouped by Check id
- [ ] Zero findings produces an explicit "no issues found" summary, matching the
      PR-comment convention from Task 12

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run
    .github/scripts/security-scan/tests/report-job-summary.spec.ts`

**Dependencies:** Task 14

**Files likely touched:**

- `.github/scripts/security-scan/lib/report-job-summary.ts`
- `.github/scripts/security-scan/tests/report-job-summary.spec.ts`

**Estimated scope:** Medium (2 files)

---

## Task 16: Baseline-scan workflow file

**Description:** Write `.github/workflows/security-scan-full.yml` —
`workflow_dispatch` only, `contents: read` permission only, invoking `run.ts
--mode=full`.

**Acceptance criteria:**

- [ ] Triggers only on `workflow_dispatch`, no automatic trigger
- [ ] No `pull-requests` permission requested (not needed for job-summary reporting)

**Verification:**

- [ ] Manual check: workflow YAML is valid; full behavioral verification in
      Checkpoint 5

**Dependencies:** Task 15

**Files likely touched:**

- `.github/workflows/security-scan-full.yml`

**Estimated scope:** Small (1 file)

---

## Checkpoint 5: Baseline Scan

- [ ] Manually triggered once against `preview`; job summary renders sensibly, run
      completes in a reasonable time
- [ ] Real chunk count/timing from this run used to close Open Question 1 for real
      (not just PR-sized diffs)

---

## Task 17: Coverage verification

**Description:** Run coverage across the scanner and confirm it meets `SPEC.md`'s
80%+ target on scoped files.

**Acceptance criteria:**

- [ ] `pnpm exec vitest run .github/scripts --coverage` reports ≥80% on
      `.github/scripts/security-scan/**/*.ts` excluding `run.ts`'s CLI glue and the
      two `report-*.ts` modules
- [ ] Any gap below 80% is closed by adding tests to the relevant Task's file, not by
      lowering the target

**Verification:**

- [ ] Tests pass: `pnpm exec vitest run .github/scripts --coverage`

**Dependencies:** Tasks 3, 4, 5, 8, 9, 14

**Files likely touched:**

- Whichever `tests/*.spec.ts` files have gaps (varies)

**Estimated scope:** Small (1-2 files, typically)

---

## Task 18: Close SPEC.md Open Questions

**Description:** Update `SPEC.md`'s Open Questions section with the values validated
in Checkpoints 3 and 5 (size cap, tool schema shape), and note Open Question 3
(who provisions `ANTHROPIC_API_KEY`) as an explicit manual follow-up for whoever
merges this.

**Acceptance criteria:**

- [ ] Size-cap constant is either confirmed at its placeholder value or updated,
      with the real diff/Baseline data cited
- [ ] Tool schema shape is confirmed as-shipped, or the "matched code excerpt" field
      is added if Checkpoint 4 showed file/line alone was too sparse
- [ ] Open Question 3 remains, explicitly called out in the eventual PR description

**Verification:**

- [ ] Manual check: `SPEC.md` diff reviewed by a human alongside the checkpoint
      results it's based on

**Dependencies:** Checkpoints 3, 4, 5

**Files likely touched:**

- `SPEC.md`

**Estimated scope:** Small (1 file)

---

## Task 19: Final review pass

**Description:** Confirm every `SPEC.md` Success Criterion is met and nothing in the
implementation violates the boundaries set in ADR-0001 or ADR-0002.

**Acceptance criteria:**

- [ ] All `SPEC.md` Success Criteria checked off against actual verified behavior
      (not assumed)
- [ ] `security-scan-pr.yml` confirmed to still use `pull_request`, never
      `pull_request_target`
- [ ] No code path in `run.ts` can cause the PR-scan workflow to exit non-zero

**Verification:**

- [ ] Manual check: human reads `run.ts`, both workflow files, and `SPEC.md`
      Success Criteria side by side

**Dependencies:** Tasks 17, 18

**Files likely touched:**

- None expected (review-only); fixes if anything fails, in whichever file needs it

**Estimated scope:** Small (0-1 files)

---

## Checkpoint 6: Complete

- [ ] All `SPEC.md` Success Criteria met
- [ ] Ready for human review / merge
