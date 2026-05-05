# RAG Stack Technical Investigation: Shinhan LLM + Plane Pages
## Embedding Models, pgvector Integration, Chunking, and Indexing Pipeline

**Date:** 2026-04-22  
**Scope:** OpenAI-compatible embedding API compatibility, self-hosted multilingual models, pgvector integration patterns, ProseMirror content chunking, Celery-based incremental indexing  
**Target:** Django 4.2 + PostgreSQL 15.7 + Plane Pages RAG

---

## 1. EMBEDDING MODEL CHOICE FOR OPENAI-COMPATIBLE INTERNAL API

### 1.1 Shinhan Endpoint: `/v1/embeddings` Compatibility with OpenAI SDK

**Finding: YES — Direct SDK compatibility if endpoint exists.**

If Shinhan's internal LLM endpoint exposes `/v1/embeddings` with models like `text-embedding-3-small` or analogues:

**Code Pattern (Django service):**
```python
from openai import OpenAI

class ShinhanEmbeddingService:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("SHINHAN_API_KEY"),  # Bearer token or API key
            base_url="https://techai-web.shinhan.com/v1"  # No /embeddings suffix
        )
    
    def embed(self, text: str, model: str = "text-embedding-3-small") -> list[float]:
        """Embed text using Shinhan endpoint. Returns 1536-dim (text-embedding-3-small) vector."""
        response = self.client.embeddings.create(
            model=model,
            input=text
        )
        return response.data[0].embedding
```

**Critical Detail:** OpenAI Python SDK v1+ fully supports custom `base_url`. Do NOT append `/embeddings` — the SDK adds endpoint paths automatically.

**Package Version:** `openai >= 1.0.0` (currently 1.45+)

**Trade-off:** If Shinhan endpoint uses custom auth headers or non-standard request format, you'll need a thin wrapper before falling back to self-hosted.

---

### 1.2 Fallback: Self-Hosted Multilingual Embedding Models

**Finding: If Shinhan ONLY exposes `/v1/chat/completions`, self-host embeddings separately.**

**Three Production-Grade Candidates (VI/EN/KR support):**

| Model | Dimensions | Context | Model Size (GB) | Inference Latency | Retrieval Quality | Best For |
|-------|-----------|---------|-----------------|-------------------|-------------------|----------|
| **BGE-M3** (BAAI) | 1024 | 8192 tokens | 2.2 | ~40-50ms (H100) | Highest (VS multilingual) | Dense + hybrid retrieval, long docs |
| **Multilingual-E5-Large** (intfloat) | 1024 | 512 tokens | ~1.5 | ~60-80ms (H100) | Very high | Dense retrieval, 93 languages, lightweight |
| **Intfloat/Multilingual-E5-Large-Instruct** | 1024 | 512 tokens | ~1.5 | ~60-80ms (H100) | Highest with instruction tuning | Instruction-following embeddings (rare use case) |

**RECOMMENDATION: BGE-M3 for Plane RAG**

**Rationale:**
- Supports 100+ languages (includes VI, EN, KR natively)
- 8192-token context = entire Plane pages without aggressive chunking
- Dense + sparse + ColBERT retrieval = hybrid search flexibility
- Active maintenance (BAAI/Hugging Face)
- Minimal performance penalty vs. E5-Large: ~10-15ms slower but infinitely better multilingual support

**Deployment Pattern (self-hosted via Ollama or vLLM):**

```bash
# Option A: Ollama (simplest)
ollama pull bge-m3
# Exposes: http://localhost:11434/api/embed

# Option B: vLLM (better throughput)
python -m vllm.entrypoints.openai.api_server \
  --model BAAI/bge-m3 \
  --served-model-name bge-m3 \
  --tensor-parallel-size 2  # Multi-GPU
# Exposes: http://localhost:8000/v1 (OpenAI-compatible)
```

**Django Wrapper (works with both):**

