---
name: plane-doc-code-loop
description: Implement Plane changes from machine-checkable documentation and keep code, tests, and generated docs synchronized. Use in makeplane/plane when a change request, semantic model, API contract, or docs/ai note should drive code generation or code modification across the Django backend, TypeScript apps, packages, tests, and docs.
---

# Plane Doc Code Loop

Use this skill only after `docs/semantic/*.json` validates.

## Workflow

1. Read the requested change, `docs/ai/change-request-template.md` if present, and relevant entries in `docs/semantic/domains.json` and `docs/semantic/mappings.json`.
2. Update `docs/semantic/change_declaration.json` with the intent, affected active domains, mapping IDs, evidence, and test paths.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1 -PlanePath . -SkipImpact
```

4. Identify the smallest source-backed change surface:
   - backend: `apps/api`
   - frontend apps: `apps/*`
   - shared packages: `packages/*`
   - docs and semantic model: `docs/semantic`, `docs/ai`
5. Modify code only where the mapping or source scan supports the change.
6. Add or update tests in the nearest existing test convention.
7. Update `docs/semantic/mappings.json`, `docs/semantic/open_questions.json`, and derived docs when the implementation changes a mapped behavior.
8. Generate impact notes:

```powershell
powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1 -PlanePath .
```

9. Run `.plane-ai-doc-loop/runtime/check_doc_gate.py` against the intended Git base before completion.

## Plane Guardrails

- Follow `AGENTS.md`: use `pnpm check`, `pnpm check:lint`, `pnpm check:types`, and targeted `pnpm turbo run <command> --filter=<package>` when appropriate.
- For backend tests, prefer the Docker test stack in `docker-compose-test.yml`.
- Keep TypeScript strict and use existing workspace dependency style.
- Do not invent API contracts from natural language. Add machine-checkable contract notes first, then implement.
- For i18n changes, update all required language files according to `CONTRIBUTING.md`.

## Completion

Run the smallest meaningful verification set, then report:

- changed code paths
- changed semantic/docs paths
- tests/checks run
- tests/checks not run and why
- open questions that still block confidence
