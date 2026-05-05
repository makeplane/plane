# Phase 05 — User-Facing AI Features (5A Summarize / 5B Translate / 5C RAG Q&A)

## Context Links
- Research: `research/scout-01-plane-data-model.md` §3 (IssueComment), §4 (activity pattern)
- Research: `research/researcher-01-embedding-rag-stack.md` (RAG query pattern)
- Code: `apps/api/plane/db/models/issue.py:489-573` (IssueComment)
- Code: `apps/api/plane/app/views/issue/comment.py:35-61` (comment retrieval)
- Phase 01: provider (LLM call wrapper)
- Phase 02: governance (all features audit-logged, PII-scrubbed)
- Phase 03: feature toggles (each sub-feature gated)
- Phase 04: embedding + `search_pages` (5C only)

## Overview
- Priority: P1 (user-visible value; justifies project)
- Status: pending
- Effort: 2d (5A) + 2d (5B) + 13-14d (5C incl. SSE streaming) = **17-18d**
<!-- Updated: Validation Session 1 - 5C effort +3-4d for SSE streaming promoted to v1 (Q5C.3) -->
- Three features, each self-contained, each gated by its own feature toggle:
  - **5A Ticket Comment Summarizer** — Issue detail page button → structured summary
  - **5B Cross-language Translator** — inline translate any comment VI↔EN↔KR
  - **5C RAG Q&A on Pages** — chat sidebar, slash-key trigger, citations

## Key Insights
- 5A + 5B are single-LLM-call features; 5C needs embed → vector search → context stuff → LLM (two-round-trip).
- 5C session-only chat history (not persisted initially) → KISS, avoid persisted-convo model v1.
- Citations: return page_id + title + URL in LLM prompt instructions; frontend renders as clickable card.
- All three features write to `AIRequestLog` with distinct `feature_name` values for audit.

---

## 5A — Ticket Comment Summarizer

### Requirements
- Button "Tóm tắt / Summarize" on Issue detail header.
- Fetches all `IssueComment` for issue ordered by `created_at`, formats as markdown conversation, single LLM call.
- Returns structured JSON: `{root_cause, actions_done, current_status, owner, confidence}`.
- Frontend shows modal with sections + copy button + refresh.
<!-- Updated: Validation Session 1 - 5A modal-only, no IssueActivity entry (Q5A.2) -->

### Architecture
```
Issue detail page
  ├─ [Tóm tắt] button ──▶ POST /api/workspaces/{slug}/projects/{pid}/issues/{iid}/ai-summary/
  │                          │
  │                          ▼
  │                        Fetch IssueComment.order_by('created_at')
  │                        Format: "[User A, 2026-04-01]: ...\n[User B, 2026-04-02]: ..."
  │                        Apply PII scrub (Phase 02)
  │                        LLM call w/ system prompt "Return JSON with keys: root_cause, actions_done, current_status, owner"
  │                        Parse JSON, fallback to raw text if parse fails
  │                        AIRequestLog.create(feature_name='summarize_comments')
  │                          │
  │                          ▼
  └── Modal: render sections
```

### Files
**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/ce/views/ai/summarize_issue.py`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/ai-summary-button.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/ai-summary-modal.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/services/ai-summary.service.ts`

**Modify:**
- `apps/api/plane/urls.py` or appropriate CE urls — register endpoint
- `apps/web/ce/components/issues/issue-header.tsx` (or nearest header location) — inject button

### Steps
1. Backend view: DRF APIView, POST, permission=`IsAuthenticated + HasAISummarizeFeature`.
2. Fetch comments via pattern in scout §3, order `created_at`, limit 500 (guard against huge threads).
3. Build prompt: system "You are a bank PM assistant. Summarize…"; user = formatted conversation.
4. Response format instruction: "Respond with JSON only: {root_cause, actions_done, current_status, owner}".
5. Try parse; if fail, wrap in `{raw_text: ...}`.
6. ~~Optional: post activity log with verb=`ai.summarized`~~ — DROPPED per Validation Session 1 (Q5A.2 → modal-only).
7. Frontend: button → call service → show modal.
8. Empty state: if issue has <2 comments, disable button with tooltip.

