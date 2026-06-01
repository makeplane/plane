# Phase 07 — Kế hoạch Kiểm thử (KHKT)

## Context

- **Output location:** `docs/shbvn-deployment/04-testing/`
- **Depends on:** Phase 04 (TEST/UAT install) ≥ 🟠 Review (cần UAT đã sẵn để chạy test)
- **Plan:** [`./plan.md`](./plan.md)

## Overview

- **Priority:** P0 — không test = không go-live
- **Status:** 🟠 Review (4/4 — viết xong 2026-05-27)
- **Mô tả:** Kế hoạch test tải, security, UAT acceptance

## Key insights

- Tool: k6 (HTTP + WebSocket), chạy từ máy ngoài bank LAN
- Test gate trước go-live: load 100 CCU + stress 200 CCU + soak 4h + DR drill + backup restore
- UAT cần 20–30 user thật, không chỉ load test
- Security scan offline (Trivy + OWASP ZAP nếu bank cho phép)

## Todo list

- [x] `load-test-plan.md` — Mục tiêu, môi trường, metrics, target, gate, vai trò
- [x] `load-test-scenarios.md` — Workload mix, VU profiles (load/stress/soak), k6 pseudo-script
- [x] `security-test-plan.md` — Trivy/OWASP, auth, TLS, secret leak, audit (air-gap offline)
- [x] `uat-acceptance-criteria.md` — Test cases, pass/fail, defect severity, sign-off form

## Success criteria

### Performance targets (chi tiết trong design `09-capacity-planning.md`)

- API p95 < 500ms @ 100 CCU
- API p99 < 1500ms @ 100 CCU
- Error rate < 1%
- CPU < 70%, RAM < 80% sustained
- Không memory leak sau 4h soak
- Tìm được điểm gãy ở stress test 200+ CCU

### Security

- Không critical CVE trong image
- LDAP/SSO auth không bypass được
- Cookie + session secure flags đúng
- Admin panel chỉ accessible từ IP allowlist

### UAT

- 20+ user pilot đăng nhập + tạo project + tạo issue thành công
- Sign-off từ project owner + 5 power user

## Risk

| Risk                               | Mitigation                                                    |
| ---------------------------------- | ------------------------------------------------------------- |
| k6 script khác user thật           | Auth flow real, scenario thật, không chỉ GET /                |
| UAT data nhỏ → không phản ánh prod | Generate fake data ≥ DB target năm 1                          |
| Bank không cho chạy security scan  | Coordinate với security team, scan offline trên build station |

## Next steps

Sau Phase 07 pass → Go-live readiness review → Production deployment.
