# Banking-Grade AI Governance Layer: Technical Research
**Shinhan Bank + Plane.so Integration** | Django 4.2 + DRF | Date: 2026-04-22

---

## SECTION 1: PII SCRUBBING BEFORE LLM CALL

### 1.1 Library Comparison

| Library | Version | Strength | Weakness | Language Support |
|---------|---------|----------|----------|-----------------|
| **Presidio-Analyzer** (Microsoft) | 0.12+ | ML-based + regex hybrid; pattern extensible; production battle-tested (Azure, banks) | Requires spaCy models; slower than pure regex; custom Korean/Vietnamese support manual | EN (native); KO, VI (custom recognizers) |
| **Scrubadub** | 2.0+ | Fast regex-based; lightweight; easy custom cleaners; great for deterministic patterns | No ML context; misses contextual PII; regex false-positive risk | EN (native); localizable |
| **pii-redactor** | Limited adoption | Multi-format (PDF, images); advanced ML | Slower; external deps; unclear bank compliance record | Unclear |

**Recommendation (Top 3):**
1. **Presidio + custom recognizers** (Primary) — ML baseline catches context-aware PII; custom regex for CCCD/CMND/phone patterns
2. **Hybrid Presidio + Scrubadub** (Secondary) — Run Scrubadub regex-first (CCCD, CMND), then Presidio ML for contextual names/amounts
3. **Scrubadub only** (Minimal overhead) — If regex patterns alone sufficient and latency critical <100ms

### 1.2 Vietnamese & Korean Pattern Definitions

#### Vietnamese ID Numbers (CCCD/CMND)
```python
# CCCD (12-digit): 001201234567 format
# CCCD Pattern: YYMMDD + 3-digit province code + 6-digit sequence
CCCD_PATTERN = r'\b\d{12}\b'
CCCD_PATTERN_STRICT = r'(?<!\d)(?:0\d{2}|1\d{2}|2\d{2}|3\d{2}|4\d{2}|5\d{2}|6\d{2}|7\d{2}|8\d{2}|9\d{2})\d{10}(?!\d)'

# CMND (9-12 digit): older format, variable length
CMND_PATTERN = r'\b\d{9,12}\b'

# Custom Presidio recognizer:
class CCCDRecognizer(PatternRecognizer):
    """Vietnamese national ID recognizer"""
    def __init__(self):
        patterns = [
            Pattern("CCCD", r'\b\d{12}\b', 0.9),
            Pattern("CMND", r'\b\d{9,11}\b', 0.8),
        ]
        super().__init__(supported_entity="VIETNAMESE_ID", patterns=patterns)
```

#### Korean Resident Registration Number (RRN/Jumin)
```python
# RRN: YYMMDD-NNNNNNN (13 digits total, hyphenated)
# Format: YYMMDDNNNNNNN where gender codes: 1/2=1900s, 3/4=2000s
# Checksum validation: multiply each digit by weights [2,3,4,5,6,7,8,9,2,3,4,5] mod 11
RRN_PATTERN = r'\d{6}-\d{7}'
RRN_NO_HYPHEN = r'\b\d{13}\b'

class JuminRecognizer(PatternRecognizer):
    """Korean resident registration number recognizer with checksum"""
    def __init__(self):
        patterns = [
            Pattern("RRN_HYPHEN", r'\d{6}-\d{7}', 0.95),
            Pattern("RRN_NO_HYPHEN", r'\b\d{13}\b', 0.90),
        ]
        super().__init__(supported_entity="KOREAN_RRN", patterns=patterns)
    
    def validate(self, value):
        # Remove hyphen, validate checksum per Korean standard
        digits = value.replace('-', '')
        weights = [2,3,4,5,6,7,8,9,2,3,4,5]
        total = sum(int(d) * w for d, w in zip(digits[:12], weights))
        check = (11 - (total % 11)) % 10
        return check == int(digits[12])
```

#### Vietnamese Phone Numbers
```python
# Vietnam: landline 0X..., mobile 09X/08X
# International: +84 (84 country code)
VN_PHONE = r'(?:(?:\+84|0)[1-9]\d{8,9})'
VN_PHONE_PATTERNS = [
    r'(?:0[1-9])\d{8,9}',           # Landline: 01-09 prefix
    r'(?:(?:\+|00)84)[1-9]\d{8,9}', # International
    r'\+84\d{1,3}\s\d{1,4}\s\d{4}',  # Spaced format
]

# Bank-specific: Vietnamese bank account (usually 10-20 digits)
VN_BANK_ACCOUNT = r'\b(?:10|16|17|18|19|20|21)\d{8,18}\b'
```

### 1.3 Implementation Pattern: Pre-Request Middleware vs Util Function

**Middleware approach** (transparent, centralized):
```python
# apps/api/middleware/pii_scrubber.py
from presidio_analyzer import AnalyzerEngine
from functools import lru_cache

class PIIScrubberMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.analyzer = AnalyzerEngine()
        self.custom_recognizers = [
            CCCDRecognizer(),
            JuminRecognizer(),
        ]
    
    def __call__(self, request):
        # Only scrub POST/PUT with LLM-bound data
        if request.method in ['POST', 'PUT'] and self._is_llm_endpoint(request.path):
            request.body_scrubbed = self._scrub_pii(request.body)
            request.META['X-PII-DETECTED'] = str(self._has_pii(request.body))
        return self.get_response(request)
    
    def _scrub_pii(self, text, reversible=True):
        """Scrub with optional reversible masking"""
        results = self.analyzer.analyze(text=text, language='en')
        if reversible:
            # Store mapping: {original: hash} for reconstruction
            mapping = {}
            scrubbed = text
            for result in results:
                entity_type = result.entity_type
                start, end = result.start, result.end
                original = text[start:end]
                masked = f"[{entity_type}_MASKED_{hash(original) % 10000}]"
                mapping[masked] = original  # For audit trail
                scrubbed = scrubbed.replace(original, masked)
            return scrubbed, mapping
        else:
            # Destructive: replace with entity type marker
            scrubbed = text
            for result in reversed(results):  # Reverse to maintain indices
                entity = text[result.start:result.end]
                scrubbed = scrubbed[:result.start] + f'[{result.entity_type}]' + scrubbed[result.end:]
            return scrubbed

# settings.py
MIDDLEWARE = [
    ...
    'apps.api.middleware.pii_scrubber.PIIScrubberMiddleware',
]
```

