# Outbox Pattern Architecture Analysis

## Overview

Plane implements the **Transactional Outbox Pattern** to create a reliable event stream from PostgreSQL database changes. The system captures entity mutations (issues, cycles, modules, labels, states) via PostgreSQL triggers, writes them atomically into an `outbox` table within the same transaction, and then asynchronously polls and publishes those events to RabbitMQ for downstream consumers.

---

## How the System Works

### End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                │
│                                                                  │
│  ┌─────────┐    AFTER trigger    ┌─────────┐                     │
│  │  Issue   │ ──────────────────>│  Outbox  │  (same transaction)│
│  │  Label   │                    │  Table   │                     │
│  │  State   │                    │          │                     │
│  │  Cycle   │                    └────┬─────┘                     │
│  │  Module  │                         │                           │
│  └─────────┘                         │                           │
└──────────────────────────────────────┼───────────────────────────┘
                                       │
                              async poll (250ms–2s)
                                       │
                              ┌────────▼─────────┐
                              │  Outbox Poller    │
                              │  (async Python,   │
                              │   psycopg3 pool)  │
                              └────────┬─────────┘
                                       │
                              publish to RabbitMQ
                                       │
                              ┌────────▼─────────┐
                              │  RabbitMQ Fanout  │
                              │  Exchange         │
                              │  (plane.event_    │
                              │   stream)         │
                              └───┬──────────┬────┘
                                  │          │
                    ┌─────────────▼┐   ┌─────▼──────────────┐
                    │  Webhook     │   │  Automation         │
                    │  Consumer    │   │  Consumer           │
                    │  Queue       │   │  Queue              │
                    └─────────────┘   └─────────────────────┘
                          │                    │
                     Celery task          Celery task
                    (webhook send)     (automation engine)
```

### Phase 1: Event Capture (PostgreSQL Triggers)

**Files:** `event_stream/models/issue.py`, `cycle.py`, `module.py`, `label.py`, `state.py`

Django proxy models use the `django-pgtrigger` library to install `AFTER INSERT/UPDATE` PostgreSQL triggers on core tables. When a row is inserted or updated, the trigger:

1. Determines the event type (e.g., `workitem.created`, `workitem.updated`, `label.deleted`)
2. Builds a JSON payload with `data` (new state) and `previous_attributes` (changed fields or old state)
3. Inserts a row into the `outbox` table **within the same database transaction**
4. Uses `ON CONFLICT DO NOTHING` to silently skip duplicate event IDs
5. Wraps the outbox insert in `BEGIN...EXCEPTION WHEN others THEN RAISE WARNING` so a failure in the outbox insert **never** blocks the original DML operation

**Tracked entities and event types:**

| Entity        | Events                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Issue         | `workitem.created`, `workitem.updated`, `workitem.deleted`, `epic.created`, `epic.updated`, `epic.deleted` |
| IssueAssignee | `workitem.updated` (assignee changes)                                                                      |
| IssueLabel    | `workitem.updated` (label changes)                                                                         |
| IssueComment  | `workitem.comment.created`, `.updated`, `.deleted`                                                         |
| IssueLink     | `workitem.link.created`, `.updated`, `.deleted`                                                            |
| IssueRelation | `workitem.relation.created`, `.deleted`                                                                    |
| FileAsset     | `workitem.attachment.created`, `.deleted`                                                                  |
| CycleIssue    | `workitem.cycle.added`, `.removed`, `.moved`                                                               |
| ModuleIssue   | `workitem.module.added`, `.removed`, `.moved`                                                              |
| Label         | `label.created`, `.updated`, `.deleted`                                                                    |
| State         | `state.created`, `.updated`, `.deleted`                                                                    |

**Notable trigger details:**

- Issue triggers filter out `description_html`, `description_binary`, `description`, `description_stripped` from payloads to avoid large payloads
- Issue triggers enrich the payload with current `assignee_ids` and `label_ids` via subqueries
- Update triggers perform column-by-column diff (using `information_schema.columns`) to detect actual changes and record only changed fields in `previous_attributes`
- Soft deletes (`deleted_at` changing from NULL to NOT NULL) are detected and emitted as `.deleted` events
- The `initiator_type` is pulled from `current_setting('plane.initiator_type', true)`, defaulting to `'USER'`, allowing the application to set session-level context (e.g., `SYSTEM.IMPORT`, `SYSTEM.AUTOMATION`)

### Phase 2: The Outbox Table

**File:** `event_stream/models/outbox.py`

```
outbox table:
  id            BIGSERIAL PRIMARY KEY
  event_id      UUID (unique, immutable)
  event_type    VARCHAR(255)
  entity_type   VARCHAR(255)
  entity_id     UUID
  payload       JSONB
  workspace_id  UUID
  project_id    UUID (nullable)
  initiator_id  UUID (nullable)
  initiator_type VARCHAR(255) [default: 'USER']
  created_at    TIMESTAMP
  claimed_at    TIMESTAMP (nullable)
  processed_at  TIMESTAMP (nullable)
