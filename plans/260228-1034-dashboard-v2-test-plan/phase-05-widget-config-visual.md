# Phase 5: Widget Config & Visual

**Status:** Complete | **Test Cases:** 12 | **Result:** 10 API tests pass, 2 UI-only (no selenium)

## Color Presets

### TC-5.1: Modern preset (default)

- **Steps:** Create widget → Appearance tab → Select "Modern"
- **Expected:** Chart uses colors: #6366f1, #8b5cf6, #ec4899, #f59e0b, #10b981...

### TC-5.2: Horizon preset

- **Steps:** Change to "Horizon" preset
- **Expected:** Chart uses warm orange/yellow colors

### TC-5.3: Earthen preset

- **Steps:** Change to "Earthen" preset
- **Expected:** Chart uses muted earth-tone colors

## Chart-Specific Config

### TC-5.4: Bar Chart — fill opacity slider

- **Steps:** Bar chart → Appearance → Adjust fill opacity to 50%
- **Expected:** Bars become semi-transparent

### TC-5.5: Bar Chart — show border toggle

- **Steps:** Toggle "Show Border" on/off
- **Expected:** Bar borders appear/disappear

### TC-5.6: Line Chart — smoothing toggle

- **Steps:** Line chart → Toggle smoothing
- **Expected:** Line changes from jagged to smooth curve

### TC-5.7: Line Chart — show markers toggle

- **Steps:** Toggle markers on/off
- **Expected:** Data points shown/hidden on line

### TC-5.8: Area Chart — fill opacity + smoothing

- **Steps:** Adjust both fill opacity and smoothing
- **Expected:** Area fill transparency changes + curve smoothness

### TC-5.9: Donut/Pie — center value toggle

- **Steps:** Donut chart → Toggle "Center Value"
- **Expected:** Total count shown/hidden in center of donut

### TC-5.10: Show legend toggle

- **Steps:** Any chart → Toggle "Show Legend"
- **Expected:** Legend below/beside chart appears/disappears

### TC-5.11: Show tooltip toggle

- **Steps:** Any chart → Toggle "Show Tooltip" → Hover on data
- **Expected:** Tooltip on hover appears/disappears

## Widget Grid Size

### TC-5.12: Widget size — width/height variation

- **Steps:** Create widgets with different chart types, verify default grid sizes
- **Expected:**
  - Bar/Line/Area: 6 col × 4 row (half width, tall)
  - Donut/Pie: 4 col × 4 row (narrower)
  - Number: 3 col × 2 row (compact)

## Success Criteria

- All 3 color presets render distinct colors
- Chart-specific config toggles work per chart type
- Visual changes persist after save + reload