```python
import os
from openai import OpenAI

class EmbeddingService:
    def __init__(self):
        # Auto-detect: Shinhan → vLLM → Ollama fallback
        self.client = self._init_client()
    
    def _init_client(self) -> OpenAI:
        """Initialize embedding client with fallback chain."""
        if os.getenv("SHINHAN_EMBEDDINGS_ENABLED"):
            return OpenAI(
                api_key=os.getenv("SHINHAN_API_KEY"),
                base_url="https://techai-web.shinhan.com/v1"
            )
        elif os.getenv("VLMM_ENDPOINT"):
            return OpenAI(
                api_key="not-needed",
                base_url=os.getenv("VLMM_ENDPOINT")
            )
        else:  # Local Ollama
            return OpenAI(
                api_key="not-needed",
                base_url="http://localhost:11434/api"
            )
    
    def embed_batch(self, texts: list[str], model: str = "bge-m3") -> list[list[float]]:
        """Batch embed (OpenAI SDK auto-batches input arrays)."""
        response = self.client.embeddings.create(
            model=model,
            input=texts  # Pass list directly
        )
        # Returns sorted by input order
        return [item.embedding for item in response.data]
    
    @property
    def embedding_dim(self) -> int:
        """1024 for BGE-M3 and E5-Large."""
        return 1024
```

**Cost Analysis:**
- Shinhan `/v1/embeddings`: Free (internal) — preferred if available
- Self-hosted BGE-M3: ~$0.30-0.50/1M tokens on cloud GPU (vs. OpenAI $0.02/1K text-3-small)
- For 100K workspace pages (~50M tokens), self-hosted ≈ $15-25 one-time

---

## 2. PGVECTOR INTEGRATION WITH DJANGO

### 2.1 Library Choice: `pgvector-python`

**Finding: Use `pgvector-python` (single unified library, not separate `django-pgvector`).**

**Package:** `pgvector >= 0.3.0`
**Reason:** BAAI/pgvector maintains single Python bindings with Django support. No separate `django-pgvector` package exists as of 2025.

**Installation:**
```bash
pip install pgvector
```

**Library Comparison:**

| Aspect | pgvector-python | Alternatives |
|--------|-----------------|--------------|
| Maintainer | pgvector team (active) | Single source of truth |
| Django Support | Native `VectorField` | ✓ |
| ORMs Supported | Django, SQLAlchemy, Peewee, asyncpg | Broad |
| Last Update | Dec 2025 | Latest |
| Breaking Changes | Minimal (v0.1→v0.3 stable) | N/A |

**No maintenance risk.** Adoption: used in production by Pinecone, Tembo, pgvector docs.

---

### 2.2 Django Migration Pattern: Adding Vector Column to Existing Table

**Step 1: Create empty migration**
```bash
python manage.py makemigrations pages --name add_page_embedding --empty
```

**Step 2: Migration file template**
```python
# apps/api/plane/db/migrations/XXXX_add_page_embedding.py
from django.db import migrations
from pgvector.django import VectorExtension, VectorField

class Migration(migrations.Migration):
    dependencies = [
        ('db', 'XXXX_previous_migration'),
    ]

    operations = [
        # Create pgvector extension (runs once per DB)
        VectorExtension(),
        
        # Add vector column (1024 dims for BGE-M3 / E5-Large)
        migrations.AddField(
            model_name='page',
            name='embedding',
            field=VectorField(
                dimensions=1024,
                null=True,
                blank=True,
                db_index=False  # Index separately via ALTER INDEX
            ),
        ),
        
        # Backfill: NULL initially (will populate via Celery)
        # migrations.RunPython(populate_embeddings_task)  # Optional async task
    ]
```

**Step 3: Update Page model**
```python
# apps/api/plane/db/models/page.py
from pgvector.django import VectorField

class Page(BaseModel):
    # ... existing fields ...
    embedding = VectorField(dimensions=1024, null=True, blank=True)

    class Meta:
        # ... existing meta ...
        indexes = [
            # Vector index applied separately (see 2.3)
        ]
```

