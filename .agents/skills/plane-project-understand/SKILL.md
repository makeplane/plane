---
name: plane-project-understand
description: Understand the open-source Plane repository and maintain a source-backed AI documentation baseline. Use when working in makeplane/plane or a local Plane checkout to scan code, update docs/semantic JSON, generate docs/ai architecture notes, map domains to source paths, or prepare AI-readable context before code generation.
---

# Plane Project Understand

Use this skill inside the root of the `makeplane/plane` repository after the loop package has been installed.

## Workflow

1. Read `AGENTS.md`, `CONTRIBUTING.md`, `pnpm-workspace.yaml`, `package.json`, and `docs/semantic/reverse_index.json`.
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1 -PlanePath . -SkipImpact
```

3. Inspect `docs/semantic/local_scan.json`.
4. Promote seed domains in `docs/semantic/domains.json` only when source paths are confirmed.
5. Add or update `docs/semantic/mappings.json` with real source paths for backend, frontend, packages, API, database, and tests.
6. Regenerate `docs/ai/architecture.md` or append hand-written notes only when they cite semantic source files and source paths.

## Plane-Specific Heuristics

- Treat `apps/api` as the Django backend even though it is excluded from `pnpm-workspace.yaml`.
- Treat `apps/*` as frontend or service apps, and `packages/*` as shared TypeScript packages.
- Prefer source-backed facts over README product terms.
- Keep unconfirmed product-domain statements in `docs/semantic/open_questions.json`.
- For backend behavior, search models, serializers, viewsets, urls, permissions, tasks, migrations, and tests.
- For frontend behavior, search routes, API clients, MobX stores, shared state, UI components, and i18n keys.

## Evidence Rules

- Every active mapping must include at least one real path under `apps/api`, `apps`, or `packages`.
- Every generated Markdown section must point back to a semantic model or source path.
- Do not mark an open question closed unless the source path evidence is present.

## Completion

Before finishing, run:

```powershell
powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop/runtime/Invoke-PlaneDocLoop.ps1 -PlanePath . -SkipImpact
```

Report changed semantic files and any remaining blocking open questions.