### Todo
- [ ] Backend summarize endpoint with scrub + audit
- [ ] System prompt template (locale-aware)
- [ ] JSON parse with fallback
- [ ] Frontend button + modal
- [ ] MobX store for summary state
<!-- Activity log integration DROPPED per Validation Session 1 (Q5A.2 → modal-only) -->
- [ ] Empty-state handling

### Success Criteria
- Issue with 20 comments → summary returned <5s, all 4 JSON fields populated.
- Reclick "Refresh" → re-calls LLM (no cache in v1).
- Button hidden when `ai_summarize_comments` toggle OFF.

### Risks
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| LLM returns non-JSON | M | M | try/except parse → show raw text |
| Huge comment thread exceeds context window | M | M | Truncate to last 500 comments; warn user |
| PII in comments leaks to LLM | M | H | Phase 02 scrubber applied in view |

---

## 5B — Cross-language Translator

### Requirements
- Icon button on any comment + page content block → dropdown (VI / EN / KR).
- Inline replacement with "Show original" toggle; original retained client-side only.
- Preserves tone and technical terms via system prompt.

### Architecture
```
[Comment]  [🌐 ▾]
              │
              ├─ VI → POST /api/workspaces/{slug}/ai/translate/
              │          { text, target_lang: 'vi', source_lang: 'auto' }
              ├─ EN
              └─ KR
                 │
                 ▼
         PII scrub → LLM call → return translated
         AIRequestLog(feature_name='translate')
                 │
                 ▼
         Frontend swaps rendered text, stores original in local state
```

### Files
**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/ce/views/ai/translate.py`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/shared/translate-menu.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/services/ai-translate.service.ts`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/hooks/use-translated-text.ts`

**Modify:**
- Insertion points in existing comment renderer + page block renderer (respect CE override; if core component, wrap via ce slot)

### Steps
1. Backend: POST endpoint accepts `{text, target_lang, source_lang?}`. Validate target ∈ {vi,en,ko}.
2. System prompt: "Translate to {target_lang}. Preserve technical terms, tone. Keep markdown/formatting."
3. Rate limit: leverage `AIRequestThrottle` (no separate throttle).
4. Frontend hook `useTranslatedText` manages {original, translated, lang, loading}.
5. Component: dropdown menu, three lang options + "Revert".

### Todo
- [ ] Backend translate endpoint
- [ ] Translate menu component (dropdown)
- [ ] Translated-text hook
- [ ] Wire into comment renderer
- [ ] Wire into page block renderer
- [ ] Handle markdown preservation (test with code blocks, lists)

### Success Criteria
- VI comment "Xin chào" + pick EN → replaced with "Hello".
- "Show original" reverts instantly (client-only).
- Code blocks not translated (preserved verbatim).
- Toggle OFF → menu hidden.

### Risks
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Markdown broken in translation | M | M | Prompt emphasizes preserving; test suite with tables/code |
| Translation of PII masks them permanently (user sees `[CCCD]`) | M | M | Document: user sees scrubbed version; raw kept in DB |
| Target lang mis-detected | L | L | Require explicit target, auto source only |

---

## 5C — RAG Q&A on Pages (Flagship)

### Requirements
- Chat widget in workspace, triggered by slash `/` or sidebar icon.
- User types question → backend embeds → vector search top-5 chunks → LLM with stuffed context → response with citations.
- Citations render as clickable cards linking to source page.
- Session-only history (no persistence in v1); refresh = reset.
- Respect workspace + page access scoping (Phase 04 `search_pages` handles).
- **SSE streaming required in v1** (per Validation Session 1, Q5C.3). Backend streams token-by-token via `text/event-stream`; frontend consumes with EventSource / ReadableStream.
<!-- Updated: Validation Session 1 - SSE streaming promoted from v1.1 deferred → v1 required (Q5C.3). Effort +3-4d. -->

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ Chat sidebar (apps/web)                                      │
│   User types question "How do we handle API auth rotation?"  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼  POST /api/workspaces/{slug}/ai/rag-qa/
                            { question, session_id, history[] }
┌───────────────────────┴─────────────────────────────────────┐
│ Backend: rag_qa view                                         │
│   1. PII scrub question                                      │
│   2. EmbeddingService.embed_batch([question]) → q_vec        │
│   3. search_pages(workspace_id, q_vec, user, k=5)            │
│      → [{chunk_text, page_id, page_title, distance}]         │
│   4. Build prompt:                                           │
│      SYSTEM: "You are Plane RAG assistant. Answer from       │
│               context. Cite sources as [^N]."                │
│      CONTEXT: "[^1] {chunk1}\n[^2] {chunk2}..."              │
│      HISTORY: last 5 turns                                   │
│      USER: question                                          │
│   5. LLM call (Phase 01 client)                              │
│   6. AIRequestLog(feature_name='rag_qa', tokens, pages_used) │
│   7. Return { answer, citations: [...] }                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────┴─────────────────────────────────────┐
│ Frontend renders:                                            │
│   - Answer bubble                                            │
│   - Citation cards (clickable → /workspace/page/{id})        │
│   - Session state in MobX (non-persistent)                   │
└─────────────────────────────────────────────────────────────┘
```

