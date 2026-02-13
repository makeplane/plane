# Incremental Loading & ETL Logs

> **Note:** Core naming conventions, workflow, and checklist are in `SKILL.md` or `db-design.md` (always loaded).

Guidelines for designing schemas to support periodic data loading with tracking and control.

---

## 1. Source Tables Requirements

All source tables that need to support incremental loading must have:

```sql
-- Required audit columns
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- Index for incremental query
CREATE INDEX idx_tablename_updated_at ON tablename(updated_at);
```

### Soft delete support

If source has soft delete, need to track deleted records too:

```sql
deleted_at TIMESTAMP NULL

-- Index to get all modified records (update or delete)
CREATE INDEX idx_tablename_modified ON tablename(updated_at);
```

---

## 2. ETL Control Tables

### etl_jobs - Job definitions

```sql
CREATE TABLE etl_jobs (
    job_id VARCHAR(100) PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    description TEXT,
    source_table VARCHAR(255),
    target_table VARCHAR(255),
    load_type VARCHAR(50) NOT NULL,         -- 'full', 'incremental', 'cdc'
    schedule VARCHAR(100),                   -- Cron: '0 */1 * * *'
    is_active BOOLEAN DEFAULT TRUE,
    timeout_seconds INT DEFAULT 3600,
    retry_count INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_etl_jobs_active (is_active)
);
```

### etl_job_runs - Execution tracking

```sql
CREATE TABLE etl_job_runs (
    run_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id VARCHAR(100) NOT NULL,
    run_status VARCHAR(50) NOT NULL,        -- 'running', 'success', 'failed', 'cancelled'
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL,
    duration_seconds INT,
    -- Metrics
    rows_read BIGINT DEFAULT 0,
    rows_written BIGINT DEFAULT 0,
    rows_updated BIGINT DEFAULT 0,
    rows_deleted BIGINT DEFAULT 0,
    -- Watermarks
    watermark_start TIMESTAMP NULL,
    watermark_end TIMESTAMP NULL,
    -- Error info
    error_message TEXT,
    error_details JSON,
    -- Metadata
    triggered_by VARCHAR(100),              -- 'scheduler', 'manual', 'api'

    INDEX idx_etl_runs_job (job_id, started_at DESC),
    INDEX idx_etl_runs_status (run_status, started_at),
    FOREIGN KEY (job_id) REFERENCES etl_jobs(job_id)
);
```

### etl_watermarks - Checkpoint tracking

```sql
CREATE TABLE etl_watermarks (
    job_id VARCHAR(100) NOT NULL,
    source_table VARCHAR(255) NOT NULL,
    watermark_column VARCHAR(100) NOT NULL,  -- 'updated_at', 'id'
    watermark_type VARCHAR(50) NOT NULL,     -- 'timestamp', 'integer'
    last_value_timestamp TIMESTAMP NULL,
    last_value_integer BIGINT NULL,
    last_successful_run_id BIGINT,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (job_id, source_table),
    FOREIGN KEY (job_id) REFERENCES etl_jobs(job_id)
);
```

---

## 3. Incremental Load Patterns

### Timestamp-based (most common)

```sql
-- Query incremental data from source
SELECT * FROM orders
WHERE updated_at > :last_watermark
  AND updated_at <= :current_watermark
ORDER BY updated_at;

-- Update watermark AFTER successful load
UPDATE etl_watermarks
SET last_value_timestamp = :current_watermark,
    last_successful_run_id = :run_id,
    last_updated_at = CURRENT_TIMESTAMP
WHERE job_id = :job_id AND source_table = 'orders';
```

### ID-based (for append-only tables)

```sql
-- Query incremental data
SELECT * FROM events
WHERE id > :last_id
ORDER BY id
LIMIT 10000;

-- Update watermark
UPDATE etl_watermarks
SET last_value_integer = :max_id_loaded,
    last_successful_run_id = :run_id
WHERE job_id = :job_id;
```

### Combined (timestamp + ID)

```sql
SELECT * FROM orders
WHERE (updated_at > :last_timestamp)
   OR (updated_at = :last_timestamp AND id > :last_id)
ORDER BY updated_at, id
LIMIT 10000;
```

---

## 4. Example Queries

### Get latest job status

```sql
SELECT
    j.job_id, j.job_name, j.load_type,
    r.run_status, r.started_at, r.finished_at,
    r.rows_written, r.error_message
FROM etl_jobs j
LEFT JOIN (
    SELECT * FROM etl_job_runs r1
    WHERE started_at = (
        SELECT MAX(started_at) FROM etl_job_runs r2
        WHERE r2.job_id = r1.job_id
    )
) r ON j.job_id = r.job_id
WHERE j.is_active = TRUE;
```

### Jobs failed in last 24 hours

```sql
SELECT j.job_name, r.run_id, r.started_at, r.error_message
FROM etl_job_runs r
JOIN etl_jobs j ON r.job_id = j.job_id
WHERE r.run_status = 'failed'
  AND r.started_at >= NOW() - INTERVAL 24 HOUR;
```

---

## 5. Best Practices

### Watermark management
- Commit watermark **AFTER** data has been successfully loaded
- Use transactions to ensure consistency
- Store both watermark_start and watermark_end for each run

### Error handling
- Log enough context for debugging: source_record_id, source_data, error_stack
- Classify errors: retryable vs non-retryable
- Set up alerts for critical failures

### Retention policy
- Keep detailed logs: 30-90 days
- Keep summary: 1-2 years
- Keep watermarks: indefinitely

---

## Checklist

- [ ] Source tables have `updated_at` with index
- [ ] ETL control tables created
- [ ] Watermark committed AFTER successful load
- [ ] Sufficient logging for debugging: rows, timestamps, errors
- [ ] Retention policy for ETL logs (30-90 days)
- [ ] Alerts for failed jobs
