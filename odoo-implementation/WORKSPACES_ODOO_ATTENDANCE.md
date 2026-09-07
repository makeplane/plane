# Check in / check out inside Workspaces

**A brief for Claude.** Add an attendance control to the Workspaces (Workspaces) top navigation so a
person can punch in and out without leaving the tool they already have open, using the
`atlas-odoo-bridge` addon and API key that are **already deployed and working**.

Nothing here needs new Odoo work. The bridge already exposes exactly the three endpoints this
feature needs. The job is a thin server-side proxy in the Workspaces Django API plus one button in the
Workspaces web app.

---

## 0. Read these before writing any code

| File                                                 | Why                                                                                                                           |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `atlas-odoo-bridge/README.md`                        | The bridge's API contract, auth, and the two operational traps                                                                |
| `atlas-odoo-bridge/atlas_bridge/controllers/main.py` | The real behaviour — read `protected`, `_resolve_employee`, `attendance_checkin`, `attendance_checkout`, `_attendance_status` |
| [`DEPLOYMENT.md`](../DEPLOYMENT.md) §8               | How the key was generated and verified                                                                                        |
| `workspaces/AGENTS.md`                               | the Workspaces build, lint and test commands. Follow them, don't invent                                                       |

The Workspaces fork is already cloned at `/Users/bip1n/Documents/Code/HGN/workspaces` (Workspaces `1.4.2`,
pnpm + turbo monorepo, Django API under `apps/api`).

---

## 1. What already exists — do not rebuild any of it

The Odoo addon `atlas_bridge` is installed on **VM01**, at
`/home/ubuntu/.hgn/odoo/custom-addons/atlas-odoo-bridge`, bind-mounted into the Odoo container.
Odoo runs from `/home/ubuntu/.hgn/odoo`, database `hgn`. **No change to the addon is required for
this feature.** If you think you need one, stop and say why first — a model or manifest change
there needs a real module upgrade, not a restart.

The three endpoints, already live:

```
GET  {ODOO}/api/v1/attendance/me?email=<email>     → status
POST {ODOO}/api/v1/attendance/checkin              → {"email": "...", "latitude": 27.7, "longitude": 85.3}
POST {ODOO}/api/v1/attendance/checkout             → {"email": "...", "latitude": 27.7, "longitude": 85.3}
```

Auth is one shared key on every request:

```
X-Atlas-Key: <the key generated in Odoo → Settings → Atlas Bridge>
```

The same key the Atlas backend uses. Get it from Odoo (**Settings → Atlas Bridge → API access**) or
from the Atlas backend's stored settings — **ask the user for it, never invent or regenerate one.**
Regenerating the key would break Atlas, which is a separate consumer of the same bridge.

`GET /attendance/me` returns:

```json
{
  "employee": { "id": 42, "name": "...", "work_email": "...", "department": "..." },
  "date": "2026-09-01",
  "timezone": "Asia/Kathmandu",
  "checked_in": true,
  "check_in": "2026-09-01T03:15:00Z",
  "current_session_hours": 2.4,
  "worked_hours_today": 5.1,
  "closed_hours_today": 2.7,
  "sessions_today": [ ... ],
  "last_check_in": "2026-09-01T03:15:00Z",
  "last_check_out": null,
  "server_time": "2026-09-01T05:39:00Z"
}
```

`checkin` and `checkout` return **the same payload** — the status after the write. So the UI never
needs a follow-up read: use the write's response to update state.

Errors are always `{"error": {"message": "...", "code": "..."}}` with a real status code:

| Status | `code`               | Means                                                            |
| ------ | -------------------- | ---------------------------------------------------------------- |
| 400    | —                    | `No employee matches <email>` — this person isn't linked in Odoo |
| 401    | —                    | Bad or missing `X-Atlas-Key`                                     |
| 409    | `already_checked_in` | A session is already open                                        |
| 409    | `not_checked_in`     | Nothing open to close                                            |
| 503    | —                    | The bridge has no key configured                                 |

Times are **UTC with an explicit `Z`**. `worked_hours_today` already includes the running session.

Coordinates go onto Odoo's `in_latitude`/`in_longitude` and `out_latitude`/`out_longitude` — but the
bridge **never requires them**. Read `_geo_values` in the controller: anything missing, unparseable
or out of range is dropped and the punch is written anyway, deliberately, so that a refused browser
permission could never stop somebody clocking in. That was the right call for Atlas and it is the
thing that makes this feature's requirement ours to enforce (§3 rule 7, §5).

---

## 2. The shape of the change

