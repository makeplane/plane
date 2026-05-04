# Validate Questions — Shinhan AI Integration

All open questions from research reports + plan design decisions. Answer inline before proceeding to implementation. Categories: **Infrastructure** / **Security** / **Product** / **Compliance** / **Performance**.

---

## Phase 01 — Provider Swap

- **Q1.1** [Infrastructure] Is `techai-web.shinhan.com` reachable from Plane's current deployment network (dev/staging/prod)? If not, who owns the network allowlist ticket and what is the SLA?
- **Q1.2** [Infrastructure] Does TechAI require custom auth headers beyond `Authorization: Bearer <token>`? (Affects OpenAI SDK compatibility — may need `http_client` wrapper.)
- **Q1.3** [Product] Deprecate `/rephrase-grammar/` entirely, or keep as a backend alias for external API consumers? (Current plan: remove, route frontend call to `/ai-assistant/` with `task=rephrase_grammar`.)
- **Q1.4** [Product] Default system prompt language when user locale absent — Vietnamese (majority users) or English (lowest-common-denominator)?
- **Q1.5** [Security] Is storing `LLM_BASE_URL` in Postgres (encrypted at rest) acceptable, or must it live in env vars only per bank infosec?

---

## Phase 02 — Governance Layer

- **Q2.1** [Compliance] Who signs off the PIA and VRA documents? Security team lead / DPO / CISO? Need sign-off path.
- **Q2.2** [Compliance] 7-year retention — confirmed for SOX, or does Korean PIPA / Vietnamese data-protection law mandate a different period?
- **Q2.3** [Security] Acceptable to store PII mapping in Redis (TLS + encrypted at rest), or must mapping live only in HSM/KMS?
- **Q2.4** [Performance] Expected peak QPS on AI endpoints? Drives Lua script design + Redis cluster sizing.
- **Q2.5** [Product] Kill switch scope: global only, or also per-workspace? (Current plan: global this phase; workspace-level via Phase 03 toggles.)
- **Q2.6** [Infrastructure] S3 bucket for WORM archive — use existing bank bucket or provision new? Region must be Korea (data residency) — confirm.
- **Q2.7** [Product] When PII detected in prompt — reject request outright, auto-mask silently, or prompt user for confirmation? (Current plan: auto-mask + log.)
- **Q2.8** [Compliance] Monthly quota 50k/workspace — placeholder. Need stakeholder-confirmed number tied to expected usage + cost ceiling.
- **Q2.9** [Security] Presidio v0.12+ Korean jumin checksum support — verified or custom implementation required?
- **Q2.10** [Infrastructure] Scrubadub still maintained as of 2026? (Decision on Primary = Presidio; fallback choice matters.)
- **Q2.11** [Infrastructure] S3 WORM 7-year archival cost for ~100GB/month logs — acceptable, or investigate GCS / cheaper alternatives?
- **Q2.12** [Security] Who validates network egress logs (VPN + NetFlow) — internal security team or third-party auditor?
- **Q2.13** [Product] Monthly quota rollover: do unused tokens carry over, or reset at month-end? Affects fairness + cost modeling.

---

## Phase 03 — Workspace Feature Toggles + RBAC

- **Q3.1** [Product] Feature-key list final, or should we add future-proofing keys (`ai_image_gen`, `ai_code_review`) now?
- **Q3.2** [Product] Default-off for new workspaces — acceptable? Or auto-enable for designated pilot workspaces via data migration?
- **Q3.3** [Infrastructure] Plane uses Django's cache framework or direct Redis? Affects `cache.delete_pattern()` usage for toggle invalidation.
- **Q3.4** [Security] Role codes for `allowed_roles` — Plane uses integer codes (5 Admin / 15 Member / 20 Guest). Do we need a new `ai_power_user` role, or reuse existing?
- **Q3.5** [Product] Should rollout-percentage apply to backend infra toggles (embedding indexing) or only user-facing features?
- **Q3.6** [Infrastructure] Django-Waffle v5 — did it add workspace scoping since research compile, or is custom model still justified?

---

## Phase 04 — Embedding Infrastructure

