# Phase 04 — Embedding Infrastructure (pgvector + BGE-M3)

## Context Links
- Research: `research/researcher-01-embedding-rag-stack.md` — entire document
- Research: `research/scout-01-plane-data-model.md` §1-2 (Page model, save lifecycle)
- Code: `apps/api/plane/db/models/page.py:23-78` (Page model, `description_html`)
- Code: `apps/api/plane/bgtasks/page_transaction_task.py` (post-commit Celery pattern)
- Code: `apps/api/plane/bgtasks/page_version_task.py:17` (version lifecycle)

## Overview
- Priority: P1 (blocks Phase 05C RAG Q&A)
- Status: pending
- Effort: 7-10d
- Enable pgvector, add `PageEmbedding` model, build `EmbeddingService` with Shinhan primary + BGE-M3 fallback, chunk pages, Celery-driven incremental + backfill indexing.

## Key Insights
- pgvector-python native Django support via `VectorField(dimensions=1024)`. Single lib, actively maintained.
- HNSW index preferred over IVFFlat for frequently-updated content (Plane pages edit hourly). Build time ~1h for 100K vectors, query 40-50ms.
- BGE-M3 fallback supports VI/EN/KR natively with 8192-token context; deployable via vLLM (throughput) or Ollama (simplest).
- Chunking target: ~256 tokens, 32-token overlap, semantic block preservation via sentence split on `description_html`.
- Content-hash dedup avoids re-embedding unchanged chunks.
- Plane already uses post-commit Celery (`page_transaction.delay(...)`); hook embedding task into same post-commit chain.

## Requirements

### Functional
- `EmbeddingService.embed_batch(texts: list[str]) → list[vector]` — auto-selects Shinhan → vLLM → Ollama based on config.
- Every Page save (create + description_html change) enqueues `index_page_embeddings.delay(page_id)` on transaction commit.
- Task chunks page, embeds new chunks (reuse dedup cache), upserts `PageEmbedding` rows.
- Backfill task runs via Celery Beat every 10min, processes 100 pages/batch, terminates when coverage 100%.
- Search API: `search_pages(workspace_id, query_text, k=5, user) → list[chunks_with_citations]` — enforces workspace isolation + user access via Page.access check.

### Non-Functional
- Embedding generation: batch of 10 chunks <1s (vLLM baseline).
- Write throughput: 100 pages/min indexing without Celery queue pileup.
- HNSW query: <80ms p95 for workspace with 100K embeddings.
- Backfill 100K pages: complete within 7 days (staged, off-peak bias).
- Storage: ~150MB HNSW index per 100K vectors.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│ Page.save()                                                 │
│   ├─ post_save signal                                       │
│   └─ transaction.on_commit(queue_embedding_task)            │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ Celery: index_page_embeddings(page_id)                     │
│   1. Fetch page, check description_html hash               │
│   2. Skip if hash unchanged                                │
│   3. HTML → plain text                                     │
│   4. chunk_page_content() → list[{text,hash,seq}]          │
│   5. Reuse existing embeddings by content_hash             │
│   6. EmbeddingService.embed_batch(new_chunks)              │
│   7. DELETE old PageEmbedding + bulk_create new            │
│   8. Audit log to AIRequestLog (Phase 02)                  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ Postgres: page_embedding table                              │
│   page_id, chunk_index, chunk_text, chunk_hash,             │
│   embedding vector(1024), workspace_id, metadata JSONB      │
│                                                             │
│   HNSW index on embedding (vector_cosine_ops)               │
└────────────────────────┬───────────────────────────────────┘
                         ▲
                         │ query
┌────────────────────────┴───────────────────────────────────┐
│ search_pages(workspace_id, query, k=5)                     │
│   1. embed query                                            │
│   2. PageEmbedding.objects.filter(                          │
│        workspace=ws, page__access=0, ...).annotate(        │
│        distance=CosineDistance('embedding', q)              │
│      ).order_by('distance')[:k]                             │
│   3. Return chunks + page refs for citations                │
└────────────────────────────────────────────────────────────┘
```

## Related Code Files

**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/page_embedding.py` — `PageEmbedding` model
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/migrations/XXXX_pgvector_extension.py` — `VectorExtension()`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/migrations/XXXX_add_page_embedding_table.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/migrations/XXXX_add_page_embedding_hnsw_index.py` — `RunSQL` concurrent create
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/embedding_service.py` — provider selection + batch embed
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/text_chunking.py` — HTML strip + sentence chunk with overlap
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/bgtasks/embedding_tasks.py` — `index_page_embeddings`, `backfill_page_embeddings`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/management/commands/check_embedding_coverage.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/rag_search.py` — `search_pages()` helper
- `/Volumes/Data/SHBVN/plane.so/docs/operations/bge-m3-self-host-runbook.md`

