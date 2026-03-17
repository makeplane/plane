# Phase 01: Frontend Validation — COMPLETE

## Context

- [plan.md](./plan.md)
- Modal: `apps/web/core/components/issues/issue-detail/links/create-update-link-modal.tsx`

## Overview

Frontend auto-prepends `http://` to any URL not starting with `http`. This silently corrupts custom protocol links (e.g., `z://abc` becomes `http://z://abc`).

**Status:** IMPLEMENTED — replaced `startsWith("http")` with RFC 3986 scheme regex at L64

## Key Insight

Line 64 of the modal:

```ts
const parsedUrl = formData.url.startsWith("http") ? formData.url : `http://${formData.url}`;
```

This is the ONLY frontend validation. No regex or URL format check exists.

## Requirements

- Custom protocol URLs (e.g., `z://abc/xyz`, `ftp://server/path`) pass through unchanged
- Plain domains (e.g., `google.com`) still get `http://` prepended (backward compat)
- Empty/whitespace-only URLs still rejected by `required` rule

## Architecture

No new files needed. Single line change in existing modal.

## Related Code Files

- `apps/web/core/components/issues/issue-detail/links/create-update-link-modal.tsx` (L64)

## Implementation Steps

### Step 1: Update URL parsing logic (L64)

Replace the `startsWith("http")` check with a protocol-aware check:

```ts
// Detect if URL has any protocol scheme (e.g., http://, https://, z://, ftp://)
const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(formData.url);
const parsedUrl = hasProtocol ? formData.url : `http://${formData.url}`;
```

Regex breakdown: `^[a-zA-Z][a-zA-Z0-9+.-]*://` matches RFC 3986 scheme syntax.

## Todo

- [x] Update L64 protocol detection regex
- [x] Manual test: `z://abc/xyz` passes through as-is
- [x] Manual test: `google.com` still gets `http://` prepended
- [x] Manual test: `https://example.com` unchanged
- [x] Run `pnpm check:lint`

## Success Criteria

- Custom protocol links submitted without `http://` prefix corruption
- Existing http/https and bare-domain behavior unchanged

## Risk Assessment

- **Low**: Single-line change, no new dependencies
- Regex is simple and well-tested (RFC 3986 scheme pattern)

## Security Considerations

- Frontend validation is advisory only; backend is the real gate
- No XSS risk since URLs are stored/rendered as text, not injected into HTML attributes unsanitized
- `javascript:` protocol concern addressed in Phase 02 backend validation

## Next Steps

Phase 02: Backend validation changes to accept custom protocols
