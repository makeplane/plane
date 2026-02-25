# Phase 6: Testing & Polish

## Context Links
- API tests pattern: `apps/api/plane/tests/` (if exists) or inline testing
- Frontend compilation: `pnpm build` or `pnpm typecheck`

## Overview
- **Priority**: P2
- **Status**: complete
- Comprehensive testing, edge case handling, final polish.

## Key Insights
- Backend: Django test framework with DRF test client
- Frontend: TypeScript compilation check is primary validation
- Edge cases: zero duration, future dates, concurrent edits, timezone handling

## Requirements
### Functional
- API endpoint tests (CRUD + permissions + validation)
- Frontend TypeScript compilation passes
- Edge cases handled gracefully

### Non-functional
- No regression in existing features
- Clean error messages for validation failures

## Implementation Steps

1. **API Tests** — create test file for worklog endpoints
   - Test CRUD operations
   - Test permission: non-member cannot access
   - Test permission: member can only edit own worklogs
   - Test permission: admin can edit any worklog
   - Test validation: duration_minutes > 0
   - Test validation: logged_at not in far future
   - Test feature gate: returns 403 when is_time_tracking_enabled=False
   - Test summary endpoint aggregation correctness

2. **Frontend Type Check**
   - Run `pnpm typecheck` across packages
   - Fix any type errors from new code

3. **Edge Cases**
   - Zero duration → reject with validation error
   - Very large duration (>24h in a day) → allow but warn in UI
   - Future date → allow (pre-logging) but no more than 7 days ahead
   - Deleted issue → cascade delete worklogs (handled by FK)
   - Concurrent edit → last-write-wins (acceptable for MVP)

4. **UI Polish**
   - Loading skeletons in sidebar property
   - Toast notifications on create/update/delete success
   - Error handling with user-friendly messages
   - Confirm dialog before delete

5. **Migration Verification**
   - Run migration on fresh DB
   - Run migration on existing DB with data
   - Verify rollback works

## Todo List
- [ ] Write API endpoint tests
- [ ] Run TypeScript compilation check
- [ ] Handle edge cases in API validation
- [ ] Add loading states to UI components
- [ ] Add toast notifications
- [ ] Add error handling
- [ ] Verify migrations forward + backward
- [ ] Manual E2E walkthrough

## Success Criteria
- All API tests pass
- TypeScript compiles without errors
- Edge cases return proper error messages
- UI has loading, error, and empty states
- Migration is reversible

## Risk Assessment
- **Test infrastructure**: May need to set up test fixtures for worklog tests
- **Migration rollback**: Removing a field requires careful backward migration

## Security Considerations
- Test that unauthenticated requests are rejected
- Test that cross-workspace access is blocked
- Verify no data leakage in summary endpoints

## Next Steps
- Feature complete — ready for code review and merge
