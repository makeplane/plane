---
name: Shinhan AI Integration
title: "Shinhan TechAI + RAG Integration into Plane.so"
description: "Provider swap to Shinhan GPT-OSS-120B, banking-grade governance, pgvector RAG, and three user-facing AI features for bank staff"
status: pending
blockedBy: []
blocks: []
priority: high
estimatedEffort: 22-32 days (post-validation: Phase 02 -4d, Phase 05 +3d net)
owner: unassigned
branch: develop
tags: [ai, rag, governance, shinhan, banking, compliance]
created: 2026-04-22
---

# Shinhan AI Integration — Overview

## Goal
Replace the thin OpenAI wrapper in Plane with Shinhan's internal TechAI endpoint (`https://techai-web.shinhan.com/v1`), add banking-grade governance (PII scrub, audit, rate limit, kill switch), build pgvector-based RAG over Plane Pages, and ship three concrete user-facing features: ticket summarizer, translator, RAG Q&A.

## Research Inputs
- `research/researcher-01-embedding-rag-stack.md` — pgvector, BGE-M3, chunking, HNSW
- `research/researcher-02-governance-banking.md` — PII (Presidio), audit log, rate limit, kill switch, compliance artifacts
- `research/scout-01-plane-data-model.md` — Page/Issue/Comment models, Celery pattern, throttle pattern

## Phase Status

| # | Phase | Status | Effort | Depends On |
|---|-------|--------|--------|------------|
| 01 | Provider Swap (Shinhan TechAI + base_url + inference params) | pending | 3-4d | — |
| 02 | Governance Layer (kill switch — post-validation scope) | pending | 0.5-2d | 01 |
| 03 | Workspace Feature Toggles + RBAC | pending | 3-4d | 02 |
| 04 | Embedding Infrastructure (pgvector + BGE-M3) | pending | 7-10d | 02 |
| 05 | User-Facing Features (5A Summarize, 5B Translate, 5C RAG Q&A + SSE) | pending | 17-18d | 03, 04 |
| 06 | Observability, Monitoring, Canary Rollout | pending | 3-4d | 05 |

**Critical path:** 01 → 02 → 04 → 05C → 06 (~28d). Phase 05A/B can parallelize with 04.

## Key Dependencies & Decisions
- TechAI endpoint must expose `/v1/chat/completions`. Embeddings endpoint presence: UNKNOWN → fallback BGE-M3 self-hosted.
- Outbound network allowlist: `techai-web.shinhan.com` (infra team ticket required).
- CE override pattern: frontend feature gates live in `apps/web/ce/`, NOT in `core/`.
- Backward compat: existing `LLM_API_KEY` / `LLM_PROVIDER` / `LLM_MODEL` env vars stay valid; new `LLM_BASE_URL` added.
- Phase 02 is BLOCKING for production rollout — governance ships before any user-facing AI feature.

## File-Ownership (Parallel Safety)
- Phase 01: `apps/api/plane/app/views/external/base.py`, `apps/api/plane/utils/instance_config_variables/core.py`, `apps/admin/app/(all)/(dashboard)/ai/form.tsx`
- Phase 02: `apps/api/plane/db/models/ai_audit.py` (new), `apps/api/plane/utils/pii_scrubber.py` (new), `apps/api/plane/throttles/ai_throttle.py` (new)
- Phase 03: `apps/api/plane/db/models/workspace_feature_toggle.py` (new), `apps/api/plane/permissions/ai.py` (new)
- Phase 04: `apps/api/plane/db/models/page_embedding.py` (new), `apps/api/plane/bgtasks/embedding_tasks.py` (new), `apps/api/plane/utils/embedding.py` (new)
- Phase 05: `apps/api/plane/ce/views/ai/` (new subtree), `apps/web/ce/components/ai/` (new subtree)
- Phase 06: `apps/api/plane/ce/views/health/ai.py` (new), runbook docs

No two phases touch the same file.

## Success Criteria (Whole Plan)
- All LLM calls flow through Shinhan TechAI when `LLM_PROVIDER=shinhan`
- 100% of AI requests logged to immutable `AIRequestLog` with prompt hash + usage
- PII patterns (CCCD, CMND, VN phone, jumin) masked in >98% of sampled prompts
- Kill switch flips AI off workspace-wide in <5s
- Page embeddings backfilled for all existing pages; Celery re-indexes on edit
- Three features live and usable by bank staff in pilot workspace