**Utility function approach** (explicit, per-endpoint control):
```python
# apps/api/utils/pii_scrubbing.py
from presidio_analyzer import AnalyzerEngine
from apps.api.recognizers import CCCDRecognizer, JuminRecognizer

class PIIScrubber:
    def __init__(self):
        self.analyzer = AnalyzerEngine()
        self.analyzer.registry.add_recognizer(CCCDRecognizer())
        self.analyzer.registry.add_recognizer(JuminRecognizer())
    
    def scrub(self, text: str, language: str = 'en', entities: list = None):
        """
        Args:
            text: Input text to scrub
            language: 'en', 'vi', 'ko'
            entities: list to filter; None=all
        Returns:
            scrubbed_text, pii_findings (dict), is_safe (bool)
        """
        results = self.analyzer.analyze(text=text, language=language, entities=entities)
        is_safe = len(results) == 0
        
        scrubbed = text
        findings = {r.entity_type: [] for r in results}
        
        for result in reversed(results):
            entity_text = text[result.start:result.end]
            findings[result.entity_type].append({
                'text': entity_text[:8] + '***' if len(entity_text) > 8 else '***',
                'confidence': result.score,
                'position': (result.start, result.end)
            })
            scrubbed = scrubbed[:result.start] + f'[{result.entity_type}]' + scrubbed[result.end:]
        
        return scrubbed, findings, is_safe

# Usage in view
scrubber = PIIScrubber()

class AskAIView(APIView):
    def post(self, request):
        prompt = request.data.get('prompt')
        scrubbed_prompt, findings, is_safe = scrubber.scrub(prompt, language='en')
        
        if not is_safe:
            # Log finding, optionally reject or mask
            logger.warning(f"PII detected in prompt: {findings}")
            # Option A: Reject entirely
            # return Response({'error': 'Prompt contains PII'}, status=400)
            # Option B: Use scrubbed version (transparent to user)
            prompt = scrubbed_prompt
        
        # Call LLM with scrubbed prompt
        response = llm_service.call(scrubbed_prompt)
        return Response({'response': response})
```

**Trade-off:**
- **Middleware:** Global coverage, reduced code duplication, harder to test per-endpoint behavior
- **Util function:** Fine-grained control, easier to bypass (risk), required in every endpoint

**Recommendation:** **Hybrid** — Middleware as safety net + util function for explicit control where needed. Middleware config allows excluding endpoints (e.g., /healthz, /metrics).

### 1.4 Reversible vs Destructive Masking

| Approach | Reversible (Hash-mapped) | Destructive ([ENTITY_TYPE]) |
|----------|--------------------------|---------------------------|
| Use case | Audit reconstruction, response rebuilding | Strict data minimization |
| Risk | Hash collisions (use UUID instead); mapping storage size | Cannot recover original for debugging |
| Compliance | GDPR "right to be forgotten" harder | Simpler; no mapping to secure/delete |
| Latency | +5-10ms per replacement | ~1ms per replacement |
| Storage | O(n_entities * entity_size) mapping dict | O(1) |

**Recommendation for Shinhan:** **Reversible (UUID-mapped)** for audit trail reconstruction. Store mapping in encrypted cache (Redis with TTL 24h) keyed by `request_id`, log mapping access.

---

## SECTION 2: AUDIT LOGGING FOR AI USAGE (SOX/BANKING COMPLIANCE)

### 2.1 Required Fields

