# Phase 01 — Provider Swap (Shinhan TechAI)

## Context Links
- Research: `research/scout-01-plane-data-model.md` §5 (instance config pattern)
- Code: `apps/api/plane/app/views/external/base.py:123-145` (current OpenAI wrapper)
- Code: `apps/api/plane/utils/instance_config_variables/core.py:276-302` (LLM config vars)
- Code: `apps/admin/app/(all)/(dashboard)/ai/form.tsx:24-96` (God-Mode AI form)
- Code: `apps/web/core/services/ai.service.ts` (frontend AI service, broken `/rephrase-grammar/`)

## Overview
- Priority: P1 (blocks all other phases)
- Status: pending
- Effort: 2-3d
- Swap OpenAI-direct client for a provider-abstracted client supporting Shinhan's OpenAI-compatible endpoint. Add `LLM_BASE_URL` config. Update admin form. Add system prompt. Fix/retire broken `/rephrase-grammar/` endpoint.

## Key Insights
- Shinhan TechAI confirmed: `POST https://techai-web.shinhan.com/v1/chat/completions`, auth `Authorization: Bearer <token>`, OpenChat-compatible body schema (`{model, messages, temperature, max_tokens, top_p, stream, ...}`). Per Validation Session 2 (Q1.2 resolved).
- `/v1/embeddings` availability UNKNOWN → Phase 04 self-hosts BGE-M3 as baseline (per Validation Session 1).
- OpenAI Python SDK v1+ supports `base_url` natively + standard Bearer auth. No `http_client` wrapper needed.
- Existing `get_llm_config()` returns only `(api_key, model)`. Must expand to return full config dict including **inference params**: `(api_key, model, base_url, provider, temperature, max_tokens, top_p, frequency_penalty, presence_penalty)`.
- Admin form currently has 2 fields (model + key). Must add: Base URL + Provider dropdown + **inference param fields** (see form spec below).
- `performEditorTask` frontend calls `/rephrase-grammar/` which doesn't exist in backend → decision: route to `/ai-assistant/` with task type parameter.
<!-- Updated: Validation Session 2 - TechAI auth + endpoint confirmed (Q1.2). Inference params added to God-Mode form + API call. -->

## Requirements

### Functional
- Support provider values: `openai` (legacy), `shinhan` (new), `custom` (future).
- `LLM_BASE_URL` config var: encrypted, editable via God-Mode, falls back to env `LLM_BASE_URL`. Shinhan value: `https://techai-web.shinhan.com/v1`.
- Auth: `Authorization: Bearer <LLM_API_KEY>` (standard OpenAI SDK behavior; no custom header wrapper).
- When `LLM_PROVIDER=shinhan`, LLM client uses `base_url=LLM_BASE_URL` and `api_key=LLM_API_KEY`.
- **Inference parameters** (God-Mode configurable, passed verbatim to `/v1/chat/completions` body):
  - `LLM_TEMPERATURE` (float, 0.0–2.0, default `0.7`)
  - `LLM_MAX_TOKENS` (int, 1–32000, default `2048`)
  - `LLM_TOP_P` (float, 0.0–1.0, default `1.0`)
  - `LLM_FREQUENCY_PENALTY` (float, -2.0–2.0, default `0.0`)
  - `LLM_PRESENCE_PENALTY` (float, -2.0–2.0, default `0.0`)
  - `LLM_STOP_SEQUENCES` (JSON array of strings, default `[]` → omit from body)
- Per-feature override (optional): feature-specific endpoint may pass stricter defaults (e.g., 5B Translate uses `temperature=0.2` for deterministic output). Base config is global fallback.
- System prompt injected on every chat request (role: system, content: bank-staff PM assistant, respond in language of user request: VI/EN/KR). Default locale when `Accept-Language` absent: **English** (per Validation Session 1).
<!-- Updated: Validation Session 1 - Default prompt language VI → EN (Q1.4) -->
<!-- Updated: Validation Session 2 - Added inference param config vars + per-feature override pattern -->
- `/rephrase-grammar/` fix: either (a) add new backend route that proxies to ai-assistant with task=rephrase, or (b) update frontend `performEditorTask` to hit `/ai-assistant/` with task parameter. Prefer (b) — less surface area.

