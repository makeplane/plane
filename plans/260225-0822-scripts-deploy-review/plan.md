---
title: "Fix SHB Deployment Scripts"
description: "Fix 5 bugs in prepare-deploy-package.sh and deploy-shb.sh for Mac-to-Server deploy workflow"
status: completed
priority: P1
effort: 1h
branch: develop
tags: [scripts, deployment, docker, bugfix]
created: 2026-02-25
---

# Fix SHB Deployment Scripts

## Problem

Three shell scripts manage the SHB build-and-deploy pipeline (Mac build machine -> RHEL production server running plane-selfhost). `build-shb-images.sh` is correct; the other two have 5 bugs that break the deploy workflow.

## Scope

| Script                              | Status | Bugs                                                            |
| ----------------------------------- | ------ | --------------------------------------------------------------- |
| `scripts/build-shb-images.sh`       | OK     | 0                                                               |
| `scripts/prepare-deploy-package.sh` | Broken | 2 (wrong compose copy, missing plane-proxy)                     |
| `scripts/deploy-shb.sh`             | Broken | 3 (BASE_COMPOSE default, hardcoded migrator name, step counter) |

## Target Workflow

```
[Mac] build-shb-images.sh -> prepare-deploy-package.sh -> scp deploy/* -> [Server] deploy-shb.sh
```

Deploy package drops INTO server's existing `plane-app/` dir (which already has `docker-compose.yaml` + `plane.env`). No base compose shipped; only the SHB override + images + deploy script.

## Phases

| #   | Phase                                                                     | File                                | Status      |
| --- | ------------------------------------------------------------------------- | ----------------------------------- | ----------- |
| 1   | [Fix prepare-deploy-package.sh](./phase-01-fix-prepare-deploy-package.md) | `scripts/prepare-deploy-package.sh` | ✅ Complete |
| 2   | [Fix deploy-shb.sh](./phase-02-fix-deploy-shb.md)                         | `scripts/deploy-shb.sh`             | ✅ Complete |
| 3   | [Validate end-to-end](./phase-03-validate-end-to-end.md)                  | All 3 scripts                       | ✅ Complete |

## Key Dependencies

- Server must already have plane-selfhost installed (`docker-compose.yaml` + `plane.env`)
- Docker Compose v2.1+ on server (for `docker compose wait`)
- `build-shb-images.sh` must run before `prepare-deploy-package.sh`

## Risk

Low -- all changes are isolated to 2 shell scripts. No application code modified.

## Validation Log

### Session 1 — 2026-02-25

**Trigger:** Initial plan creation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Deploy package hiện tại thiết kế để SCP vào CÙNG directory với plane-selfhost (`plane-app/`). Nếu server path khác nhau mỗi lần, deploy-shb.sh có nên auto-detect vị trí `docker-compose.yaml` không?
   - Options: Giữ nguyên — SCP vào đúng dir | Thêm auto-detect | Thêm script wrapper
   - **Answer:** Giữ nguyên — SCP vào đúng dir, không cần detect
   - **Rationale:** KISS principle. User tự SCP vào đúng folder; no added complexity needed.

2. **[Assumptions]** Server pro đang dùng `docker-compose.yaml` (extension .yaml). Plan fix BASE_COMPOSE default thành .yaml. Nếu sau này server đổi sang .yml, script sẽ cần override thủ công. Đây có phải rủi ro cần xử lý không?
   - Options: Không cần lo — .yaml là chuẩn | Thêm auto-detect cả .yml và .yaml
   - **Answer:** Không cần lo — .yaml là chuẩn plane-selfhost, ít thay đổi
   - **Rationale:** plane-selfhost uses `.yaml` consistently; positional arg override covers edge case.

3. **[Tradeoff]** Plan xóa bỏ `docker inspect ... plane-migrator` và chỉ dựa vào `docker compose wait`. Bạn có cần giữ exit code number trong error log để debug không?
   - Options: Không cần — docker compose wait đủ | Giữ exit code dùng compose-aware method
   - **Answer:** Không cần — docker compose wait + logs migrator đủ để debug
   - **Rationale:** Simpler code, no hardcoded container names. `docker compose logs migrator` provides all debug info needed.

#### Confirmed Decisions

- Deploy package structure: No base compose shipped — confirmed
- BASE_COMPOSE default: `.yaml` (plane-selfhost standard) — confirmed
- Migrator check: Remove `docker inspect` block, rely on `docker compose wait` — confirmed

#### Action Items

- No plan changes required. All decisions align with current plan.

#### Impact on Phases

- No phase updates required — all validation answers confirm the plan as written.
