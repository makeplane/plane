# Phase 02 — Governance Layer (Kill Switch Only — Post-Validation Scope)

<!-- Updated: Validation Session 1 — SCOPE COLLAPSED. PII scrubber, audit log, rate limit, compliance docs DROPPED per user decision. Internal model on internal bank GPU → no external data leak risk. Audit log retention flagged as CONCERN; user to re-confirm before implementation. -->

## Context Links
- Research: `research/researcher-02-governance-banking.md` §4 (kill switch) — other sections now out-of-scope
- Code: `apps/api/plane/utils/instance_config_variables/core.py` (add kill-switch config)

## Overview
- Priority: P1 (still blocking — ops rollback capability required before any feature ships)
- Status: pending
- Effort: **0.5-2d** (reduced from 5-7d; see CONCERN below)
- Ship the single retained governance pillar: **global + workspace-level kill switch**.

## ⚠️ Validation Session 1 — Scope Change Record

User Q2.7 answer: *"No PII masking needed. Internal model running on internal bank GPU server."*
User Q(governance) multi-select answer: *Kill switch only.*

**Dropped from scope (as of Validation Session 1):**
- ❌ PII scrubber (Presidio, Vietnamese recognizers, Korean jumin) — no external leak risk
- ❌ Immutable audit log (`AIRequestLog` model + Postgres trigger) — **user to re-confirm**
- ❌ Multi-tier rate limiter (Redis Lua burst/hourly/monthly) — **user to re-confirm**
- ❌ Admin audit dashboard (`/admin/ai-audit`) — dependent on audit log
- ❌ S3 WORM archival Celery task — dependent on audit log
- ❌ Compliance docs (VRA, PIA, IR playbook) — dependent on PII + audit scope

**Retained:**
- ✅ Global kill switch (`AI_GLOBAL_ENABLED` instance config + middleware)
- ✅ Admin God-Mode toggle UI

**⚠️ CONCERN — requires user re-confirmation before implementation:**
- Dropping **audit log** is atypical for banking AI features regardless of internal/external model boundary. Audit serves operational traceability (cost, debugging, incident response), not just external-leak compliance.
- Dropping **rate limit** removes cost-runaway protection.
- If user intent was "drop PII scrubbing only" (per Vietnamese note), revise this phase to re-add audit log + rate limit (+2-3d effort).

## Key Insights (Retained)
- Kill switch: Django cache-based toggle, propagates <5s to all pods. Middleware short-circuits AI endpoints with HTTP 503 + fallback message when disabled.
- Workspace-level kill switch piggybacks on Phase 03 feature toggle infrastructure (per user Q2.5 multi-select recommending both scopes).

## Requirements (Post-Validation)

### Functional
- Kill switch: `AI_GLOBAL_ENABLED` config (default true). When false → all AI endpoints return 503 with fallback message.
- Admin God-Mode toggle in existing AI form (`apps/admin/app/(all)/(dashboard)/ai/form.tsx`) writes both DB + cache.

### Non-Functional
- Kill switch propagation: <5s worst case across all pods.

<!-- Dropped per Validation Session 1: audit log + PII scrubber + rate limit requirements. Retained sections below preserved as reference IF user re-confirms scope; otherwise ignore. -->

### [DROPPED — pending re-confirm] Former functional requirements
- ~~Every AI request (chat, embedding, RAG query) writes an `AIRequestLog` row before returning to user.~~
- ~~PII scrubber runs on `prompt` field before LLM call; logs `pii_detected` + `pii_types`.~~
- ~~Rate limit returns HTTP 429 with `Retry-After` header + JSON body showing used/limit/reset per level.~~
- ~~Admin dashboard at `/admin/ai-audit` shows: total requests, cost, PII hits, error rate.~~

### [DROPPED] Former non-functional requirements
- ~~PII scrubber latency <150ms for 2KB prompt (p95).~~
- ~~Audit log write sync with request.~~
- ~~Rate limit check <10ms (Lua single round-trip).~~
- ~~7-year retention: hot 90d Postgres → warm 2y partitioned → cold S3 Glacier (WORM).~~

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Incoming AI Request                                         │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐    kill switch OFF      ┌──────────┐
│ KillSwitchCheck     ├────────────────────────▶│ 503      │
│ cache.get(AI_ON)    │                          │ fallback │
└─────────┬───────────┘                          └──────────┘
          │ ON
          ▼
┌─────────────────────┐    limit exceeded       ┌──────────┐
│ AIRequestThrottle   ├────────────────────────▶│ 429      │
│ (burst+hr+month)    │                          └──────────┘
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ PIIScrubber.scrub() │── returns scrubbed + findings + mapping
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ LLM call (Phase 01) │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│ AIRequestLog.objects.create(...)            │
│   user_id, workspace_id, prompt_hash,       │
│   tokens, cost, duration, pii_detected,     │
│   feature_name, provider, success           │
└─────────┬───────────────────────────────────┘
          │
          ▼
    Response to user
