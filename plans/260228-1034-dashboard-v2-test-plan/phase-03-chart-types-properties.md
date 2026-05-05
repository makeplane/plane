# Phase 3: Chart Types × Properties Matrix

**Status:** Complete | **Test Cases:** 30 | **Result:** All API tests pass

## Chart Types (6)

| Type          | Expected Rendering          |
| ------------- | --------------------------- |
| `BAR_CHART`   | Vertical bars with labels   |
| `LINE_CHART`  | Connected line with points  |
| `AREA_CHART`  | Filled area under line      |
| `DONUT_CHART` | Ring chart with segments    |
| `PIE_CHART`   | Full circle with segments   |
| `NUMBER`      | Single large number display |

## X-Axis Properties with Backend Support (5)

| Property      | Groups by                                         |
| ------------- | ------------------------------------------------- |
| `priority`    | urgent, high, medium, low, none                   |
| `state`       | State names (per project states)                  |
| `state_group` | backlog, unstarted, started, completed, cancelled |
| `assignee`    | User display names                                |
| `labels`      | Label names                                       |

## Test Matrix: Chart Type × Property (30 cases)

### TC-3.1 → TC-3.5: BAR_CHART × each property

| TC  | Chart | Property    | Expected                     |
| --- | ----- | ----------- | ---------------------------- |
| 3.1 | Bar   | priority    | Bars for each priority level |
| 3.2 | Bar   | state       | Bars for each state          |
| 3.3 | Bar   | state_group | Bars for 5 state groups      |
| 3.4 | Bar   | assignee    | Bars per assignee            |
| 3.5 | Bar   | labels      | Bars per label               |

### TC-3.6 → TC-3.10: LINE_CHART × each property

| TC   | Chart | Property    | Expected                        |
| ---- | ----- | ----------- | ------------------------------- |
| 3.6  | Line  | priority    | Line connecting priority counts |
| 3.7  | Line  | state       | Line connecting state counts    |
| 3.8  | Line  | state_group | Line for 5 groups               |
| 3.9  | Line  | assignee    | Line per assignee               |
| 3.10 | Line  | labels      | Line per label                  |

### TC-3.11 → TC-3.15: AREA_CHART × each property

| TC   | Chart | Property    | Expected                   |
| ---- | ----- | ----------- | -------------------------- |
| 3.11 | Area  | priority    | Filled area for priorities |
| 3.12 | Area  | state       | Filled area for states     |
| 3.13 | Area  | state_group | Filled area for groups     |
| 3.14 | Area  | assignee    | Filled area per assignee   |
| 3.15 | Area  | labels      | Filled area per label      |

### TC-3.16 → TC-3.20: DONUT_CHART × each property

| TC   | Chart | Property    | Expected                  |
| ---- | ----- | ----------- | ------------------------- |
| 3.16 | Donut | priority    | Ring segments by priority |
| 3.17 | Donut | state       | Ring segments by state    |
| 3.18 | Donut | state_group | Ring segments by group    |
| 3.19 | Donut | assignee    | Ring segments by assignee |
| 3.20 | Donut | labels      | Ring segments by label    |

### TC-3.21 → TC-3.25: PIE_CHART × each property

| TC   | Chart | Property    | Expected               |
| ---- | ----- | ----------- | ---------------------- |
| 3.21 | Pie   | priority    | Pie slices by priority |
| 3.22 | Pie   | state       | Pie slices by state    |
| 3.23 | Pie   | state_group | Pie slices by group    |
| 3.24 | Pie   | assignee    | Pie slices by assignee |
| 3.25 | Pie   | labels      | Pie slices by label    |

### TC-3.26 → TC-3.30: NUMBER widget × each metric

| TC   | Chart  | Metric                     | Expected                      |
| ---- | ------ | -------------------------- | ----------------------------- |
| 3.26 | Number | count (Issue Count)        | Single number showing total   |
| 3.27 | Number | estimate_points            | Single number showing sum     |
| 3.28 | Number | count + priority filter    | Count filtered by priority    |
| 3.29 | Number | count + state_group filter | Count filtered by state group |
| 3.30 | Number | count + assignee filter    | Count filtered by assignee    |

## Notes

- Properties WITHOUT backend support (`cycle`, `module`, `estimate_point`, `start_date`, `target_date`, `created_at`, `completed_at`) will silently fall back to state grouping — document as known limitation
- "No data available" is valid if no issues exist matching the filter scope

## Success Criteria

- All 6 chart types render without JS errors
- All 5 backend-supported properties return correct data grouping
- Charts display "No data available" gracefully when no data
