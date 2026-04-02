# Log & CI/CD Analysis

Collect and analyze logs from servers, CI/CD pipelines, and application layers to diagnose failures.

## GitHub Actions Analysis

### List and Inspect Runs

```bash
# List recent runs (all workflows)
gh run list --limit 10

# List runs for specific workflow
gh run list --workflow=ci.yml --limit 5

# View specific run details
gh run view <run-id>

# View failed job logs only
gh run view <run-id> --log-failed

# Download complete logs
gh run view <run-id> --log > /tmp/ci-full.txt

# Re-run failed jobs
gh run rerun <run-id> --failed
```

### Common CI/CD Failure Patterns

| Pattern | Likely Cause | Investigation |
|---------|-------------|---------------|
| Passes locally, fails CI | Environment diff | Check Node/Python version, OS, env vars |
| Intermittent failures | Race conditions, flaky tests | Run 3x, check timing, shared state |
| Timeout failures | Resource limits, infinite loops | Check resource usage, add timeouts |
| Permission errors | Token/secret misconfiguration | Verify `GITHUB_TOKEN`, secret names |
| Dependency install fails | Registry issues, version conflicts | Check lockfile, registry status |
| Build succeeds, tests fail | Test environment setup | Check test config, database setup, fixtures |

### Analyzing Failed Steps

1. **Identify which step failed** - `gh run view <id>` shows step-by-step status
2. **Get the logs** - `gh run view <id> --log-failed` for focused output
3. **Search for error patterns** - Look for `Error:`, `FAIL`, `exit code`, stack traces
4. **Check annotations** - `gh api repos/{owner}/{repo}/check-runs/{id}/annotations`

## Server Log Analysis

### Log Collection Strategy

1. **Identify log locations** - Application logs, system logs, web server logs
2. **Filter by timeframe** - Narrow to incident window
3. **Correlate request IDs** - Trace single request across services
4. **Look for patterns** - Repeated errors, error rate changes, unusual payloads

### Structured Log Queries

```bash
# Search application logs for errors (use Grep tool when possible)
# Pattern: timestamp, level, message
# Filter by time range and severity

# PostgreSQL slow query log
psql -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check database connections
psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

### Cross-Source Correlation

1. **Align timestamps** across all log sources (timezone awareness)
2. **Build timeline** - First error → propagation → user impact
3. **Identify trigger** - What changed immediately before first error?
4. **Map blast radius** - Which services/endpoints affected?

## Application Log Analysis

### Error Pattern Recognition

- **Sudden spike** → Deployment, config change, external dependency failure
- **Gradual increase** → Resource leak, data growth, degradation
- **Periodic failures** → Cron jobs, scheduled tasks, resource contention
- **Single endpoint** → Code bug, data issue, specific dependency
- **All endpoints** → Infrastructure, database, network issue

### Key Log Fields

Prioritize: timestamp, level, error message, stack trace, request ID, user ID, endpoint, response code, duration

### Evidence Preservation

Always capture relevant log excerpts for the diagnostic report. Include:
- Exact error messages and stack traces
- Timestamps and request IDs
- Before/after comparison (normal vs error state)
- Counts and frequencies