### Files
**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/ce/views/ai/rag_qa.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/rag_prompt_builder.py`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/ai-chat/chat-sidebar.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/ai-chat/chat-message.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/ai-chat/citation-card.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/ai-chat/chat-input.tsx`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/services/ai-rag-qa.service.ts`
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/store/ai-chat-store.ts` — MobX store
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/hooks/use-slash-trigger.ts`

**Modify:**
- `apps/web/ce/layouts/workspace-layout.tsx` (or Plane's workspace layout) — inject sidebar entry + slash handler

### Steps
1. **Prompt builder**: `build_rag_prompt(question, chunks, history, locale) → messages[]`. Context footnotes `[^N]` format; instruct LLM to cite.
2. **Backend view**: POST `rag-qa/`. Inputs: `{question, session_id (uuid), history: [{role, content}]}`. Outputs: `{answer, citations: [{ref, page_id, page_title, url, excerpt}]}`.
3. **Permission**: `IsAuthenticated + HasAIPagesRAGFeature`.
4. **Call order**: scrub question → embed → search → build prompt → LLM → log.
5. **Citation parsing**: post-process LLM output, extract `[^N]` refs, attach page metadata from search results.
6. **Token budget**: limit context to ~4K tokens (5 chunks × 800 chars typical); trim history beyond last 5 turns.
7. **Frontend sidebar**: slide-in panel, fixed right (400px). Collapsed by default.
8. **MobX store**: `messages[]`, `isLoading`, `sendMessage(q)`, `reset()`. Session only.
9. **Slash trigger**: global keydown listener; `/` key in non-editor context opens chat with focus on input.
10. **Citation cards**: show page title + 150-char excerpt + "Open page" link.
11. **Empty-state**: "Ask me anything about your workspace pages. Try: 'What's the API auth policy?'"
12. **Loading state**: skeleton for response.
13. **Error state**: retry button, fallback message per Phase 02 pattern.
14. **SSE streaming (v1 required)**: Backend emits `text/event-stream` with chunks `data: {token}\n\n` as LLM responds. OpenAI SDK `stream=True` → iterate + yield in StreamingHttpResponse. Citations emitted as final event `data: {"citations": [...]}\n\n`. Frontend uses EventSource or fetch+ReadableStream; appends tokens to message bubble; renders citation cards after final event. +3-4d effort.

### Todo
- [ ] RAG prompt builder with footnote citation format
- [ ] Backend rag-qa endpoint (scrub → embed → search → LLM)
- [ ] Citation post-processor (parse `[^N]` refs)
- [ ] Token budget trimming (context + history)
- [ ] Chat sidebar UI component
- [ ] Chat input with slash trigger
- [ ] Citation card component
- [ ] MobX chat store (session-only)
- [ ] Slash key global handler
- [ ] Empty state + loading + error states
- [ ] Integration test: ask question → answer + valid citations
- [ ] Access control test: user B cannot see user A's private page info in answer

### Success Criteria
- Question "What's our API auth flow?" → answer with 1-3 citations to real pages.
- Clicking citation → navigates to source page.
- Chat session resets on refresh (no persistence).
- Answer latency <8s p95 (embed + search + LLM).
- User in workspace with toggle OFF → sidebar hidden, slash key no-op.
- Private page info never appears in answer for non-authorized user.

### Risks
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| LLM hallucinates citations (fake `[^99]`) | H | M | Validate ref numbers ≤ len(chunks); strip invalid |
| Context too large → exceed LLM window | M | M | Char-count trim + summarize oldest history turns |
| Vector search returns irrelevant chunks → bad answer | M | M | Distance threshold 0.4; show "Not enough info" when < threshold |
| Private page content leaks via chunk | L | H | `search_pages` access control + Phase 04 integration test |
| Slash key conflicts with editor | H | M | Only trigger outside contentEditable; document exclusion zones |
| Streaming complexity delays launch | H | M | SSE required v1 per user decision; allocate +3-4d buffer; backend stream helper reusable for 5A/5B later if needed |
| Session-only history frustrates users ("I lost my chat") | M | L | Clear messaging: "History resets on refresh". Persistence = Phase post-launch |

### Security
- Per-request PII scrub applied before embed + LLM.
- Answer generated from user-accessible pages only (access control enforced in `search_pages`).
- Citation URLs point to Plane internal pages (no external links in LLM output).
- Audit log includes `pages_referenced` JSON field for traceability.

---

## Cross-feature Non-Functional Requirements
- All three features gated by workspace feature toggle (Phase 03).
- All three features write `AIRequestLog` rows (Phase 02) with distinct `feature_name`.
- All three features respect global kill switch (Phase 02).
- All three features respect rate limit (Phase 02) — same throttle counts across features.

## Open Questions (blocking validation)

### 5A
- Q5A.1 [Product] Summary structure: `{root_cause, actions_done, status, owner}` is hypothesis — should bank PM team validate?
- Q5A.2 [Product] Post summary as visible activity entry, or modal-only? Affects discoverability + audit trail.
- Q5A.3 [Performance] Limit of 500 comments — acceptable, or need streaming/chunked summary for huge threads?

### 5B
- Q5B.1 [Product] Languages pair: confirmed VI/EN/KR? Any need for JA, ZH?
- Q5B.2 [Product] Auto-translate on comment load (if UI lang ≠ comment lang), or always on-demand? On-demand = default; cheaper.
- Q5B.3 [Product] Should translated versions cache in DB for other users, or strictly per-user ephemeral? (Privacy: PII-scrubbed content vs. raw.)

### 5C
- Q5C.1 [Product] Chat history persistence v1 = session-only acceptable? Or must persist (extra model required)?
- Q5C.2 [Product] Scope — pages only, or include Issues/Comments in RAG index? (Current: pages only.)
- Q5C.3 [Performance] Streaming required for UX? Defer to v1.1 = acceptable?
- Q5C.4 [Product] When no relevant chunks found — show "Not enough information" or still call LLM with empty context?
- Q5C.5 [Security] Should RAG answer be filtered through PII scrub on output as well (LLM may echo PII from chunks)?
- Q5C.6 [Product] Slash `/` key conflicts with Plane's existing slash-command menu in editor?
- Q5C.7 [Product] Citation format — footnote style `[^1]` or inline link chips? UX decision.
- Q5C.8 [Performance] Max concurrent chats per workspace — caps LLM concurrent calls; drives Celery/pool sizing.

## Next Steps / Dependencies
- Requires: Phase 01, 02, 03 for all; Phase 04 additionally for 5C.
- Can parallelize: 5A + 5B can ship independently and earlier; 5C gated on Phase 04 completion.
- Blocks: Phase 06 observability (needs real usage to calibrate dashboards).