```

**Indexes (partial, for performance):**

- `outbox_unclaimed_unprocessed`: Covers `(claimed_at, processed_at, id)` WHERE `claimed_at IS NULL AND processed_at IS NULL` — keeps the hot polling query fast
- `outbox_processed_idx`: Covers `(processed_at)` WHERE `processed_at IS NOT NULL` — for the cleanup job

**Three-state lifecycle:**

1. **Unclaimed** (`claimed_at IS NULL, processed_at IS NULL`) — freshly inserted, waiting to be picked up
2. **Claimed** (`claimed_at IS NOT NULL, processed_at IS NULL`) — a poller instance has locked this row
3. **Processed** (`processed_at IS NOT NULL`) — successfully published to RabbitMQ

### Phase 3: Outbox Poller (Claim & Publish)

**File:** `event_stream/management/commands/outbox_poller.py`

A long-running async management command (`python manage.py outbox_poller`) that:

1. **Maintains a `psycopg3` async connection pool** (configurable 2–10 connections, with health checks, max idle, max lifetime)
2. **Polls in a loop** with adaptive backoff:
   - Starts at `INTERVAL_MIN` (default 250ms)
   - Doubles delay every 5 consecutive empty cycles, up to `INTERVAL_MAX` (default 2s)
   - Resets to `INTERVAL_MIN` when events are found
3. **Claims a batch** using `SELECT ... FOR UPDATE SKIP LOCKED`:
   ```sql
   UPDATE outbox
      SET claimed_at = NOW()
    WHERE id IN (
        SELECT id FROM outbox
         WHERE processed_at IS NULL
           AND claimed_at IS NULL
         ORDER BY id
         LIMIT $batch_size
         FOR UPDATE SKIP LOCKED
    )
    RETURNING id, event_id, event_type, ...;
   ```
   This enables **multiple poller instances** to run concurrently without contention.
4. **Publishes each event** to RabbitMQ via `EventStreamPublisher`
5. **Marks events as processed** in a single batch UPDATE
6. **Monitors memory** and self-restarts (via `os.execv`) if RSS exceeds the limit (default 500MB)
7. **Handles graceful shutdown** on SIGTERM/SIGINT/SIGQUIT

### Phase 4: RabbitMQ Publisher

**File:** `event_stream/publisher.py`

- Declares a **durable fanout exchange** (`plane.event_stream`)
- Publishes messages with `delivery_mode=2` (persistent)
- Thread-safe via `threading.RLock`
- Retry with exponential backoff (default 3 attempts)
- AWS Secrets Manager integration for AmazonMQ credentials with auto-refresh on auth failure

### Phase 5: Downstream Consumers

**Fanout topology:** Every consumer gets every message. Each consumer manages its own queue and binding.

#### Webhook Consumer (`webhook/consumer.py`)

- Extends `BaseConsumer`
- Queue: configured per deployment
- Dead Letter Queue with 7-day TTL
- Main queue with 1-hour TTL
- Simply dispatches to `process_webhook_event.delay(body=body)` via Celery
- ACK/NACK based on dispatch success

#### Automation Consumer (`automations/consumer.py`)

- Standalone consumer (does not extend `BaseConsumer`)
- Queue: `plane.event_stream.automations`
- Filters events by prefix (`workitem.`, `issue.`)
- Skips system-originated events (`initiator_type.startswith("SYSTEM.")`)
- **Exactly-once processing** via `ProcessedAutomationEvent` table (uses `IntegrityError` on unique `event_id` to deduplicate)
- Dispatches to `execute_automation_task.delay(event_data)` via Celery

### Phase 6: Outbox Cleanup

**File:** `event_stream/bgtasks/outbox_cleaner.py`

A Celery beat task that runs periodically to:

1. Select processed outbox records older than `OUTBOX_CLEANER_CUTOFF_DAYS` (default 2 days)
2. Archive them to MongoDB (if configured) for audit/analytics
3. Delete them from PostgreSQL in batches of 1000
4. If `ENABLE_OUTBOX_POLLER` is off, cleans up based on `created_at` instead of `processed_at`

---

## Current Flaws & Risks

### 1. Claimed-but-never-processed events (Stuck Claims) — CRITICAL

**The Problem:** If the poller claims a batch (sets `claimed_at`) but crashes before publishing or marking `processed_at`, those rows are **permanently stuck**. No mechanism exists to reclaim them.

The query `WHERE processed_at IS NULL AND claimed_at IS NULL` explicitly skips claimed rows. There is no timeout-based reclaim (e.g., "if `claimed_at` is older than 5 minutes and `processed_at IS NULL`, treat as unclaimed").

**Impact:** Events silently lost. Downstream consumers never see them.

**Fix:** Add a reclaim mechanism:

```sql
-- Reclaim rows that were claimed more than N minutes ago but never processed
UPDATE outbox SET claimed_at = NULL
WHERE claimed_at < NOW() - INTERVAL '5 minutes'
  AND processed_at IS NULL;