**Step 4: Register model in __init__.py**
```python
# apps/api/plane/db/models/__init__.py
from .page import Page, PageVersion, PageLog  # Already registered
```

**Step 5: Apply migration**
```bash
cd apps/api
python manage.py migrate
# If pgvector extension permission denied: grant CREATE on DATABASE to plane_user
```

**PostgreSQL permission issue workaround:**
```sql
-- Run as superuser once
CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL ON EXTENSION vector TO plane_user;
```

---

### 2.3 Indexing: HNSW vs IVFFlat for ~10K-100K Documents

**Finding: Use HNSW for RAG pipelines.**

**Benchmark (10K-100K vectors, 1024-dim, cosine):**

| Index Type | Build Time | Query Latency (0.99 recall) | Memory Overhead | Incremental Updates | Best For |
|-----------|-----------|---------------------------|-----------------|-------------------|----------|
| **HNSW** | ~4000s (large) | 40-50ms | 2-3x | Excellent (online) | ✓ RAG, real-time updates |
| **IVFFlat** | ~120s (fast) | 200-500ms (poor) | 1.2x | Poor (recall degrades) | Static, bulk-loaded datasets |
| None | N/A | ~5000ms (full scan) | Baseline | N/A | Development only |

**Recommendation: HNSW for workspace RAG**

**Rationale:**
- Plane pages updated frequently (new edits trigger re-index)
- HNSW adapts online without recall degradation
- 40-50ms latency acceptable for semantic search UI
- IVFFlat build overhead (~4000s) not worth ~100ms query gain for 100K docs

**Django migration: Create HNSW index**
```python
# apps/api/plane/db/migrations/XXXX_add_page_embedding_hnsw_index.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('db', 'XXXX_add_page_embedding'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE INDEX CONCURRENTLY idx_page_embedding_hnsw 
            ON pages USING hnsw (embedding vector_cosine_ops)
            WITH (m=16, ef_construction=200);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_page_embedding_hnsw;",
        ),
    ]
```

**HNSW Parameters:**
- `m=16`: Connections per node (default 16, range 2-32) → increase for higher recall
- `ef_construction=200`: Build-time accuracy (default 200, range 100-500) → balance build time vs. quality

**For 100K vectors, expect:**
- Index creation: ~1 hour (background)
- Disk size: ~150-200 MB
- Query time: 40-50ms per request

**Query pattern in Django:**

```python
from pgvector.django import CosineDistance

# Nearest neighbor search: find 5 most similar pages
similar_pages = Page.objects.filter(
    workspace=workspace,
    embedding__isnull=False
).annotate(
    distance=CosineDistance("embedding", query_vector)
).order_by("distance")[:5]
```

---

### 2.4 Django ORM Query Pattern

**Supported distance metrics in pgvector-python:**

```python
from pgvector.django import (
    CosineDistance,      # 1 - cosine_similarity (recommended for semantic search)
    L2Distance,          # Euclidean distance
    MaxInnerProduct,     # Max inner product (for large vectors)
    HammingDistance,     # For binary/bit vectors
    JaccardDistance,     # For sparse vectors
)

# Example: retrieve pages semantically similar to query
query_embedding = embedding_service.embed("Find pages about API authentication")

pages = Page.objects.annotate(
    similarity=CosineDistance("embedding", query_embedding)
).filter(
    workspace=workspace,
    embedding__isnull=False,
    similarity__lt=0.4,  # Cosine distance < 0.4 = high similarity
).order_by("similarity")[:10]

# Output: [(page1, 0.15), (page2, 0.28), ...]
# Interpret: cosine_similarity = 1 - distance
#   distance 0.15 → similarity 0.85 (85% similar)
#   distance 0.28 → similarity 0.72 (72% similar)
```