```
Workspaces web (browser)                Workspaces API (Django)              Odoo / VM01
  navbar button  ──session cookie──▶  /api/attendance/*  ──X-Atlas-Key──▶  /api/v1/attendance/*
```

**The browser never sees the bridge key, and never talks to Odoo.** The key lives only in the Workspaces
API container's environment. The browser is authenticated by the Workspaces session cookie, exactly
like every other Workspaces call, and the Django layer decides which Odoo employee that session maps to.

**Do not route this through the Atlas backend.** Atlas has its own JWT auth and its own user table;
making the Workspaces browser session acceptable to Atlas is a cross-domain SSO problem that buys nothing
here. Workspaces already knows who the user is, and the bridge already accepts an email. Two independent
consumers of the same bridge is the intended design — the bridge is stateless and stores nothing.

---

## 3. Rules

1. **The key never reaches the browser.** No `NEXT_PUBLIC_*` variable holds it. No client-side
   `fetch` to the Odoo host. If you catch yourself adding CORS config on Odoo, you've taken the
   wrong path.
2. **Don't touch the Odoo addon.** See §1.
3. **Don't touch the Atlas repos** (`backend/`, `frontend/`, `atlas-odoo-bridge/`). This feature
   lives entirely in `workspaces/`.
4. **Keep the fork upgradable.** Workspaces is upstream software the team will pull from again. Put new
   code in **new files** with names that read as ours, and keep edits to upstream files down to
   import/registration lines. The touch list in §5 and §6 is deliberately short — keep it that way,
   and note every upstream file you edit in the summary at the end.
5. **No commits.** Make the edits, run the checks, report what changed. The user runs `git`.
   If asked to commit later: no co-author or session trailers, ever.
6. **Fail soft on infrastructure, loud on data.** With Odoo unreachable or the key unset, the
   navbar degrades quietly and the rest of Workspaces is unaffected — an attendance outage must never
   break the workspace. A user who doesn't resolve to an Odoo employee is _not_ that case: every
   Workspaces account maps to one (§4), so that is a provisioning bug and has to be visible.
7. **Location is required to check in, and Workspaces is the only thing that can enforce it.** The bridge
   accepts coordinates and never demands them (§1). So the check lives in the Django layer — §5. If
   you send coordinates from the browser and trust the bridge to reject a punch that lacks them, you
   will ship something that looks like it works and enforces nothing.

---

## 4. Identity: which Odoo employee is this Workspaces user?

**Every Workspaces account belongs to an employee who already exists in Odoo.** That is a given for
this rollout, not something the feature has to discover, manage or offer a UI for. Nobody is
provisioned in Workspaces who was not first set up in Odoo.

The join key is **email**: `request.user.email` in Workspaces → `email=` on the bridge, which searches
`hr.employee.work_email` then `private_email`, case-insensitively. No mapping table, no new column,
no user-facing setting.

Because the correspondence is guaranteed, a **400 `No employee matches <email>`** is not a state to
design for — it is a defect, and it means one of exactly two things:

- the person's Workspaces account uses a different address than their Odoo `work_email`, or
- somebody reached Workspaces without an Odoo employee record.

Handle it accordingly: **log it at warning level with the email**, and show the user a short message
that names the fix — _"Your Workspaces account (<email>) doesn't match an employee record in Odoo.
Ask HR to check your work email."_ Don't dress it up as an ordinary empty state and don't silently
hide the control. A button that quietly does nothing costs more support time than one that explains
itself.

Do **not** add a user-editable "my Odoo employee id" field in Workspaces. That is a second source of
truth for something Odoo already owns, and Atlas already keeps that mapping for its own purposes.

### Prove the mapping before rollout, not after

The guarantee in this section is an intent about how people are provisioned, and intent drifts — a
married name, a `@hgn` vs `@hgsoftware` address, one contractor added in a hurry. Check it once,
before the feature goes near the team; it turns a fortnight of one-off complaints into a list:

```bash
# every active Workspaces user, from the Workspaces API host
docker compose exec api python manage.py shell -c \
  "from workspaces.db.models import User; print('\n'.join(User.objects.filter(is_active=True).values_list('email', flat=True)))" \
  | tr 'A-Z' 'a-z' | sort > /tmp/plane-users.txt

# every employee the bridge can see
curl -s -H "X-Atlas-Key: $KEY" "$ODOO/api/v1/employees" \
  | jq -r '.employees[].work_email // empty' | tr 'A-Z' 'a-z' | sort > /tmp/odoo-emails.txt

comm -23 /tmp/plane-users.txt /tmp/odoo-emails.txt   # Workspaces accounts with no employee
```

