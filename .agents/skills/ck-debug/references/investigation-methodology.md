# Investigation Methodology

Five-step structured investigation for system-level issues, incidents, and multi-component failures.

## When to Use

- Server returning 500 errors or unexpected responses
- System behavior changed without obvious code changes
- Multi-component failures spanning services/databases/infrastructure
- Need to understand "what happened" before fixing

## Step 1: Initial Assessment

**Gather scope and impact before diving in.**

1. **Collect symptoms** - Error messages, affected endpoints, user reports
2. **Identify affected components** - Which services, databases, queues involved?
3. **Determine timeframe** - When did issue start? Correlate with deployments/changes
4. **Assess severity** - Users affected? Data at risk? Revenue impact?
5. **Check recent changes** - Git log, deployment history, config changes, dependency updates

```bash
# Recent deployments
gh run list --limit 10
# Recent commits
git log --oneline -20 --since="2 days ago"
# Config changes
git diff HEAD~5 -- '*.env*' '*.config*' '*.yml' '*.yaml' '*.json'
```

## Step 2: Data Collection

**Gather evidence systematically before analysis.**

1. **Server/application logs** - Filter by timeframe and affected components
2. **CI/CD pipeline logs** - Use `gh run view <run-id> --log-failed` for GitHub Actions
3. **Database state** - Query relevant tables, check recent migrations
4. **System metrics** - CPU, memory, disk, network utilization
5. **External dependencies** - Third-party API status, DNS, CDN

```bash
# GitHub Actions: list recent workflow runs
gh run list --workflow=<workflow> --limit 5
# View failed run logs
gh run view <run-id> --log-failed
# Download full logs
gh run view <run-id> --log > /tmp/ci-logs.txt
```

**For codebase understanding:**
- Read `docs/codebase-summary.md` if exists and up-to-date (<2 days old)
- Otherwise use `ck:repomix` to generate fresh codebase summary
- Use `/ck:scout` or `/ck:scout ext` to find relevant files
- Use `ck:docs-seeker` skill for package/plugin documentation

## Step 3: Analysis Process

**Correlate evidence across sources.**

1. **Timeline reconstruction** - Order events chronologically across all log sources
2. **Pattern identification** - Recurring errors, timing patterns, affected user segments
3. **Execution path tracing** - Follow request flow through system components
4. **Database analysis** - Query performance, table relationships, data integrity
5. **Dependency mapping** - Which components depend on the failing one?

**Key questions:**
- Does issue correlate with specific deployments or time windows?
- Is it intermittent or consistent?
- Does it affect all users or a subset?
- Are there related errors in upstream/downstream services?

## Step 4: Root Cause Identification

**Systematic elimination with evidence.**

1. **List hypotheses** ranked by evidence strength
2. **Test each** - Design smallest experiment to confirm/eliminate
3. **Validate with evidence** - Logs, metrics, reproduction steps
4. **Consider environmental factors** - Race conditions, resource limits, config drift
5. **Document the chain** - Full event sequence from trigger to symptom

**Avoid:** Fixing first hypothesis without testing alternatives. Multiple plausible causes require elimination.

## Step 5: Solution Development

**Design targeted, evidence-backed fixes.**

1. **Immediate fix** - Minimum change to restore service (hotfix, rollback, config change)
2. **Root cause fix** - Address underlying issue permanently
3. **Preventive measures** - Monitoring, alerting, validation to catch recurrence early
4. **Verification plan** - How to confirm fix works in production

**Prioritize:** Impact × urgency. Restore service first, then fix root cause, then prevent recurrence.

## Integration with Code-Level Debugging

When investigation narrows to specific code:
- Switch to `systematic-debugging.md` for the code-level fix
- Use `root-cause-tracing.md` if error is deep in call stack
- Apply `defense-in-depth.md` after fixing
- Always finish with `verification.md`