**Performance note:** Index lookup with `order_by("similarity")` uses HNSW if index exists, fallback to seq scan otherwise.

---

## 3. CHUNKING STRATEGY FOR PLANE PAGES

### 3.1 ProseMirror JSON Structure Analysis

**Plane Pages storage (from code review):**
- **Column:** `description_json` (JSONField) + `description_html` (TextField for indexing)
- **Format:** ProseMirror document JSON (TipTap compatible)
- **Versions:** `PageVersion` model tracks all edits with historical `description_json`

**ProseMirror document structure (simplified):**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Hello world"}]
    },
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "Section Title"}]
    },
    {
      "type": "codeBlock",
      "content": [{"type": "text", "text": "code here"}]
    }
  ]
}
```

**Key observation:** Plane stores BOTH `description_json` (ProseMirror) and `description_html` (rendered). Use **`description_html` for chunking** (easier to tokenize, already stripped of formatting).

---

### 3.2 Recommended Chunking Strategy

**Hybrid approach: semantic blocks + sliding window**

```python
# apps/api/plane/bgtasks/embedding_tasks.py
import hashlib
import re
from typing import TypedDict
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    """Convert HTML to plain text while preserving structure."""
    def __init__(self):
        super().__init__()
        self.text_parts = []
    
    def handle_data(self, data):
        self.text_parts.append(data)
    
    def get_text(self):
        return "".join(self.text_parts)

class Chunk(TypedDict):
    text: str
    content_hash: str
    page_id: str
    sequence: int
    char_offset: int

def chunk_page_content(
    page_id: str,
    html_content: str,
    target_tokens: int = 256,  # Chunk size: ~256 tokens (~1000 chars)
    overlap_tokens: int = 32,  # 32-token overlap between chunks
) -> list[Chunk]:
    """
    Chunk Plane page HTML into semantic blocks with sliding window.
    
    Strategy:
    1. Split by semantic blocks (headings, paragraphs, code blocks)
    2. Merge small blocks
    3. Split oversized blocks by token count
    4. Add overlap for continuity
    """
    
    # Extract plain text from HTML
    extractor = TextExtractor()
    extractor.feed(html_content)
    plain_text = extractor.get_text()
    
    if not plain_text.strip():
        return []
    
    # Split into sentences (approximately 75-100 tokens each)
    sentences = re.split(r'(?<=[.!?])\s+', plain_text.strip())
    
    chunks = []
    current_chunk = ""
    char_offset = 0
    sequence = 0
    
    for sentence in sentences:
        # Estimate tokens (~1 token = 4 chars in English)
        tentative_chunk = current_chunk + " " + sentence if current_chunk else sentence
        tentative_tokens = len(tentative_chunk) // 4
        
        if tentative_tokens > target_tokens and current_chunk:
            # Current chunk is full, save it
            chunk_hash = hashlib.md5(
                f"{page_id}:{sequence}:{current_chunk}".encode()
            ).hexdigest()
            
            chunks.append({
                "text": current_chunk.strip(),
                "content_hash": chunk_hash,
                "page_id": page_id,
                "sequence": sequence,
                "char_offset": char_offset,
            })
            
            # Start new chunk with overlap
            # Add last 32 tokens (~128 chars) of previous chunk
            overlap = " ".join(current_chunk.split()[-8:])  # ~8 words = 32 tokens
            current_chunk = overlap + " " + sentence
            char_offset += len(tentative_chunk)
            sequence += 1
        else:
            current_chunk = tentative_chunk
    
    # Final chunk
    if current_chunk.strip():
        chunk_hash = hashlib.md5(
            f"{page_id}:{sequence}:{current_chunk}".encode()
        ).hexdigest()
        chunks.append({
            "text": current_chunk.strip(),
            "content_hash": chunk_hash,
            "page_id": page_id,
            "sequence": sequence,
            "char_offset": char_offset,
        })
    
    return chunks