## Rollout Order
Canary: 1 internal workspace → 5 workspaces → all. Kill switch always-on ready. Rollback = flip `AI_GLOBAL_ENABLED=false` via God-Mode.

## Links
- Phases: `phase-01-provider-swap.md` → `phase-06-observability-rollout.md`
- Open questions: `validate-questions.md`

---

## Validation Log

### Session 1 — 2026-04-22

**Trigger:** Pre-implementation validation (`/ck:plan validate`)
**Questions asked:** 8 (from 55+ open questions — prioritized by implementation-changing impact)

#### Questions & Answers

1. **[Infrastructure]** Does Shinhan TechAI expose `/v1/embeddings`, or must we self-host BGE-M3?
   - Options: TechAI confirmed | Self-host BGE-M3 (Recommended) | Unknown — investigate first
   - **Answer:** Self-host BGE-M3
   - **Rationale:** Most defensive path; no blocking on infra investigation. Phase 04 keeps BGE-M3 deployment as baseline. If TechAI later exposes embeddings, swap is a config change.

2. **[Security]** When PII detected in AI prompt, what is the action?
   - Options: Auto-mask + log (Recommended) | Reject | Prompt user
   - **Answer:** None — no PII scrubbing needed
   - **Custom input:** "không cần mask data gì cả. đây là model nội bộ chạy trong server GPU nội bộ của ngân hàng" ("No masking needed. Internal model running on bank's internal GPU server.")
   - **Rationale:** Internal model, internal bank network → no external data leak risk. PII scrubber removed from scope entirely.

3. **[Product]** 5A Summarizer output surfacing?
   - Options: Modal-only (Recommended) | IssueActivity | Both
   - **Answer:** Modal-only (ephemeral)
   - **Rationale:** KISS. No DB write. Re-run to refresh. Drop IssueActivity integration path.

4. **[Product]** 5C Chat history persistence?
   - Options: Session-only (Recommended) | Persist from day 1 | Local-storage
   - **Answer:** Session-only in v1
   - **Rationale:** No Chat/ChatMessage models needed. History lost on refresh — clear UX messaging required.

5. **[Security/Governance]** Which governance pieces to keep in Phase 02?
   - Options (multi-select): Audit log | Rate limit | Kill switch | PII scrubber
   - **Answer:** Kill switch ONLY
   - **Rationale:** User extended "internal model" reasoning to full governance layer. Phase 02 scope collapses from 5-7d to ~1-2d. See **CONCERN** note below.

6. **[Performance]** SSE streaming for AI responses in v1?
   - Options: Non-streaming v1, SSE v1.1 (Recommended) | SSE in v1
   - **Answer:** SSE streaming in v1
   - **Rationale:** User prioritized UX over ship speed. Phase 05C adds +3-4d for SSE infra + frontend streaming client. Updated effort.

7. **[Product]** Default state for new workspaces?
   - Options: Off, opt-in (Recommended) | On for pilot | On for all
   - **Answer:** Off by default, opt-in
   - **Rationale:** Safest rollout. Aligns with Phase 06 canary strategy. Workspace admin manually enables.

8. **[Product]** Default system-prompt language?
   - Options: Vietnamese (Recommended) | English | Korean
   - **Answer:** English
   - **Rationale:** Lowest-common-denominator, clearest logs, assumes staff read English. Phase 01 prompt templates default to EN when locale absent.

#### Confirmed Decisions

- **Embeddings:** Self-host BGE-M3 (no TechAI `/v1/embeddings` assumed)
- **PII scrubbing:** DROPPED (internal model, internal network)
- **Governance scope:** KILL SWITCH ONLY (audit log, rate limit, PII scrubber all dropped)
- **5A UI:** Modal-only, no IssueActivity
- **5C chat:** Session-only, SSE streaming enabled in v1
- **Workspace default:** Off, opt-in
- **Prompt language fallback:** English

#### ⚠️ CONCERN — Flagged for user re-confirmation