### Non-Functional
- Backward compat: existing `OPENAI_API_KEY`, `GPT_ENGINE` env vars continue to work (default provider=openai).
- No breaking change to `POST /api/workspaces/{slug}/ai-assistant/` request/response contract.
- Outbound network: document allowlist requirement `techai-web.shinhan.com:443` — create infra ticket before deploy.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Frontend (apps/web)                                       │
│   ai.service.ts → POST /ai-assistant/ { task, prompt }    │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│ Backend: apps/api/plane/app/views/external/base.py        │
│   1. cfg = get_llm_config()                               │
│      → { api_key, model, base_url, provider,              │
│          temperature, max_tokens, top_p,                  │
│          frequency_penalty, presence_penalty,             │
│          stop_sequences }                                 │
│   2. system_prompt = build_system_prompt(task, locale)    │
│   3. client = OpenAI(api_key=cfg.api_key,                 │
│                      base_url=cfg.base_url)               │
│      (sends Authorization: Bearer <api_key> automatically)│
│   4. body = {                                             │
│        model: cfg.model,                                  │
│        messages: [system, user],                          │
│        temperature: override.temp or cfg.temperature,     │
│        max_tokens: override.max or cfg.max_tokens,        │
│        top_p: cfg.top_p,                                  │
│        frequency_penalty: cfg.frequency_penalty,          │
│        presence_penalty: cfg.presence_penalty,            │
│        stop: cfg.stop_sequences or None,                  │
│      }                                                    │
│   5. client.chat.completions.create(**body)               │
│   6. return response                                      │
└──────────────────────────┬───────────────────────────────┘
                           │
          ┌────────────────┴─────────────────┐
          ▼                                   ▼
   provider=openai                    provider=shinhan
   base_url=api.openai.com/v1         base_url=techai-web.shinhan.com/v1
                                      POST /chat/completions
                                      Authorization: Bearer <LLM_API_KEY>
                                      body: OpenChat-compatible schema
```

## Related Code Files

**Modify:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/external/base.py` (lines 123-145) — add base_url, system prompt, task dispatch, inference params splat
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/instance_config_variables/core.py` (lines 276-302) — add `LLM_BASE_URL`, `LLM_TEMPERATURE`, `LLM_MAX_TOKENS`, `LLM_TOP_P`, `LLM_FREQUENCY_PENALTY`, `LLM_PRESENCE_PENALTY`, `LLM_STOP_SEQUENCES`. `LLM_PROVIDER` already present.
- `/Volumes/Data/SHBVN/plane.so/apps/admin/app/(all)/(dashboard)/ai/form.tsx` (lines 24-96) — add Base URL + Provider dropdown + Inference Parameters section (6 fields)
- `/Volumes/Data/SHBVN/plane.so/apps/web/core/services/ai.service.ts` — remove `performEditorTask`'s `/rephrase-grammar/` path; point to `/ai-assistant/` with `task=rephrase_grammar`

**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/llm_system_prompts.py` — prompt templates per task, per locale
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/llm_client.py` — `LLMConfig` TypedDict + `build_completion_kwargs()` helper

**Delete:**
- None (backward compat required)

## Implementation Steps

1. Add config vars to `llm_config_variables` list in `core.py`:
   - `LLM_BASE_URL` (`is_encrypted=True`, default `os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1")`)
   - `LLM_TEMPERATURE` (string-cast float, default `"0.7"`, validator: 0.0–2.0)
   - `LLM_MAX_TOKENS` (string-cast int, default `"2048"`, validator: 1–32000)
   - `LLM_TOP_P` (string-cast float, default `"1.0"`, validator: 0.0–1.0)
   - `LLM_FREQUENCY_PENALTY` (string-cast float, default `"0.0"`, validator: -2.0–2.0)
   - `LLM_PRESENCE_PENALTY` (string-cast float, default `"0.0"`, validator: -2.0–2.0)
   - `LLM_STOP_SEQUENCES` (string-cast JSON array, default `"[]"`)
