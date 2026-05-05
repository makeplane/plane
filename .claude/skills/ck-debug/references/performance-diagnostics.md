# Performance Diagnostics

Identify bottlenecks, analyze query performance, and develop optimization strategies.

## When to Use

- Response times increased significantly
- Application feels slow or unresponsive
- Database queries taking too long
- High CPU/memory/disk usage
- Resource exhaustion or OOM errors

## Diagnostic Process

### 1. Quantify the Problem

**Measure before optimizing.** Establish baseline and current state.

- What is the expected response time vs actual?
- When did degradation start? (correlate with changes)
- Which endpoints/operations are affected?
- Is it consistent or intermittent?

### 2. Identify the Bottleneck Layer

```
Request → Network → Web Server → Application → Database → Filesystem
                                      ↓
                              External APIs / Services
```

**Elimination approach:** Measure time at each layer to find where delay occurs.

| Layer | Check | Tool |
|-------|-------|------|
| Network | Latency, DNS, TLS | `curl -w` timing, network logs |
| Web server | Request queue, connections | Server metrics, access logs |
| Application | CPU profiling, memory | Profiler, APM, `process.memoryUsage()` |
| Database | Query time, connections | `EXPLAIN ANALYZE`, `pg_stat_statements` |
| Filesystem | I/O wait, disk usage | `iostat`, `df -h` |
| External APIs | Response time, timeouts | Request logging with durations |

### 3. Database Performance

#### PostgreSQL Diagnostics

```sql
-- Slow queries (requires pg_stat_statements extension)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 20;

-- Active queries right now
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Table sizes and bloat
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC LIMIT 20;

-- Missing indexes (sequential scans on large tables)
SELECT relname, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND seq_tup_read > 10000
ORDER BY seq_tup_read DESC;

-- Connection pool status
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
```

#### Query Optimization

```sql
-- Analyze specific query execution plan
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <your-query>;
```

**Look for:** Sequential scans on large tables, nested loops with high row counts, sorts without indexes, excessive buffer hits.

### 4. Application Performance

**Common bottlenecks:**

| Issue | Symptom | Fix |
|-------|---------|-----|
| N+1 queries | Many small DB calls per request | Eager loading, batch queries |
| Memory leaks | Growing memory over time | Profile heap, check event listeners |
| Blocking I/O | High response time, low CPU | Async operations, connection pooling |
| CPU-bound | High CPU, proportional to load | Optimize algorithms, caching |
| Connection exhaustion | Intermittent timeouts | Pool sizing, connection reuse |
| Large payloads | Slow transfers, high memory | Pagination, compression, streaming |

### 5. Optimization Strategy

**Priority order:**
1. **Quick wins** - Add missing index, fix N+1 query, enable caching
2. **Configuration** - Pool sizes, timeouts, buffer sizes, worker counts
3. **Code changes** - Algorithm optimization, data structure changes
4. **Architecture** - Caching layer, read replicas, async processing, CDN

**Always:** Measure after each change to verify improvement. One change at a time.

## Reporting Performance Issues

Include in diagnostic report:
- **Baseline vs current** metrics (with numbers)
- **Bottleneck identification** with evidence
- **Root cause** explanation
- **Recommended fixes** with expected impact
- **Verification plan** to confirm improvement
