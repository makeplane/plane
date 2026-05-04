# Phase 06 — Observability, Monitoring, Rollout

## Context Links
- Phases 01-05 complete (features + governance in place)
- Research: `research/researcher-02-governance-banking.md` §4 (circuit breaker + graceful degradation)
- Code: existing Celery task logs pattern, Django logging config

## Overview
- Priority: P2
- Status: pending
- Effort: 3-4d
- Add structured logging, usage metrics, health check, and execute canary rollout. Produce ops runbook for on-call.

## Key Insights
- Plane already uses Django logging; extend with JSON formatter for AI subsystem.
- No existing Prometheus in Plane stack (confirm w/ infra) → fallback to Postgres materialized views for daily aggregates.
- Circuit breaker (pybreaker + Redis) already specced in Phase 02 §4.1 — wire in Phase 06.
- Kill switch (Phase 02) = primary rollback mechanism; no code redeploy needed.

## Requirements

### Functional
- Structured JSON logs for every AI event (request start, LLM call, embedding call, error) with fields: `request_id`, `user_id`, `workspace_id`, `feature`, `duration_ms`, `tokens`, `cost_usd`, `status`.
- Health endpoint `GET /api/ai/health/`: probes TechAI chat reachability, embedding provider reachability, circuit breaker state, kill switch state. Returns aggregate OK/DEGRADED/DOWN.
- Daily aggregate job: materialize `ai_usage_daily` view from `AIRequestLog` for fast dashboard.
- Canary rollout: staged enablement via Phase 03 feature toggles + percentage rollout.
- Runbook doc covering 6 common failure modes.

### Non-Functional
- Log emission <1ms overhead.
- Health endpoint <500ms (parallel probes, 1s timeout each).
- Aggregate refresh: daily cron, <60s for 1M log rows.

## Architecture

```
Per-request logging (structlog)
  │
  ├─ stdout JSON → Plane log pipeline → Loki/Elastic (infra-dependent)
  │
  └─ AIRequestLog (Phase 02) = source of truth for reporting

Health check
  POST /api/ai/health/ ──┐
                          ├─ probe TechAI /v1/models (HEAD or cheap call)
                          ├─ probe embedding provider
                          ├─ read circuit breaker state from Redis
                          └─ read AI_GLOBAL_ENABLED cache
                             │
                             ▼
                          Aggregate: OK if all green; DEGRADED if circuit tripped;
                                    DOWN if kill switch or TechAI unreachable

Daily aggregates (materialized view)
  ai_usage_daily:
    workspace_id, date, feature_name,
    request_count, token_sum, cost_sum, error_count, pii_detected_count
  REFRESH MATERIALIZED VIEW CONCURRENTLY nightly

Rollout
  Day 0: Enable all toggles ON for WORKSPACE_CANARY_ID only
  Day 3: If no incidents, enable for 5 pilot workspaces
  Day 10: Enable globally (all workspaces default-on)
  At any point: Kill switch → disable in <5s
```

## Related Code Files