2. Refactor `get_llm_config()` to return a dataclass/TypedDict `LLMConfig` with all fields (api_key, model, base_url, provider, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, stop_sequences). Callers updated — grep all sites before landing. Parse numeric fields from string with `try/except` → fall back to defaults + log warning.
3. Create `apps/api/plane/utils/llm_system_prompts.py` with `build_system_prompt(task: str, locale: str) -> str`. Tasks: `default`, `rephrase_grammar`, `summarize`, `translate`, `rag_qa`. Locales: `vi`, `en`, `ko`. KISS: one prompt template with locale substitution. Default locale `en`.
4. Create `apps/api/plane/utils/llm_client.py` helper `build_completion_kwargs(cfg: LLMConfig, overrides: dict = None) -> dict` — returns kwargs ready to splat into `client.chat.completions.create(**kwargs)`. Omits `stop` key if list empty.
5. Update `external/base.py` WorkspaceAIEndpoint and ProjectAIEndpoint:
   - Fetch `cfg = get_llm_config()`.
   - Accept optional `task` field from request body (default=`default`).
   - Build system prompt via `build_system_prompt(task, locale)` (locale inferred from `Accept-Language` → fallback `en`).
   - Instantiate `OpenAI(api_key=cfg.api_key, base_url=cfg.base_url)` — SDK auto-sends `Authorization: Bearer <api_key>`.
   - Build `messages = [{"role":"system","content":system_prompt}, {"role":"user","content":prompt}]`.
   - `kwargs = build_completion_kwargs(cfg, overrides=request_overrides)` + `messages=messages, model=cfg.model`.
   - Call `client.chat.completions.create(**kwargs)`.
6. Admin form `form.tsx` (apps/admin):
   - Add `LLM_BASE_URL` text input.
   - Add `LLM_PROVIDER` select with options `openai`, `shinhan`, `custom`.
   - When `shinhan` selected, auto-fill base_url placeholder `https://techai-web.shinhan.com/v1`.
   - Add new section **"Inference Parameters"** with inputs:
     - `LLM_TEMPERATURE` — number input, step `0.1`, min `0`, max `2`
     - `LLM_MAX_TOKENS` — number input, step `1`, min `1`, max `32000`
     - `LLM_TOP_P` — number input, step `0.05`, min `0`, max `1`
     - `LLM_FREQUENCY_PENALTY` — number input, step `0.1`, min `-2`, max `2`
     - `LLM_PRESENCE_PENALTY` — number input, step `0.1`, min `-2`, max `2`
     - `LLM_STOP_SEQUENCES` — textarea (JSON array of strings); validated client-side on save
   - "Restore defaults" button per-field (optional UX polish, defer if tight).
7. Frontend `ai.service.ts` — change `performEditorTask` to POST `/ai-assistant/` with `{ task: "rephrase_grammar", prompt }`. Remove 404-returning `/rephrase-grammar/` call.
8. Document network allowlist + API contract: create `docs/operations/shinhan-network-allowlist.md` with:
   - Allowlist target: `techai-web.shinhan.com:443`
   - curl smoke test:
     ```bash
     curl -X POST https://techai-web.shinhan.com/v1/chat/completions \
       -H "Authorization: Bearer $LLM_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{"model":"gpt-oss-120b","messages":[{"role":"user","content":"ping"}],"temperature":0.7,"max_tokens":64}'
     ```
9. Smoke test end-to-end: set `LLM_PROVIDER=shinhan` in God-Mode → call `/ai-assistant/` → verify TechAI responds, params honored (e.g., tweak temperature, observe variability).
10. Run lint + backend tests: `pnpm check:lint && cd apps/api && python run_tests.py`.

## Todo List

