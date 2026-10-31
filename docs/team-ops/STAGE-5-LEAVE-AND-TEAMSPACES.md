# Stage 5: Leave requests with approval, and Teamspaces

## Leave requests

A person asks for leave (dates, type, note). A manager approves or rejects. Approval writes the working days of the period into that person's calendar as `LEAVE` days (set by hand, audited with the approver as `changed_by`). Rejection or cancellation changes nothing in the calendar.

- Table `tops_leave_request` (migration `team_ops.0005_leave_requests`, create-table only): person, period, type, note, status (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), who decided, when, and a decision note.
- Rules: only working weekdays that are not holidays are taken; at most 62 days per request; a person cannot have two open (pending or approved) requests that overlap; a request is decided once; only the person cancels, only while pending.
- Who decides: workspace admins any request (their own included, so a one-admin workspace is not stuck); a team lead the requests of people in their teams; nobody else. Guests and outsiders cannot use it.
- API under `/api/workspaces/<slug>/team-ops/leave-requests/`: `GET ?scope=mine|review`, `POST` to ask, `POST <id>/` with `{action: approve|reject|cancel, note}`.
- Page "Leave": the request form, "Waiting for your decision" (managers) and "My requests". Sidebar item "Leave".
- The calendar still lets a person set leave days directly (Stage 2, self-declared). Closing that path for non-admins is a policy switch that has not been added; say if you want it.
- Tests: 13 backend contract tests, 3 frontend service tests.

## Teamspaces

A read-only page "Teamspaces": every team with its description, lead and members, and links to the Team calendar and to team management (admins). It reuses the teams of Stage 2 (`tops_team`); there is no new table. Team spaces with their own pages, files or discussions belong to the Team Collaboration module, which is not built.

## Checked

Both pages were opened in a real browser (as a member); the full request, approve and reject flow was exercised through the backend tests and the services' tests, not clicked through in the browser.
