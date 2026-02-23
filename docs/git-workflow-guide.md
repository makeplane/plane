# Git Workflow Guide — Shinhan Plane

> Hướng dẫn quy trình làm việc với Git cho Developer & Operator

---

## Branch Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    BRANCH STRUCTURE                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   preview (Production)                                  │
│   ════════════════════                                  │
│     ▲                                                   │
│     │  Pull Request (merge khi release)                 │
│     │                                                   │
│   develop (Development)                                 │
│   ═════════════════════                                 │
│     ▲         ▲         ▲                               │
│     │         │         │                               │
│   feat/     fix/      chore/                            │
│   xxx       xxx       xxx                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| Branch    | Mục đích                           | Ai merge?                           |
| --------- | ---------------------------------- | ----------------------------------- |
| `preview` | Production — code ổn định, đã test | Lead / Manager                      |
| `develop` | Development — tích hợp feature mới | Developer                           |
| `feat/*`  | Feature mới                        | Developer (tạo & merge vào develop) |
| `fix/*`   | Sửa bug                            | Developer                           |
| `chore/*` | Config, docs, refactor             | Developer                           |

---

## Quy trình hàng ngày (Developer)

### Bước 1 — Bắt đầu task mới

```bash
# 1. Cập nhật develop mới nhất
git checkout develop
git pull origin develop

# 2. Tạo branch mới từ develop
git checkout -b feat/ten-tinh-nang
```

> **Quy tắc đặt tên branch:**
>
> - `feat/login-page` — tính năng mới
> - `fix/broken-sidebar` — sửa bug
> - `chore/update-deps` — công việc kỹ thuật

### Bước 2 — Code & Commit

```bash
# Xem thay đổi
git status
git diff

# Stage & commit
git add file1.ts file2.ts
git commit -m "feat(auth): implement login form validation"
```

> **Quy tắc commit message:**
>
> ```
> type(scope): mô tả ngắn gọn
> ```
>
> | Type       | Khi nào dùng     | Ví dụ                                   |
> | ---------- | ---------------- | --------------------------------------- |
> | `feat`     | Tính năng mới    | `feat(auth): add OAuth login`           |
> | `fix`      | Sửa bug          | `fix(sidebar): resolve scroll issue`    |
> | `perf`     | Tối ưu hiệu năng | `perf(api): optimize query N+1`         |
> | `refactor` | Tái cấu trúc     | `refactor(store): simplify state logic` |
> | `chore`    | Config, deps     | `chore(deps): upgrade react to v18.3`   |
> | `docs`     | Tài liệu         | `docs: update API reference`            |

### Bước 3 — Push & tạo Pull Request

```bash
# Push branch lên remote
git push -u origin feat/ten-tinh-nang
```

Sau đó tạo PR trên GitHub hoặc dùng CLI:

```bash
gh pr create --base develop --title "feat(auth): implement login form"
```

### Bước 4 — Review & Merge vào develop

```
┌──────────┐     PR      ┌──────────┐    Review    ┌──────────┐
│  Push    │ ──────────▶ │  GitHub  │ ──────────▶  │  Merge   │
│  branch  │             │  PR page │    ✅ OK      │  vào     │
│          │             │          │              │  develop  │
└──────────┘             └──────────┘              └──────────┘
```

- Tối thiểu **1 reviewer** approve
- CI/CD checks phải pass
- Không có conflict

### Bước 5 — Dọn dẹp sau merge

```bash
# Quay về develop & cập nhật
git checkout develop
git pull origin develop

# Xóa branch cũ (đã merge)
git branch -d feat/ten-tinh-nang
```

---

## Quy trình Release (Lead / Manager)

### Merge develop → preview (Production)

```
  develop                          preview
  ═══════                          ═══════
     │                                │
     │  ① Tạo PR                      │
     │──────────────────────────────▶ │
     │                                │
     │  ② Review + Approve            │
     │                                │
     │  ③ Merge PR                    │
     │──────────────────────────────▶ │ ← Production updated
     │                                │
```

