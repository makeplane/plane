# Auto-Diagram: Zero-Config Codebase Visualization

Analyze ANY codebase and generate architecture diagram automatically.
No description needed — read the code, figure out what to draw.

## Context Budget (Hard Limits)

| Operation                | Limit                       |
| ------------------------ | --------------------------- |
| Grep results per pattern | 20 matches (use head_limit) |
| Files read per component | 5 files                     |
| Tool calls in Phase 2    | 15                          |
| Tool calls in Phase 3    | 10                          |

If limits exceeded, proceed with partial results and note gaps.

---

## Phase 1: Project Detection

1. **Read root files**: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `Gemfile`, `composer.json`, `mix.exs`, `Makefile`, `Dockerfile`, `docker-compose.yml`, `*.tf`
2. **Scan directory structure**: `ls` root and first-level subdirs
3. **Detect project type**:
   - **Monorepo**: `workspaces` in package.json, `lerna.json`, `pnpm-workspace.yaml`, `packages/` or `apps/`
   - **Microservices**: Multiple Dockerfiles, docker-compose with 3+ services
   - **Standard app**: Single service with standard dirs
4. **Detect frameworks**:
   - React/Next.js: `next.config.*`, `src/app/`, `src/pages/`
   - Express/Fastify/Hono: `routes/`, `controllers/`, `middleware/`
   - Nest.js: `@nestjs/core` in package.json
   - Django/Flask/FastAPI: `manage.py`, `wsgi.py`, `app.py`, `main.py` + `uvicorn`
   - Spring: `src/main/java/`, `application.properties`
   - Go: `cmd/`, `internal/`, `pkg/`
   - Rust: `src/main.rs`, `src/lib.rs`
   - Rails: `Gemfile` + `config/routes.rb`
   - Laravel: `artisan`, `app/Http/`
   - Phoenix: `mix.exs` + `lib/*_web/`

**Monorepo**: Scope to package-level view first. One box per package. Offer drill-down.

---

## Phase 2: Component Discovery (max 15 tool calls)

### Web Applications

1. **Frontend**: Glob `*.tsx`, `*.jsx`, `*.vue`, `*.svelte` in `src/`, `app/`, `pages/`
2. **API routes**: Grep `router\.(get|post|put|delete)`, `@(Get|Post|Put|Delete)`, `@app\.route`, `HandleFunc`
3. **Database**: Look for `prisma/schema.prisma`, `models.py`, `*.entity.ts`, `migrations/`, `@Entity`
4. **External services**: Grep `axios`, `fetch(`, `requests\.`, `http\.NewRequest`
5. **Message queues**: Grep `amqp`, `kafka`, `bull`, `celery`, `SQS`, `pubsub`
6. **Cache**: Grep `redis`, `memcached`, `cache` in imports
7. **Auth**: Grep `passport`, `jwt`, `oauth`, `@Auth`, `middleware.*auth`

### Infrastructure

1. Read `docker-compose.yml` service definitions
2. Grep `*.tf` for `resource "` blocks
3. Glob `**/k8s/*.yaml` or `**/manifests/*.yaml`

### Libraries/CLIs

1. Find `main`, `bin`, `exports` in package config
2. Map public API surface
3. Read dependency list

**Output**: 4-12 components with names, types, key files.

---

## Phase 3: Connection Mapping (max 10 tool calls)

1. **Read entry points** (max 5 files total). Look for:
   - Import statements referencing OTHER components
   - HTTP client calls, RPC calls, queue publishers
   - Database queries
   - Event emitters/listeners

2. **Categorize connections**:
   - `REST/HTTP`, `SQL/ORM`, `gRPC/RPC`, `Event/Queue`, `Import`

3. **Build edge list**: `ComponentA --[protocol]--> ComponentB`

If connections unreliable: show components without arrows, note to user.

---

## Phase 4: Verify with User

Present summary BEFORE drawing:

> "I found **N components** and **M connections**:
>
> **Components:** [list with types]
> **Connections:** [list of edges]
>
> Does this look right? Should I add, remove, or rename anything?"

Wait for confirmation.

---

## Phase 5: Layout Selection

| Pattern                          | Layout                | Trigger                          |
| -------------------------------- | --------------------- | -------------------------------- |
| Request/response (most web apps) | Vertical flow         | Frontend + API + DB detected     |
| Data pipeline / ETL              | Horizontal pipeline   | Linear transform chain           |
| Event-driven / microservices     | Hub and spoke         | Message broker detected          |
| Monolith with modules            | Vertical flow + zones | Single service, multiple modules |

Default: vertical flow. Hybrid: vertical with event bus in middle layer.

---

## Phase 6: Generate Diagram

Use the active rendering mode (MCP or file-based).
Follow sizing rules and color palette from SKILL.md.

**Label format** per box:

```
ComponentName
tech-stack
(key detail)
```

---

## Constraints

- Max 12 components per diagram — group if more found
- Max 20 arrows — primary data flow only, secondary as dashed
- Always include title: `{ProjectName} Architecture Overview`
- Include legend if >3 colors used

## Grouping (>12 components)

1. Group by top-level directory
2. If directory has >3 components, collapse into one zone
3. Show zone as dashed rectangle with summary box
4. Offer drill-down

## Edge Cases

| Situation                | Action                                      |
| ------------------------ | ------------------------------------------- |
| Empty repo (<5 files)    | Simple module diagram                       |
| Monorepo                 | Package-level view, offer drill-down        |
| No clear architecture    | File dependency graph                       |
| Can't detect connections | Components without arrows, note to user     |
| Subdirectory specified   | Scope analysis to that dir only             |
| Context budget exceeded  | Partial results, tell user what was skipped |
