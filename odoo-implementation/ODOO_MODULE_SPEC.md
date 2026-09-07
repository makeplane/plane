# Odoo bridge: the endpoints Workspaces is already asking for

**Status: specification.** The three attendance endpoints in
[`WORKSPACES_ODOO_ATTENDANCE.md`](./WORKSPACES_ODOO_ATTENDANCE.md) are deployed and working. The endpoints
below are **not** — Workspaces calls them, gets a 404, and reports the feature as unavailable rather
than broken. Implementing them in `atlas-odoo-bridge` switches the corresponding Workspaces screens on
with no change on the Workspaces side.

Everything here follows the conventions the deployed bridge already set:

- Auth is the single shared `X-Atlas-Key` header. No new credential.
- Times are **UTC with an explicit `Z`**. Dates are `YYYY-MM-DD`.
- Errors are `{"error": {"message": "...", "code": "..."}}` with a real status code.
- A person is identified by their **work email**, never by an Odoo id Workspaces would have to store.
- The bridge stores nothing of its own. Odoo remains the source of truth.

the Workspaces client (`workspaces/utils/odoo_bridge.py`) treats `404`, `405` and `501` as _"this deployment
does not have that route yet"_ and everything ≥ 500 as an outage. So an unimplemented endpoint is
safe to leave unimplemented.

---

## 1. `GET /api/v1/attendance/history`

Called by `/api/attendance/history/` — the attendance history screen.

**Query:** `email` (required), `start_date`, `end_date` (optional, default: the last 30 days).

```json
{
  "employee": { "id": 42, "name": "...", "work_email": "..." },
  "timezone": "Asia/Kathmandu",
  "start_date": "2026-08-01",
  "end_date": "2026-08-31",
  "days": [
    {
      "date": "2026-08-01",
      "worked_hours": 8.2,
      "expected_hours": 8.0,
      "status": "present",
      "sessions": [{ "check_in": "2026-08-01T03:15:00Z", "check_out": "2026-08-01T11:30:00Z", "worked_hours": 8.2 }]
    }
  ],
  "totals": { "worked_hours": 168.4, "expected_hours": 176.0, "present_days": 21, "absent_days": 1, "leave_days": 2 }
}
```

`status` is one of `present`, `absent`, `leave`, `holiday`, `weekend`. Workspaces renders the calendar
straight off it, so a day the employee was not expected to work must say so rather than be omitted.

---

## 2. `GET /api/v1/leave/me`

Called by `/api/attendance/leave/` — the leave panel.

**Query:** `email` (required), `year` (optional, default: current).

```json
{
  "employee": { "id": 42, "work_email": "..." },
  "year": 2026,
  "balances": [
    { "type": "Annual Leave", "allocated": 20.0, "taken": 7.0, "pending": 1.0, "remaining": 12.0, "unit": "days" }
  ],
  "requests": [
    {
      "id": 118,
      "type": "Annual Leave",
      "start_date": "2026-09-10",
      "end_date": "2026-09-12",
      "days": 3.0,
      "state": "validate",
      "description": ""
    }
  ]
}
```

`state` uses Odoo's own `hr.leave` states (`draft`, `confirm`, `refuse`, `validate1`, `validate`)
— Workspaces maps them to labels rather than inventing its own vocabulary.

---

## 3. `GET /api/v1/holidays`

Called by `/api/attendance/holidays/` — the holiday calendar.

**Query:** `email` (optional — scopes to the employee's calendar/company), `year` (optional).

```json
{
  "year": 2026,
  "calendar": "Nepal",
  "holidays": [{ "date": "2026-10-20", "name": "Dashain", "type": "public" }]
}
```

---

## 4. `GET /api/v1/employees/working-hours`

Called by `/api/attendance/working-hours/`.

**Query:** `email` (required).

```json
{
  "employee": { "id": 42, "work_email": "..." },
  "calendar": "Standard 40 hours/week",
  "timezone": "Asia/Kathmandu",
  "hours_per_day": 8.0,
  "hours_per_week": 40.0,
  "days": [{ "weekday": 1, "from": "09:00", "to": "18:00", "break_hours": 1.0 }]
}
```

`weekday` is ISO — Monday is 1.

---

## 5. `GET /api/v1/attendance/team`

Called by `/api/workspaces/<slug>/operations/team-availability/` — the PM dashboard's team panel.

**This is the one that matters most for load.** Without it Workspaces falls back to calling
`/attendance/me` once per member, in a bounded thread pool, cached for a minute. That works, but it
is N requests where one would do.

**Query:** `emails` — comma-separated, up to 100.

```json
{
  "date": "2026-09-04",
  "employees": [
    {
      "work_email": "...",
      "id": 42,
      "name": "...",
      "department": "Engineering",
      "checked_in": true,
      "check_in": "2026-09-04T03:15:00Z",
      "worked_hours_today": 5.1,
      "on_leave": false,
      "leave_type": null
    }
  ],
  "unmatched": ["someone@example.com"]
}
```

An address with no employee behind it goes in `unmatched` rather than producing an error — Workspaces
shows those people as "not linked", which is a provisioning problem for HR, not a failure of the
request.

---

## 6. Optional: `GET /api/v1/departments`

Not called yet. Listed because PROJECT.md names departments as part of the integration's surface,
and because grouping the team panel by department is the obvious next thing somebody will ask for.

```json
{ "departments": [{ "id": 3, "name": "Engineering", "manager_email": "...", "member_count": 12 }] }
```

---

## Implementation notes

- **Read-only.** Nothing above writes to Odoo. The only writes Workspaces performs are the two punches
  that already exist, and that should stay true: a leave request approved from Workspaces would need an
  approval chain Workspaces does not model.
- **`_resolve_employee` is already the right lookup.** Reuse it rather than adding a second
  email-matching path — the existing behaviour (match on `work_email`, 400 when nothing matches) is
  what the Workspaces error handling is written against.
- **Pagination is not needed.** Every response above is bounded by a year, a team or a calendar.
- **Do not regenerate the API key.** Atlas is a separate consumer of the same bridge.
