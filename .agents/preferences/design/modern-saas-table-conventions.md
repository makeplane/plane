---
type: preference
topic: design
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-07-27
---

# Default table/list conventions for dashboard-style apps

Starting point for any new data-table UI in a dashboard-style app (adjust
per actual UX needs, but start here rather than a bare HTML table):

- Whole-row hover highlight, not just the cell under the cursor.
- Status/category values shown as colored pills — the same color must
  consistently mean the same status everywhere in the app, not be picked
  per-table.
- Sortable column headers: click to sort, with a visible sort-direction
  indicator on the header itself.
- Checkbox-based multiselect on rows that support bulk actions, with a
  bulk-action toolbar that appears once 1+ rows are selected.

Observed 2026-07-27 (Jobernaut dashboard wireframes): User pointed at a SaaS
reference screenshot (an orders table) and said "i like this table and
dashboard style in general" — row hover, colored status pills, sortable
headers, and multiselect checkboxes were each called out by name as things
to carry over.