- [ ] Add config vars in `core.py`: `LLM_BASE_URL`, `LLM_TEMPERATURE`, `LLM_MAX_TOKENS`, `LLM_TOP_P`, `LLM_FREQUENCY_PENALTY`, `LLM_PRESENCE_PENALTY`, `LLM_STOP_SEQUENCES`
- [ ] Create `utils/llm_client.py` with `LLMConfig` TypedDict + `build_completion_kwargs()`
- [ ] Refactor `get_llm_config()` to return `LLMConfig` dict; update all callers
- [ ] Create `llm_system_prompts.py` with task × locale templates (default EN)
- [ ] Update `WorkspaceAIEndpoint` and `ProjectAIEndpoint` to use config + kwargs splat
- [ ] Update admin form with Base URL + Provider + Inference Parameters section (6 fields with validation)
- [ ] Fix `performEditorTask` frontend call → `/ai-assistant/` with task
- [ ] Write network allowlist + API contract ops doc (includes curl smoke test)
- [ ] Smoke-test Shinhan endpoint end-to-end (tweak temperature → observe variability)
- [ ] Confirm legacy OpenAI path still works (regression)
- [ ] Unit test: `build_completion_kwargs()` omits `stop` when empty, includes all params otherwise
- [ ] Unit test: numeric config parsing resilient to garbage input (falls back to defaults)

## Success Criteria
- Request with `LLM_PROVIDER=shinhan` + valid creds returns 200 with LLM response from TechAI.
- Request with `LLM_PROVIDER=openai` (legacy) still works unchanged.
- Admin God-Mode form saves/reads `LLM_BASE_URL` + `LLM_PROVIDER` + all 6 inference params.
- Changing `LLM_TEMPERATURE` in God-Mode from 0.0 → 1.5 → next 5 requests show visibly different outputs.
- Changing `LLM_MAX_TOKENS` caps response length as expected (verify via `usage.completion_tokens`).
- Invalid form input (e.g., `temperature=5.0`) rejected client-side AND server-side.
- `performEditorTask` frontend no longer returns 404; "rephrase" button works in Page editor.
- All existing backend tests pass.
- curl smoke test from allowlist doc succeeds against TechAI staging.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TechAI auth differs from Bearer | M | H | Build thin auth header wrapper if needed; fall back to custom `http_client` in OpenAI SDK |
| Existing callers break on 4-tuple return | H | M | Grep all `get_llm_config()` callers first, update atomically |
| System prompt degrades existing response quality | L | M | A/B locally on 5 sample prompts; tune template |
| Network egress blocked by firewall | H | H | Submit allowlist ticket day 1; stub client for local dev |
| Frontend `performEditorTask` still broken after fix | M | L | Add Playwright smoke test for "rephrase" button |

## Security Considerations
- `LLM_BASE_URL` marked `is_encrypted=True` (same as API key) — prevents leak via config export.
- System prompt MUST NOT contain user data or secrets.
- Log outbound LLM endpoint target in Phase 02 AIRequestLog for provenance.
- No response streaming initially (simpler; less leak surface). Revisit in Phase 06.

## Open Questions (blocking validation)
- Q1.1 [Infrastructure] Is `techai-web.shinhan.com` reachable from current Plane deployment network? If not, who owns the allowlist ticket? — STILL OPEN
- ~~Q1.2 [Infrastructure] Does TechAI require custom auth headers beyond `Authorization: Bearer <token>`?~~ **RESOLVED Validation Session 2: standard Bearer auth, OpenChat-compatible body.**
- Q1.3 [Product] Should we deprecate `/rephrase-grammar/` route entirely, or add a backend alias for API consumers? — STILL OPEN
- ~~Q1.4 [Product] System prompt language default?~~ **RESOLVED Validation Session 1: English.**
- Q1.5 [Security] Is storing `LLM_BASE_URL` in DB (encrypted) acceptable, or must it live in env only per bank infosec? — STILL OPEN

## Next Steps / Dependencies
- Unblocks: Phase 02 (governance wraps the provider call), Phase 04 (embedding service reuses `LLM_BASE_URL`), Phase 05 (features call `/ai-assistant/`).
- Requires: Shinhan TechAI staging credentials + network allowlist.
