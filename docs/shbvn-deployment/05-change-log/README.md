# 05 — Lịch sử & Quyết định

Tracking quyết định kiến trúc, lịch sử triển khai, sự cố.

## Danh sách tài liệu

| File / Folder                                      | Mục đích                                              | Status   |
| -------------------------------------------------- | ----------------------------------------------------- | -------- |
| [`decisions/`](./decisions/)                       | **ADR** — Architecture Decision Records               | 🟡       |
| [`deployment-history.md`](./deployment-history.md) | Log mỗi lần deploy (version, time, by whom, rollback) | 🟡 Draft |
| [`incident-log.md`](./incident-log.md)             | Log sự cố production (P1/P2) + root cause             | 🟡 Draft |

## Nguyên tắc

- **ADR là forever record** — Không xóa, không sửa nội dung quyết định đã chốt. Nếu đảo ngược → tạo ADR mới `superseded by`.
- **Deployment history** — append-only, mọi deploy phải log lại.
- **Incident log** — root cause analysis cho mọi P1/P2.

## ADR template

Mỗi ADR theo format Michael Nygard (kebab-case file):

```markdown
# ADR-NNN: Tiêu đề ngắn

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Deciders:** [Tên người duyệt]

## Context

Vấn đề / bối cảnh đặt ra quyết định.

## Decision

Quyết định cuối cùng, ngắn gọn.

## Alternatives considered

- Option A: ... (lý do loại)
- Option B: ... (lý do loại)
- Option C: ... (CHỌN)

## Consequences

- Positive: ...
- Negative: ...
- Risks: ...
```

## Liên kết

- Quyết định gốc: [`decisions/`](./decisions/)
- Tóm tắt trong overview: [`../01-system-design/00-overview.md`](../01-system-design/00-overview.md) § 7