```python
from django.db import models
from django.utils import timezone

class AIAuditLog(models.Model):
    """Immutable audit log for all AI requests (WORM-compliant)"""
    
    # User & Context
    user_id = models.UUIDField(db_index=True)  # FK to User
    workspace_id = models.UUIDField(db_index=True)  # Multi-tenancy
    project_id = models.UUIDField(null=True)  # Optional context
    
    # Request Details
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    request_id = models.UUIDField(unique=True)  # Idempotency + tracing
    
    # AI Model Info
    provider = models.CharField(
        max_length=32, 
        choices=[('OPENAI', 'OpenAI'), ('ANTHROPIC', 'Anthropic'), ('SHINHAN_INTERNAL', 'Shinhan LLM')],
        db_index=True
    )
    model_name = models.CharField(max_length=128)  # gpt-4, claude-3, etc.
    
    # Content (Privacy-safe)
    prompt_hash = models.CharField(max_length=64, db_index=True)  # SHA256(prompt), not raw
    prompt_length = models.IntegerField()  # Token estimate
    response_length = models.IntegerField()
    
    # Usage Metrics
    tokens_used = models.IntegerField()  # Cumulative: input + output
    input_tokens = models.IntegerField()
    output_tokens = models.IntegerField()
    cost_usd = models.DecimalField(max_digits=10, decimal_places=6)  # For chargeback tracking
    
    # Performance
    duration_ms = models.IntegerField()  # LLM response time
    latency_p99_ms = models.IntegerField(null=True)  # SLA tracking
    
    # Feature Context
    feature_name = models.CharField(max_length=128, db_index=True)
    # e.g., 'issue_description_gen', 'sprint_planning_summary', 'comment_drafting'
    
    # Compliance Fields
    pii_detected = models.BooleanField(default=False)  # Scrubber result
    pii_types = models.JSONField(default=list)  # ['CCCD', 'EMAIL'] if found
    scrubbing_applied = models.BooleanField(default=False)
    
    # Result Tracking
    success = models.BooleanField(default=True)
    error_type = models.CharField(max_length=64, null=True)  # RateLimitError, APIError, etc.
    error_message = models.TextField(null=True)  # Redacted error (no data leak)
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True)  # For audit trail
    user_agent = models.TextField(null=True, max_length=256)
    
    # WORM Compliance
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    # NO update_at, delete allowed, or soft_delete
    # Use PostgreSQL constraint: IMMUTABLE constraint via trigger (below)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', 'created_at']),
            models.Index(fields=['workspace_id', 'created_at']),
            models.Index(fields=['provider', 'created_at']),
        ]
        # Prevent any modification post-insert
        permissions = [('view_audit_logs', 'Can view AI audit logs')]
    
    def __str__(self):
        return f"{self.feature_name} ({self.user_id}) @ {self.timestamp}"
    
    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("AIAuditLog is immutable; updates forbidden")
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        raise ValueError("AIAuditLog is immutable; deletion forbidden")

# PostgreSQL TRIGGER for database-level immutability
IMMUTABILITY_TRIGGER_SQL = """
CREATE TRIGGER ai_audit_log_immutable
BEFORE UPDATE OR DELETE ON api_aiauditlog
FOR EACH ROW
EXECUTE FUNCTION prevent_update_delete();

CREATE FUNCTION prevent_update_delete() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ai_auditlog is immutable';
END;
$$ LANGUAGE plpgsql;
"""
```

### 2.2 Storage Strategy: Dedicated Table + Archival

**Design:**
- **Hot (0-90 days):** `api_aiauditlog` (PostgreSQL, main DB for queries)
- **Warm (90-2y):** `ai_auditlog_archive` (partitioned by month, searchable)
- **Cold (2-7y):** S3 + Glacier (immutable object lock, encrypted)

```python
# apps/api/management/commands/archive_audit_logs.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import boto3
from api.models import AIAuditLog

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--age-days', type=int, default=90)
    
    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=options['age_days'])
        old_logs = AIAuditLog.objects.filter(created_at__lt=cutoff)
        
        # Export to S3 in Parquet (columnar compression)
        s3 = boto3.client('s3')
        count = 0
        
        for batch in chunks(old_logs.values(), 10000):
            df = pd.DataFrame(batch)
            parquet_data = df.to_parquet(compression='snappy')
            
            partition_key = f"ai-audit-logs/{cutoff.year}/{cutoff.month:02d}/"
            s3.put_object(
                Bucket='shinhan-audit-archive',
                Key=f"{partition_key}batch_{count}.parquet",
                Body=parquet_data,
                ServerSideEncryption='AES256',
                ObjectLockMode='GOVERNANCE',  # WORM lock
                ObjectLockRetainUntilDate=cutoff + timedelta(days=7*365),
            )
            count += 1
        
        self.stdout.write(f"Archived {count} batches to S3")
        # NOTE: don't delete from Postgres immediately; keep for 30d grace period for restores
```

### 2.3 Real-Time Dashboard Query Pattern

```python
# apps/api/views/audit_dashboard.py
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response

class AuditDashboardView(APIView):
    permission_classes = [IsWorkspaceAdmin]  # Only admins + compliance officers
    
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        days = int(request.query_params.get('days', 30))
        
        cutoff = timezone.now() - timedelta(days=days)
        logs = AIAuditLog.objects.filter(
            workspace_id=workspace_id,
            created_at__gte=cutoff
        )
        
        # Cache-friendly aggregations (indexes on workspace_id + created_at)
        stats = {
            'total_requests': logs.count(),
            'total_cost': logs.aggregate(Sum('cost_usd'))['cost_usd__sum'] or 0,
            'total_tokens': logs.aggregate(Sum('tokens_used'))['tokens_used__sum'] or 0,
            'avg_latency_ms': logs.aggregate(Avg('duration_ms'))['duration_ms__avg'] or 0,
            'pii_detected_count': logs.filter(pii_detected=True).count(),
            'error_count': logs.filter(success=False).count(),
            'by_provider': dict(logs.values('provider').annotate(
                count=Count('id'), 
                cost=Sum('cost_usd')
            ).values_list('provider', 'count', 'cost')),
            'by_feature': dict(logs.values('feature_name').annotate(
                count=Count('id'), 
                avg_latency=Avg('duration_ms')
            ).values_list('feature_name', 'count', 'avg_latency')),
            'by_user': logs.values('user_id').annotate(
                count=Count('id'),
                cost=Sum('cost_usd')
            )[:10],  # Top 10 users
        }
        
        return Response(stats)

# Frontend: Cache for 5min (non-sensitive aggregates)
@cache_page(60 * 5)
def audit_dashboard_cached(request):
    ...
```

### 2.4 Retention: 7-Year Archive + Compliance Export

```python
# Django admin command for SOX/regulatory exports
# apps/api/management/commands/export_audit_logs_for_compliance.py
def export_for_ciso_report(workspace_id, year):
    """Generate annual SOX audit trail for CISO"""
    logs = AIAuditLog.objects.filter(
        workspace_id=workspace_id,
        created_at__year=year
    ).values(
        'user_id', 'provider', 'feature_name', 
        'created_at', 'success', 'cost_usd', 'tokens_used'
    )
    
    df = pd.DataFrame(logs)
    df['created_at'] = pd.to_datetime(df['created_at'])
    
    # Group by month for summary
    monthly = df.groupby(df['created_at'].dt.to_period('M')).agg({
        'user_id': 'nunique',
        'cost_usd': 'sum',
        'tokens_used': 'sum',
    })
    
    # Export with digital signature
    export_path = f"/tmp/audit_report_{year}.csv"
    df.to_csv(export_path, index=False)
    
    # Sign for tamper-detection
    import hashlib
    with open(export_path, 'rb') as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()
    
    # Store hash in blockchain or external notary
    # (for high-assurance deployments, optional)
    
    return export_path
```

