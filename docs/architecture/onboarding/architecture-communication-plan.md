# Architecture Communication Plan — Plane platform onboarding

- **Scenario skill**: `architecture-communicator`
- **Date**: 2026-11-04 · **Branch**: `plane-forked` · **Evidence**: static pass (code, configs, compose files); no runtime telemetry observed.

## Audience and decision context

- **Audience**: new engineers joining the team, in their first days/weeks.
- **Decision the material supports**: build an accurate mental model of the platform and know where to make changes — which app to open, which package is shared, which service runs a behavior.
- **Constraints**: reading time under ~20 minutes; three focused diagrams; no component/code-level (L3/L4) detail.

## Message hierarchy (what a new engineer must take away, in order)

1. **One product, one API.** Plane is a project-management platform: one Django backend (`apps/api`) serves three browser apps (`web`, `space`, `admin`) plus one realtime collaboration service (`apps/live`).
2. **Edge routing is centralized.** In deployment everything enters through a Caddy proxy (`apps/proxy`) that routes by path; in local dev the apps run on their own ports via `pnpm dev`.
3. **Shared layers live in `packages/`.** UI building blocks (`@plane/blocks`), the rich text editor (`@plane/editor`), API clients (`@plane/services`), and MobX stores (`@plane/shared-state`) are workspace packages shared by all frontends — change them once, every app benefits.
4. **Background work is not in-request.** Emails, webhooks, exports, cleanups run in Celery workers with RabbitMQ as broker; realtime page editing goes through the separate `live` service, not Django.

## Source model and evidence

No pre-existing architecture model was found in the repository, so an evidence pass was performed with four parallel explore agents covering: repo top-level structure, the Django backend, the frontend apps, and deployment/runtime topology. Every claim in the diagrams and notes carries a file-path evidence reference in `diagram-reading-notes.md`, with confidence labels per the shared contract.

## Selected views (and why)

| View                        | Level                            | Question it answers for the newcomer                                     |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `onboarding-context.mmd`    | L1 System context                | Who uses Plane, through which surface, and what is outside the boundary? |
| `onboarding-containers.mmd` | L2 Containers + runtime topology | What runs, on which port, and what talks to what?                        |
| `onboarding-ownership.mmd`  | Code ownership map               | Where does code live, and which repo path do I open to change X?         |

Deliberately **excluded** to keep the story readable (noted as simplifications, not omissions of risk):

- Instance licensing/telemetry internals (`plane/license/`) — mentioned, not diagrammed.
- The ~30 individual Celery task modules in `plane/bgtasks/` — summarized as "worker".
- The secondary compose file at `deployments/cli/community/docker-compose.yml` — unexamined in this pass.
- The pytest stack (`docker-compose-test.yml`) — summarized in reading notes only.
- The Django app/module map — delivered as a table in reading notes rather than a fourth diagram.

## Delivery format

Mermaid (`.mmd`) sources + Markdown notes, per audience choice. Mermaid is acceptable here because each view is deliberately small and the primary surface is the repository/wiki. File delivery rule respected: sources are files on disk, not inline code blocks.

## Follow-up (if this material graduates)

If the team adopts these views, the recommended next step is an evidence-backed Structurizr/Graphviz source model (via `system-modeler` + a format skill) so views can be regenerated and CI-validated rather than hand-maintained. Runtime observations (traces, actual traffic paths) were not available for this pass.
