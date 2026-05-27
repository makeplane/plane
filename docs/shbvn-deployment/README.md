# Shinhan Workspace (SHWS) — Tài liệu triển khai

Tài liệu vòng đời (lifecycle) cho dự án triển khai **Shinhan Workspace (SHWS)** — hệ thống quản lý dự án nội bộ của Shinhan Bank Vietnam (SHBVN), được xây dựng trên nền tảng mã nguồn mở Plane.so.

## Phạm vi

- **PROD**: 2-node hybrid (App Docker + Data Native PostgreSQL trên RHEL 9.6 + EMC SAN)
- **TEST/UAT**: 1 VM all-in-one Docker
- **DR**: Cross-site PostgreSQL streaming replication
- **Air-gap**: Mọi cài đặt offline (bundle qua build station)
- **Quy mô**: 1000 user / 100 CCU / RPO 15p / RTO 1h

## Cấu trúc thư mục

| Thư mục                                    | Loại tài liệu                    | Audience                                  |
| ------------------------------------------ | -------------------------------- | ----------------------------------------- |
| [`01-system-design/`](./01-system-design/) | **TKHT** — Thiết kế Hệ thống     | Architect, security, auditor, stakeholder |
| [`02-installation/`](./02-installation/)   | **HDCĐ** — Hướng dẫn Cài đặt     | SRE, DevOps, người triển khai             |
| [`03-operations/`](./03-operations/)       | **HDVH** — Hướng dẫn Vận hành    | Oncall, DBA, ops team                     |
| [`04-testing/`](./04-testing/)             | **KHKT** — Kế hoạch Kiểm thử     | QA, performance team                      |
| [`05-change-log/`](./05-change-log/)       | ADR + lịch sử thay đổi           | Tất cả vai trò                            |
| [`assets/`](./assets/)                     | Diagram source (`.mmd`), exports | Tất cả vai trò                            |

## Quy ước

- **Ngôn ngữ:** Tiếng Việt cho nội dung, English cho tên file/lệnh/code
- **Kích thước file:** <800 dòng (modularize nếu vượt)
- **Tên file:** kebab-case, descriptive (LLM-friendly cho Grep/Glob)
- **Mọi quyết định kiến trúc** → ghi ADR vào [`05-change-log/decisions/`](./05-change-log/decisions/)

## Status icon

- ⬜ Chưa bắt đầu
- 🟡 Draft (đang viết)
- 🟠 Review (chờ duyệt)
- 🟢 Approved (đã duyệt)
- 🔵 Implemented (đã triển khai thực tế)

## Lifecycle flow

```
01 Design  →  02 Install  →  03 Operate  →  04 Validate  →  05 Track
   ↑                                                              │
   └──────────────── feedback loop ───────────────────────────────┘
```

## Cross-references

- Repo gốc: `/Volumes/Data/SHBVN/plane.so/` (SHBVN fork của Plane upstream)
- Reports tạm thời (research, scout): `plans/reports/`
- Plans triển khai (timeline): `plans/`
