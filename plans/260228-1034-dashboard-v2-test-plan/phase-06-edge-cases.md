# Phase 6: Edge Cases & Error Handling

**Status:** Complete | **Test Cases:** 10 | **Result:** 6 API tests pass, 4 UI-only skipped

## Empty/No Data States

### TC-6.1: Widget with no matching data

- **Steps:** Create widget filtered to label that has 0 issues
- **Expected:** "No data available for these filters." message inside widget

### TC-6.2: Empty dashboard detail page

- **Steps:** Navigate to dashboard with 0 widgets
- **Expected:** "No widgets yet. Add your first widget." empty state with Add button

### TC-6.3: Dashboard list — empty state

- **Steps:** Delete all dashboards → Navigate to list
- **Expected:** Empty state UI (no crashes)

## Concurrent/Reload Scenarios

### TC-6.4: Rapid widget creation

- **Steps:** Add 3 widgets in quick succession without waiting
- **Expected:** All 3 created, no duplicates, no race conditions

### TC-6.5: Edit while loading

- **Steps:** Open edit modal immediately after page load (while widgets loading)
- **Expected:** Modal opens without crash, existing widget data loads

### TC-6.6: Browser back/forward navigation

- **Steps:** Dashboard list → Detail → Browser Back → Browser Forward
- **Expected:** Pages render correctly, no stale data

## Error Scenarios

### TC-6.7: Invalid dashboard ID in URL

- **Steps:** Navigate to /shinhan-bank-vn/dashboards/invalid-uuid/
- **Expected:** Graceful error or redirect, no white screen

### TC-6.8: Network error during widget save

- **Steps:** Disconnect API → Try creating widget
- **Expected:** Error toast, widget not added to grid

### TC-6.9: Delete dashboard while on detail page

- **Steps:** Open dashboard in tab A → Delete from list in tab B → Refresh tab A
- **Expected:** Graceful handling (redirect or error, not crash)

## Permission

### TC-6.10: Dashboard visibility — private vs public

- **Steps:** Create private dashboard (access=0), verify other users can't see it
- **Expected:** Only creator sees private dashboards in list

## Success Criteria

- No JS errors/white screens in any edge case
- Graceful error messages for all failure scenarios
- Empty states render properly
- Navigation transitions are smooth