```

This could run as a periodic Celery task or be integrated into the poller loop.

### 2. Trigger failure silently drops events — MODERATE

**The Problem:** Every trigger wraps the outbox INSERT in `EXCEPTION WHEN others THEN RAISE WARNING`. If the outbox insert fails for any reason (e.g., constraint violation, disk full), the original DML succeeds but the event is never recorded.

**Impact:** Silent event loss. The entity changes but no event is ever emitted.

**Tradeoff:** This is a deliberate design choice — the alternative (letting the trigger failure block the business operation) could cause availability issues. But there's no alerting or monitoring on these `RAISE WARNING` messages.

**Fix:**

- Monitor PostgreSQL logs for these warnings
- Add a reconciliation mechanism that periodically compares entity `updated_at` timestamps against the latest outbox event for each entity
- Consider a fallback table that captures failed outbox inserts

### 3. No publisher-side acknowledgment / at-least-once guarantee gap — MODERATE

**The Problem:** The publisher uses `mandatory=False` which means if the exchange has no bound queues (e.g., consumers haven't started yet), messages are silently dropped by RabbitMQ. The publish also doesn't use **publisher confirms** (`confirm_delivery`), so there's no positive acknowledgment from RabbitMQ that the message was persisted.

Despite this, the poller marks the outbox row as processed based on the `publish()` return value, which only reflects that `basic_publish` didn't throw — not that RabbitMQ accepted and persisted the message.

**Impact:** Potential message loss between publisher and broker.

**Fix:**

- Enable publisher confirms: `channel.confirm_delivery()` + check return from `basic_publish`
- Set `mandatory=True` and handle `basic_return` callback for unroutable messages
- Only mark as processed after confirmed delivery

### 4. Outbox cleaner archives to MongoDB before deleting — data loss risk — LOW-MODERATE

**The Problem:** In `flush_to_mongo_and_delete()`, if the MongoDB bulk write fails, the code logs the error but **continues to delete from PostgreSQL**:

```python
except BulkWriteError as bwe:
    logger.error(f"MongoDB bulk write error: {str(bwe)}")
    # Continue with deletion even if MongoDB insert fails  <-- DATA LOSS
