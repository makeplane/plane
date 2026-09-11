---
title: Tune Core Memory and Checkpoint Settings for Your Workload
impact: LOW
impactDescription: correct memory sizing avoids disk spills and excessive checkpoint I/O
tags: configuration, memory, checkpoints, tuning
---

## Tune Core Memory and Checkpoint Settings for Your Workload

Default `postgresql.conf` values are conservative for small/shared hosts. For a dedicated
production instance, size these settings to the box and workload rather than leaving defaults.

**Incorrect (defaults on a dedicated production instance):**

```
shared_buffers = 128MB       # default, far too small for a dedicated server
work_mem = 4MB                # default, causes disk spills on sort/hash-heavy queries
effective_cache_size = 4GB    # default guess, not tied to actual instance RAM
```

**Correct (sized to the instance):**

```
-- Rule of thumb starting points (verify against your workload/instance):
shared_buffers = '25% of RAM'          -- Postgres's own cache of hot pages
work_mem = 'RAM / (max_connections * 2..4)'  -- per sort/hash operation, multiplies under concurrency
effective_cache_size = '50-75% of RAM' -- planner hint for OS-level cache, not an allocation
```

Checkpoint tuning for write-heavy workloads:

```
checkpoint_timeout = '15min'           -- default 5min; longer spreads out checkpoint I/O
max_wal_size = '4GB'                   -- raise to reduce checkpoint frequency under heavy writes
checkpoint_completion_target = 0.9     -- spread checkpoint I/O across more of the interval
```

Guidance:

- **`work_mem` is per-operation, not per-connection** — a query with several sorts/hashes can use
  a multiple of `work_mem` simultaneously; size conservatively and raise only for specific
  session/query needs with `SET LOCAL work_mem`.
- **`effective_cache_size` is a planner hint only** — it does not allocate memory, it tells the
  query planner how much OS-level page cache to assume is available for index scans.
- **Autovacuum settings** (`autovacuum_vacuum_scale_factor`, `autovacuum_analyze_scale_factor`)
  are covered separately — see "Maintain Table Statistics with VACUUM and ANALYZE".
- Always benchmark configuration changes against realistic query patterns; these are starting
  points, not universal constants.

Reference: [Server Configuration](https://www.postgresql.org/docs/current/runtime-config.html)
