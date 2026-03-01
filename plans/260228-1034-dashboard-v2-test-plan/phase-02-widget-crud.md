# Phase 2: Widget CRUD

**Status:** Complete | **Test Cases:** 10 | **Result:** All API tests pass

## Test Cases

### TC-2.1: Add widget — Bar Chart (default)

- **Steps:** Dashboard detail → "Add Widget" → Select Bar Chart → Property: Priority, Metric: Issue Count → Submit
- **Expected:** Widget appears immediately in grid, chart renders

### TC-2.2: Add widget — renders after page reload

- **Steps:** After TC-2.1, reload page (F5)
- **Expected:** Widget still visible with same config

### TC-2.3: Add multiple widgets

- **Steps:** Add 3 different widgets (Bar, Line, Donut) to same dashboard
- **Expected:** All 3 render in grid, no overlap

### TC-2.4: Edit widget — change chart type

- **Steps:** Widget context menu → Edit → Change from Bar to Line → Save
- **Expected:** Widget updates to Line Chart, data preserved

### TC-2.5: Edit widget — change property

- **Steps:** Widget context menu → Edit → Change x_axis from Priority to State → Save
- **Expected:** Chart re-renders with state data

### TC-2.6: Edit widget — change metric

- **Steps:** Widget context menu → Edit → Change y_axis from Issue Count to Estimate Points → Save
- **Expected:** Chart re-renders with estimate point values

### TC-2.7: Edit widget — change name

- **Steps:** Widget context menu → Edit → Change widget name → Save
- **Expected:** New name shown in widget header

### TC-2.8: Delete widget

- **Steps:** Widget context menu → Delete
- **Expected:** Widget removed from grid, toast success

### TC-2.9: Delete last widget → empty state

- **Steps:** Delete all widgets from dashboard
- **Expected:** "No widgets yet" empty state appears

### TC-2.10: Widget config modal — cancel

- **Steps:** Open Add Widget modal → Fill form → Cancel/close
- **Expected:** No widget created, modal closes cleanly

## Success Criteria

- All widget CRUD operations work
- MobX store updates UI reactively (no reload needed)
- Data persists across page reloads
