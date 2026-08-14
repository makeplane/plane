# iOS/macOS implementation guide: real-time sync

This is the implementation companion to
[`sync-api-contract.md`](./sync-api-contract.md), which defines _what_ the
server sends and expects. This document is _how_ to build the Swift side of
it — types, networking, background delivery, and the Pomodoro countdown —
targeting a SwiftUI app shared between iOS and macOS (`Network`/`Foundation`
APIs used here are available on both).

It assumes:

- Swift 5.9+, iOS 16+ / macOS 13+ (for `URLSessionWebSocketTask`, `async/await`,
  `UNUserNotificationCenter`'s modern APIs).
- You already have an authenticated session against the Plane API (login flow
  is out of scope here — this guide starts from "I have a valid credential").

---

## 1. Project layout

```
PlaneSync/
├── Models/
│   ├── SyncEvent.swift
│   ├── Device.swift
│   └── PomodoroTimer.swift
├── Networking/
│   ├── APIClient.swift          # REST calls (existing in your app, extended below)
│   └── SyncSocket.swift         # the /sync WebSocket client
├── Push/
│   └── PushManager.swift        # APNs registration + background wakeup handling
├── Sync/
│   └── SyncCoordinator.swift    # owns the socket, applies events to local state
└── Pomodoro/
    └── PomodoroTimerStore.swift # ObservableObject mirroring the web store
```

---

## 2. Models

Mirror the payload shapes from the contract doc exactly — keep decoding
permissive (`payload` as `[String: JSONValue]` or similar) since new
`entity_type`s may appear before the app updates.

```swift
// Models/SyncEvent.swift
import Foundation

enum SyncEntityType: String, Codable {
    case issue, issueComment = "issue_comment", cycle, module, project
    case pomodoroTimer = "pomodoro_timer"
}

enum SyncAction: String, Codable {
    case created, updated, deleted, moved
}

struct SyncEvent: Codable, Identifiable {
    let id: String
    let seq: Int
    let entityType: SyncEntityType
    let entityId: String
    let action: SyncAction
    let actor: String?
    let payload: [String: AnyCodable]
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, seq, actor, payload
        case entityType = "entity_type"
        case entityId = "entity_id"
        case action
        case createdAt = "created_at"
    }
}

/// Minimal type-erased JSON value so `payload` decodes without a fixed shape
/// per entity_type — see AnyCodable.swift in most Swift utility libraries,
/// or vendor a small one; omitted here for brevity.
```

```swift
// Models/Device.swift
struct DeviceRegistration: Codable {
    let platform: String   // "ios" | "macos"
    let apnsToken: String
    let apnsEnv: String    // "sandbox" | "production"

    enum CodingKeys: String, CodingKey {
        case platform
        case apnsToken = "apns_token"
        case apnsEnv = "apns_env"
    }
}
```

```swift
// Models/PomodoroTimer.swift
import Foundation

enum PomodoroStatus: String, Codable {
    case running, paused, completed, discarded
}

struct PomodoroTimer: Codable, Identifiable {
    let id: String
    let workspace: String
    let project: String
    let issue: String
    let startedBy: String
    let startedAt: Date          // server timestamp — the source of truth
    let durationMinutes: Int
    let pausedSeconds: Int
    let status: PomodoroStatus
    let description: String
    let sessionIndex: Int
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, workspace, project, issue, status, description
        case startedBy = "started_by"
        case startedAt = "started_at"
        case durationMinutes = "duration_minutes"
        case pausedSeconds = "paused_seconds"
        case sessionIndex = "session_index"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    /// Same formula as apps/web/core/hooks/pomodoro/use-pomodoro-timer.ts —
    /// derive from server timestamps, never count down independently.
    func remainingSeconds(now: Date = Date()) -> Int {
        let total = durationMinutes * 60
        let elapsed: Int
        if status == .running {
            elapsed = pausedSeconds + max(0, Int(now.timeIntervalSince(startedAt)))
        } else {
            elapsed = pausedSeconds
        }
        return max(0, total - elapsed)
    }
}
```

Decode dates with `.iso8601` (`JSONDecoder().dateDecodingStrategy = .iso8601`)
— the API emits UTC ISO-8601 timestamps throughout.

---

## 3. Registering for push (APNs)

```swift
// Push/PushManager.swift
import UserNotifications
import UIKit // or AppKit on macOS

final class PushManager: NSObject {
    static let shared = PushManager()

    func requestAuthorizationAndRegister() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    /// Call from `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)`.
    func didReceiveDeviceToken(_ tokenData: Data) {
        let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
        Task {
            do {
                try await APIClient.shared.registerDevice(
                    DeviceRegistration(
                        platform: "ios", // "macos" on the Mac target
                        apnsToken: token,
                        apnsEnv: isSandboxAPNs() ? "sandbox" : "production"
                    )
                )
            } catch {
                // non-fatal: WS delivery/replay still covers this device
                // once it's foregrounded again.
                print("Device registration failed:", error)
            }
        }
    }

    private func isSandboxAPNs() -> Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
}
```

