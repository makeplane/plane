# Phase 1: Backend -- Bank-wide Project Field

## Context

- Project model: `apps/api/plane/db/models/project.py`
- Field `is_bank_wide` already exists (line 101, migration 0143)
- Project serializer: `apps/api/plane/app/serializers/project.py`
- Frontend type: `apps/web/ce/types/projects/projects.ts`

## Overview

`is_bank_wide` (BooleanField) is already on the Project model. This phase verifies it is fully exposed through the API and frontend types, ready for the spreadsheet column (Phase 4).

## Requirements

1. Confirm `is_bank_wide` is in Project serializer fields
2. Confirm `IProject` type in `@plane/types` includes `is_bank_wide: boolean`
3. If missing from either, add it

## Architecture

No new model changes needed. The field was added in migration 0143. Just verify serialization + typing.

## Related Files

- `apps/api/plane/db/models/project.py` (line 101)
- `apps/api/plane/db/migrations/0143_project_is_bank_wide.py`
- `apps/api/plane/app/serializers/project.py`
- `packages/types/src/project/project.ts` or `apps/web/ce/types/projects/projects.ts`

## Implementation Steps

### 1.1 Verify serializer includes `is_bank_wide`

- Check `ProjectSerializer` fields list
- If using `__all__`, it's already included
- If explicit list, add `is_bank_wide`

### 1.2 Verify `IProject` type

- Check `packages/types/src/project/` for `is_bank_wide` property
- If missing: add `is_bank_wide: boolean` to interface

### 1.3 Verify CE create form includes toggle

- `apps/web/ce/components/projects/create/attributes.tsx` already references `is_bank_wide`
- `apps/web/ce/components/projects/settings/bank-wide/root.tsx` exists

## Todo

- [ ] Grep serializer for `is_bank_wide` inclusion
- [ ] Grep `IProject` type for `is_bank_wide`
- [ ] Fix gaps if any

## Success Criteria

- `GET /api/v1/workspaces/{slug}/projects/` returns `is_bank_wide` per project
- `IProject` type includes `is_bank_wide: boolean`

## Risk Assessment

- Low risk: field already exists, this is verification only

## Security Considerations

- None: boolean field, no sensitive data

## Next Steps

Phase 2: add `is_default` to IssueView and seed default views
