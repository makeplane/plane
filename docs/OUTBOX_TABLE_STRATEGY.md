# Outbox Table Strategy: Single vs. Multiple Tables

## Context

The `Outbox` table currently handles work item related events (plus `state.*` and `label.*` events) before pushing them to the event stream via RabbitMQ. As we expand event coverage to project-specific and workspace-specific events, we need to decide whether to extend the existing table or introduce separate outbox tables per domain.

## Current State

The `Outbox` table already has a generic schema — it uses `entity_type`, `event_type`, and `entity_id` fields rather than foreign keys to specific tables. It also has both `workspace_id` and a nullable `project_id`. The poller, publisher, and cleaner are all entity-agnostic — they process rows by sequential `id`, not by entity type. Non-work-item events already exist in the table: `state.created/updated/deleted` and `label.created/updated/deleted`.

### Current Schema (key columns)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `BigAutoField` | Sequential PK, guarantees global ordering |
| `event_id` | `UUIDField` | Unique event identifier |
| `event_type` | `CharField(255)` | e.g., `workitem.created`, `state.updated` |
| `entity_type` | `CharField(255)` | e.g., `issue`, `state`, `label` |
| `entity_id` | `UUIDField` | Entity UUID |
| `payload` | `JSONField` | Event data with `data` and `previous_attributes` |
| `workspace_id` | `UUIDField` | Workspace context |
| `project_id` | `UUIDField (nullable)` | Project context (null for workspace-level entities) |
| `processed_at` | `DateTimeField (nullable)` | Null = unprocessed |
| `claimed_at` | `DateTimeField (nullable)` | Null = unclaimed by poller |
| `initiator_id` | `UUIDField (nullable)` | User who triggered the event |
| `initiator_type` | `CharField` | `USER`, `SYSTEM.IMPORT`, `SYSTEM.AUTOMATION` |

### Current Infrastructure

- **Poller**: Async management command with connection pooling, `SELECT ... FOR UPDATE SKIP LOCKED`
- **Publisher**: RabbitMQ fanout exchange with retry/reconnection logic
- **Cleaner**: Celery task archiving processed events to MongoDB, deleting from PostgreSQL
- **Triggers**: PL/pgSQL triggers via `django-pgtrigger` on proxy models

---

## Option A: Single Table (Extend Current `Outbox`)

Add project events (`project.created`, `project.updated`, `project.member.added`, etc.) and workspace events (`workspace.updated`, `workspace.member.invited`, etc.) as new rows in the same table with new `entity_type` values.

### Pros

| Benefit | Detail |
|---------|--------|
| **Zero infrastructure change** | The poller, publisher, cleaner, RabbitMQ exchange, and consumer bindings all work as-is. No new management commands, no new Celery tasks, no new connection pools. |
| **Guaranteed global ordering** | The `BigAutoField` PK gives a single, monotonically increasing sequence across all event types. Consumers that care about cross-entity ordering (e.g., "project deleted after work item moved") get it for free. |
| **Simpler operations** | One table to monitor, one set of partial indexes to tune, one cleaner schedule, one archival pipeline to MongoDB. |
| **Existing patterns reuse** | The proxy-model + pgtrigger pattern is already established. Adding `ProjectProxy`, `ProjectMemberProxy`, `WorkspaceProxy` follows the identical pattern as `IssueProxy`, `LabelProxy`, `StateProxy`. |
| **Atomic cross-entity events** | If a single transaction creates a project and its default states, all events land in the same table in the same transaction — no distributed coordination needed. |
| **Consumer simplicity** | Downstream consumers (flux, silo, webhooks) receive all events from one exchange. They filter by `event_type`/`entity_type` — no need to subscribe to multiple exchanges or merge streams. |

### Cons

| Concern | Detail |
|---------|--------|
| **Table growth** | Work item events are high-volume (assignments, comments, relations). Adding project/workspace events increases row count, though these are comparatively low-volume (projects change infrequently). |
| **Index pressure** | The `outbox_unclaimed_unprocessed` partial index covers all unprocessed rows. More event types = more rows in the hot path of the index, though project/workspace events add negligible volume vs. work item churn. |
| **Noisy neighbor risk** | A burst of work item events could delay processing of a critical workspace event (e.g., `workspace.member.removed`). Mitigated by the poller's batch processing (FIFO by `id`), but no per-entity-type prioritization. |
| **Schema coupling** | All event types share the same `payload` JSON shape constraints. If workspace events need fundamentally different metadata (e.g., `organization_id` above `workspace_id`), you're adding nullable columns or overloading fields. |
| **Blast radius** | A bad migration, trigger bug, or index corruption affects all event types simultaneously. |

