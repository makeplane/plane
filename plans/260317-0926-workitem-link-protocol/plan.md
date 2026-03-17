---
title: "Extend Workitem Link Protocol Support"
description: "Allow custom protocol URLs (z://, file://, ftp://) in workitem links beyond http/https"
status: complete
priority: P2
effort: 1h
branch: develop
tags: [workitem, link, validation, frontend, backend]
created: 2026-03-17
---

# Extend Workitem Link Custom Protocol Support

## Problem

Workitem "Add Link" only accepts http/https URLs. Users need custom protocols like `z://abc/xyz`.

## Root Cause (3 validation layers)

| Layer              | File                                                                                  | Behavior                                            |
| ------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Frontend modal     | `apps/web/core/components/issues/issue-detail/links/create-update-link-modal.tsx` L64 | Prepends `http://` if URL doesn't start with `http` |
| Backend serializer | `apps/api/plane/app/serializers/issue.py` L589-597                                    | Django `URLValidator()` rejects non-http(s) schemes |
| Celery crawler     | `apps/api/plane/bgtasks/work_item_link_task.py` L44-46                                | `validate_url_ip()` rejects non-http(s) schemes     |

## Phases

| #   | Phase               | Status   | Effort | File                                          |
| --- | ------------------- | -------- | ------ | --------------------------------------------- |
| 1   | Frontend validation | complete | 20min  | [phase-01](./phase-01-frontend-validation.md) |
| 2   | Backend validation  | complete | 40min  | [phase-02](./phase-02-backend-validation.md)  |

## Out of Scope

- Workspace-level allowlist of permitted custom protocols
- Link preview/metadata crawling for non-http protocols

## Validation Log

### Session 1 — 2026-03-17

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 01 modifies apps/web/core/components/issues/issue-detail/links/create-update-link-modal.tsx. The CE pattern says never modify core/ for new features — but this is a bug fix. Which approach should we use?
   - Options: Modify core/ directly | Override via CE
   - **Answer:** Modify core/ directly
   - **Rationale:** Bug fixes to core/ are acceptable; CE override pattern is for new features only. Simpler and avoids unnecessary indirection.

2. **[Security]** The backend uses a blocklist approach (blocking javascript, data, vbscript). Should file:// URLs also be blocked?
   - Options: Block file:// too | Allow file://
   - **Answer:** Allow file://
   - **Rationale:** Enterprise users may need file:// to link to network shares. Keep BLOCKED_SCHEMES as `{javascript, data, vbscript}` only.

3. **[Scope]** ftp/ftps already accepted by Django URLValidator. Should we preserve existing ftp crawling or always skip for non-http(s)?
   - Options: Skip crawl for all non-http(s) | Keep ftp crawling as-is
   - **Answer:** Skip crawl for all non-http(s)
   - **Rationale:** Consistent rule: only http/https links get metadata crawled. Simplifies conditional logic in link.py.

4. **[Architecture]** Where should the new serializer test file go?
   - Options: New file as planned | Add to existing test file
   - **Answer:** New file as planned (`apps/api/plane/tests/unit/serializers/test_issue_link_serializer.py`)
   - **Rationale:** Follows existing test directory structure convention.

#### Confirmed Decisions

- Core/ modification: allowed for bug fixes — direct edit to modal
- `file://` scheme: allowed (not blocked)
- ftp crawl: skipped — only http/https get metadata crawl
- Tests: new file `test_issue_link_serializer.py`

#### Action Items

- [ ] Keep `BLOCKED_SCHEMES = {"javascript", "data", "vbscript"}` — do NOT add `file`
- [ ] Verify test directory `apps/api/plane/tests/unit/serializers/` exists before creating test file

#### Impact on Phases

- Phase 2: BLOCKED_SCHEMES must NOT include `file` — update implementation note
