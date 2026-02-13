# PostgreSQL Administration

User management, backups, replication, maintenance, and production database administration.

## User and Role Management

### Create Users
```sql
-- Create user with password
CREATE USER appuser WITH PASSWORD 'secure_password';

-- Create superuser
CREATE USER admin WITH SUPERUSER PASSWORD 'admin_password';

-- Create role without login
CREATE ROLE readonly;

-- Create user with attributes
CREATE USER developer WITH
  PASSWORD 'dev_pass'
  CREATEDB
  VALID UNTIL '2025-12-31';
```

### Alter Users
```sql
-- Change password
ALTER USER appuser WITH PASSWORD 'new_password';

-- Add attributes
ALTER USER appuser WITH CREATEDB CREATEROLE;

-- Remove attributes
ALTER USER appuser WITH NOSUPERUSER;

-- Rename user
ALTER USER oldname RENAME TO newname;

-- Set connection limit
ALTER USER appuser CONNECTION LIMIT 10;
```

### Roles and Inheritance
```sql
-- Create role hierarchy
CREATE ROLE readonly;
CREATE ROLE readwrite;

-- Grant role to user
GRANT readonly TO appuser;
GRANT readwrite TO developer;

-- Revoke role
REVOKE readonly FROM appuser;

-- Role membership
\du
```

### Permissions

#### Database Level
```sql
-- Grant database access
GRANT CONNECT ON DATABASE mydb TO appuser;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO appuser;

-- Revoke access
REVOKE CONNECT ON DATABASE mydb FROM appuser;
```

#### Table Level
```sql
-- Grant table permissions
GRANT SELECT ON users TO appuser;
GRANT SELECT, INSERT, UPDATE ON orders TO appuser;
GRANT ALL PRIVILEGES ON products TO appuser;

-- Grant on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Revoke permissions
REVOKE INSERT ON users FROM appuser;
```

#### Column Level
```sql
-- Grant specific columns
GRANT SELECT (id, name, email) ON users TO appuser;
GRANT UPDATE (status) ON orders TO appuser;
```

#### Sequence Permissions
```sql
-- Grant sequence usage (for SERIAL/auto-increment)
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO appuser;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO appuser;
```

#### Function Permissions
```sql
-- Grant execute on function
GRANT EXECUTE ON FUNCTION get_user(integer) TO appuser;
```

### Default Privileges
```sql
-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO readwrite;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE ON SEQUENCES TO readwrite;
```

### View Permissions
```sql
-- Show table permissions
\dp users

-- Show role memberships
\du

-- Query permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'users';
```

## Backup and Restore

### pg_dump (Logical Backup)
```bash
# Dump database to SQL file
pg_dump mydb > mydb.sql

# Custom format (compressed, allows selective restore)
pg_dump -Fc mydb > mydb.dump

# Directory format (parallel dump)
pg_dump -Fd mydb -j 4 -f mydb_dir

# Specific table
pg_dump -t users mydb > users.sql

# Multiple tables
pg_dump -t users -t orders mydb > tables.sql

# Schema only
pg_dump -s mydb > schema.sql

# Data only
pg_dump -a mydb > data.sql

# Exclude table
pg_dump --exclude-table=logs mydb > mydb.sql

# With compression
pg_dump -Fc -Z 9 mydb > mydb.dump
```

### pg_dumpall (All Databases)
```bash
# Dump all databases
pg_dumpall > all_databases.sql

# Only globals (roles, tablespaces)
pg_dumpall --globals-only > globals.sql
```

### pg_restore
```bash
# Restore from custom format
pg_restore -d mydb mydb.dump

# Restore specific table
pg_restore -d mydb -t users mydb.dump

# List contents
pg_restore -l mydb.dump

# Parallel restore
pg_restore -d mydb -j 4 mydb.dump

# Clean database first
pg_restore -d mydb --clean mydb.dump

# Create database if not exists
pg_restore -C -d postgres mydb.dump
```

### Restore from SQL
```bash
# Restore SQL dump
psql mydb < mydb.sql

# Create database and restore
createdb mydb
psql mydb < mydb.sql

# Single transaction
psql -1 mydb < mydb.sql

# Stop on error
psql --set ON_ERROR_STOP=on mydb < mydb.sql
```

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

# Configuration
DB_NAME="mydb"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup
pg_dump -Fc "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"

# Remove old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -mtime +$RETENTION_DAYS -delete

# Log
echo "Backup completed: ${DB_NAME}_${DATE}.dump"
```

### Point-in-Time Recovery (PITR)
```bash
# Enable WAL archiving (postgresql.conf)
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
max_wal_senders = 3

# Base backup
pg_basebackup -D /backup/base -Ft -z -P

# Restore to point in time
# 1. Stop PostgreSQL
# 2. Restore base backup
# 3. Create recovery.conf with recovery_target_time
# 4. Start PostgreSQL
```

## Replication

### Streaming Replication (Primary-Replica)

#### Primary Setup
```sql
-- Create replication user
CREATE USER replicator WITH REPLICATION PASSWORD 'replica_pass';

-- Configure postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_size = 64MB

-- Configure pg_hba.conf
host replication replicator replica_ip/32 md5
```

#### Replica Setup
```bash
# Stop replica PostgreSQL
systemctl stop postgresql