`APIClient.registerDevice` is a plain `POST /api/users/me/devices/` call using
your existing authenticated `URLSession`/`APIClient` — see §1–2 of the
contract doc for the exact shape. Call `requestAuthorizationAndRegister()`
once after login (or on the Pomodoro/notifications settings screen), and call
`didReceiveDeviceToken` from your `AppDelegate`/`UIApplicationDelegateAdaptor`.

**Handling the silent push** (in `application(_:didReceiveRemoteNotification:
fetchCompletionHandler:)` or the SwiftUI
`.backgroundTask(.appRefresh(...))`/`BGAppRefreshTask` equivalent):

```swift
func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
) {
    guard let workspaceId = userInfo["workspace_id"] as? String else {
        completionHandler(.noData)
        return
    }
    Task {
        do {
            // Payload-free push: it only tells you *that* something changed.
            // Reconnect/replay to get the actual data — see §5.
            try await SyncCoordinator.shared.catchUp(workspaceId: workspaceId)
            completionHandler(.newData)
        } catch {
            completionHandler(.failed)
        }
    }
}
```

For the visible Pomodoro phase-end push, `aps.alert`/`aps.sound` are already
set by the server — the system presents it automatically; no extra handling
needed beyond having notification permission granted.

---

## 4. The `/sync` WebSocket client

```swift
// Networking/SyncSocket.swift
import Foundation

protocol SyncSocketDelegate: AnyObject {
    func syncSocket(_ socket: SyncSocket, didReceive event: SyncEvent)
}

final class SyncSocket {
    weak var delegate: SyncSocketDelegate?

    private let workspaceSlug: String
    private let workspaceId: String
    private let userId: String
    private let deviceId: String?
    private let authTokenProvider: () -> String   // returns cookie/bearer value

    private var task: URLSessionWebSocketTask?
    private var reconnectAttempt = 0
    private var pingTimer: Timer?
    private var isStopped = false

    init(
        workspaceSlug: String,
        workspaceId: String,
        userId: String,
        deviceId: String?,
        authTokenProvider: @escaping () -> String
    ) {
        self.workspaceSlug = workspaceSlug
        self.workspaceId = workspaceId
        self.userId = userId
        self.deviceId = deviceId
        self.authTokenProvider = authTokenProvider
    }

    private var cursorKey: String { "plane-sync-cursor-\(workspaceId)" }
    private var cursor: Int {
        get { UserDefaults.standard.integer(forKey: cursorKey) }
        set { UserDefaults.standard.set(newValue, forKey: cursorKey) }
    }

    func connect() {
        isStopped = false
        var components = URLComponents(string: "\(Config.liveBaseURL)\(Config.liveBasePath)/sync")!
        components.scheme = Config.liveBaseURL.hasPrefix("https") ? "wss" : "ws"
        components.queryItems = [
            URLQueryItem(name: "userId", value: userId),
            URLQueryItem(name: "workspaceSlug", value: workspaceSlug),
            URLQueryItem(name: "workspaceId", value: workspaceId),
            URLQueryItem(name: "sinceSeq", value: String(cursor)),
            deviceId.map { URLQueryItem(name: "deviceId", value: $0) },
            URLQueryItem(name: "cookie", value: authTokenProvider()),
        ].compactMap { $0 }

        let session = URLSession(configuration: .default)
        let task = session.webSocketTask(with: components.url!)
        self.task = task
        task.resume()
        listen()
        startHeartbeat()
    }

    private func listen() {
        task?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .failure:
                self.scheduleReconnect()
            case .success(let message):
                if case .string(let text) = message {
                    self.handle(text)
                }
                self.listen() // keep receiving
            }
        }
    }

    private func handle(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let event = try? decoder.decode(SyncEvent.self, from: data) else { return }
        // De-dupe: only accept events strictly newer than our cursor.
        guard event.seq > cursor else { return }
        cursor = event.seq
        DispatchQueue.main.async {
            self.delegate?.syncSocket(self, didReceive: event)
        }
    }

    private func startHeartbeat() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 20, repeats: true) { [weak self] _ in
            self?.task?.send(.string("{\"type\":\"ping\"}")) { _ in }
        }
    }

    private func scheduleReconnect() {
        pingTimer?.invalidate()
        guard !isStopped else { return }
        let delay = min(pow(2.0, Double(reconnectAttempt)), 30)
        reconnectAttempt += 1
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            self?.connect()
        }
    }

    func disconnect() {
        isStopped = true
        pingTimer?.invalidate()
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }
}
```

