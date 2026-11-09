# Delivery summary — Plane platform onboarding views

- **Date**: 2026-11-04 · **Branch**: `plane-forked` · **Scenario skill**: `architecture-communicator`
- **Diagram format guidance**: plugin `diagram-output-formats` reference (Mermaid chosen for deliberately small, Markdown-native views).

## Who this is for

New engineers joining the Plane fork. The material builds a first-week mental model: who uses which surface, what runs where, and where to make changes. It is not a design doc, a migration plan, or a component-level reference.

## What was produced

| File                                 | Purpose                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `architecture-communication-plan.md` | Audience, decision context, message hierarchy, view selection rationale, deliberate omissions |
| `onboarding-context.mmd`             | View A — L1 system context (actors → surfaces → external systems)                             |
| `onboarding-containers.mmd`          | View B — L2 containers + runtime topology (Caddy edge, services, data stores)                 |
| `onboarding-ownership.mmd`           | View C — code ownership map (apps vs packages, import relationships)                          |
| `diagram-reading-notes.md`           | Reading order, backend module table, evidence table with confidence, caveats, follow-ups      |
| `delivery-summary.md`                | This file                                                                                     |

## How to use it

1. Read `architecture-communication-plan.md` if you need to know why these three views and not others.
2. Walk the views in order — context, containers, ownership — with `diagram-reading-notes.md` open beside them.
3. Mermaid sources render in GitHub/GitLab wikis and in the Qoder Canvas `.mmd` viewer. They are the canonical source; don't hand-edit rendered exports.
4. Onboarding mentors: pair each view with the follow-up exercises at the end of the reading notes (dev-server check, one traced request, one realtime edit).

## Evidence basis and maintenance

- Evidence was gathered in a single static pass over this branch (four parallel explorations: repo structure, Django backend, frontends, deployment). Every load-bearing claim is traceable via the evidence table in `diagram-reading-notes.md`, with confidence labels.
- Known unknowns are stated in the notes (web runtime mode, email transport, unexamined `deployments/cli/community` compose) rather than drawn as fact.
- **Maintenance**: these are hand-maintained views, not a regenerable model. Re-validate after: any change to `apps/proxy/Caddyfile.ce`, `docker-compose*.yml`, `pnpm-workspace.yaml`, or the `plane/urls.py` API surface. If the team adopts this material, the recommended next step is a Structurizr/Graphviz source model so views can be regenerated and validated instead of patched.
