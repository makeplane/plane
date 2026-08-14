# Real-time sync API contract (for native iOS/macOS clients)

This document is the contract a separate iOS/macOS codebase implements against.
It is not implemented in this repository — only the server side (`apps/api`,
`apps/live`) and the web client are. See
[`.claude/plans/implement-a-real-time-synchronization-immutable-nebula.md`](../.claude/plans)
for the full design rationale.

## 1. Authentication

Every call below uses the user's normal Plane credential (session cookie for
web, API token / OAuth bearer for native apps) — there is no separate sync
credential. `/sync` is a WebSocket, so the credential travels as connection
query params rather than a header.

## 2. Registering a device for push (native only)

```
POST /api/users/me/devices/
{
  "platform": "ios" | "macos",
  "apns_token": "<hex device token from APNs registration>",
  "apns_env": "sandbox" | "production"
}
→ 201 { "id": "...", "platform": "...", "apns_token": "...", "apns_env": "...", "last_active_at": "..." }
```

Re-registering the same `apns_token` for the same user upserts (refreshes
`apns_env`/`last_active_at`) instead of duplicating. Call this once per app
launch after obtaining/refreshing the token from `UNUserNotificationCenter`.

```
DELETE /api/users/me/devices/{id}/
→ 204
```

Call on logout / notification permission revocation.

## 3. The `/sync` WebSocket

One connection per open workspace.

```
wss://<live-host><LIVE_BASE_PATH>/sync
  ?userId=<user id>
  &workspaceSlug=<slug>
  &workspaceId=<workspace id>
  &sinceSeq=<last known cursor, 0 for a fresh install>
  &deviceId=<device id from step 2, iOS/macOS only>
  &cookie=<session cookie>   (web) — native clients pass an equivalent auth token instead
```

On connect the server:

1. Replays every `SyncEvent` with `seq > sinceSeq` for the workspace (paged,
   500 at a time) — this is the offline/reconnect catch-up.
2. Switches to a live stream: every new event for the workspace as it happens.

Every event frame:

```json
{
  "type": "event",
  "id": "uuid",
  "seq": 1042,
  "entity_type": "issue" | "issue_comment" | "cycle" | "module" | "project" | "pomodoro_timer",
  "entity_id": "uuid",
  "action": "created" | "updated" | "deleted" | "moved",
  "actor": "user-uuid | null",
  "payload": { "...": "small, entity-specific diff — see §5" },
  "created_at": "2026-08-14T00:00:00Z"
}
```

Client responsibilities:

- Persist the highest `seq` seen per workspace locally; pass it back as
  `sinceSeq` on the next connect (this is exactly what
  `apps/web/core/services/sync/sync-socket.service.ts` does with
  `localStorage`, mirror that behavior).
- De-dupe by `seq` — replay and the live stream can overlap by at most one
  event around the switchover.
- Send `{"type": "ping"}` periodically (~20s) to keep the connection's
  presence marker warm; this is what suppresses redundant APNs pushes while
  a device is actively connected.
- On `entity_type: "issue"` / `"issue_comment"` / `"cycle"` / `"module"` /
  `"project"` with `payload.project_id` (or `issue_id`), re-fetch just that
  entity via the normal REST API and patch it in place if it's currently
  visible — do not force a full list reload. `action: "moved"` on an issue
  means a scheduling field changed (see §5) — reposition it in any date/
  calendar view instead of only updating its fields.

## 4. Offline / background wakeups (APNs)

When a registered device is both offline (no live `/sync` connection) and
behind the workspace's latest `seq`, the server sends a push:

```json
{
  "aps": { "content-available": 1 },
  "workspace_id": "...",
  "seq": 1042
}
```

This is deliberately payload-free. On receipt (background fetch), reconnect
`/sync` with the device's last known `sinceSeq` and let replay do the rest —
never trust the push payload as the data itself.

Pomodoro phase-end pushes are the one **visible** push type (`aps.alert` +
`aps.sound`) — sent to a user's other devices when a focus/break phase ends
on one device, so a phone in someone's pocket still gets notified.

## 5. Entity payload shapes

`payload` is a small, best-effort diff — always safe to ignore its contents
and just re-fetch the entity by `entity_id`, but for entities you already
have cached, applying it directly avoids a round trip:

| entity_type        | payload keys (typical)                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `issue`            | `project_id`, and on update `changed_fields: string[]`; on `moved`, `start_date`/`target_date` |
| `issue_comment`    | `issue_id`, `project_id`                                                                       |
| `cycle` / `module` | `project_id`, `changed_fields` on update                                                       |
| `project`          | `changed_fields` on update                                                                     |
| `pomodoro_timer`   | see below                                                                                      |

`pomodoro_timer` payload (also the shape to expect back from
`GET /api/users/me/pomodoro-timers/`, which is the authoritative source —
always prefer it over the event payload for anything timer-related):

```json
{
  "status": "running" | "paused" | "completed" | "discarded",
  "started_at": "2026-08-14T00:00:00Z",
  "duration_minutes": 25,
  "paused_seconds": 130,
  "session_index": 2,
  "issue_id": "uuid",
  "action": "created" | "paused" | "resumed" | "skipped" | "completed" | "discarded" | "phase_end"
}
```

**Compute remaining time from these fields, never by counting down locally**:

```
remaining = duration_minutes * 60 - paused_seconds
          - (status == "running" ? now - started_at : 0)
```

This is the same formula `apps/web` uses (see
`apps/web/core/hooks/pomodoro/use-pomodoro-timer.ts`), so all devices agree
regardless of clock drift or how long they were backgrounded.

## 6. Pomodoro control endpoints (idempotent)

```
POST /api/users/me/pomodoro-timers/                       { issue_id, duration_minutes?, description?, client_mutation_id }
POST /api/users/me/pomodoro-timers/{id}/pause/             { client_mutation_id }
POST /api/users/me/pomodoro-timers/{id}/resume/            { client_mutation_id }
POST /api/users/me/pomodoro-timers/{id}/skip/              { client_mutation_id }
POST /api/users/me/pomodoro-timers/{id}/complete/          { create_time_log?, client_mutation_id }
POST /api/users/me/pomodoro-timers/{id}/discard/           { client_mutation_id }
```

`client_mutation_id` is a client-generated UUID (v4). Send a fresh one per
logical action; a retried request with the same key is a no-op on the server
(returns the current state instead of double-applying), which is what
prevents two devices racing the same button press from producing duplicate
transitions. Starting a timer while one is already active for the user
returns `409 Conflict` — surface that as "timer already running on another
device."

## 7. Reconciling after being offline

There is no separate offline-reconciliation endpoint. On reconnect:

1. Re-open `/sync` with the last known `sinceSeq` — this replays every
   missed event, including any Pomodoro transitions.
2. Additionally call `GET /api/users/me/pomodoro-timers/` once to get the
   current authoritative timer state immediately (don't wait for the timer
   entity's events to be individually replayed/parsed) — apply the same
   remaining-time formula from §5.