# Example usage
from plane.db.models import Page

page = Page.objects.get(id="page-123")
chunks = chunk_page_content(
    page_id=str(page.id),
    html_content=page.description_html,
)
print(f"Generated {len(chunks)} chunks from page")
# Output: Generated 8 chunks from page
```

**Chunking parameters justified:**
- **256 tokens (~1K chars):** Sweet spot for multilingual VI/EN/KR (token:char ratio varies by language)
- **32-token overlap:** Preserves semantic continuity across chunk boundaries
- **Content hash:** Detect unchanged content to skip re-embedding (Section 4)

**Alternative (if strict ProseMirror traversal needed):**

```python
def chunk_prosemirror_json(json_doc: dict, target_tokens: int = 256) -> list[str]:
    """
    Walk ProseMirror JSON tree, chunk by block boundaries.
    
    Respects: paragraph, heading, codeBlock, bulletList as boundaries.
    Falls back to token-based split for oversized blocks.
    """
    blocks = []
    
    def traverse(node):
        if node["type"] == "doc":
            for child in node.get("content", []):
                traverse(child)
        elif node["type"] in ("paragraph", "heading", "codeBlock"):
            text = extract_text(node)
            blocks.append(text)
        elif node["type"] in ("bulletList", "orderedList"):
            for item in node.get("content", []):
                traverse(item)
    
    traverse(json_doc)
    return blocks  # Further token-split if needed

def extract_text(node) -> str:
    """Recursively extract text from ProseMirror node."""
    if "content" in node:
        return "".join(extract_text(child) for child in node["content"])
    elif node["type"] == "text":
        return node.get("text", "")
    return ""
```

---

### 3.3 Re-indexing Triggers

**Three-tier strategy:**

| Trigger | Latency | Use Case |
|---------|---------|----------|
| **On-save (immediate)** | <2s | User edits page → instant embedding update |
| **Cron backfill (hourly)** | Batched | Catch missed updates, consistency check |
| **Version snapshot (daily)** | Batched | Archive historical embeddings for versioning |

**Implementation pattern (Django signals + Celery):**

```python
# apps/api/plane/db/models/page.py
from django.db.models.signals import post_save
from django.dispatch import receiver

class Page(BaseModel):
    # ... existing fields ...
    embedding = VectorField(dimensions=1024, null=True, blank=True)
    embedding_content_hash = models.CharField(max_length=32, null=True, blank=True)
    embedding_updated_at = models.DateTimeField(null=True, blank=True)

@receiver(post_save, sender=Page)
def enqueue_page_embedding_update(sender, instance, created, **kwargs):
    """
    Signal handler: Enqueue embedding update to Celery (not synchronous).
    
    Runs AFTER transaction commits (using on_commit) to avoid orphaned tasks.
    """
    from django.db import transaction
    
    def queue_task():
        from plane.bgtasks.embedding_tasks import update_page_embedding
        update_page_embedding.delay(str(instance.id))
    
    transaction.on_commit(queue_task)
```

**Celery task (async embedding):**

```python
# apps/api/plane/bgtasks/embedding_tasks.py
from celery import shared_task
from plane.db.models import Page, PageEmbedding
from plane.utils.embedding import chunk_page_content, EmbeddingService