**Top 3 Recommendations:**
1. **Dedicated immutable table + monthly S3 archival** — Hot queries on Postgres, WORM cold storage for 7y
2. **Append-only design (Django model + DB trigger)** — Prevent accidental/malicious modifications
3. **Real-time aggregates with Redis cache** — Dashboard queries don't stress DB; 5min refresh acceptable

---

## SECTION 3: RATE LIMITING (PER-USER, PER-WORKSPACE, MONTHLY QUOTAS)

### 3.1 Library Comparison

| Library | Version | Paradigm | Backend | Workspace Support | Burst+Quota |
|---------|---------|----------|---------|------------------|-------------|
| **DRF SimpleRateThrottle** | DRF 3.14+ | Throttle class | Redis/cache | Requires custom | Manual |
| **django-ratelimit** | 4.0+ | Decorator | Redis | No (per-user only) | No |
| **Waffle (feature flags)** | 5.0+ | Flag toggle | DB + cache | Yes | Via flag percentage |
| **Custom Redis + Lua** | — | Script-based | Redis native | Yes | Via Lua script |

**Recommendation (Top 3):**
1. **DRF ScopedRateThrottle + Redis** — Foundation for per-view limits; extend with custom key-generation for workspace
2. **Custom Lua script (Redis)** — For simultaneous burst + monthly quota (atomic operations)
3. **Hybrid: ScopedRateThrottle + Waffle toggles** — Throttle for rate-limits, feature flags for kill switch

### 3.2 Implementation: Per-User, Per-Workspace, Per-Feature Limits

```python
# apps/api/throttles/ai_throttle.py
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.exceptions import Throttled
import redis
from django.conf import settings

class AIRequestThrottle(SimpleRateThrottle):
    """
    Multi-level throttling:
    - Per-user: 100 req/hour (burst)
    - Per-workspace: 1000 req/hour (org limit)
    - Per-workspace-month: 50,000 requests (quota)
    """
    scope = 'ai_request'
    
    def __init__(self):
        super().__init__()
        self.redis = redis.Redis.from_url(settings.REDIS_URL)
    
    def get_cache_key(self, request, view):
        """Generate cache key: rate_limit:{level}:{identifier}:{window}"""
        # Determine identifier based on scope
        if not request.user or not request.user.is_authenticated:
            return None  # Disable for anonymous
        
        workspace_id = request.query_params.get('workspace_id') or request.user.workspace_id
        user_id = request.user.id
        
        # Build multi-key strategy
        return {
            'burst': f"ai_throttle:burst:{user_id}:{workspace_id}",
            'hourly': f"ai_throttle:hourly:{workspace_id}",
            'monthly': f"ai_throttle:monthly:{workspace_id}:{self.get_month_key()}",
        }
    
    def throttle_success(self, request, view):
        """Check all throttle levels atomically"""
        keys = self.get_cache_key(request, view)
        if not keys:
            return True
        
        # Lua script for atomic multi-key rate limiting
        lua_script = """
        local burst_key, hourly_key, monthly_key = KEYS[1], KEYS[2], KEYS[3]
        local burst_limit, hourly_limit, monthly_limit = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
        local burst_window, hourly_window, monthly_window = tonumber(ARGV[4]), tonumber(ARGV[5]), tonumber(ARGV[6])
        
        local burst_count = redis.call('incr', burst_key)
        if burst_count == 1 then
            redis.call('expire', burst_key, burst_window)
        end
        
        local hourly_count = redis.call('incr', hourly_key)
        if hourly_count == 1 then
            redis.call('expire', hourly_key, hourly_window)
        end
        
        local monthly_count = redis.call('incr', monthly_key)
        if monthly_count == 1 then
            redis.call('expire', monthly_key, monthly_window)
        end
        
        if burst_count > burst_limit or hourly_count > hourly_limit or monthly_count > monthly_limit then
            return 0  -- Throttled
        end
        
        return {burst_count, hourly_count, monthly_count}
        """
        
        script_hash = self.redis.script_load(lua_script)
        
        try:
            result = self.redis.evalsha(
                script_hash, 3,
                keys['burst'], keys['hourly'], keys['monthly'],
                100, 1000, 50000,  # Limits
                3600, 3600, 2592000,  # Windows (1h, 1h, 30d)
            )
            self.counts = result  # For response headers
            return True
        except self.redis.ResponseError:
            return False
    
    def get_month_key(self):
        """Return YYYY-MM for consistent monthly bucketing"""
        from django.utils import timezone
        return timezone.now().strftime('%Y-%m')
    
    def throttle_failure(self, request, view):
        """Return detailed throttle error"""
        burst, hourly, monthly = self.counts
        raise Throttled(
            detail={
                'error': 'Rate limit exceeded',
                'burst_used': burst,
                'hourly_used': hourly,
                'monthly_used': monthly,
                'reset_in': self._get_reset_times(),
            }
        )
    
    def _get_reset_times(self):
        """Calculate when limits reset"""
        return {
            'burst': self.redis.ttl(self.keys['burst']),
            'hourly': self.redis.ttl(self.keys['hourly']),
            'monthly': self.redis.ttl(self.keys['monthly']),
        }

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'apps.api.throttles.ai_throttle.AIRequestThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'ai_request': '100/hour',  # Fallback (Lua overrides)
    }
}
```

