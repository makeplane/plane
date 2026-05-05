# Phase 1: Dashboard CRUD

**Status:** Complete | **Test Cases:** 8 | **Result:** All API tests pass

## Test Cases

### TC-1.1: Create dashboard — basic

- **Steps:** Click "+ New Dashboard" → Enter name "Test Dashboard Alpha" → Submit
- **Expected:** Dashboard appears in list, toast success, redirects/shows in list

### TC-1.2: Create dashboard — with description

- **Steps:** Create dashboard with name + description text
- **Expected:** Description saved, visible on detail page toolbar

### TC-1.3: Create dashboard — empty name validation

- **Steps:** Try creating dashboard with empty name
- **Expected:** Form validation error, no API call

### TC-1.4: List dashboards

- **Steps:** Navigate to /shinhan-bank-vn/dashboards/
- **Expected:** All created dashboards visible in card list

### TC-1.5: Update dashboard — rename

- **Steps:** Open dashboard card menu → Edit → Change name → Save
- **Expected:** Name updated in list and detail page

### TC-1.6: Update dashboard — change description

- **Steps:** Edit dashboard → Modify description → Save
- **Expected:** Description updated

### TC-1.7: Delete dashboard

- **Steps:** Open dashboard card menu → Delete → Confirm
- **Expected:** Dashboard removed from list, toast success, widgets also removed

### TC-1.8: Delete dashboard — with widgets

- **Steps:** Create dashboard with 2+ widgets → Delete dashboard
- **Expected:** Dashboard AND all widgets removed cleanly

## Success Criteria

- All 8 CRUD operations work without errors
- Data persists after page reload
- Toast notifications show for all actions