Confirm the `/employees` response shape against the controller before trusting that `jq` path, and
compare case-insensitively — the bridge matches with `=ilike`, so a case difference is not a real
mismatch. Hand the user the list; fixing it is an Odoo-side job.

---

## 5. Backend — `apps/api` (Django)

### New files

**`apps/api/workspaces/utils/odoo_bridge.py`** — the only thing in the codebase that knows the bridge
exists.

- Reads `ODOO_BASE_URL` and `ODOO_API_KEY` from `django.conf.settings`.
- One small client using `requests` (already a dependency, pinned `2.33.0` in
  `apps/api/requirements/base.txt` — don't add `httpx`).
- **Always set a timeout** (5s connect / 10s read is right) — an unreachable Odoo must not tie up a
  Workspaces worker.
- Sends `X-Atlas-Key`, `Content-Type: application/json`, and nothing else.
- Returns `(status_code, payload)` or raises one narrow exception type; do not let a
  `requests.RequestException` escape into a Workspaces 500.
- Never log the key. Log the URL, status and the bridge's `error.message` only.

**`apps/api/workspaces/app/views/attendance/__init__.py`** and
**`apps/api/workspaces/app/views/attendance/base.py`** — three endpoints, modelled on the existing
small views (`workspaces/app/views/timezone/base.py` is the shortest example; `workspaces/app/views/base.py`
holds `BaseAPIView`).

- Subclass `BaseAPIView` so you inherit `BaseSessionAuthentication` and `IsAuthenticated`. These are
  **user-scoped, not workspace-scoped** — attendance has nothing to do with which workspace is open,
  so do not put `workspaceSlug` in the route or require workspace membership.
- The employee is **always** `request.user.email`. Never accept an `employee_id` or `email` from the
  request body — that would let any signed-in user punch in as anybody. This is the single most
  important line of this document.
- **Require `latitude` and `longitude` on check-in, and validate them here.** Reject a body that
  omits either, or that carries anything but a float in `[-90, 90]` / `[-180, 180]`, with a **400**
  and a machine-readable `location_required` / `location_invalid` code the UI can branch on. Only
  once they pass do they go into the bridge's JSON body. Rule 7 in §3 is why: the bridge will accept
  that punch without coordinates, so if this validator isn't here, nothing enforces the requirement.
- **Check-out sends coordinates when the browser has them and proceeds without them.** The
  requirement is on the way in. Blocking check-out on a permission prompt strands an open session —
  someone already out of the building, on a phone that won't get a fix, cannot close their day and
  Odoo keeps counting the hours. Send the pair when present, omit it when not. (If they want both
  ends blocking, it is the same validator on the other endpoint — ask first.)
- Pass through the bridge's status codes: 409 stays 409. A 400 `No employee matches` becomes a 409
  carrying the §4 message and a `not_linked` code, logged at warning level with the email.
  401/503/timeouts become 503 with a generic "Attendance is unavailable" — never leak the bridge's
  internals to the browser.
- Add a throttle. the Workspaces `workspaces/throttles/` and `AuthenticationThrottle` show the pattern; a punch
  endpoint should not be free to hammer.

**`apps/api/workspaces/app/urls/attendance.py`**

```python
urlpatterns = [
    path("attendance/me/", AttendanceStatusEndpoint.as_view(), name="attendance-status"),
    path("attendance/check-in/", AttendanceCheckInEndpoint.as_view(), name="attendance-check-in"),
    path("attendance/check-out/", AttendanceCheckOutEndpoint.as_view(), name="attendance-check-out"),
]
```

`workspaces.app.urls` is mounted at `api/`, so these are `/api/attendance/…`. (the Workspaces `/api/v1/` is
its public API — unrelated to the bridge's `/api/v1/` on the Odoo host. Don't conflate them.)

### Upstream files to edit — three lines total

- `apps/api/workspaces/app/views/__init__.py` — one import, at the end, matching the file's style.
- `apps/api/workspaces/app/urls/__init__.py` — one import and one `*attendance_urls,` entry.
- `apps/api/workspaces/settings/common.py` — the two env vars, near the other `os.environ.get` reads:

```python
ODOO_BASE_URL = os.environ.get("ODOO_BASE_URL", "").rstrip("/")
ODOO_API_KEY = os.environ.get("ODOO_API_KEY", "")
```

Unset → the status endpoint reports the feature as unavailable and the navbar hides itself. A blank
key must never be sent; the bridge treats a blank configured key as "closed", and so should we.

### Caching

Don't add Redis caching in phase 1. `GET /attendance/me` is one indexed Odoo read per user per
minute; the frontend's revalidation interval is the real control. If it ever needs one, cache the
status for ~15s per user and **drop it on every write** — a stale "checked out" after a check-in is
worse than an extra request.

---

## 6. Frontend — `apps/web`

### New files

**`apps/web/core/services/attendance.service.ts`** — extend `APIService` from
`@/services/api.service`, constructed with `API_BASE_URL` like its siblings. Three methods:
`getStatus()`, `checkIn()`, `checkOut()`. Put the response type next to it or in
`apps/web/core/types/`; do **not** edit `packages/services` or `packages/types` — keeping the change
inside `apps/web/core` means far less to merge on the next upstream pull.

**`apps/web/core/components/attendance/check-in-button.tsx`** (plus a barrel `index.ts` if the
neighbouring component folders have one — match them).

- `observer` from `mobx-react`, same as every component around it.
- Fetch with `useSWR` — the codebase already uses it in the navigation (see
  `top-navigation-root.tsx` fetching the notification count). Revalidate on focus, and on an
  interval of about 60s so the running-hours label doesn't drift.
- Optimistic on click, then reconcile from the write's response payload (§1 — the write returns the
  full status, so there is no second request).