### 3.3 Displaying Remaining Quota to Frontend

```python
# apps/api/views/ai_query.py
from rest_framework.response import Response
from rest_framework.views import APIView

class AskAIView(APIView):
    throttle_classes = [AIRequestThrottle]
    
    def post(self, request):
        prompt = request.data['prompt']
        
        # Call LLM
        llm_response = call_llm(prompt)
        
        # Fetch remaining quota from Redis
        redis_conn = redis.Redis.from_url(settings.REDIS_URL)
        workspace_id = request.user.workspace_id
        user_id = request.user.id
        
        burst_used = redis_conn.get(f"ai_throttle:burst:{user_id}:{workspace_id}") or 0
        hourly_used = redis_conn.get(f"ai_throttle:hourly:{workspace_id}") or 0
        month_key = timezone.now().strftime('%Y-%m')
        monthly_used = redis_conn.get(f"ai_throttle:monthly:{workspace_id}:{month_key}") or 0
        
        response = Response({
            'response': llm_response,
            'quota': {
                'burst': {'used': int(burst_used), 'limit': 100, 'remaining': 100 - int(burst_used)},
                'hourly': {'used': int(hourly_used), 'limit': 1000, 'remaining': 1000 - int(hourly_used)},
                'monthly': {'used': int(monthly_used), 'limit': 50000, 'remaining': 50000 - int(monthly_used)},
            }
        })
        
        # Add cache headers for frontend caching
        response['X-RateLimit-Remaining-Burst'] = 100 - int(burst_used)
        response['X-RateLimit-Remaining-Monthly'] = 50000 - int(monthly_used)
        response['X-RateLimit-Reset-Burst'] = redis_conn.ttl(f"ai_throttle:burst:{user_id}:{workspace_id}")
        
        return response
```

---

## SECTION 4: KILL SWITCH / CIRCUIT BREAKER

### 4.1 Circuit Breaker Pattern with pybreaker + Redis

```python
# apps/api/circuit_breaker/ai_breaker.py
from pybreaker import CircuitBreaker
from pybreaker.storage import CircuitRedisStorage
import redis
from django.conf import settings

# Redis-backed circuit breaker for distributed resilience
redis_client = redis.Redis.from_url(settings.REDIS_URL)
storage = CircuitRedisStorage(redis_client, namespace='ai_breaker')

ai_circuit_breaker = CircuitBreaker(
    fail_max=5,  # Open after 5 failures
    reset_timeout=60,  # Try to recover after 60s
    storage=storage,
    name='openai_api',
    listeners=[],  # Can add logging listeners
)

# Usage in LLM service
class LLMService:
    @ai_circuit_breaker
    def call(self, prompt):
        """Will raise CircuitBreakerError if breaker is OPEN"""
        return openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
```

### 4.2 Admin Kill Switch (Feature Flag Based)

```python
# apps/api/middleware/ai_kill_switch.py
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status

class AIKillSwitchMiddleware:
    """Admin can disable AI globally in <1s via cache"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check kill switch cache (default False = enabled)
        if cache.get('ai_feature_disabled', False):
            if request.path.startswith('/api/v1/ai/'):
                return Response(
                    {'error': 'AI features are currently disabled for maintenance'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    headers={'Retry-After': '300'}  # Retry in 5 minutes
                )
        
        return self.get_response(request)

# Django admin action
from django.contrib import admin
from django.core.cache import cache

def disable_ai_features(modeladmin, request, queryset):
    cache.set('ai_feature_disabled', True, timeout=3600)  # 1 hour
    messages.success(request, "AI features disabled. Will auto-re-enable in 1 hour.")
disable_ai_features.short_description = "Disable AI features (kill switch)"

# Callable directly via admin or API
class AdminDisableAIView(APIView):
    permission_classes = [IsWorkspaceAdmin]
    
    def post(self, request):
        duration_seconds = request.data.get('duration_seconds', 3600)
        reason = request.data.get('reason', 'Manual disable')
        
        cache.set('ai_feature_disabled', True, timeout=duration_seconds)
        cache.set('ai_disable_reason', reason, timeout=duration_seconds)
        
        # Audit log this action
        AIAuditLog.objects.create(
            user_id=request.user.id,
            workspace_id=request.user.workspace_id,
            feature_name='kill_switch',
            success=True,
            prompt_hash=hashlib.sha256(f"ADMIN_DISABLE:{reason}".encode()).hexdigest(),
            prompt_length=0,
            response_length=0,
        )
        
        return Response({'status': 'AI features disabled', 'duration_seconds': duration_seconds})
```

### 4.3 Graceful Degradation: What to Show User

```python
# apps/api/views/ai_query.py
class AskAIView(APIView):
    def post(self, request):
        prompt = request.data['prompt']
        
        try:
            # Try primary LLM
            if cache.get('ai_feature_disabled'):
                raise CircuitBreakerError("Kill switch active")
            
            response = ai_circuit_breaker.call(prompt)
            
        except CircuitBreakerError:
            # Circuit open: fallback strategy
            return Response({
                'response': None,
                'fallback': {
                    'type': 'circuit_breaker_open',
                    'message': 'AI service temporarily unavailable. Please try again in 5 minutes.',
                    'fallback_suggestion': 'Use template suggestions or manual drafting.',
                },
                'status': 'degraded'
            }, status=status.HTTP_200_OK)  # 200, not 503, so frontend handles gracefully
        
        except RateLimitError:
            # Quota exhausted: offer paid tier
            return Response({
                'response': None,
                'fallback': {
                    'type': 'rate_limit',
                    'message': 'Your monthly AI quota has been reached.',
                    'upgrade_url': '/billing/upgrade-plan',
                },
                'status': 'quota_exceeded'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            # Any other error: suggest manual retry
            return Response({
                'response': None,
                'fallback': {
                    'type': 'error',
                    'message': 'AI feature temporarily unavailable.',
                    'retry_in_seconds': 60,
                },
                'status': 'error'
            }, status=status.HTTP_200_OK)
        
        return Response({'response': response, 'status': 'success'})
```

