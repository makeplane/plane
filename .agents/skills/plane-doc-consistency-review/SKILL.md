---
name: plane-doc-consistency-review
description: Review Plane pull requests or local diffs for drift between source code, semantic JSON, generated AI docs, tests, and product documentation. Use in makeplane/plane before commit or PR review to find missing docs updates, stale mappings, untested behavior, broken generated docs, or AI-generated changes that lack source evidence.
---

# Plane Doc Consistency Review

Use this skill before committing or opening a PR.

## Workflow

1. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1 -PlanePath .
```

2. Read `docs/semantic/change_impact.json` and `docs/ai/change-impact.md`.
3. Compare changed paths with `docs/semantic/mappings.json`.
4. Verify `docs/semantic/change_declaration.json` covers every changed code path, declared test, and affected active mapping.
5. Check whether each behavior change has:
   - source-backed mapping updates
   - tests or a clear test gap
   - generated docs update
   - open questions updated when evidence is incomplete
6. Review generated docs for claims that lack source paths.

## Findings Priority

- P0: Code and machine-checkable contracts disagree, or generated code bypasses documented security/auth/data rules.
- P1: Behavior changed but tests or semantic mappings are missing.
- P2: Documentation is stale, open questions are unresolved, or generated notes lack evidence.
- P3: Formatting, naming, or clarity issues that do not change behavior.

## Completion

Lead with findings. Include exact files and, when available, line numbers. If no issue is found, state the remaining verification gaps.