```bash
# Tạo PR merge develop → preview
gh pr create --base preview --head develop \
  --title "release: merge develop into preview" \
  --body "## Changes
- Feature A
- Fix B
- Improvement C"
```

**Checklist trước khi merge:**

- [ ] Tất cả test pass trên develop
- [ ] Code review hoàn tất
- [ ] Không có conflict với preview
- [ ] Đã test trên staging/dev environment

---

## Xử lý tình huống thường gặp

### 1. Conflict khi merge PR

```bash
# Cập nhật develop vào branch của bạn
git checkout feat/ten-tinh-nang
git merge develop

# Giải quyết conflict trong editor
# Sau khi resolve xong:
git add .
git commit -m "merge: resolve conflicts with develop"
git push
```

### 2. Cần cập nhật develop mới nhất vào branch đang làm

```bash
git checkout feat/ten-tinh-nang
git merge develop
# hoặc
git rebase develop  # (nếu chưa push)
```

### 3. Lỡ commit nhầm branch

```bash
# Undo commit cuối (giữ nguyên code)
git reset --soft HEAD~1

# Switch sang branch đúng
git checkout -b feat/branch-dung
git commit -m "feat: message"
```

### 4. Hotfix khẩn cấp trên production

```bash
# Tạo hotfix từ preview
git checkout preview
git pull origin preview
git checkout -b fix/critical-bug

# Fix → commit → push
git push -u origin fix/critical-bug

# Tạo PR trực tiếp vào preview
gh pr create --base preview --title "fix: critical bug in production"

# SAU KHI merge: đồng bộ ngược vào develop
git checkout develop
git merge preview
git push origin develop
```

```
  preview ◀── fix/critical-bug (PR trực tiếp)
     │
     ▼
  develop ◀── merge preview (đồng bộ ngược)
```

---

## Các lệnh Git hay dùng

| Tình huống               | Lệnh                    |
| ------------------------ | ----------------------- |
| Xem branch hiện tại      | `git branch`            |
| Xem tất cả branch        | `git branch -a`         |
| Xem lịch sử commit       | `git log --oneline -10` |
| Xem thay đổi chưa commit | `git diff`              |
| Lưu tạm thay đổi         | `git stash`             |
| Lấy lại thay đổi đã lưu  | `git stash pop`         |
| Xem PR đang mở           | `gh pr list`            |
| Xem status PR            | `gh pr status`          |

---

## Quy tắc bắt buộc

| #   | Quy tắc                                               | Lý do                               |
| --- | ----------------------------------------------------- | ----------------------------------- |
| 1   | **KHÔNG push trực tiếp vào `preview`**                | Branch production, chỉ merge qua PR |
| 2   | **KHÔNG push trực tiếp vào `develop`**                | Phải qua PR để có review            |
| 3   | **KHÔNG commit file `.env`, API key, credentials**    | Bảo mật                             |
| 4   | **KHÔNG dùng `--force` push** (trừ khi Lead cho phép) | Tránh mất code của người khác       |
| 5   | **LUÔN pull trước khi bắt đầu làm**                   | Tránh conflict                      |
| 6   | **Commit message phải theo format**                   | Lịch sử rõ ràng                     |
| 7   | **1 PR = 1 feature/fix**                              | Dễ review, dễ revert                |

---

## Tổng quan luồng hoạt động

```
Developer A          Developer B          Lead/Manager
    │                    │                     │
    ├─ feat/login        ├─ fix/sidebar        │
    │                    │                     │
    ├─ PR → develop ───▶ │                     │
    │                    ├─ PR → develop ─────▶│
    │                    │                     │
    │                    │              Review & Approve
    │                    │                     │
    │                    │       develop ◀──── Merged
    │                    │                     │
    │                    │              ┌──────┴──────┐
    │                    │              │  Test on    │
    │                    │              │  Staging    │
    │                    │              └──────┬──────┘
    │                    │                     │
    │                    │              PR: develop → preview
    │                    │                     │
    │                    │              preview ◀── Merged
    │                    │              (Production Updated)
```

---

_Cập nhật: 2026-02-23 | Repo: github.com/shbvn/plane_