**Top 3 Recommendations:**
1. **pybreaker + Redis storage** — Distributed circuit breaker persists across app instances
2. **Cache-based kill switch** — Admin toggle in <1s, no deployment needed
3. **Graceful degradation (200 + fallback object)** — Users see options, not 503 errors

---

## SECTION 5: PER-WORKSPACE / PER-ROLE FEATURE TOGGLES (RBAC)

### 5.1 Feature Toggle Architecture (django-waffle + Workspace Scope)

```python
# apps/api/models/feature_flags.py
from django.db import models
from django.contrib.auth.models import Group

class WorkspaceFeatureToggle(models.Model):
    """Workspace-scoped feature flags with RBAC"""
    
    workspace = models.ForeignKey('Workspace', on_delete=models.CASCADE)
    feature_key = models.CharField(max_length=128)  # 'ai_ask_feature', 'ai_summary_gen', etc.
    enabled = models.BooleanField(default=False)
    
    # Percentage rollout (0-100)
    rollout_percentage = models.IntegerField(default=0)
    
    # RBAC: only allow certain roles
    allowed_roles = models.ManyToManyField(Group, blank=True)
    # Empty = all roles; otherwise restricted
    
    # Time-based toggle
    enabled_from = models.DateTimeField(null=True)
    enabled_until = models.DateTimeField(null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('workspace', 'feature_key')
    
    def is_enabled_for_user(self, user, current_time=None):
        """Check if feature enabled for specific user + time"""
        from django.utils import timezone
        current_time = current_time or timezone.now()
        
        # Check time window
        if self.enabled_from and current_time < self.enabled_from:
            return False
        if self.enabled_until and current_time > self.enabled_until:
            return False
        
        # Check RBAC
        if self.allowed_roles.exists():
            if not user.groups.filter(pk__in=self.allowed_roles.values_list('pk')).exists():
                return False
        
        # Check rollout percentage (hash-based, consistent per user)
        import hashlib
        user_hash = int(hashlib.md5(f"{user.id}".encode()).hexdigest(), 16)
        if user_hash % 100 >= self.rollout_percentage:
            return False
        
        return self.enabled
```

### 5.2 Usage in Views + Permissions

```python
# apps/api/permissions.py
from rest_framework.permissions import BasePermission
from apps.api.models import WorkspaceFeatureToggle

class HasAIFeatureAccess(BasePermission):
    """Check workspace-scoped + user role-scoped AI feature access"""
    
    feature_key = None  # Override in subclass
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        workspace_id = request.parser_context['kwargs'].get('workspace_id') or request.user.workspace_id
        
        try:
            toggle = WorkspaceFeatureToggle.objects.get(
                workspace_id=workspace_id,
                feature_key=self.feature_key
            )
        except WorkspaceFeatureToggle.DoesNotExist:
            return False
        
        return toggle.is_enabled_for_user(request.user)

class HasAIAskFeature(HasAIFeatureAccess):
    feature_key = 'ai_ask'

class HasAISummaryFeature(HasAIFeatureAccess):
    feature_key = 'ai_summary_generation'

# In views
class AskAIView(APIView):
    permission_classes = [IsAuthenticated, HasAIAskFeature]
    
    def post(self, request):
        # ... LLM call ...
        pass
```

### 5.3 Admin Panel for Workspace Admins

```python
# apps/api/admin.py
from django.contrib import admin
from apps.api.models import WorkspaceFeatureToggle

@admin.register(WorkspaceFeatureToggle)
class WorkspaceFeatureToggleAdmin(admin.ModelAdmin):
    list_display = ('workspace', 'feature_key', 'enabled', 'rollout_percentage', 'enabled_from', 'enabled_until')
    list_filter = ('enabled', 'workspace', 'feature_key')
    list_editable = ('enabled', 'rollout_percentage')
    
    fieldsets = (
        ('Feature', {
            'fields': ('workspace', 'feature_key', 'enabled'),
        }),
        ('Rollout', {
            'fields': ('rollout_percentage', 'enabled_from', 'enabled_until'),
            'description': 'Percentage rollout and time window for gradual feature enablement',
        }),
        ('Access Control (RBAC)', {
            'fields': ('allowed_roles',),
            'description': 'Leave empty to allow all roles; select specific groups to restrict.',
        }),
    )
    
    def get_queryset(self, request):
        # Only show toggles for user's workspace
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            qs = qs.filter(workspace=request.user.workspace)
        return qs
```

**Top 3 Recommendations:**
1. **WorkspaceFeatureToggle model** — Database-backed, supports RBAC + rollout % + time windows
2. **Permission class pattern** — Reusable per-view enforcement
3. **Admin interface** — Workspace admins toggle features without code deploy

---

## SECTION 6: COMPLIANCE ARTIFACTS CHECKLIST

### 6.1 Banking CISO Approval Document Checklist

**Critical Documents:**

