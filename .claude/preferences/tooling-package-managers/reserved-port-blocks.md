---
type: preference
topic: tooling-package-managers
status: active
scope: context-dependent
applies_when: [docker-compose]
updated: 2026-08-23
---

# Reserved port blocks per project

Every project that publishes host ports gets a reserved **block of 10 consecutive
ports starting at 7000** (first app → 7000–7009, second app → 7010–7019, …). Within
a block, the base port (`x0`) belongs to the production/main instance; higher slots
serve test instances and parallel versions.

## Rules

1. Every host binding comes from its project's own block (see allocation table
   below) — never a bare well-known port (5432, 3000, …) and never another
   project's range.
2. Bind to `127.0.0.1:` explicitly, never `0.0.0.0`.
3. Compose files bind via `${PROJECT_VAR:-<block-default>}:<container-port>`; the
   committed default matches the table below, and each project's `.env` overrides
   locally (Compose auto-loads `.env` sitting next to `docker-compose.yml`).

Slot map within a block (default map — finalize per project while wiring in):
`x0` prod app · `x1` prod database · `x2–x6` test instances · `x7–x9` spare.

Rationale: local apps are long-running processes, so their endpoints (bookmarks,
connection strings, scripts) must survive restarts — dynamic ports don't fit, but
hardcoded well-known ports collide across projects (origin: Questimus test-db and
Legaliosa sp10-pg both wanting 5433, 2026-08-23). Blocks give stability plus
collision-freedom by construction. Sibling rule:
[Local dev projects: Docker over manual start scripts](docker-over-manual-scripts.md).

## Allocation table

Canonical allocations live in the Arsenal vault
(`library/preferences/tooling-package-managers/reserved-port-blocks.md`) and reach
projects through `/project-sync` — **never edit a deployed copy; edit the vault and
sync**. Blocks are claimed top-down. Range verified free on the owner's machine
2026-08-23 (nothing listening on TCP 7000–7099).

| Project          | Block     | Assigned    |
| ---------------- | --------- | ----------- |
| Questimus        | 7000–7009 | 2026-08-23  |
| Legaliosa        | 7010–7019 | 2026-08-23  |
| Don Saldo        | 7020–7029 | 2026-08-23  |
| Jobernaut        | 7030–7039 | 2026-08-23  |
| Media Consumerus | 7040–7049 | 2026-08-23  |
| *(next)*         | 7050–7059 | unallocated |