```

## Related Code Files

**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/ai_audit.py` — `AIRequestLog` model
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/migrations/XXXX_add_ai_request_log.py` — table + immutability trigger
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/pii_scrubber.py` — `PIIScrubber` class + recognizers
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/pii_recognizers/vietnamese.py` — CCCD, CMND, VN phone, VN bank account
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/pii_recognizers/korean.py` — jumin with checksum
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/throttles/ai_throttle.py` — `AIRequestThrottle` with Lua script
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/middleware/ai_kill_switch.py` — middleware class
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/ce/views/ai_audit_dashboard.py` — aggregate query endpoint
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/bgtasks/ai_audit_archival.py` — S3 archive task
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/ai/audit/page.tsx` — dashboard UI
- `/Volumes/Data/SHBVN/plane.so/docs/compliance/vra-checklist.md` — VRA template
- `/Volumes/Data/SHBVN/plane.so/docs/compliance/pia-ai-integration.md` — PIA template
- `/Volumes/Data/SHBVN/plane.so/docs/compliance/incident-response-ai.md` — IR playbook

**Modify:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/external/base.py` — inject scrubber + audit write (wraps Phase 01 change)
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/instance_config_variables/core.py` — add `AI_GLOBAL_ENABLED`, `AI_PII_SCRUB_ENABLED`, `AI_RATE_LIMIT_OVERRIDES`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/settings/common.py` — register middleware, throttle defaults
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/ai/form.tsx` — add kill-switch toggle

## Implementation Steps

1. **Model + migration**: `AIRequestLog` per research §2.1. Fields: `id`, `user`, `workspace`, `project` (nullable), `request_id`, `timestamp`, `provider`, `model_name`, `prompt_hash` (SHA256), `prompt_length`, `response_length`, `input_tokens`, `output_tokens`, `cost_usd`, `duration_ms`, `feature_name`, `pii_detected`, `pii_types` (JSONField), `scrubbing_applied`, `success`, `error_type`, `error_message`, `ip_address`, `user_agent`. Override `save()` to reject on `pk` present; override `delete()` to raise.
2. **Postgres trigger**: `RunSQL` in migration — `CREATE TRIGGER ai_request_log_immutable BEFORE UPDATE OR DELETE ...`.
3. **PII recognizers**: Implement `CCCDRecognizer`, `CMNDRecognizer`, `VNPhoneRecognizer`, `VNBankAccountRecognizer`, `JuminRecognizer` (with checksum validate). Register into Presidio `AnalyzerEngine`.
4. **PIIScrubber** util: `scrub(text, language='en') → (scrubbed, findings, mapping)`. Mapping stored in Redis `redis.setex(f"pii_map:{request_id}", 86400, json.dumps(mapping))`.
5. **Throttle**: `AIRequestThrottle(SimpleRateThrottle)` with Lua script from research §3.2. Override `throttle_failure` to return structured JSON.
6. **Kill switch middleware**: `AIKillSwitchMiddleware` — check `cache.get('AI_GLOBAL_ENABLED', True)` → if False and path matches `/ai-assistant/` or `/ai/`, return 503 with `{error, fallback}`. Seed cache from `AI_GLOBAL_ENABLED` instance config on startup; admin toggle writes both DB + cache.
7. **Integration into endpoint**: Modify `external/base.py` post-Phase-01 to:
   - Generate `request_id = uuid4()`.
   - Call `PIIScrubber.scrub(prompt)` before building messages.
   - Time the LLM call.
   - On success or error, write `AIRequestLog` (use `try/except` to avoid blocking user on log failure; log to stderr on failure).
8. **Admin dashboard API**: `GET /api/workspaces/{slug}/ai/audit/summary?days=30` → aggregates per research §2.3. Permission: workspace admin only. Cache 5min (Redis).
9. **Admin dashboard UI**: God-Mode page with cards (total req, cost, PII hits, error rate) + table (by feature, top users). Chart lib: whatever Plane already uses (recharts or chart.js — check existing admin).
10. **Archival task**: `ai_audit_archival` Celery Beat cron daily → rows >90d → export batch to Parquet → S3 WORM → do NOT delete from Postgres yet (grace period 30d, handled by separate cleanup task gated on S3 verify).
11. **Compliance docs**: Fill VRA, PIA, IR playbook templates with Shinhan-specific fields (vendor=Shinhan internal, residency=Korea).
12. **Tests**: Unit tests for PII recognizers (CCCD/CMND/jumin positive + negative), throttle Lua script (burst/hourly/monthly independent), audit log immutability (Django save + raw SQL UPDATE both rejected).

## Todo List (Post-Validation — Kill Switch Scope)

- [ ] Add `AI_GLOBAL_ENABLED` instance config var (default `true`) with encrypted flag
- [ ] Implement `AIKillSwitchMiddleware` — short-circuits AI endpoints with 503 when cache flag false
- [ ] Register middleware in `settings/common.py`
- [ ] Seed cache from DB config on app startup
- [ ] Admin God-Mode toggle UI — writes DB + invalidates cache
- [ ] Unit test: middleware returns 503 when flag off; passes through when on
- [ ] Smoke test: flip toggle in God-Mode → AI request returns 503 within 5s

<!-- DROPPED tasks (pending re-confirm) retained for audit history -->
- [ ] ~~Create `AIRequestLog` model + migration + immutability trigger~~
- [ ] ~~Implement Vietnamese PII recognizers (CCCD, CMND, phone, bank acct)~~
- [ ] ~~Implement Korean jumin recognizer with checksum validation~~
- [ ] ~~Implement `PIIScrubber` util with Redis mapping store~~
- [ ] ~~Implement `AIRequestThrottle` with atomic Lua script~~
- [ ] ~~Integrate scrubber + audit write into `external/base.py`~~
- [ ] ~~Build audit dashboard API endpoint + UI~~
- [ ] ~~Implement S3 archival Celery task~~
- [ ] ~~Write compliance docs (VRA, PIA, IR playbook)~~

## Success Criteria (Post-Validation)
- Admin toggles kill switch in God-Mode → next AI request within 5s returns 503 with fallback message.
- Kill switch state persists across pod restarts (DB-backed, cache re-seeded on boot).
- Legacy AI requests (pre-Phase-01 openai path) also respected by middleware.

<!-- DROPPED (pending re-confirm): PII masking, audit log row, immutability trigger, rate limit 429, audit dashboard, compliance doc sign-off -->.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Presidio misses context-free CCCD (12-digit is also a phone/account) | H | H | Strict pattern + context-word boosting; backstop with `CMND_PATTERN` only for identified VI locale |
| Jumin checksum false negatives | M | M | Include lenient pattern variant (no checksum) with lower confidence; CISO accepts both |
| Audit log write fails → user AI request fails | M | H | Fail-open: catch exception, emit stderr + metric, proceed with user response |
| Lua script errors on Redis cluster mode | L | H | Use hash tag `{workspace_id}` to force same slot; fallback to Django cache mode |
| Kill switch stuck-off after toggle | L | H | Add auto-re-enable timestamp (1h default); admin can extend |
| S3 archive task saturates network | L | M | Rate-limit task (100 MB/min); run off-peak |
| Trigger blocks legitimate admin edits (e.g., GDPR erase) | L | M | Document escape valve: superuser with DB access can ALTER TRIGGER DISABLE |

## Security Considerations
- PII mapping in Redis must use encrypted connection (TLS) + short TTL (24h).
- Audit log `prompt_hash` = SHA256(prompt) — never store raw prompt.
- `error_message` field: sanitize LLM error responses (may contain echoed PII).
- Dashboard access gated on `IsWorkspaceAdmin` + audit-log view permission.
- Compliance exports signed (SHA256 of content) to detect tampering.

## Open Questions (blocking validation)
- Q2.1 [Compliance] Who signs off PIA/VRA? Security team lead, DPO, or CISO?
- Q2.2 [Compliance] Retention 7 years — confirmed for SOX? Korean PIPA requires different period?
- Q2.3 [Security] Acceptable to store PII mapping in Redis (even encrypted), or must mapping live in HSM/KMS?
- Q2.4 [Performance] Expected peak QPS on AI endpoints? Sizes Lua script load, Redis cluster config.
- Q2.5 [Product] Kill switch scope: global, per-workspace, or both? (Current plan: global; workspace-level deferred to Phase 03.)
- Q2.6 [Infrastructure] S3 bucket for WORM archive — existing bank bucket or new? Region must be Korea (residency).
- Q2.7 [Product] On PII detection: reject request, auto-mask silently, or prompt user to review? (Current plan: auto-mask + log.)
- Q2.8 [Compliance] Monthly quota 50k/workspace — pulled from thin air; need stakeholder confirmation.

## Next Steps / Dependencies
- Requires: Phase 01 complete (provider working).
- Blocks: Phase 03 (feature toggles need audit log ref), Phase 04 (embedding calls also log), Phase 05 (all user features write audit rows).
- Parallel-safe with Phase 03 if file ownership respected.