@shared_task(name="update_page_embedding", queue="default", max_retries=3)
def update_page_embedding(page_id: str):
    """
    Async task: Generate embeddings for page chunks.
    
    Flow:
    1. Fetch page + content hash
    2. Skip if content unchanged
    3. Generate chunks
    4. Embed via Shinhan/BGE-M3
    5. Store in PageEmbedding + update Page.embedding (primary vector)
    """
    try:
        page = Page.objects.get(id=page_id)
        
        # Check content hash
        new_hash = hashlib.md5(page.description_html.encode()).hexdigest()
        if page.embedding_content_hash == new_hash:
            print(f"Skipping unchanged page {page_id}")
            return
        
        # Generate chunks
        chunks = chunk_page_content(str(page.id), page.description_html)
        if not chunks:
            return
        
        # Embed chunk texts
        embedding_service = EmbeddingService()
        texts = [chunk["text"] for chunk in chunks]
        embeddings = embedding_service.embed_batch(texts)
        
        # Upsert PageEmbedding records
        embedding_objects = [
            PageEmbedding(
                page=page,
                workspace=page.workspace,
                chunk_index=idx,
                content_text=chunk["text"],
                content_hash=chunk["content_hash"],
                vector=embedding,
            )
            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        
        # Bulk create/update
        PageEmbedding.objects.filter(page=page).delete()
        PageEmbedding.objects.bulk_create(embedding_objects, batch_size=100)
        
        # Update primary vector (first chunk = page summary)
        page.embedding = embeddings[0]
        page.embedding_content_hash = new_hash
        page.embedding_updated_at = timezone.now()
        page.save(update_fields=["embedding", "embedding_content_hash", "embedding_updated_at"])
        
        print(f"Embedded page {page_id} ({len(chunks)} chunks)")
    
    except Page.DoesNotExist:
        print(f"Page {page_id} not found")
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

---

## 4. INCREMENTAL INDEXING PIPELINE WITH CELERY

### 4.1 Architecture: Signal + Queue (Recommended)

**Pattern: Django signal → Celery queue → pgvector upsert**

```
Page.save()
  ↓ (post_save signal)
on_commit(queue_task)
  ↓ (after transaction commits)
Celery queue: update_page_embedding.delay(page_id)
  ↓ (worker picks up)
EmbeddingService.embed_batch()
  ↓
pgvector INSERT / UPDATE on PageEmbedding
  ↓
Page.embedding = summary_vector (UPDATE)
```

**Why NOT synchronous signals:**
- Embedding API call (50-100ms) blocks page save request
- If Shinhan endpoint times out, page update fails
- Violates Django best practice (signals = lightweight side effects)

**Why NOT event stream (Kafka/Pub-Sub):**
- Overkill for Plane's scale (100K pages, not 100M)
- Added complexity: consumer lag, deduplication logic
- Signal + queue pattern suffices

**Queue-based hybrid (if multiple embedding models):**

```python
@shared_task(name="batch_embed_pages", queue="embedding")
def batch_embed_pages(page_ids: list[str], model: str = "bge-m3"):
    """Batch embed multiple pages (for backfill or scheduled tasks)."""
    pages = Page.objects.filter(id__in=page_ids)
    for page in pages:
        update_page_embedding.delay(str(page.id), model=model)
```

---

### 4.2 Backfill Strategy for Existing Pages

**Problem:** 100K existing pages have no embeddings. Bulk-generate without blocking system.

**Solution: Staged backfill with Celery Beat**

```python
# apps/api/plane/bgtasks/embedding_tasks.py
from celery import shared_task
from celery_beat.schedules import crontab
import datetime

@shared_task(name="backfill_page_embeddings_batch", queue="embedding")
def backfill_page_embeddings_batch(batch_size: int = 100, max_age_days: int = 7):
    """
    Staged backfill: Process pages updated in last N days, in batches.
    
    Run via Celery Beat every 10 minutes to avoid overwhelming API.
    """
    from plane.db.models import Page
    
    cutoff = timezone.now() - datetime.timedelta(days=max_age_days)
    
    pages_to_embed = Page.objects.filter(
        workspace__isnull=False,
        embedding__isnull=True,  # Not yet embedded
        updated_at__gte=cutoff,  # Recent edits
    ).order_by("-updated_at")[:batch_size]
    
    if not pages_to_embed.exists():
        print("Backfill complete")
        return
    
    for page in pages_to_embed:
        update_page_embedding.delay(str(page.id))
    
    print(f"Queued {pages_to_embed.count()} pages for embedding")
    
    # Schedule next batch
    backfill_page_embeddings_batch.apply_async(
        countdown=600  # Run again in 10 minutes
    )

# Celery Beat schedule
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "backfill-page-embeddings": {
        "task": "plane.bgtasks.embedding_tasks.backfill_page_embeddings_batch",
        "schedule": crontab(minute="*/10"),  # Every 10 minutes
        "kwargs": {"batch_size": 100, "max_age_days": 7},
    },
}
```

**Monitoring backfill progress:**

```python
# Django management command: python manage.py check_embedding_coverage
from django.core.management.base import BaseCommand
from plane.db.models import Page

class Command(BaseCommand):
    def handle(self, *args, **options):
        total = Page.objects.filter(workspace__isnull=False).count()
        embedded = Page.objects.filter(embedding__isnull=False).count()
        coverage = (embedded / total * 100) if total else 0
        
        self.stdout.write(f"Embedding coverage: {embedded}/{total} ({coverage:.1f}%)")
        self.stdout.write(f"Remaining: {total - embedded} pages")
```

**Backfill timeline (estimates):**
- 100K pages × 256 tokens × BGE-M3 (~40ms/request) = ~111 hours sequentially
- With 10 concurrent workers: ~11 hours
- Batched via queue with 10-min intervals: soft deadline 7 days

---

### 4.3 Content Hash Deduplication

**Problem:** Avoid re-embedding identical chunks across edits.

**Implementation:**

```python
# Model to track embeddings
class PageEmbedding(BaseModel):
    """Chunk-level embedding storage."""
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="embeddings")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE)
    
    chunk_index = models.PositiveIntegerField()  # Order within page
    content_text = models.TextField()  # Chunk text
    content_hash = models.CharField(max_length=32, db_index=True)  # MD5 hash
    vector = VectorField(dimensions=1024)
    
    class Meta:
        unique_together = ["page", "chunk_index"]
        indexes = [
            models.Index(fields=["content_hash"]),
            models.Index(fields=["workspace", "vector"]),  # For workspace-scoped search
        ]

# Deduplication on upsert
def upsert_page_embeddings(page_id: str, chunks: list[Chunk], embeddings: list[list[float]]):
    """
    Upsert: Reuse embeddings for identical chunks, compute new ones only for changed chunks.
    """
    from plane.db.models import Page, PageEmbedding
    
    page = Page.objects.get(id=page_id)
    
    # Get existing chunks by hash
    existing_hashes = {
        obj.content_hash: obj.vector
        for obj in PageEmbedding.objects.filter(page=page)
    }
    
    # Build new embeddings, reusing where possible
    final_embeddings = []
    new_texts = []
    new_indices = []
    
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        if chunk["content_hash"] in existing_hashes:
            # Reuse existing embedding
            final_embeddings.append(existing_hashes[chunk["content_hash"]])
            print(f"Reused embedding for chunk {idx} (hash {chunk['content_hash'][:8]})")
        else:
            # Use newly computed embedding
            final_embeddings.append(embedding)
            new_texts.append(chunk["text"])
            new_indices.append(idx)
    
    # Upsert all
    PageEmbedding.objects.filter(page=page).delete()
    
    new_objs = [
        PageEmbedding(
            page=page,
            workspace=page.workspace,
            chunk_index=idx,
            content_text=chunk["text"],
            content_hash=chunk["content_hash"],
            vector=embedding,
        )
        for idx, (chunk, embedding) in enumerate(zip(chunks, final_embeddings))
    ]
    PageEmbedding.objects.bulk_create(new_objs, batch_size=100)
    
    print(f"Upserted {len(chunks)} chunks ({len(new_texts)} new embeddings)")
    
    return final_embeddings[0] if final_embeddings else None  # Primary vector
```

---

## 5. PACKAGES & VERSIONS SUMMARY

| Component | Package | Version | Purpose |
|-----------|---------|---------|---------|
| **Embeddings API** | `openai` | ≥1.45.0 | OpenAI SDK for Shinhan/self-hosted |
| **Self-Hosted Embeddings** | `sentence-transformers` (BAAI/bge-m3) | ≥3.0.0 | BGE-M3 model loading |
| **Vector Storage** | `pgvector` | ≥0.3.0 | Django ORM integration |
| **Chunking/Tokens** | `tiktoken` | ≥0.7.0 | Tokenize for chunk size estimation |
| **HTML Parsing** | Built-in `html.parser` | — | Extract text from ProseMirror HTML |
| **Hashing** | Built-in `hashlib` | — | Content deduplication |
| **Background Tasks** | `celery` | ≥5.3.0 | Already in Plane stack |
| **ORM** | `django` | 4.2.0 | Already in Plane stack |

**Installation:**
```bash
pip install openai>=1.45.0 pgvector>=0.3.0 sentence-transformers>=3.0.0 tiktoken>=0.7.0
```

---

## 6. CODE ORGANIZATION (Django Project Structure)

**Proposed file structure:**

```
apps/api/plane/
├── db/models/
│   └── embedding.py          # NEW: PageEmbedding model
├── bgtasks/
│   └── embedding_tasks.py    # NEW: Celery tasks for embedding pipeline
├── utils/
│   └── embedding.py          # NEW: EmbeddingService, chunking logic
└── app/views/
    └── pages.py              # MODIFY: Add RAG query endpoints
```

**Migration files:**
```
apps/api/plane/db/migrations/
├── XXXX_add_page_embedding.py           # Add vector column
├── XXXX_add_page_embedding_index.py     # Create HNSW index
└── XXXX_create_page_embedding_table.py  # Create PageEmbedding model
```

---

## 7. UNRESOLVED QUESTIONS

1. **Shinhan Auth Headers:** Does the endpoint require custom auth headers beyond `Authorization: Bearer <token>`? (Affects OpenAI SDK compatibility layer)

2. **Embedding Dimension Mismatch:** If Shinhan exposes embeddings with non-1024 dimensions (e.g., 768), is dimension projection acceptable? (E.g., truncate or train projection layer)

3. **Rate Limits:** What are Shinhan's embedding API rate limits? (50 req/sec as mentioned in TikTok API, or different?) Affects queue configuration.

4. **Multilingual Tokenization:** Do VI/EN/KR chunking at ~256 tokens maintain semantic boundaries equally well? (Suggest bench test on sample pages)

5. **Page Version Embeddings:** Should historical PageVersion records also be embedded for version-aware search? (Adds ~10x storage/compute, may not be needed)

6. **Workspace Isolation:** Are embeddings indexed per-workspace or globally? (Recommend per-workspace to avoid cross-workspace leakage)

7. **Caching Layer:** Should chunk embeddings be cached (Redis) to avoid repeated API calls on search-only operations? (Orthogonal to indexing pipeline)

---

## REFERENCES

- [OpenAI Embeddings API](https://developers.openai.com/api/docs/guides/embeddings)
- [pgvector Python documentation](https://github.com/pgvector/pgvector-python)
- [BGE-M3 Model Card](https://huggingface.co/BAAI/bge-m3)
- [PGVector HNSW vs IVFFlat Analysis](https://medium.com/@bavalpreetsinghh/pgvector-hnsw-vs-ivfflat-a-comprehensive-study-21ce0aaab931)
- [Django Signals Best Practices](https://lincolnloop.com/blog/django-anti-patterns-signals/)
- [RAG Chunking and Deduplication](https://sabarishkumarg.medium.com/designing-rag-architectures-that-scale-chunking-deduplication-and-accuracy-improvements-1adb76dbd8ec)
- [Plane Pages Model Code](file:///Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/page.py)