This is a direct Swift port of
[`apps/web/core/services/sync/sync-socket.service.ts`](../apps/web/core/services/sync/sync-socket.service.ts)
— same query params, same cursor-in-storage/de-dupe/backoff behavior. Keep
them in sync if the contract changes.

---

## 5. Coordinating events into app state

```swift
// Sync/SyncCoordinator.swift
import Foundation

final class SyncCoordinator: SyncSocketDelegate {
    static let shared = SyncCoordinator()

    private var socket: SyncSocket?
    private let pomodoroStore: PomodoroTimerStore = .shared

    func start(workspaceSlug: String, workspaceId: String, userId: String, deviceId: String?) {
        socket?.disconnect()
        let socket = SyncSocket(
            workspaceSlug: workspaceSlug,
            workspaceId: workspaceId,
            userId: userId,
            deviceId: deviceId,
            authTokenProvider: { AuthSession.shared.cookieOrToken }
        )
        socket.delegate = self
        socket.connect()
        self.socket = socket
    }

    func stop() {
        socket?.disconnect()
        socket = nil
    }

    /// Used both by the running socket's live stream and by the APNs
    /// background-wakeup path (§3) — same replay endpoint either way.
    func catchUp(workspaceId: String) async throws {
        // Reuses SyncSocket's own replay-on-connect; for a background push
        // it's often simpler to call the REST replay endpoint directly:
        // GET /api/workspaces/{slug}/sync/replay/?since_seq=<cursor>
        // and apply the returned events the same way `didReceive` does below.
    }

    func syncSocket(_ socket: SyncSocket, didReceive event: SyncEvent) {
        switch event.entityType {
        case .issue, .issueComment, .cycle, .module, .project:
            // Re-fetch just this entity via your existing REST layer and
            // patch it into local state / Core Data / whatever your app uses
            // — do not trigger a full list reload. `event.action == .moved`
            // on an issue means a scheduling field changed: reposition it in
            // any calendar/date view instead of only updating its fields.
            LocalStore.shared.refreshEntity(id: event.entityId, kind: event.entityType)
        case .pomodoroTimer:
            // Don't trust the event payload for anything timer-related —
            // re-fetch the authoritative row, same as the web store does.
            Task { await pomodoroStore.refreshFromServer() }
        }
    }
}
```

Call `SyncCoordinator.shared.start(...)` once the user has an active
workspace (e.g. right after workspace selection, or app launch if there's a
last-used workspace), and `stop()` on logout/workspace switch. If your app
supports multiple simultaneously-open workspaces (e.g. a macOS multi-window
setup), run one `SyncCoordinator`/`SyncSocket` pair per workspace.

---

## 6. Pomodoro store