**Modify:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/page.py` — add `embedding_content_hash`, `embedding_updated_at` (NOT `embedding` VectorField on Page itself — chunks in separate table)
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/__init__.py` — register `PageEmbedding`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/bgtasks/page_transaction_task.py` — chain `index_page_embeddings.delay()` at end
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/instance_config_variables/core.py` — add `EMBEDDING_PROVIDER`, `EMBEDDING_BASE_URL`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/settings/celery.py` (or beat config) — add backfill schedule
- `/Volumes/Data/SHBVN/plane.so/apps/api/requirements/base.txt` — add `pgvector>=0.3.0`, optionally `tiktoken>=0.7.0`

**Delete:** None.

## Implementation Steps

1. **Add pgvector extension**: Migration with `VectorExtension()`. Verify `plane_user` has privilege; document SQL grant if not.
2. **PageEmbedding model** per research §2 + §4.3. Fields: `id`, `page` (FK cascade), `workspace` (FK, denormalized for fast scoping), `chunk_index`, `chunk_text`, `chunk_hash` (indexed), `embedding` (`VectorField(1024)`), `metadata` (JSONB, e.g., source page title), `created_at`. `unique_together=(page, chunk_index)`.
3. **HNSW index**: separate migration using `RunSQL` with `CREATE INDEX CONCURRENTLY` to avoid locking. Parameters `m=16, ef_construction=200`.
4. **Add Page fields**: `embedding_content_hash CharField(32, null)`, `embedding_updated_at DateTimeField(null)`.
5. **EmbeddingService**: Provider chain (research §1.2):
   - If `EMBEDDING_PROVIDER=shinhan` and endpoint reachable → `OpenAI(api_key, base_url=techai-web...)`.
   - If `EMBEDDING_PROVIDER=vllm` → `OpenAI(api_key="none", base_url=VLLM_URL)`.
   - If `EMBEDDING_PROVIDER=ollama` → `OpenAI(api_key="none", base_url=OLLAMA_URL)`.
   - Method `embed_batch(texts)` passes list to SDK, returns ordered vectors.
   - Dimension validation: reject if returned dim ≠ `EMBEDDING_DIMENSIONS` config.
6. **Chunking util** per research §3.2: `chunk_page_content(page_id, html) → list[dict]`. HTML stripped via `html.parser.HTMLParser`. Sentence split regex `(?<=[.!?])\s+`. Target 256 tokens (~1K chars). Overlap 32 tokens. Content hash `md5(page_id:seq:text)`.
7. **Celery task `index_page_embeddings`**:
   - Lock on `page_id` (Redis lock 60s) to prevent race on concurrent saves.
   - Compute new `content_hash = md5(description_html)`.
   - If `page.embedding_content_hash == new_hash` → return.
   - Chunk, dedup vs existing `PageEmbedding.chunk_hash`, embed only new chunks.
   - Bulk upsert: delete all embeddings for page, bulk_create new set (simpler than individual upsert).
   - Update `page.embedding_content_hash`, `embedding_updated_at`.
   - Write `AIRequestLog` (feature_name=`embedding_index`, tokens=sum chunk sizes, model=EMBEDDING_MODEL).
   - Retry 3x with exponential backoff on transient errors.
8. **Signal wiring**: Extend existing `page_transaction` task in `bgtasks/page_transaction_task.py` — at end, call `index_page_embeddings.delay(page_id)`. Do NOT add another post_save signal (KISS, reuse existing chain).
9. **Backfill task**: Celery Beat cron `*/10 * * * *` calls `backfill_page_embeddings_batch(batch_size=100)`. Query: `Page.objects.filter(embedding_content_hash__isnull=True, archived_at__isnull=True)[:100]` → delay each.
10. **Management command** `check_embedding_coverage` — prints `embedded / total` per workspace.
11. **`rag_search.py`**: `search_pages(workspace_id, query, user, k=5) → list[SearchResult]`. Uses `pgvector.django.CosineDistance`. Filters: `workspace_id`, `page__access=0 OR page__owned_by=user` (access control), `page__archived_at__isnull=True`. Returns list of `{chunk_text, page_id, page_title, distance, url}`.
12. **Access control test**: Create private page (access=1) as userA, attempt search as userB → must NOT surface userA's private page chunks.
13. **Runbook for BGE-M3 self-host**: vLLM command, Ollama command, health check, GPU sizing estimate (1×T4 for 10 QPS, 1×A10 for 100 QPS).

## Todo List

- [ ] Migration: enable pgvector extension
- [ ] Migration: add `embedding_content_hash`, `embedding_updated_at` to Page
- [ ] Model + migration: `PageEmbedding`
- [ ] Migration: HNSW index (CONCURRENTLY)
- [ ] Add embedding config vars (provider, url, model, dims)
- [ ] Implement `EmbeddingService` with provider selection
- [ ] Implement text chunker with HTML strip + overlap
- [ ] Implement `index_page_embeddings` Celery task
- [ ] Wire into `page_transaction_task` post-commit chain
- [ ] Implement `backfill_page_embeddings_batch` + beat schedule
- [ ] Implement `rag_search.search_pages` with access control
- [ ] Management command for coverage report
- [ ] BGE-M3 self-host runbook
- [ ] Unit tests: chunker (short, long, empty, multi-lang), service provider selection
- [ ] Integration test: full cycle (save page → embed → search → correct result)
- [ ] Access control test: private pages excluded for non-owner

## Success Criteria
- `python manage.py migrate` succeeds on fresh DB + enables pgvector.
- Editing a page triggers Celery task within 2s; embeddings in `page_embedding` table within 10s.
- Backfill command processes 100K pages in <7d (measurable via coverage % trend).
- `search_pages("API authentication")` returns top 5 chunks with relevance order.
- Access control: private page owned by user A not returned to user B.
- HNSW query latency <80ms p95 with 100K embeddings.
- Duplicate chunk (same content_hash) reuses existing embedding — no LLM call.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| pgvector extension permission denied on prod | M | H | SQL grant doc in migration comments; DBA pre-flight |
| Shinhan `/v1/embeddings` missing → fallback needed | H | H | Phase-gate: test Shinhan day 1; if absent, spin up BGE-M3 vLLM parallel |
| HNSW `CREATE INDEX` blocks writes on large table | M | H | Use CONCURRENTLY; build during low traffic window |
| Celery queue saturates on mass import | M | M | Dedicated `embedding` queue with own worker pool; rate-limit backfill to 100/10min |
| Chunk size wrong for Korean/Vietnamese (token:char ratio varies) | M | M | Benchmark on sample KR/VI pages; tune 256 if needed |
| Race on concurrent page save → duplicate embeddings | M | M | Redis lock on `page_id` in task; unique constraint `(page, chunk_index)` |
| Storage growth for high-volume workspace | L | M | Monitor pg_table_size; partition `page_embedding` by workspace if >50GB |
| BGE-M3 GPU availability in bank infra | H | H | Confirm infra capacity day 1; if no GPU, investigate CPU BGE-M3 (slower but works) |
| Access control missed → cross-user leakage | L | H | Explicit test case; code review mandatory on search helper |

## Security Considerations
- Page embeddings = lossy compression of content but still potentially sensitive. Treat `page_embedding` table as equivalent sensitivity to `page` table.
- Search results must respect Plane's page access model (Public vs Private).
- Workspace isolation via `workspace_id` filter, never rely solely on page FK.
- No PII scrub on indexed text: the full content is already in Plane DB; embeddings are derivative. Scrubbing on query prompt only (Phase 02 covers).
- If self-hosting BGE-M3, ensure model server is on internal network only (no public egress).

## Open Questions (blocking validation)
- Q4.1 [Infrastructure] Does TechAI expose `/v1/embeddings`? If yes, what model name, what dimensions? If no — GPU approval to self-host BGE-M3 (1×A10 ~ est).
- Q4.2 [Infrastructure] Postgres version confirmed 15.7 (supports pgvector 0.7+)? Any prod-side blocker for `CREATE EXTENSION vector`?
- Q4.3 [Security] Is it acceptable to store embeddings of potentially-sensitive page content in same DB, or must embeddings live in isolated store?
- Q4.4 [Performance] Expected max pages per workspace? Drives HNSW tuning + partition decision.
- Q4.5 [Product] Should PageVersion history also be embedded (version-aware search)? Research recommends NO (10× cost, low value).
- Q4.6 [Product] Cross-page-type scope: embed only `Page`, or also `Issue.description`, `IssueComment`? Current plan: Pages only; Issues for Phase 05A summary via direct fetch (no embedding needed).
- Q4.7 [Infrastructure] Celery `embedding` queue — dedicated worker count? Sizing from expected edit QPS.
- Q4.8 [Security] Embedding cache in Redis (research §7) — worth the complexity, or skip?
- Q4.9 [Product] When page deleted/archived — hard-delete embeddings or soft-flag? Cascade FK will hard-delete; confirm acceptable.

## Next Steps / Dependencies
- Requires: Phase 02 (audit log) for embedding task audit rows.
- Blocks: Phase 05C (RAG Q&A needs `search_pages`).
- Parallel-safe with Phase 03.