- Use the existing primitives, not new ones: `Tooltip` from `@makeplane/propel/components/tooltip`,
  `AppSidebarItem` from `@/components/sidebar/sidebar-item` for a plain icon button, `setToast` /
  `TOAST_TYPE` from `@workspaces/propel/toast` for errors, `cn` from `@workspaces/utils`. Read
  `top-navigation-root.tsx` and copy its idiom exactly.
- States: **loading** (skeleton or nothing), **checked out** → "Check in", **locating…** while the
  browser resolves a position, **checked in** → "Check out" with today's hours, **unavailable**
  (bridge down or unconfigured) → render nothing, **not linked** → the §4 message. No modal.
- Tooltip carries the detail: check-in time and `worked_hours_today`. Convert the UTC `Z` timestamps
  for display — the payload's `timezone` field tells you the employee's zone.
- Guard the double-click: disable while a write is in flight. A 409 `already_checked_in` should
  still be handled gracefully (re-read status, no scary toast) because two tabs can race.

### Getting the position

- **Capture it inside the click handler, not on mount.** `getCurrentPosition` should be triggered by
  the user's gesture so the browser's permission prompt has an obvious cause, and a fix taken at page
  load is stale by the time anyone presses the button. Wrap the callback API in a promise and
  `await` it with `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }`.
- **`navigator.geolocation` exists only in a secure context.** Over plain HTTP on a LAN address it is
  unavailable and _nobody can check in at all_. See §7 — confirm how Workspaces is served before you
  build this.
- **Show a `locating…` state.** Ten seconds of a frozen button is indistinguishable from a hang.
- **Handle the three error codes separately**, because the fix differs and a generic toast here
  turns into support tickets: `PERMISSION_DENIED` → "Allow location for this site to check in",
  pointing at the padlock in the address bar; `POSITION_UNAVAILABLE` → "Your device couldn't get a
  location"; `TIMEOUT` → offer a retry.
- **Never substitute a position.** No cached last-known value, no IP-derived guess, no silent zero.
  If there is no fix, there is no check-in — that is the whole point of the requirement.

### Upstream file to edit — one

**`apps/web/core/components/navigation/top-navigation-root.tsx`** — this is the navbar. Mount the
control in the "Additional Actions" flex row (currently Inbox → `HelpMenuRoot` →
`StarUsOnGitHubLink` → `UserMenuRoot`). Put it **first in that group**, left of Inbox: it is the
most-used action of the four and it stays away from the avatar menu's click target.

That is the only upstream web file that needs to change. One import, one element.

### i18n

Workspaces runs strings through `useTranslation` from `@workspaces/i18n`. Follow it — add keys to the English
locale file under a new `attendance.*` namespace and use `t(...)`. Don't hardcode user-facing
strings just because the fork is ours.

---

## 7. Configuration and deploy

`apps/api/.env` (created by `./setup.sh` from `.env.example`) is loaded into the `api` and `worker`
containers via `env_file` in `docker-compose.yml`. Add to **`apps/api/.env.example`** (so the next
person sees it) and to the real `.env`:

```dotenv
# Attendance — the Atlas Odoo bridge on VM01. Server-side only; never expose to the browser.
ODOO_BASE_URL=https://<the odoo host>
ODOO_API_KEY=
```

Confirm the Odoo hostname with the user before writing it anywhere — the deploy notes and the
runbook disagree (`office.hgn.com.np` vs `odoo.hgsoftware.com.np`), and the one that matters is the
one the **Workspaces API container** can resolve.

