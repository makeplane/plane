# Load Test — Login Concurrency vs. AuthenticationThrottle (1000/min)

**Date:** 2026-05-22 09:23 (Asia/Saigon)
**Target:** local API (`http://localhost:8000`), `develop` @ `ca1c763ed`
**Trigger commit:** `a2c1a97fc fix(auth): raise rate limit quotas to unblock concurrent SSO logins` (30/min → 1000/min)

---

## TL;DR

- **The 1000/min throttle only enforces under strictly-serial traffic.** First `429` at request #1001 from one IP (verified).
- **Under any real concurrency the throttle is bypassed.** A burst of 1500 concurrent requests from one IP all returned `200`, zero `429`. Same for 1100 with only 4 workers.
- Cause: DRF `SimpleRateThrottle.allow_request` does a non-atomic Redis `GET → mutate → SET`. With concurrent workers, all reads see the same pre-image and writes overwrite each other → the bucket length never observes ≥ `num_requests`.
- Practical concurrent ceiling on this local stack (not the throttle): ~1500 concurrent succeed cleanly; >1500 starts producing OS-level connection drops, not 429s.
- The actual login POST `/auth/sign-in/` is a plain Django `View` — it has **no DRF throttle at all**. The gate measured here is `/auth/email-check/`, which is the throttled step in the login flow.

---

## What the question maps to in code

Login flow from the web app:

| Step | Endpoint                  | View base           | Throttle                                               |
| ---- | ------------------------- | ------------------- | ------------------------------------------------------ |
| 1    | `POST /auth/email-check/` | DRF `APIView`       | `AuthenticationThrottle` = **1000/min** (per IP, anon) |
| 2    | `POST /auth/sign-in/`     | plain Django `View` | **none (DRF throttle doesn't apply)**                  |

`AuthenticationThrottle` is defined in `apps/api/plane/authentication/rate_limit.py:18` and applied on `apps/api/plane/authentication/views/app/check.py:32`, `magic.py:36`, `password_management.py:48`. It is **not** applied to `SignInAuthEndpoint` (`apps/api/plane/authentication/views/app/email.py:26`).

So the rate-limit raise primarily affects: email-check, magic-link generation, forgot-password.

## Runtime config (verified inside running `api` container)

- `DJANGO_SETTINGS_MODULE = plane.settings.production`
- `CACHES.default.BACKEND = django_redis.cache.RedisCache` (→ `redis://plane-redis:6379/`)
- `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES = {'anon': '1000/minute', 'asset_id': '5/minute'}`
- `AuthenticationThrottle: rate=1000/minute, num_requests=1000, duration=60`

Throttle key actually used: `:1:throttle_authentication_172.253.118.108`. That IP is **the Caddy proxy** in front of the API container (verified — it's not the host's loopback, it's a single shared bucket). This matches the commit's note: _"Django reads `REMOTE_ADDR` (Caddy proxy IP) instead of `X-Forwarded-For`, so all internal users share one throttle bucket."_ — that bug is still present.

## Experiments

| #                          | Workers | Requests | Wall (s) | 200      | 429     | Other | Notes                                                    |
| -------------------------- | ------- | -------- | -------- | -------- | ------- | ----- | -------------------------------------------------------- |
| Burst 100                  | 100     | 100      | 0.45     | 100      | 0       | 0     | OK                                                       |
| Burst 500                  | 100     | 500      | 2.70     | 500      | 0       | 0     | OK                                                       |
| Burst 1000                 | 100     | 1000     | 4.56     | 1000     | 0       | 0     | Throttle silent                                          |
| Burst 1100                 | 100     | 1100     | 5.21     | 1100     | 0       | 0     | Throttle silent                                          |
| Burst 1500                 | 100     | 1500     | 10.06    | 1420     | 0       | 80    | OS connection drops                                      |
| Burst 2000                 | 100     | 2000     | 8.63     | 1965     | 0       | 35    | OS connection drops                                      |
| Single-burst 1500          | 200     | 1500     | 6.79     | 1500     | 0       | 0     | Fresh bucket, all pass                                   |
| **Concurrency 4, 1100**    | 4       | 1100     | 7.24     | **1100** | **0**   | 0     | Even low concurrency bypasses throttle                   |
| **Serial, 1 worker, 1100** | 1       | 1100     | 18.98    | **1000** | **100** | 0     | First `429` at request #1001 — throttle enforces exactly |

Latencies (single-IP load): p50 ≈ 0.27s @ 100; p95 ≈ 0.6s @ 1000–1100; p95 jumps to ~3s above ~1500.

## Why concurrent traffic bypasses the throttle

DRF `SimpleRateThrottle.allow_request`:

```
history = cache.get(key, [])         # 1. read
prune expired entries
if len(history) >= num_requests: 429
history.insert(0, now)
cache.set(key, history, duration)    # 2. write
```

Steps 1 and 2 are not atomic. With concurrent workers each reading a stale pre-image, they all observe `len < 1000` and each writes its own history back. The Redis value is the last writer's view, so the stored history length tracks a small fraction of the actual throughput. Verified empirically: after a 1500-concurrent burst, the Redis bucket payload was only ~3.5 KB of pickled timestamps (~150 entries), not 1500. After the strictly-serial 1100-run, the bucket reached exactly 1000 entries and started returning 429.

## Answers to "how many users can log in at the same time"

For traffic originating from one IP (= what Caddy looks like to the API today):

- **Throttle-enforced ceiling (serial workload, e.g. retries, scripts):** 1000 successful requests per rolling 60 s. Request 1001 → `429 RATE_LIMIT_EXCEEDED`.
- **Concurrent burst from one IP:** effectively unbounded by the throttle — limited only by Django workers / DB / sockets. On this local stack, ~1500 concurrent succeed cleanly; beyond that the OS starts dropping connections (not 429s).
- **Actual `/auth/sign-in/` password POST:** **never DRF-throttled.** Bound only by gunicorn workers + DB latency + bcrypt cost. With shared XFF bug, this endpoint is the weakest link if you care about brute-force throttling.

## Risks worth flagging

1. **The raised quota does not actually protect against concurrent login storms** because the underlying throttle has a race that bursts walk through. The 30/min → 1000/min raise is fine for legitimate users hitting it serially, but it does not change the concurrent ceiling.
2. **Password sign-in is still un-throttled.** A botnet (or even a single fast client) can brute-force passwords against `/auth/sign-in/` at gunicorn-saturation speed. Recommend adding `AuthenticationThrottle` (or a stricter per-email throttle) to `SignInAuthEndpoint`.
3. **All internal users share one throttle bucket** because Django reads `REMOTE_ADDR` (Caddy's IP). The commit already calls this out as a known band-aid. Until `X-Forwarded-For` handling is fixed, the per-IP rate limit means "per Caddy", not "per real user".

## Artifacts

- Script: `plans/reports/load-test-login-rate-limit.py`
- Raw log: `plans/reports/load-test-login-rate-limit.log`

## Unresolved questions

- Should the throttle be made atomic (e.g., switch to Redis `INCR` + `EXPIRE`, or use `django-ratelimit` / `drf-extensions` token-bucket)? This is the real fix; raising the quota does not address it.
- Should `SignInAuthEndpoint` (password POST) be migrated to DRF `APIView` + `AuthenticationThrottle` so that the rate limit covers the actual login attempt and not just the email-check probe?
- Is the `X-Forwarded-For` work tracked anywhere? Without it, "1000/min per IP" effectively means "1000/min for the entire workspace".