```swift
// Pomodoro/PomodoroTimerStore.swift
import Combine
import Foundation

@MainActor
final class PomodoroTimerStore: ObservableObject {
    static let shared = PomodoroTimerStore()

    @Published private(set) var activeTimer: PomodoroTimer?
    @Published private(set) var remainingSeconds: Int = 0

    private var tickTimer: Timer?

    func refreshFromServer() async {
        guard let timers = try? await APIClient.shared.fetchPomodoroTimers() else { return }
        activeTimer = timers.first { $0.status == .running || $0.status == .paused }
        recomputeRemaining()
        restartTicker()
    }

    /// Ticks once a second purely to re-render the UI — the *value* always
    /// comes from `activeTimer.remainingSeconds(now:)`, never from
    /// decrementing a local counter, so a backgrounded app (where the timer
    /// doesn't fire) simply recomputes correctly the moment it wakes up.
    private func restartTicker() {
        tickTimer?.invalidate()
        guard activeTimer?.status == .running else { return }
        tickTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.recomputeRemaining() }
        }
    }

    private func recomputeRemaining() {
        remainingSeconds = activeTimer?.remainingSeconds() ?? 0
    }

    // MARK: - Actions (mirror PomodoroTimerViewSet's endpoints)

    func start(issueId: String, durationMinutes: Int?) async throws {
        let timer = try await APIClient.shared.startPomodoro(
            issueId: issueId, durationMinutes: durationMinutes, clientMutationId: UUID().uuidString
        )
        activeTimer = timer
        recomputeRemaining()
        restartTicker()
    }

    func pause() async throws {
        guard let id = activeTimer?.id else { return }
        activeTimer = try await APIClient.shared.pausePomodoro(id: id, clientMutationId: UUID().uuidString)
        recomputeRemaining()
        restartTicker()
    }

    func resume() async throws {
        guard let id = activeTimer?.id else { return }
        activeTimer = try await APIClient.shared.resumePomodoro(id: id, clientMutationId: UUID().uuidString)
        recomputeRemaining()
        restartTicker()
    }

    func skip() async throws {
        guard let id = activeTimer?.id else { return }
        activeTimer = try await APIClient.shared.skipPomodoro(id: id, clientMutationId: UUID().uuidString)
        recomputeRemaining()
        restartTicker()
    }

    func complete(createTimeLog: Bool = true) async throws {
        guard let id = activeTimer?.id else { return }
        let response = try await APIClient.shared.completePomodoro(
            id: id, createTimeLog: createTimeLog, clientMutationId: UUID().uuidString
        )
        activeTimer = response.timer
        recomputeRemaining()
        restartTicker()
    }

    func discard() async throws {
        guard let id = activeTimer?.id else { return }
        activeTimer = try await APIClient.shared.discardPomodoro(id: id, clientMutationId: UUID().uuidString)
        recomputeRemaining()
        tickTimer?.invalidate()
    }
}
```

Every mutating call generates a fresh `UUID()` as `client_mutation_id` — this
is what makes a retried/duplicate request idempotent server-side (see
`PomodoroTimerViewSet._duplicate_mutation` in `apps/api/plane/app/views/
pomodoro.py`), which matters here specifically because two devices (say,
Watch/iPhone/web) can race the same button press.

**Starting a timer while one is already active elsewhere** returns
`409 Conflict` — surface it as e.g. _"A pomodoro is already running on
another device."_ rather than retrying.

---

## 7. Phase-end notifications from this device

When a focus/break phase completes locally (your own countdown logic, not a
`didReceive` event), call the existing notify endpoint so other devices get
an APNs alert:

```swift
func notifyPhaseEnd(phase: String, title: String, body: String) async {
    guard let timerId = activeTimer?.id else { return }
    try? await APIClient.shared.notifyPomodoroPhaseEnd(
        phase: phase, title: title, body: body, timerId: timerId
    )
}
```

This mirrors `notifyPomodoroPhaseEnd` in
`apps/web/core/components/pomodoro/notify-phase-end.ts` — always call it
regardless of whether this device has any particular notification channel
configured; the server decides whom else to notify.

---

## 8. Config

```swift
enum Config {
    static let apiBaseURL = "https://api.yourplane.instance"
    static let liveBaseURL = "https://live.yourplane.instance"
    static let liveBasePath = ""  // matches LIVE_BASE_PATH on the server
}
```

Match these to whatever your deployment's `API_BASE_URL` / `LIVE_BASE_URL` /
`LIVE_BASE_PATH` actually are (same env vars the web app and `apps/live` use).

---

## 9. Testing checklist

- [ ] Register a device, kill the app, trigger a change from web — confirm a
      silent push arrives and `catchUp` populates the change without opening
      the app.
- [ ] Open the app with the WS connected, make a change from web — confirm
      it lands within ~1s via the live stream, not the push path.
- [ ] Force a network drop (airplane mode toggle) mid-session, make several
      changes on web while offline, reconnect — confirm all of them replay in
      order with no duplicates (check by `seq`, they should be strictly
      increasing with no repeats).
- [ ] Start a Pomodoro on iOS, pause it from web — confirm iOS's countdown
      updates to the paused value (not just stops ticking incorrectly).
- [ ] Put the app in the background mid-Pomodoro for several minutes, bring
      it to foreground — confirm `remainingSeconds` is correct immediately
      (this is the timestamp-derivation test; a naive local-countdown
      implementation will be wrong here).
- [ ] Trigger the same pomodoro action (e.g. pause) from two devices within
      the same second — confirm only one state transition happens, not two.