```

**Impact:** Audit/analytics data permanently lost if MongoDB write fails.

**Fix:** Only delete from PostgreSQL after confirmed MongoDB write. Return early on MongoDB failure and retry in the next run.

### 5. AutomationConsumer doesn't extend BaseConsumer — code duplication

**The Problem:** `AutomationConsumer` duplicates all the connection management, signal handling, queue setup, and retry logic from `BaseConsumer` instead of extending it (unlike `WebhookConsumer` which properly extends `BaseConsumer`).

**Impact:** Maintenance burden, divergent behavior. The automation consumer has a stale DLQ exchange name (`plane_event_stream_dlq` vs `plane.event_stream.dlq` in BaseConsumer), and several TODO comments about hardcoded values.

### 6. Label/State triggers use `information_schema.columns` per-row — PERFORMANCE

**The Problem:** Update triggers for `Label` and `State` query `information_schema.columns` dynamically to enumerate fields for diffing. This is executed for **every single row update**, even if nothing changed.

**Impact:** Slower trigger execution, especially under bulk updates. `information_schema` queries involve catalog lookups.

**Fix:** Hardcode the tracked column list in the trigger body, or use a static PL/pgSQL function that caches the column list.

### 7. No ordering guarantee across consumers

**The Problem:** The fanout exchange delivers copies of messages to each consumer queue independently. Within a single consumer, ordering is preserved by queue FIFO. However, if a message is NACKed and sent to the DLQ, then later reprocessed, ordering is broken.

**Impact:** Downstream systems may see events out of order (e.g., `workitem.updated` before `workitem.created` if the create was NACKed).

### 8. Memory-based restart uses `os.execv` — operational risk

**The Problem:** When the poller exceeds its memory limit, it calls `os.execv(sys.executable, [sys.executable] + sys.argv)` which replaces the current process in-place. In a containerized environment (Kubernetes), this might confuse health checks, liveness probes, or PID-based monitoring.

**Impact:** Could cause unexpected behavior in orchestrated environments.

**Fix:** Exit with a specific code and let the container orchestrator handle restart. The code already supports `RESTART_EXIT_CODE = 100` but then intercepts it with `os.execv`.

---

## Fault Tolerance Assessment

| Scenario                                                 | Tolerant? | Details                                                                                                                                   |
| -------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **App crash during DML**                                 | Yes       | PostgreSQL transaction rollback means both the entity change and outbox insert are rolled back atomically                                 |
| **Trigger failure**                                      | Partially | Entity change succeeds, outbox event is silently dropped. Business operation is not impacted.                                             |
| **Poller crash before publish**                          | **No**    | Claimed events are stuck forever (no reclaim mechanism)                                                                                   |
| **Poller crash after publish, before marking processed** | Partially | Events may be re-published (at-least-once) once reclaim is implemented, but currently they're stuck                                       |
| **RabbitMQ down**                                        | Yes       | Poller retries with exponential backoff (3 attempts), then the event stays claimed. However, with no reclaim, this becomes a stuck event. |
| **Consumer crash**                                       | Yes       | RabbitMQ redelivers unacked messages. DLQ catches poison messages.                                                                        |
| **Database connection loss (poller)**                    | Yes       | Async connection pool with health checks, reconnection, and psycopg3 built-in retry                                                       |
| **Database connection loss (consumer)**                  | Partially | Consumers detect `OperationalError` and exit; automation consumer retries once then exits                                                 |
| **MongoDB down during cleanup**                          | **No**    | Data is deleted from PostgreSQL even if MongoDB archive fails                                                                             |
| **Multiple poller instances**                            | Yes       | `FOR UPDATE SKIP LOCKED` prevents double-processing                                                                                       |
| **Duplicate events**                                     | Partially | `ON CONFLICT DO NOTHING` at trigger level; automation consumer has `ProcessedAutomationEvent` dedup table; webhook consumer has no dedup  |

**Overall verdict:** The system is **partially fault-tolerant**. The happy path is well-designed, but the stuck-claims issue is a significant gap that can cause silent event loss in production.

---

## Pros of This Implementation

1. **Transactional consistency** — Events are written in the same transaction as the entity change. No dual-write problem. If the business operation fails, no event is emitted.

2. **No application-level event emission** — Triggers capture events at the database level, meaning any code path that mutates the database (ORM, raw SQL, bulk operations, migrations) automatically generates events. No risk of forgetting to emit an event.

3. **Scalable polling with `SKIP LOCKED`** — Multiple poller instances can run concurrently without coordination, using PostgreSQL's native row-level locking to partition work.

4. **Fanout exchange enables decoupled consumers** — Adding a new consumer (e.g., analytics, real-time push) requires zero changes to the publisher. Just bind a new queue.

5. **Adaptive polling** — Exponential backoff on empty cycles reduces unnecessary database load during quiet periods, while snapping back to fast polling when events arrive.

6. **Rich change tracking** — Update triggers capture `previous_attributes` (old values), enabling consumers to know exactly what changed without querying the database.

7. **Memory safety** — The poller self-monitors RSS and restarts before OOM, which is important for a long-running process.

8. **Graceful shutdown** — Proper signal handling (SIGTERM/SIGINT/SIGQUIT) with in-flight message draining.

9. **Connection resilience** — Both the poller (psycopg3 pool) and publisher (pika) have reconnection logic with health checks and credential refresh for cloud deployments.

10. **Soft-delete awareness** — Triggers correctly detect soft deletes (`deleted_at` transitions) and emit `.deleted` events, aligning with Plane's soft-delete model.

---

## Cons of This Implementation

1. **Polling latency** — Events are not pushed; they're polled. Best case latency is 250ms (INTERVAL_MIN), worst case is 2s (INTERVAL_MAX) during quiet periods. Not suitable for sub-100ms real-time requirements.

2. **PostgreSQL as event store** — The outbox table grows with every mutation. Under heavy write load, this can cause table bloat, increased WAL volume, and vacuum pressure. The partial indexes mitigate query cost but not storage/maintenance cost.

3. **Complex PL/pgSQL triggers** — Trigger functions are verbose, duplicated across entities, and hard to test. The `information_schema` dynamic column diffing is particularly fragile. Changes to table schemas require trigger updates.

4. **No dead-letter / retry for stuck claims** — The single biggest operational risk. A simple process crash can orphan events permanently.

5. **Tight coupling to RabbitMQ** — The publisher is hardcoded to pika/RabbitMQ. Switching to Kafka, Redis Streams, or SQS would require rewriting the publisher and all consumers.

6. **No schema registry or versioning** — Event payloads are ad-hoc JSON built in PL/pgSQL triggers. There's a `"version": "1.0"` field in the publisher but no actual schema enforcement or evolution strategy. Adding/removing fields to entities can silently change event payloads.

7. **Webhook consumer has no dedup** — Unlike the automation consumer which uses `ProcessedAutomationEvent` for exactly-once processing, the webhook consumer ACKs unconditionally after dispatching to Celery. If Celery fails, the webhook may fire twice on retry.

8. **`os.execv` restart strategy** — Replaces the process in-place, which is an anti-pattern in container orchestration where the scheduler should manage restarts.

9. **No backpressure** — If the poller publishes faster than consumers can process, RabbitMQ queues grow unbounded (only TTL provides a safety valve, silently dropping old messages).

10. **Observability gaps** — Trigger failures produce PostgreSQL warnings (not errors), which are easy to miss. No metrics exported for outbox table depth, claim age, publish latency, or consumer lag.

---

## Recommendations for Improvement

### High Priority

1. **Implement claim timeout / reclaim mechanism**
   - Add a periodic task that resets `claimed_at = NULL` for rows where `claimed_at < NOW() - INTERVAL '5 minutes' AND processed_at IS NULL`
   - Add a `claim_count` column to detect poison events that keep failing

2. **Enable RabbitMQ publisher confirms**
   - Call `channel.confirm_delivery()` on connect
   - Only mark outbox rows as processed after confirmed delivery

3. **Fix MongoDB archive-then-delete ordering**
   - Do not delete from PostgreSQL if MongoDB write fails

### Medium Priority

4. **Add observability**
   - Export metrics: outbox depth (unclaimed), oldest unclaimed age, oldest claimed age, publish rate, consumer lag
   - Alert on trigger warnings in PostgreSQL logs
   - Add structured logging with event correlation IDs

5. **Refactor AutomationConsumer to extend BaseConsumer**
   - Eliminate code duplication
   - Standardize DLQ exchange naming

6. **Optimize label/state triggers**
   - Replace `information_schema.columns` queries with hardcoded column lists
   - Or use a shared PL/pgSQL function

### Low Priority

7. **Add event schema versioning**
   - Include schema version in payload
   - Document event contracts for consumers

8. **Replace `os.execv` with clean exit**
   - Exit with `RESTART_EXIT_CODE` and let Kubernetes/supervisor handle restart

9. **Consider CDC as alternative**
   - For higher throughput needs, evaluate PostgreSQL logical replication / Debezium as an alternative to trigger-based capture
   - This would eliminate trigger complexity and reduce write amplification

---

## Architecture Comparison

| Aspect                 | Current (Outbox + Polling)    | Alternative (CDC / Debezium)    |
| ---------------------- | ----------------------------- | ------------------------------- |
| Consistency            | Strong (same transaction)     | Strong (WAL-based)              |
| Latency                | 250ms–2s                      | Sub-100ms                       |
| Write amplification    | 2x (entity + outbox)          | 1x (WAL is free)                |
| Schema changes         | Manual trigger updates        | Automatic from WAL              |
| Operational complexity | Moderate (poller + RabbitMQ)  | High (Kafka Connect + Debezium) |
| Payload control        | Full (trigger builds payload) | Limited (row-level changes)     |
| Infrastructure         | PostgreSQL + RabbitMQ         | PostgreSQL + Kafka + Debezium   |

The current approach is a reasonable choice for Plane's scale, with the outbox pattern being well-understood and requiring no additional infrastructure beyond RabbitMQ. The main risk is operational (stuck claims) rather than architectural.