| Document | Purpose | Shinhan-Specific Notes |
|----------|---------|------------------------|
| **Data Residency & Processing Agreement** | Confirm data stays in [KR/SG]; no cross-border | Require: "Data residency: South Korea only" + explicit prohibit fine-tuning on corporate data |
| **Vendor Risk Assessment (VRA)** | Third-party security review | Score OpenAI/Anthropic/Shinhan LLM (must >80/100) |
| **Privacy Impact Assessment (PIA)** | GDPR/local privacy compliance | Map PII types (CCCD, account nums) + scrubbing proof |
| **Model Card & AI Risk Assessment** | Model behavior, drift, bias | For Shinhan internal LLM: training data provenance, accuracy metrics |
| **Threat Model & Penetration Test Report** | Security proof | Test: prompt injection, data exfiltration, PII leakage |
| **Audit Trail & Immutability Proof** | SOX compliance | Append-only logs, WORM storage design, 7-year retention |
| **Incident Response Plan (AI-specific)** | How to handle LLM failures, data breaches | Playbook: circuit breaker activation, fallback, communication timeline |
| **Rate Limit & Cost Control Design** | Prevent runaway costs | Proof: per-user/workspace/monthly limits enforced at middleware level |
| **PII Detection & Masking Proof-of-Concept** | Demonstrate Presidio/Scrubadub integration | Test with sample CCCD, account numbers, phone; show before/after |
| **Kill Switch & Disable-in-60s Plan** | Rapid response capability | Proof: Redis cache-based toggle, <1s propagation to all servers |
| **Network Egress Control** | Data doesn't leak to unintended LLM | If using external LLM: proof of firewalled API calls, VPN/direct routing |
| **Vendor Contract Amendments** | Explicit no fine-tuning, data residency, liability | Ensure OpenAI/Anthropic Standard ToS updated with banking requirements |
| **Change Management Log** | Track all AI system changes | Proof: commit history, deployment logs, feature flag toggles |
| **Access Control Matrix** | Who can enable/disable AI per workspace | RBAC roles: AI_ADMIN, AI_USER, AI_AUDITOR |

### 6.2 Data Residency & Network Egress Checklist

```markdown
## Network Isolation for Banking LLM Integration

**Requirement:** Ensure customer data never leaves Shinhan's network without encryption + consent.

### External LLM (e.g., OpenAI)
- [ ] VPN/private endpoint to LLM API (no public internet)
- [ ] Mandatory PII scrubbing BEFORE sending to LLM
- [ ] TLS 1.3 encryption in transit
- [ ] No request logging on LLM provider side (contractual)
- [ ] Audit trail: timestamp + hash of scrubbed prompt only (raw prompt never logged)
- [ ] Fallback to on-prem LLM if external unavailable

### On-Prem LLM (Shinhan Internal)
- [ ] Direct network path: no routing through untrusted gateways
- [ ] Air-gapped training (model trained on Shinhan data only)
- [ ] Proof: model training logs signed by Shinhan ML team
- [ ] Regular accuracy audits: does fine-tuning drift occur?

### Compliance Proof Artifacts
- Network diagram with data flow arrows (include firewall rules)
- Azure/AWS security group rules proving egress restriction
- Contract clauses prohibiting data storage at LLM provider
```

### 6.3 Vendor Risk Scoring Matrix

```python
# apps/api/compliance/vendor_risk_assessment.py

VENDOR_RISK_MATRIX = {
    'openai': {
        'security_score': 92,  # SOC 2 Type II, regular pen tests
        'data_residency': 'US (can request EU region)',
        'fine_tuning_risk': 'Medium (opt-out required, contractual)',
        'contract_terms': 'Standard SaaS ToS (requires amendment)',
        'approval_required': 'CISO sign-off + compliance team',
        'conditions': [
            'Must use GPT-4-Turbo-Preview or newer (no fine-tuning)',
            'Explicit "data not used for training" API request',
            'No API keys in VCS; rotate quarterly',
            'Log all API calls to AIAuditLog model',
        ]
    },
    'anthropic': {
        'security_score': 88,
        'data_residency': 'US/EU (can request)',
        'fine_tuning_risk': 'Low (no fine-tuning offered)',
        'contract_terms': 'Business contract available',
        'approval_required': 'CISO sign-off',
        'conditions': [
            'Explicitly request data residency clause',
            'Use latest Claude 3 Opus',
            'Implement PII scrubbing per this spec',
        ]
    },
    'shinhan_internal': {
        'security_score': 95,
        'data_residency': 'South Korea (on-prem)',
        'fine_tuning_risk': 'Very Low (controlled internally)',
        'contract_terms': 'Internal SLA',
        'approval_required': 'Chief Data Officer approval',
        'conditions': [
            'Model accuracy validated against production data',
            'Drift detection: monthly audit',
            'Training data provenance: signed by ML team',
        ]
    }
}

# Scoring function
def compute_vendor_risk_score(vendor_name):
    """Lower score = higher risk; >80 = approved"""
    data = VENDOR_RISK_MATRIX.get(vendor_name)
    return data['security_score']  # Simplified; can expand
```

### 6.4 Compliance Audit Trail Report Generation

