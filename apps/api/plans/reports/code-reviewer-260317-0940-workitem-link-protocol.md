# Code Review: Work Item Link Protocol Support

**Date:** 2026-03-17
**Branch:** ngoc-feat/workspaces
**Score: 7.5 / 10**

---

## Scope

- Files: 4
- Focus: Protocol-agnostic URL support for work item links (RFC 3986 custom schemes)
- Changed: serializer, view, frontend modal, new test file

---

## Overall Assessment

The change correctly shifts from a hardcoded `http://` prepend strategy to an allowlist/blocklist approach. The core logic is sound and the backend validation is well-structured. Several edge cases need attention before this is production-safe.

---

## Critical Issues

### 1. Blocked schemes without `://` bypass frontend regex and reach backend

The frontend regex `^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/` requires `://`. Inputs like `vbscript:msgbox(1)` or `data:text/html,...` do not match, so they get `http://` prepended: `http://vbscript:msgbox(1)`. The backend then parses this as `scheme=http, netloc=vbscript:msgbox(1)` — a valid http URL. The dangerous payload is stored in the database as the netloc component.

This is a stored-XSS / data-injection surface: the URL is displayed in the UI and potentially rendered as a link. If the UI ever renders `href="http://vbscript:msgbox(1)"`, some older browsers (IE11 / legacy Edge) execute it.

**Fix options (either is sufficient):**

- Backend: also block `data:` and `vbscript:` patterns that appear after prepending `http://` — i.e., also check `parsed.netloc` for blocked scheme names.
- Simpler: in `validate_url`, after parsing, reject any URL where `netloc` or `path` matches `^(javascript|data|vbscript):`.
- Frontend: expand the regex OR add an explicit reject list before the protocol-detection step.

### 2. Protocol-relative URL `//example.com` produces malformed result

Input `//example.com/path` does not match the frontend regex (scheme is empty), so `http://` is prepended, yielding `http:////example.com/path`. This is a malformed URL that will either fail backend validation or be stored malformed. Should be caught with a frontend-level check or a specific transform.

---

## High Priority

### 3. `file://` scheme accepted with no access restrictions

`file:///network/share/doc` passes validation. While stated as intentional for "enterprise network shares", this allows storing arbitrary local filesystem paths. If the application ever server-side fetches these URLs (e.g., future crawling feature), this is an SSRF vector. The `crawl_work_item_link_title` guard already excludes non-http(s) URLs, which mitigates this for now — but the decision should be documented in code, not just the plan.

**Recommendation:** Add an inline comment in `validate_url` explicitly stating `file://` is allowed for network share use cases and that crawling is intentionally excluded.

### 4. Test: `vbscript:msgbox(1)` test uses wrong input format

```python
def test_vbscript_scheme_rejected(self):
    with pytest.raises(ValidationError):
        self._validate("vbscript:msgbox(1)")
```

`urlparse("vbscript:msgbox(1)")` returns `scheme='vbscript'`, so the backend correctly rejects it. However the frontend sends `"http://vbscript:msgbox(1)"` to the backend (due to the regex miss), which then passes. The test does not cover the actual attack vector — it tests the raw scheme, not the mutated form that actually arrives at the API.

**Missing test:** `self._validate("http://vbscript:msgbox(1)")` should also raise ValidationError (it currently does not).

---

## Medium Priority

### 5. `from urllib.parse import urlparse` inside method body

The import is inside `validate_url`. It works (Python caches module imports) but is against Python convention. Move to module-level imports.

### 6. Validation error format is inconsistent

`validate_url` raises `serializers.ValidationError({"error": "..."})` (a dict), while field-level validators in DRF conventionally raise with a plain string or list. Raising with a dict wraps the error in an extra level: the response body will be `{"url": [{"error": "..."}]}` rather than the typical `{"url": ["..."]}`. This may break frontend error parsing if the frontend expects a flat string.

Check how the frontend consumes validation errors from this endpoint and align the format.

### 7. `crawl_work_item_link_title` guard is string-prefix based

```python
if url.startswith("http://") or url.startswith("https://"):
```

This is correct and safe as-is, but using `urllib.parse.urlparse(url).scheme in ("http", "https")` is more robust and consistent with the validation logic above.

---

## Low Priority

### 8. Test file missing `ftp://` without netloc rejection case

`ftp://` (no netloc, no path) is not tested. The last `if not parsed.netloc and not parsed.path` check should catch it, but an explicit test adds confidence.

### 9. Frontend comment is accurate but verbose

The comment `# Detect RFC 3986 scheme...` correctly describes the regex. Minor: `z://` in the comment is an unusual example — `ftp://` or `myapp://` would be more intuitive for readers.

---

## Edge Cases Found During Review

| Input                | Frontend sends              | Backend receives                                  | Result                |
| -------------------- | --------------------------- | ------------------------------------------------- | --------------------- |
| `vbscript:msgbox(1)` | `http://vbscript:msgbox(1)` | `scheme=http, netloc=vbscript:msgbox(1)`          | **Stored** (Critical) |
| `data:text/html,...` | `http://data:text/html,...` | `scheme=http, netloc=data:text/html,...`          | **Stored** (Critical) |
| `//example.com/path` | `http:////example.com/path` | Likely stored malformed                           | High                  |
| `javascript://alert` | Sent as-is                  | `scheme=javascript` — **blocked**                 | OK                    |
| `JAVASCRIPT://alert` | Sent as-is                  | `.lower()` normalizes — **blocked**               | OK                    |
| `file:///share`      | Sent as-is                  | `scheme=file, netloc='', path='/share'` — allowed | OK (by design)        |
| `z://abc/xyz`        | Sent as-is                  | Allowed                                           | OK                    |

---

## Positive Observations

- Replacing Django's `URLValidator` with explicit scheme-based logic is correct — `URLValidator` rejects all non-http(s) URLs.
- Case normalization via `.lower()` on scheme comparisons is correct.
- Conditional `crawl_work_item_link_title` guard is clean and correctly isolated.
- Test structure with `_validate` helper is clean and idiomatic.
- Frontend regex correctly handles `+`, `.`, `-` in scheme names per RFC 3986.
- Removal of `to_internal_value` is correct since the frontend now handles protocol detection.

---

## Recommended Actions

1. **[Critical]** Fix the `vbscript:` / `data:` bypass via `http://` prepend. Either: (a) reject in `validate_url` when `parsed.netloc` matches a blocked scheme name, or (b) add frontend pre-check before the regex test.
2. **[Critical]** Add test for `validate_url("http://vbscript:msgbox(1)")` — must raise ValidationError.
3. **[High]** Handle `//example.com` in frontend: detect protocol-relative URLs before the regex step.
4. **[Medium]** Move `from urllib.parse import urlparse` to module-level import.
5. **[Medium]** Align `ValidationError` format (string vs dict) with frontend error handling expectations.
6. **[Low]** Add inline comment in `validate_url` documenting the `file://` decision.

---

## Unresolved Questions

- Does the frontend link renderer use `href={url}` directly? If so, `http://vbscript:...` stored values could be clickable with unexpected behavior on older browsers.
- Is `file://` rendering intended to open local files in users' browsers (it won't for remote URLs), or is it purely for display/copy purposes?
