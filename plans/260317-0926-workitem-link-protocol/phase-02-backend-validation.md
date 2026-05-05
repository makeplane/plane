# Phase 02: Backend Validation — COMPLETE

## Context

- [plan.md](./plan.md)
- [phase-01](./phase-01-frontend-validation.md)
- Serializer: `apps/api/plane/app/serializers/issue.py` (L589-597)
- Celery task: `apps/api/plane/bgtasks/work_item_link_task.py` (L44-46)
- URL utils: `apps/api/plane/utils/url.py`

## Overview

Two backend layers reject non-http(s) URLs:

1. `IssueLinkSerializer.validate_url()` uses Django `URLValidator()` which only accepts http/https/ftp/ftps
2. `validate_url_ip()` in Celery crawler explicitly rejects non-http(s) schemes

**Status:** IMPLEMENTED — replaced Django URLValidator with urlparse-based validation + BLOCKED_SCHEMES; conditional crawl in link.py; new unit test file

## Key Insights

- Django `URLValidator` accepts: http, https, ftp, ftps. Rejects custom protocols like `z://`
- `is_valid_url()` in `plane/utils/url.py` uses `urlparse` which accepts any scheme -- already flexible
- The Celery crawler (`crawl_work_item_link_title`) only makes sense for http/https; custom protocol links can't be crawled
- IssueLink model uses `TextField` for url -- no model-level URL validation, so no model changes needed

## Requirements

- Accept URLs with any `scheme://` format in serializer validation
- Block dangerous schemes: `javascript`, `data`, `vbscript`
- Skip Celery metadata crawling for non-http(s) links (can't fetch title/favicon)
- Maintain SSRF protections for http(s) links

## Architecture

No new files. Modify 2 existing files + add tests.

## Related Code Files

| File                                            | Change                                          |
| ----------------------------------------------- | ----------------------------------------------- |
| `apps/api/plane/app/serializers/issue.py`       | Replace `URLValidator()` with custom validation |
| `apps/api/plane/bgtasks/work_item_link_task.py` | Skip crawl for non-http(s) schemes              |
| `apps/api/plane/app/views/issue/link.py`        | Conditionally call crawl task                   |
| `apps/api/plane/tests/unit/utils/test_url.py`   | Add tests for new validation                    |

## Implementation Steps

### Step 1: Replace serializer URL validation

File: `apps/api/plane/app/serializers/issue.py` L589-597

Replace Django `URLValidator()` with `urlparse`-based validation:

```python
def validate_url(self, value):
    from urllib.parse import urlparse

    BLOCKED_SCHEMES = {"javascript", "data", "vbscript"}  # file:// is allowed (enterprise network shares)

    parsed = urlparse(value)

    # Must have a scheme and netloc/path
    if not parsed.scheme:
        raise serializers.ValidationError({"error": "Invalid URL format. URL must include a protocol scheme."})

    if parsed.scheme.lower() in BLOCKED_SCHEMES:
        raise serializers.ValidationError({"error": "This URL scheme is not allowed."})

    # For http/https, require netloc (domain)
    if parsed.scheme.lower() in ("http", "https") and not parsed.netloc:
        raise serializers.ValidationError({"error": "Invalid URL format."})

    # For custom protocols, require at least scheme://something
    if not parsed.netloc and not parsed.path:
        raise serializers.ValidationError({"error": "Invalid URL format."})

    return value
```

### Step 2: Conditionally skip crawl for non-http(s)

File: `apps/api/plane/app/views/issue/link.py`

In both `create()` (L52) and `partial_update()` (L79), wrap crawl call:

```python
url = serializer.data.get("url", "")
if url.startswith("http://") or url.startswith("https://"):
    crawl_work_item_link_title.delay(serializer.data.get("id"), url)
```

### Step 3: Add unit tests

File: `apps/api/plane/tests/unit/serializers/test_issue_link_serializer.py` (new)

Test cases:

- `http://example.com` -- valid
- `https://example.com` -- valid
- `z://abc/xyz` -- valid
- `ftp://server/path` -- valid
- `javascript://alert(1)` -- rejected
- `data://text/html,<h1>` -- rejected
- `://no-scheme` -- rejected
- Empty string -- rejected

## Todo

- [x] Update `validate_url` in `IssueLinkSerializer`
- [x] Conditional crawl in `link.py` create()
- [x] Conditional crawl in `link.py` partial_update()
- [x] Add unit tests for serializer validation
- [x] Run `cd apps/api && python run_tests.py -u`
- [x] Run `pnpm check:lint`

## Success Criteria

- `z://abc/xyz` accepted and stored correctly
- `javascript:alert(1)` rejected
- http/https links still crawled for metadata
- Non-http links stored without metadata crawl (no errors)
- All existing tests pass

## Risk Assessment

- **Medium**: Changing URL validation could admit unexpected schemes
- Mitigation: explicit blocklist for dangerous schemes + require `scheme://` format
- No DB migration needed (model field is `TextField`)

## Security Considerations

- **XSS via javascript: protocol**: Blocked explicitly in BLOCKED_SCHEMES
- **SSRF**: Only http/https links are crawled; SSRF protections in `validate_url_ip()` unchanged
- **data: URI**: Blocked to prevent content injection
- Custom protocols cannot be used for SSRF since Celery won't fetch them

## Next Steps

After implementation: run full test suite, lint check, code review