# Remove data directory
rm -rf /var/lib/postgresql/data/*

# Clone from primary
pg_basebackup -h primary_host -D /var/lib/postgresql/data -U replicator -P -R

# Start replica
systemctl start postgresql

# Check replication status
SELECT * FROM pg_stat_replication;  -- On primary
```

### Logical Replication

#### Publisher (Primary)
```sql
-- Create publication
CREATE PUBLICATION my_publication FOR ALL TABLES;

-- Or specific tables
CREATE PUBLICATION my_publication FOR TABLE users, orders;

-- Check publications
\dRp
SELECT * FROM pg_publication;
```

#### Subscriber (Replica)
```sql
-- Create subscription
CREATE SUBSCRIPTION my_subscription
CONNECTION 'host=primary_host dbname=mydb user=replicator password=replica_pass'
PUBLICATION my_publication;

-- Check subscriptions
\dRs
SELECT * FROM pg_subscription;

-- Monitor replication
SELECT * FROM pg_stat_subscription;
```

## Monitoring

### Database Size
```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('mydb'));

-- Table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index sizes
SELECT schemaname, tablename, indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Connections
```sql
-- Current connections
SELECT count(*) FROM pg_stat_activity;

-- Connections by database
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Connection limit
SHOW max_connections;

-- Kill connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = 12345;
```

### Activity
```sql
-- Active queries
SELECT pid, usename, state, query, query_start
FROM pg_stat_activity
WHERE state != 'idle';

-- Long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Blocking queries
SELECT blocked.pid AS blocked_pid,
       blocked.query AS blocked_query,
       blocking.pid AS blocking_pid,
       blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));
```

### Cache Hit Ratio
```sql
-- Should be > 0.99 for good performance
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

### Table Bloat
```sql
-- Check for table bloat (requires pgstattuple extension)
CREATE EXTENSION pgstattuple;

SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pgstattuple(schemaname||'.'||tablename) AS stats
FROM pg_tables
WHERE schemaname = 'public';
```

## Maintenance

### VACUUM
```sql
-- Reclaim storage
VACUUM users;

-- Verbose
VACUUM VERBOSE users;

-- Full (locks table, rewrites)
VACUUM FULL users;

-- With analyze
VACUUM ANALYZE users;

-- All tables
VACUUM;
```

### Auto-Vacuum
```sql
-- Check last vacuum
SELECT schemaname, tablename, last_vacuum, last_autovacuum
FROM pg_stat_user_tables;

-- Configure postgresql.conf
autovacuum = on
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.1
```

### REINDEX
```sql
-- Rebuild index
REINDEX INDEX idx_users_email;

-- Rebuild all indexes on table
REINDEX TABLE users;

-- Rebuild database indexes
REINDEX DATABASE mydb;

-- Concurrently (doesn't lock)
REINDEX INDEX CONCURRENTLY idx_users_email;
```

### ANALYZE
```sql
-- Update statistics
ANALYZE users;

-- Specific columns
ANALYZE users(email, status);

-- All tables
ANALYZE;

-- Verbose
ANALYZE VERBOSE users;
```

## Configuration

### postgresql.conf Location
```sql
SHOW config_file;
```

### Key Settings
```conf
# Memory
shared_buffers = 4GB                 # 25% of RAM
work_mem = 64MB                      # Per operation
maintenance_work_mem = 512MB         # VACUUM, CREATE INDEX
effective_cache_size = 12GB          # OS cache estimate

# Query Planner
random_page_cost = 1.1               # Lower for SSD
effective_io_concurrency = 200       # Concurrent disk ops

# Connections
max_connections = 100
superuser_reserved_connections = 3

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_min_duration_statement = 100     # Log slow queries

# Replication
wal_level = replica
max_wal_senders = 3
wal_keep_size = 64MB

# Autovacuum
autovacuum = on
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1
```

### Reload Configuration
```sql
-- Reload config without restart
SELECT pg_reload_conf();

-- Or from shell
pg_ctl reload
```

## Security

### SSL/TLS
```conf
# postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
ssl_ca_file = '/path/to/ca.crt'
```

### pg_hba.conf (Host-Based Authentication)
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     md5

# Remote connections
host    all             all             0.0.0.0/0               md5
host    all             all             ::0/0                   md5

# Replication
host    replication     replicator      replica_ip/32           md5

# SSL required
hostssl all             all             0.0.0.0/0               md5
```

### Row Level Security
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_policy ON users
  USING (user_id = current_user_id());

-- Drop policy
DROP POLICY user_policy ON users;

-- View policies
\d+ users
```

## Best Practices

1. **Backups**
   - Daily automated backups
   - Test restores regularly
   - Store backups off-site
   - Use pg_dump custom format for flexibility

2. **Monitoring**
   - Monitor connections, queries, cache hit ratio
   - Set up alerts for critical metrics
   - Log slow queries
   - Use pg_stat_statements

3. **Security**
   - Use strong passwords
   - Restrict network access (pg_hba.conf)
   - Enable SSL/TLS
   - Regular security updates
   - Principle of least privilege

4. **Maintenance**
   - Regular VACUUM and ANALYZE
   - Monitor autovacuum
   - REINDEX periodically
   - Check for table bloat

5. **Configuration**
   - Tune for workload
   - Use connection pooling (pgBouncer)
   - Monitor and adjust memory settings
   - Keep PostgreSQL updated

6. **Replication**
   - At least one replica for HA
   - Monitor replication lag
   - Test failover procedures
   - Use logical replication for selective replication
