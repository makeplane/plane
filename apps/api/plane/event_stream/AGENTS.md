# Event Stream Module

Real-time event processing using PostgreSQL outbox pattern.

## Purpose

Provides real-time event streaming with guaranteed delivery using the transactional outbox pattern.

## Models

### Outbox

Event storage with processing tracking.

**Key Fields**:

- `event_type`: Type of event
- `payload`: Event data (JSON)
- `processed_at`: When event was processed (null = unprocessed)

### Proxy Models

- `IssueProxy`
- `CycleIssueProxy`
- Other entity proxies for event generation

## Event Flow

1. Database triggers capture entity changes
2. Events written to Outbox table (transactional)
3. Async pollers fetch unprocessed events in batches
4. Handlers process events with full entity data
5. Events marked as processed with timestamp

## Performance

| Metric             | Value                            |
| ------------------ | -------------------------------- |
| Throughput         | 1,000-5,000+ events/sec          |
| Latency            | <250ms typical, <100ms optimized |
| Batch Size         | 50-1000 (configurable)           |
| Concurrent Pollers | 1-10+ (configurable)             |

## Components

### Publisher

Interface for publishing events to the outbox.

### OutboxPoller

Async polling from outbox table:

- Batch processing
- Memory monitoring with automatic restarts
- Configurable concurrency

### Management Command

```bash
python manage.py outbox_poller
```

Runs the async event processor.

## Configuration

- Batch sizes: 50-1000
- Concurrent pollers: 1-10+
- Memory monitoring enabled