User selected ONLY "Kill switch" from Phase 02 multi-select. This drops audit log + rate limit + PII scrubber. For banking AI features, **audit log** (operational traceability, cost tracking, debugging) typically stays regardless of external/internal model boundary. **Rate limit** also protects against runaway cost even on internal infra. If user intent was "drop PII scrubbing only" (per Vietnamese note) but retain audit log + rate limit, revise Phase 02 before implementation.

**Recommended minimum for banking ops hygiene:**
- Audit log (lightweight — workspace, user, feature, tokens, latency) — 1-2d
- Kill switch — 0.5d (already confirmed)
- Rate limit — defer acceptable if cost-monitoring exists elsewhere

**As-selected (if user confirms):**
- Kill switch only, ~0.5-1d Phase 02 total

#### Action Items

- [ ] User confirms Phase 02 scope: kill-switch-only OR kill-switch + audit log
- [x] Propagate decisions to phase-01, phase-02, phase-05 files
- [x] Update plan.md phase table effort estimates
- [ ] Close resolved questions in `validate-questions.md` (Q1.4, Q2.7, Q4.1, Q5A.2, Q5C.1, Q5C.3, Q3.2)

#### Impact on Phases

- **Phase 01:** Default prompt language → English. Q1.4 resolved.
- **Phase 02:** SCOPE COLLAPSE. Drop PII scrubber, audit log (pending re-confirm), rate limit (pending re-confirm), compliance doc set (VRA, PIA, IR). Keep: kill switch + admin toggle. Effort: 5-7d → 0.5-2d depending on audit-log re-confirm.
- **Phase 04:** BGE-M3 self-hosted path confirmed (was already baseline). Q4.1 resolved.
- **Phase 05A:** Modal-only. Drop "Optional IssueActivity entry" path. Q5A.2 resolved.
- **Phase 05C:** SSE streaming IN v1 (was deferred to v1.1). Add +3-4d. Session-only history confirmed. Q5C.1, Q5C.3 resolved.
- **Phase 03:** Default-off confirmed. Q3.2 resolved.

---

### Session 2 — 2026-04-22

**Trigger:** User clarification on TechAI API contract + God-Mode form scope

#### User-Confirmed Facts

- **Endpoint:** `POST https://techai-web.shinhan.com/v1/chat/completions`
- **Auth:** `Authorization: Bearer <LLM_API_KEY>` — standard OpenAI SDK behavior, no custom wrapper
- **Body schema:** OpenChat-compatible (same shape as OpenAI chat completions)
- **Scope expansion:** God-Mode form must expose inference parameters (temperature, max_tokens, top_p, frequency_penalty, presence_penalty, stop_sequences) so ops can tune model behavior at runtime without code deploy.

#### Confirmed Decisions

- **Resolves Q1.2:** TechAI uses standard Bearer auth. No `http_client` wrapper needed in OpenAI SDK.
- **Endpoint canonical form:** `LLM_BASE_URL = https://techai-web.shinhan.com/v1` (SDK appends `/chat/completions`).
- **New config vars (7 total):** `LLM_BASE_URL` + 6 inference params (all encrypted, God-Mode editable, env-var fallback).
- **API body construction:** `build_completion_kwargs(cfg, overrides)` helper splats config into `client.chat.completions.create(**kwargs)`. Per-feature overrides supported (e.g., 5B Translate forces `temperature=0.2`).
- **Validation:** Client-side form validators (min/max/step) + server-side numeric parsing with fallback-to-default on garbage input.

#### Action Items

- [x] Update Phase 01 Requirements with new config vars spec
- [x] Update Phase 01 Architecture diagram with full body construction
- [x] Update Phase 01 Implementation Steps (add llm_client.py helper, expand form spec)
- [x] Update Phase 01 Related Code Files (+ `utils/llm_client.py` create)
- [x] Update Phase 01 Todo List (+ unit tests for kwargs builder + config parsing)
- [x] Close Q1.2 in validate-questions.md + phase-01 open-questions section

#### Impact on Phases

- **Phase 01:** Effort 2-3d → **3-4d** (+1d for inference param plumbing + form + tests). Critical-path unchanged.
- **Phase 05 (5B Translate):** Can now force `temperature=0.2` override for deterministic output — update 5B step to use per-feature override.
- **Phase 05 (5C RAG Q&A):** Can force lower `temperature=0.3` + higher `max_tokens` to reduce hallucination + allow longer answers.
- **Other phases:** No change.