**Three traps. The first two are in the bridge README; all three are real:**

1. **`localhost` will not work.** The Workspaces API is a container; `localhost` is that container. Use
   the public hostname or a LAN IP that resolves from inside it.
2. **The nginx allow-list on Odoo.** `/api/v1/*` on the Odoo host is restricted to the Atlas API
   host's IP. **The Workspaces API host is a new client and will be denied until its address is added
   there.** Expect the first end-to-end test to fail with a 403 from nginx — that's this, not your
   code. Adding the IP is a change on VM01 and is the user's to make; flag it early rather than at
   the end.
3. **Workspaces has to be served over HTTPS or nobody can check in.** Browser geolocation is gated
   on a secure context, so `http://<lan-ip>:3000` yields a `navigator` with no usable `geolocation`
   and every punch fails — a failure that reads like a bug in the button and isn't. `localhost` in
   development is fine; any shared instance needs a certificate. **Check this before writing the UI,
   and if Workspaces is currently served over plain HTTP, say so immediately** — it is a
   prerequisite for the feature, not a polish item.

---

## 8. Verification

Work outward, and don't skip the curl step — it separates "my code is wrong" from "the network is
wrong".

```bash
# 1. The bridge, from the Workspaces API host (not from a laptop)
KEY=<key>; ODOO=https://<odoo host>
curl -s -o /dev/null -w '%{http_code}\n' "$ODOO/api/v1/health"                # 401 — key required
curl -s -H "X-Atlas-Key: $KEY" "$ODOO/api/v1/health"                          # 200 — names the db
curl -s -H "X-Atlas-Key: $KEY" "$ODOO/api/v1/attendance/me?email=<your email>"

# 2. Through Workspaces, signed in (session cookie), against your OWN account
curl -s -b <cookie jar> http://localhost:8000/api/attendance/me/
```

Then in the browser: check in from the navbar, **confirm the record appears in Odoo's attendance
view with the coordinates on it**, check out, confirm the hours land. Do the first write against
**your own** employee record.

You will see those coordinates because the addon gives bridge punches their own `in_mode`/`out_mode`
value, **"Atlas"** — Odoo's form hides its geolocation block for `manual` records, which is exactly
the trap that value exists to avoid. One consequence to pass on to the user: a Workspaces punch and
an Atlas punch are indistinguishable in Odoo, both labelled Atlas. Separating them would mean a new
selection value in the addon, which is a module upgrade on VM01 and is out of scope here.

Also verify the failure paths on purpose — they are most of the value of this design:

- Wrong `ODOO_API_KEY` → navbar degrades, rest of Workspaces fine.
- `ODOO_BASE_URL` unset → control absent, no errors in the console.
- An account with no matching Odoo employee → the §4 message, logged server-side, not a crash.
- Check in twice quickly → no duplicate session (Odoo's own constraint plus the 409 handling).
- **Location denied in the browser** → check-in refused with the "allow location" message, and
  **nothing written to Odoo**. Check the second half in Odoo, not just in the UI.
- **Location stripped at the API** → `curl` a check-in through Workspaces with no `latitude` in the body
  and confirm a **400 `location_required`**. This is the test that proves the enforcement is real:
  the bridge would have happily accepted that same request.
- **Check-out with location denied** → still succeeds, session closes, hours land.

Before reporting done: `pnpm check` (format, lint, types) at the repo root, and the API tests per
`AGENTS.md` if you touched anything they cover.

---

## 9. Out of scope

Leave, holidays, attendance history, a full attendance page, and reporting are all **Atlas's job** —
it already does them, against this same bridge. This feature is one control in one navbar: punch in
with a location, punch out, see today's hours.

**Geofencing is not in scope, and is not what "location is required" means here.** The bridge records
coordinates and never checks them against anything; neither should this. A punch from the wrong side
of the city gets stored, not refused. What is enforced is _presence_ — no position, no check-in —
and that is what §5 and §6 build. If the user wants "must be within N metres of an office", that is
new logic that belongs beside the validator in the Django layer, and it needs three answers first:
office coordinates, a radius, and what happens to people working remotely. Ask before building it.

---

## 10. What to report at the end

- Every **upstream Workspaces file** you edited, with the line count of the change. This list is what
  makes the next `git pull` from upstream survivable.
- The env vars added, and whether the Odoo nginx allow-list still needs the Workspaces host's IP.
- What you verified end-to-end, and what you couldn't (say so plainly).
- Suggested commit message. Then stop — the user commits.