**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/ai_logger.py` — structlog setup + helpers
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/ce/views/health/ai.py` — health endpoint
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/migrations/XXXX_add_ai_usage_daily_view.py` — materialized view
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/bgtasks/ai_usage_refresh.py` — Celery Beat task
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/circuit_breaker/ai_breaker.py` — pybreaker + Redis
- `/Volumes/Data/SHBVN/plane.so/docs/operations/ai-runbook.md` — on-call runbook
- `/Volumes/Data/SHBVN/plane.so/docs/operations/ai-rollout-plan.md` — canary schedule

**Modify:**
- `apps/api/plane/settings/common.py` — LOGGING config adds JSON formatter for `plane.ai.*` loggers
- Views from Phases 01-05 — wrap LLM/embed calls in circuit breaker
- Phase 02 audit dashboard — supplement real-time counts with `ai_usage_daily` for historical

**Delete:** None.

## Implementation Steps

1. **Structured logger**: `ai_logger.py` wraps `structlog` with default fields. Expose `log_ai_event(event, **fields)`. Integrate into `external/base.py` at request boundary, task enqueue, error paths.
2. **Circuit breaker wrap**: In EmbeddingService + LLM call sites, wrap with `@ai_circuit_breaker`. On `CircuitBreakerError` → return graceful fallback per Phase 02 §4.3 pattern. Breaker: `fail_max=5, reset_timeout=60s`, Redis storage namespace `ai_breaker`.
3. **Health endpoint**: Parallel probes via asyncio or threading (ThreadPoolExecutor 4 workers). Return JSON:
   ```json
   {"status":"OK","checks":{"techai":"OK","embedding":"OK","circuit":"CLOSED","kill_switch":"ON"}}
   ```
   Status codes: 200 OK, 503 DEGRADED/DOWN.
4. **Materialized view**: `CREATE MATERIALIZED VIEW ai_usage_daily AS SELECT workspace_id, date(created_at), feature_name, COUNT(*), SUM(input_tokens+output_tokens) ... GROUP BY 1,2,3`.
5. **Daily refresh task**: Celery Beat cron `0 2 * * *` (2am) → `REFRESH MATERIALIZED VIEW CONCURRENTLY ai_usage_daily`. Guard with advisory lock.
6. **Runbook** covering:
   - TechAI 5xx → check circuit state, fail over to ops-notified mode
   - PII scrubber failing → bypass temporarily? (document decision: fail closed — reject request)
   - Celery embedding queue backlog → scale workers, pause backfill
   - Rate limit storm → temporarily raise limit or kill switch
   - Kill switch stuck → manual cache.delete + DB update path
   - HNSW index corruption → rebuild CONCURRENTLY steps
7. **Canary rollout plan doc**: timeline, go/no-go criteria, rollback steps. Go criteria: 0 PII leaks, <1% error rate, latency p95 <8s, no CISO complaints.
8. **Smoke tests in CI**: `apps/api/tests/ai/test_health.py` — hits health endpoint, asserts 200. `test_contract.py` — mocks TechAI response, verifies full path.
9. **Observability review**: with infra team, route JSON logs to existing Plane log sink (Loki/Elastic/CloudWatch). If none exists — stdout only, document gap.
10. **Dashboard link-ups**: Phase 02 audit dashboard gets "Historical trends" tab reading `ai_usage_daily`.

## Todo List

- [ ] Structlog setup + helper
- [ ] Wrap LLM + embedding calls in circuit breaker
- [ ] Implement health endpoint with parallel probes
- [ ] Materialized view migration + refresh task
- [ ] Celery Beat entry for daily refresh
- [ ] Write on-call runbook (6 failure modes)
- [ ] Write canary rollout plan doc
- [ ] Add CI smoke tests for health + contract
- [ ] Coordinate with infra for log sink
- [ ] Historical trends tab on audit dashboard
- [ ] Execute Day 0 canary enablement
- [ ] Execute Day 3 pilot expansion
- [ ] Execute Day 10 full rollout (pending success)

## Success Criteria
- `GET /api/ai/health/` returns 200 OK in healthy state; 503 when TechAI unreachable.
- `ai_usage_daily` materialized view populated within 60s of refresh.
- Canary workspace uses all features for 3 days without incident.
- Kill switch exercised in staging: <5s propagation measured.
- Runbook reviewed by on-call lead + signed off.
- JSON logs searchable by `request_id` end-to-end.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No existing observability stack → logs go to stdout only | H | M | Work with infra to route; interim: file-based rotation |
| Circuit breaker flaps during TechAI hiccups | M | M | Tune fail_max and reset_timeout based on canary data |
| Materialized view refresh locks writes | L | M | Use CONCURRENTLY; requires unique index |
| Canary workspace too small → no signal | M | M | Pick active workspace with >100 pages, >50 users |
| Rollback via kill switch leaves in-flight requests hanging | L | L | Requests return fallback; no hanging (tested in Phase 02) |

## Security Considerations
- Health endpoint is public-auth gated (authenticated users only). Don't expose TechAI URL in error strings to non-admins.
- Materialized view contains aggregated data only, no per-user PII.
- Logs must NOT contain raw prompts (use prompt_hash from AIRequestLog instead).

## Open Questions (blocking validation)
- Q6.1 [Infrastructure] Existing log aggregation — Loki, Elastic, CloudWatch, or stdout-only?
- Q6.2 [Product] Canary workspace selection — pick dev/test internal workspace or real pilot team?
- Q6.3 [Compliance] Can health endpoint be probed anonymously (for external monitor), or must require auth?
- Q6.4 [Infrastructure] Celery Beat scheduler already configured? If not, setup needed.
- Q6.5 [Product] Go/no-go thresholds: <1% error rate — is this acceptable for banking ops, or must be <0.1%?
- Q6.6 [Product] Rollout speed — 10 days total acceptable, or accelerated/extended based on stakeholder review?

## Next Steps / Dependencies
- Requires: All prior phases.
- After this: feature-complete; iterate based on real usage signals (persistence, streaming, new features).
- Post-launch followups: Phase 07 (future) — streaming, chat persistence, issue-level RAG, model fine-tuning evaluation.