---

## Option B: Multiple Tables (Separate `WorkItemOutbox`, `ProjectOutbox`, `WorkspaceOutbox`)

Create dedicated outbox tables per domain, each with its own poller instance and potentially its own RabbitMQ exchange.

### Pros

| Benefit | Detail |
|---------|--------|
| **Isolation** | A work item event storm doesn't block project/workspace event processing. Each table has its own poller with independent throughput. |
| **Independent scaling** | You can tune batch sizes, polling intervals, and connection pool sizes per domain. Work items might need 250-batch aggressive polling; workspace events might use 50-batch lazy polling. |
| **Schema specialization** | Each table can have domain-specific columns. `ProjectOutbox` could have `project_id NOT NULL`; `WorkspaceOutbox` could drop `project_id` entirely. Tighter schemas, better validation at the DB level. |
| **Independent lifecycle** | Different retention policies per domain — archive work item events after 2 days but keep workspace audit events for 30 days. Different cleaners, different MongoDB collections. |
| **Fault isolation** | A trigger bug on the project table doesn't affect work item event capture. You can deploy/rollback proxy models independently. |
| **Easier partitioning later** | If one domain grows to need table partitioning (e.g., by `workspace_id`), you do it on that table without affecting others. |

### Cons

| Concern | Detail |
|---------|--------|
| **Operational overhead** | 3 poller processes instead of 1 (or a multiplexed poller with complexity). 3 cleaner tasks. 3 sets of monitoring/alerting. 3 connection pools consuming DB connections. |
| **No global ordering** | You lose the single sequence. If a consumer needs to know that `project.deleted` happened after `workitem.updated`, it must merge and sort by timestamp (which has clock-skew risk) or implement vector clocks. |
| **Cross-entity transactions** | When a single DB transaction produces events across domains (e.g., project creation triggers default states + labels), events land in different tables. Consumers must handle partial visibility. |
| **Code duplication** | The poller, publisher, and cleaner logic is identical — you'd either duplicate it or parameterize it. The proxy model + trigger pattern needs to be replicated per table. |
| **Consumer complexity** | Downstream services must subscribe to multiple exchanges (or you add a fan-in layer), increasing the surface area for message loss or ordering bugs. |
| **Migration cost** | Existing `state.*` and `label.*` events are already in the current outbox. You'd need to migrate them to the new table(s) and update all triggers atomically. |

---

## Option C (Hybrid): Single Table + Priority/Partitioning

Keep one `Outbox` table but add a `domain` or `priority` column. Use PostgreSQL declarative partitioning by domain, or have the poller fetch with priority ordering.

### Pros

- Retains global ordering and operational simplicity
- Partitioning gives physical isolation at the storage level
- Poller can prioritize workspace events over work item events with a simple `ORDER BY priority, id`
- One exchange, one consumer subscription

### Cons

- Partition management adds DBA complexity
- Priority polling can starve low-priority events under load
- Still a single poller process (unless you run one per partition)

---

## Recommendation

**Extend the single table (Option A)**, for these reasons:

1. **Volume asymmetry**: Project and workspace events are orders of magnitude less frequent than work item events. A workspace might have dozens of project changes per day vs. thousands of work item changes. The "noisy neighbor" concern is theoretical, not practical.

2. **The schema already supports it**: `entity_type` + `event_type` are generic strings, `project_id` is already nullable (perfect for workspace-level events), and the poller/publisher are entity-agnostic.

3. **Precedent exists**: `state.*` and `label.*` events are project-level entities already living in the same outbox. Adding `project.*` and `workspace.*` events is a continuation of the existing pattern, not a new architectural decision.

4. **Operational simplicity wins at this scale**: Multiple pollers, multiple cleaners, and multiple exchanges are justified when processing millions of events/hour across domains. For project/workspace events, the overhead far exceeds the benefit.

### Future Escape Hatch

If isolation becomes necessary later, you can:
- Add a `domain` column (`workitem`, `project`, `workspace`) with a partial index per domain
- Run multiple poller instances with `WHERE domain = 'X'` filters
- This gets Option B's isolation benefits without the table-split migration cost