- **Q4.1** [Infrastructure] Does TechAI expose `/v1/embeddings`? If yes — model name and output dimensions? If no — approval to deploy BGE-M3 self-hosted (~1×A10 GPU for target QPS)?
- **Q4.2** [Infrastructure] Postgres version confirmed 15.7 with pgvector-compatible ? Any prod-side blocker to `CREATE EXTENSION vector` (permission / HA replica concerns)?
- **Q4.3** [Security] Acceptable to store embeddings of potentially-sensitive page content in same DB as raw pages, or must embeddings live in isolated store?
- **Q4.4** [Performance] Max expected pages per workspace? Drives HNSW tuning + partitioning decision.
- **Q4.5** [Product] Embed PageVersion history as well (version-aware search), or skip? (Research recommends skip: 10× cost, marginal value.)
- **Q4.6** [Product] Embedding scope — Pages only, or also Issues + IssueComments? (Current plan: Pages only. Issue summary 5A works via direct fetch.)
- **Q4.7** [Infrastructure] Dedicated Celery `embedding` queue — how many workers? Sized from expected edit QPS.
- **Q4.8** [Performance] Redis embedding cache for repeat queries — build in v1 or defer?
- **Q4.9** [Product] When page deleted/archived — hard-delete embeddings (cascade FK) or soft-flag? (Current: hard-delete.)
- **Q4.10** [Infrastructure] If self-hosting BGE-M3 — GPU availability in bank infra? If no GPU, CPU BGE-M3 acceptable (~10× slower)?
- **Q4.11** [Security] TechAI auth for `/v1/embeddings` — same Bearer token as chat, or separate?
- **Q4.12** [Performance] Embedding dimension: if TechAI returns non-1024 (e.g., 768) — acceptable to project / truncate, or must match BGE-M3 spec?
- **Q4.13** [Product] Chunk size 256 tokens — benchmark needed on Korean + Vietnamese samples (token:char ratio varies)?

---

## Phase 05 — User-Facing Features

### 5A — Ticket Comment Summarizer
- **Q5A.1** [Product] Summary structure `{root_cause, actions_done, current_status, owner}` — confirm with bank PM team? Or different fields (e.g., `next_steps`, `risks`)?
- **Q5A.2** [Product] Post AI summary as visible IssueActivity entry (discoverable, audit trail), or modal-only (ephemeral)?
- **Q5A.3** [Performance] Limit of 500 comments per summary — acceptable, or need streaming/chunked approach for massive threads?

### 5B — Cross-language Translator
- **Q5B.1** [Product] Language pairs confirmed VI/EN/KR? Need JA or ZH for Shinhan Japan/China offices?
- **Q5B.2** [Product] Auto-translate on comment load (if UI lang ≠ detected comment lang), or always on-demand? (Current plan: on-demand, cheaper.)
- **Q5B.3** [Product] Cache translated versions in DB for cross-user reuse, or strictly per-user ephemeral? (Privacy trade-off.)

### 5C — RAG Q&A on Pages
- **Q5C.1** [Product] Session-only chat history in v1 acceptable, or must persist from day 1? (Persistence adds Chat + ChatMessage models.)
- **Q5C.2** [Product] RAG scope — Pages only in v1? Issue/Comments post-launch?
- **Q5C.3** [Performance] Streaming responses required for UX, or acceptable to ship v1 non-streaming and add SSE in v1.1?
- **Q5C.4** [Product] When no relevant chunks found — return "Not enough information" early, or call LLM with empty context anyway?
- **Q5C.5** [Security] Should RAG final answer be PII-scrubbed on output as well? (LLM may echo PII from indexed chunks.)
- **Q5C.6** [Product] `/` slash key — conflicts with Plane's existing editor slash-command menu? UX research needed.
- **Q5C.7** [Product] Citation rendering — footnote-style `[^1]` with cards, or inline link chips? Visual design input needed.
- **Q5C.8** [Performance] Max concurrent chat sessions per workspace cap — drives LLM pool sizing + cost ceiling.

---

## Phase 06 — Observability, Rollout

- **Q6.1** [Infrastructure] Existing log aggregation stack — Loki / Elastic / CloudWatch / stdout-only? Determines structured-log routing.
- **Q6.2** [Product] Canary workspace choice — internal dev/test workspace, or a live pilot team? Trade-off: safety vs. realistic signal.
- **Q6.3** [Compliance] Health endpoint authentication — anonymous-probable (easier for external monitors) or require auth (safer)?
- **Q6.4** [Infrastructure] Celery Beat scheduler already configured in Plane? If not, setup needed before daily refresh task.
- **Q6.5** [Product] Go/no-go thresholds — "<1% error rate" — is this the bank's ops bar, or must be <0.1%?
- **Q6.6** [Product] Rollout speed — 10-day canary → pilot → all. Accelerate or extend based on governance review cadence?

---

## Cross-Cutting

- **QX.1** [Product] Pilot user count target for Phase 06 canary — 10 / 50 / 200? Affects usage signal quality.
- **QX.2** [Compliance] Who owns final go-live approval — CISO, CTO, or committee?
- **QX.3** [Infrastructure] Backward-compat `OPENAI_API_KEY` / `GPT_ENGINE` env vars — keep indefinitely or deprecate at version X?
- **QX.4** [Security] Any additional Shinhan-specific audit fields required beyond `AIRequestLog` schema (e.g., employee ID, department code)?
- **QX.5** [Product] Pricing / internal chargeback — track per-workspace cost for billback to cost centers, or aggregate only?
- **QX.6** [Compliance] Data-processing agreement signed with TechAI internal team required? Internal LLM still needs governance paper trail?

---

## Answer Template

For each question, fill in one of:
- `Answer: <decision + rationale>`
- `Defer: <why> (revisit at: <milestone>)`
- `Ignore: <why not applicable>`

Questions marked **BLOCKING** after answers review will pause plan execution until resolved. Default: all questions treated blocking for the phase they appear in.
