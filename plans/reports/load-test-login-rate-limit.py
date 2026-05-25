"""
Concurrent burst load test for /auth/email-check/ to verify the
raised AuthenticationThrottle (1000/minute, per-IP, AnonRateThrottle).

The endpoint is the real rate-limit gate in the password login flow
(the actual /auth/sign-in/ Django view is NOT DRF-throttled).

Run:
    python3 plans/reports/load-test-login-rate-limit.py
"""

from __future__ import annotations

import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
except ImportError:
    print("requests not installed. pip install requests", file=sys.stderr)
    sys.exit(1)

BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/auth/email-check/"
PAYLOAD = {"email": "loadtest@example.com"}
HEADERS = {"Content-Type": "application/json"}

# Burst sizes to test. The rate is 1000/minute per IP (SimpleRateThrottle
# sliding-window). A burst > 1000 within ~60s should produce 429s.
BURSTS = [100, 500, 1000, 1100, 1500, 2000]

# Concurrency (worker thread count) per burst.
WORKERS = 100

# Seconds to wait between bursts so the sliding window decays
# (DRF SimpleRateThrottle averages requests over the period).
COOLDOWN_BETWEEN_BURSTS = 75


def fire_one(session: requests.Session) -> tuple[int, float]:
    start = time.perf_counter()
    try:
        resp = session.post(ENDPOINT, json=PAYLOAD, headers=HEADERS, timeout=10)
        return resp.status_code, time.perf_counter() - start
    except requests.RequestException as exc:
        # Treat connection-level failure as -1
        print(f"  ! request error: {exc}", file=sys.stderr)
        return -1, time.perf_counter() - start


def run_burst(n: int) -> dict:
    print(f"\n=== Burst: {n} concurrent requests (workers={WORKERS}) ===")
    statuses: list[int] = []
    latencies: list[float] = []

    t0 = time.perf_counter()
    with requests.Session() as session, ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(fire_one, session) for _ in range(n)]
        for fut in as_completed(futures):
            code, latency = fut.result()
            statuses.append(code)
            latencies.append(latency)
    wall = time.perf_counter() - t0

    counts: dict[int, int] = {}
    for s in statuses:
        counts[s] = counts.get(s, 0) + 1

    ok = counts.get(200, 0)
    throttled = counts.get(429, 0)
    other = n - ok - throttled

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(0.95 * len(latencies)) - 1] if latencies else 0.0
    p99 = latencies[int(0.99 * len(latencies)) - 1] if latencies else 0.0

    rps = n / wall if wall > 0 else 0

    print(f"  wall-time      : {wall:.2f}s")
    print(f"  effective rps  : {rps:.1f}")
    print(f"  status counts  : {counts}")
    print(f"  200 OK         : {ok}")
    print(f"  429 throttled  : {throttled}")
    print(f"  other / errors : {other}")
    print(f"  latency p50/p95/p99 (s): {p50:.3f} / {p95:.3f} / {p99:.3f}")

    return {
        "n": n,
        "wall": wall,
        "rps": rps,
        "ok": ok,
        "throttled": throttled,
        "other": other,
        "p50": p50,
        "p95": p95,
        "p99": p99,
        "counts": counts,
    }


def main() -> None:
    print(f"Target: {ENDPOINT}")
    print(f"Bursts: {BURSTS}")
    print(f"Cooldown between bursts: {COOLDOWN_BETWEEN_BURSTS}s "
          f"(needed so the per-minute window decays)")

    # Probe once
    try:
        probe = requests.post(ENDPOINT, json=PAYLOAD, headers=HEADERS, timeout=5)
        print(f"Probe: HTTP {probe.status_code} body={probe.text[:120]}")
        if probe.status_code not in (200, 400):
            print("Probe returned unexpected status; aborting.", file=sys.stderr)
            sys.exit(2)
    except requests.RequestException as exc:
        print(f"Probe failed: {exc}", file=sys.stderr)
        sys.exit(2)

    results = []
    for i, n in enumerate(BURSTS):
        results.append(run_burst(n))
        if i < len(BURSTS) - 1:
            print(f"  ... cooling down {COOLDOWN_BETWEEN_BURSTS}s")
            time.sleep(COOLDOWN_BETWEEN_BURSTS)

    print("\n\n=== Summary ===")
    print(f"{'burst':>6} {'wall(s)':>9} {'rps':>8} {'200':>6} {'429':>6} {'other':>6}")
    for r in results:
        print(f"{r['n']:>6} {r['wall']:>9.2f} {r['rps']:>8.1f} "
              f"{r['ok']:>6} {r['throttled']:>6} {r['other']:>6}")

    print("\nInterpretation:")
    print("  - AuthenticationThrottle is set to 1000/minute (per IP, sliding window).")
    print("  - Bursts <= 1000 within one minute should all 200.")
    print("  - Bursts > 1000 should see 429s for the overflow once the window is full.")
    print("  - The actual /auth/sign-in/ (password POST) is NOT DRF-throttled "
          "and is therefore bounded by DB / network / Django workers, not this limit.")


if __name__ == "__main__":
    main()
