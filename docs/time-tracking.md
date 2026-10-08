# Time Tracking

Log the time you spend on work items and projects, review your week, and report
on where the time goes. Time tracking is available in every project; there is
nothing to switch on.

## Who can do what

|                                           | Workspace Guest | Workspace Member                                | Project Admin     | Workspace Admin    |
| ----------------------------------------- | --------------- | ----------------------------------------------- | ----------------- | ------------------ |
| See time tracking                         | ✗               | ✓                                               | ✓                 | ✓                  |
| See other people's time                   | ✗               | ✓ in public projects and projects you belong to | ✓                 | ✓ everywhere       |
| Log your own time                         | ✗               | ✓ in projects where you're an Admin or Member   | ✓                 | ✓ in your projects |
| Log, edit or delete time for someone else | ✗               | ✗                                               | ✓ in that project | ✓ any project      |
| Change a project's "Billable by default"  | ✗               | ✗                                               | ✓                 | ✓                  |

Time in **secret projects** is only visible to that project's members and to
workspace admins.

## Logging time

**With a timer.** Click the stopwatch in the top bar, pick a project (and
optionally a work item), and press **Start**. On a work item you can also press
the ▶ button next to **Time** in its properties, use **Start timer** in the
work item's ⋯ menu, or run _Start timer_ from the command palette. Starting a
new timer stops the one that's running. You have at most one timer at a time.

- Click the running timer to change its description, work item, billable flag
  or start time (for "I forgot to start it 10 minutes ago"), or to stop or
  discard it.
- A timer stopped within a minute is discarded as an accidental start.
- A timer that runs for 12 hours stops automatically at exactly 12 hours and is
  marked **Review**. Open it and choose **Looks right**, or correct it. The
  stopwatch shows an amber dot while you have entries to review.

**Manually.** Use **Log time** (top bar timer menu, the time-tracking page, a
work item's **+** button or ⋯ menu). Enter either a duration on a date, or a
start and end time. Durations accept `1h 30m`, `1h30m`, `90m`, `1:30`, `1.5`
or `1,5`; a plain number means hours. An entry is between 1 minute and 24
hours, and can't be in the future.

Time without a work item counts as **project time** (meetings, admin, …).

## The time-tracking page

Open **Time tracking** in the sidebar (under _More_ if it isn't pinned).

- **Timesheet** - one person's week, a row per project/work item and a column
  per day. Click an empty cell and type a duration to log time; click a cell
  with one manual entry to change it (clear it to delete). Cells with several
  entries or timer entries open a list. **Add row** and **Copy rows from
  previous week** set up rows before you log time. Weeks start on the day set
  in your profile preferences.
- **Entries** - every entry matching the filters, with totals, grouping,
  sorting, inline billable toggles and bulk actions (delete, mark billable /
  non-billable).
- **Reports** - headline numbers (with the change against the previous period),
  time over time, a breakdown by any dimension, a pivot table and the top work
  items. Click a bar, slice, pivot cell or row to see the entries behind it.
  Switch between `h:mm` and decimal hours at the top right.

Filters live in the page address, so you can bookmark or share a filtered view.
A link only shows the recipient the entries they're allowed to see.

**Export** (Reports → Export) downloads the filtered entries as CSV or Excel
(up to 50,000 rows), or the pivot table as CSV. Start and end times are shown in
each person's own timezone.

## Billable time

Every entry is billable or non-billable. Project admins can make new entries in
a project billable by default under **Project settings → Time tracking**.
Changing the default doesn't affect existing entries.

## Good to know

- An entry counts towards the day it was **started**, in the timezone of the
  person it belongs to, even if a timer runs past midnight.
- Deleting a work item keeps its time as project time. Archiving a work item or
  project keeps its time in reports, but no new time can be logged on it.
- Archiving a project, or removing someone from a project or the workspace,
  stops their running timer there.
- In reports grouped by label, module or assignee, an entry counts towards each
  of its work item's labels/modules/assignees, so the groups can add up to more
  than the total.