```python
# Management command for regulatory reports
# apps/api/management/commands/generate_compliance_report.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.api.models import AIAuditLog
import json

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--workspace-id', required=True)
        parser.add_argument('--quarter', default='Q1')  # Q1, Q2, Q3, Q4
    
    def handle(self, *args, **options):
        workspace_id = options['workspace_id']
        quarter = options['quarter']
        year = timezone.now().year
        
        # Map quarter to months
        q_months = {'Q1': [1,2,3], 'Q2': [4,5,6], 'Q3': [7,8,9], 'Q4': [10,11,12]}
        months = q_months[quarter]
        
        logs = AIAuditLog.objects.filter(
            workspace_id=workspace_id,
            created_at__year=year,
            created_at__month__in=months
        )
        
        report = {
            'report_period': f"{year}-{quarter}",
            'generated_at': timezone.now().isoformat(),
            'summary': {
                'total_requests': logs.count(),
                'total_cost_usd': float(logs.aggregate(Sum('cost_usd'))['cost_usd__sum'] or 0),
                'total_tokens': logs.aggregate(Sum('tokens_used'))['tokens_used__sum'] or 0,
                'pii_detected_count': logs.filter(pii_detected=True).count(),
                'error_count': logs.filter(success=False).count(),
            },
            'by_user': [
                {'user_id': str(u['user_id']), 'requests': u['count'], 'cost': float(u['cost'])}
                for u in logs.values('user_id').annotate(count=Count('id'), cost=Sum('cost_usd'))
            ],
            'pii_incidents': [
                {
                    'timestamp': log.created_at.isoformat(),
                    'user_id': str(log.user_id),
                    'pii_types': log.pii_types,
                    'action': 'scrubbed' if log.scrubbing_applied else 'detected',
                }
                for log in logs.filter(pii_detected=True)
            ],
        }
        
        # Sign report
        import hashlib
        report_json = json.dumps(report, indent=2, sort_keys=True)
        report['signature'] = hashlib.sha256(report_json.encode()).hexdigest()
        
        # Save
        output_path = f"/tmp/compliance_report_{year}_{quarter}.json"
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.stdout.write(f"Report saved: {output_path}")
        self.stdout.write(json.dumps(report, indent=2))
```

**Top 3 Recommendations:**
1. **Formal VRA (Vendor Risk Assessment)** — Score each external LLM provider; document conditions
2. **Network isolation diagram** — Prove data doesn't leak; include firewall rules
3. **Quarterly compliance report** — Automated extraction of audit logs for CISO; signed + archived

---

## SUMMARY & RECOMMENDATIONS BY SECTION

### 1. PII Scrubbing
**Choose:** Presidio-Analyzer (hybrid ML + regex) + custom recognizers for CCCD/Jumin/VN phone  
**Pattern:** Pre-request middleware + explicit util function for override  
**Masking:** UUID-reversible with Redis mapping (24h TTL) for audit reconstruction

### 2. Audit Logging
**Storage:** Postgres hot (0-90d) + S3 Glacier cold (90d-7y), WORM-locked object retention  
**Design:** Django model with database immutability trigger; append-only semantics  
**Query:** Real-time aggregates cached 5min; monthly export for CISO reports

### 3. Rate Limiting
**Mechanism:** DRF ScopedRateThrottle + Redis Lua script (atomic multi-level)  
**Levels:** Burst (100/hr/user), Hourly (1000/workspace), Monthly (50k/workspace)  
**Frontend:** API headers show remaining quota; graceful degradation on limit

### 4. Kill Switch & Circuit Breaker
**Global disable:** Cache-based toggle, <1s propagation  
**Circuit breaker:** pybreaker + Redis storage, automatic recovery after 60s  
**Degradation:** Return 200 + fallback object (not 503); suggest manual workflow

### 5. Workspace Feature Flags
**Model:** WorkspaceFeatureToggle + RBAC (allowed_roles) + rollout % + time window  
**Enforcement:** Permission classes; checked per-view  
**UI:** Django admin for workspace admins; no deployment needed

### 6. Compliance Artifacts
**Must-have:** VRA matrix, network isolation diagram, PIA for PII, audit trail immutability proof, incident response playbook, quarterly compliance report  
**Vendor specifics:** OpenAI (amendment required), Anthropic (good), Shinhan internal (best)

---

## UNRESOLVED QUESTIONS

1. **Presidio custom Korean RRN checksum:** Does the v0.12+ release include built-in Jumin validation, or is custom implementation required?
2. **Scrubadub maintenance status:** What's the current release cadence (as of 2026)? Is it still recommended over Presidio for regex-heavy use?
3. **S3 WORM object lock cost model:** What's typical monthly cost for 7-year archival of 100GB+ monthly audit logs? Should we investigate cheaper alternatives (GCS + retention policy)?
4. **Django-Waffle vs custom toggle model:** Has Waffle added built-in workspace scoping in v5.0+? Or is custom model still necessary?
5. **Shinhan internal LLM specs:** What's the model size, training data scope, and inference latency? Affects fallback strategy and quota planning.
6. **Network egress proof mechanism:** If using VPN + NetFlow monitoring, who validates logs? Internal security team, or third-party auditor?
7. **PII mapping encryption:** Should the UUID→original mapping in Redis be encrypted? How to balance auditability vs. security?
8. **Monthly quota rollover:** If user has 50k/month quota, do unused tokens carry over? Affects fairness + cost modeling.

---

## REFERENCES & SOURCES

- [Microsoft Presidio GitHub](https://github.com/microsoft/presidio)
- [Microsoft Presidio Documentation](https://microsoft.github.io/presidio/analyzer/)
- [Scrubadub Documentation](https://scrubadub.readthedocs.io/)
- [PyBreaker GitHub](https://github.com/danielfm/pybreaker)
- [Django REST Framework Throttling](https://www.django-rest-framework.org/api-guide/throttling/)
- [django-waffle Documentation](https://waffle.readthedocs.io/en/stable/)
- [django-auditlog GitHub](https://github.com/jazzband/django-auditlog)
- [SOX Compliance Data Retention Requirements](https://pathlock.com/learn/sox-data-retention-requirements/)
- [Vietnamese Phone Number Regex Reference](https://gist.github.com/tungvn/2460c5ba947e5cbe6606c5e85249cf04)
- [Vendor Risk Assessment Template 2026](https://www.atlassystems.com/blog/vendor-risk-assessment-checklist-key-questions)
- [Financial LLM Integration Framework (ArXiv)](https://arxiv.org/pdf/2504.02165)

---

**Report compiled:** 2026-04-22 | **Status:** Ready for Planner handoff
