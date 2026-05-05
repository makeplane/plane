# GitNexus — Hướng dẫn cho Developer Plane

> Code intelligence dựa trên đồ thị (call graph) cho codebase 500k LOC. Tài liệu này dành cho dev mới khi onboarding.

---

## TL;DR

```bash
# Setup 1 lần (cần Docker chạy sẵn)
./scripts/gitnexus.sh pull              # tải image (~1.2GB)
./scripts/gitnexus.sh analyze           # index lần đầu (~2-3 phút)
./scripts/gitnexus.sh status            # verify "up-to-date"

# Sau đó: tự động re-index khi commit / pull / branch switch
```

MCP server (`./scripts/gitnexus.sh mcp`) đã được nối với Claude Code qua `.mcp.json` — không cần config thủ công.

---

## 1. GitNexus là gì? Vì sao dùng?

GitNexus là **knowledge graph** của toàn bộ codebase: nó đọc code → trích xuất symbols (function/class/method), call relationships, execution flows → lưu vào local DB → cho phép truy vấn ngữ nghĩa.

### Vì sao Plane cần?

| Vấn đề ở 500k LOC          | Cách cũ                          | Cách GitNexus                         |
| -------------------------- | -------------------------------- | ------------------------------------- |
| Tìm callers của 1 function | `grep -r` → noise + miss dynamic | `gitnexus_impact` chính xác           |
| Hiểu execution flow        | Đọc 10+ file                     | `gitnexus_query` → flow trả ranked    |
| Refactor an toàn           | Find/replace → vỡ runtime        | `gitnexus_rename` aware call graph    |
| Verify scope trước commit  | `git diff` thuần                 | `gitnexus_detect_changes` map symbols |

Quy tắc dự án (xem `CLAUDE.md`):

- **MUST** chạy `gitnexus_impact` trước khi sửa function/class.
- **MUST** chạy `gitnexus_detect_changes` trước commit để verify blast radius.

---

## 2. Yêu cầu

| Tool           | Version     | Ghi chú                                       |
| -------------- | ----------- | --------------------------------------------- |
| Docker Desktop | ≥ 24        | Phải chạy daemon trước khi chạy lệnh GitNexus |
| Disk space     | ~1.4 GB     | Image ~1.2GB + index ~150MB                   |
| RAM khi index  | ~2 GB peak  | Run idle = ~200MB                             |
| Architecture   | amd64/arm64 | Image multi-arch (Apple Silicon native OK)    |

**Tại sao Docker mà không phải `npx gitnexus`?**

- Project pin version `1.6.4-rc.63`. Trong khi `npm latest = 1.6.3` → khác bản team chuẩn hóa.
- Docker tránh native build issue cross-platform (tree-sitter, onnxruntime-node, ladybugdb).
- Docker tránh fail SSH-fetch dependency (`tree-sitter-dart` qua `git+ssh://`).
- Image tag pinned ⇒ index schema khớp giữa các máy team.

---

## 3. Setup lần đầu

### Bước 1 — Chắc chắn Docker đã chạy

```bash
docker info > /dev/null && echo "Docker OK" || echo "Start Docker Desktop trước"
```

### Bước 2 — Pull image

```bash
./scripts/gitnexus.sh pull
```

Mặc định: `akonlabs/gitnexus:1.6.4-rc.63` (~1.2GB). Override bằng env: `GITNEXUS_IMAGE=...`.

> ⚠️ **Pre-release notice:** Team đang pin **Release Candidate** (`rc.63`), không phải stable. Lý do: stable `1.6.3` không index được Django migrations và thiếu capability detection (FTS, vectorSearch). Khi `1.6.4` stable release → migrate. Theo dõi tại https://hub.docker.com/r/akonlabs/gitnexus/tags.

### Bước 3 — Index lần đầu

```bash
./scripts/gitnexus.sh analyze
```

Mất ~2-3 phút trên codebase Plane (~5500 files). Sẽ tạo:

- `.gitnexus/lbug` — graph DB (~150MB, gitignored)
- `.gitnexus/meta.json` — metadata (commit SHA, stats)
- Cập nhật block `<!-- gitnexus:start -->...<!-- gitnexus:end -->` trong `CLAUDE.md` & `AGENTS.md`

### Bước 4 — Verify

```bash
./scripts/gitnexus.sh status
# Mong đợi: "Status: ✅ up-to-date"

./scripts/gitnexus.sh list
# Mong đợi: "plane" hiện trong danh sách

# Sanity check: đúng version đang chạy
docker images akonlabs/gitnexus
# Mong đợi: cột TAG = 1.6.4-rc.63 (hoặc tag pin hiện tại của team)
```

### Bước 5 — Restart Claude Code session

MCP server đọc index khi khởi động. Restart để Claude thấy graph:

- VS Code: reload window
- Terminal: thoát & mở lại CLI

Test: hỏi Claude `"What does the issue_serializer function do?"` — nếu Claude dùng `gitnexus_context` tool ⇒ OK.

Hoặc verify từ shell:

```bash
claude mcp list
# Mong đợi: "gitnexus: ./scripts/gitnexus.sh mcp - ✓ Connected"
```

---

## 4. Cơ chế hoạt động

### 4.1 Bức tranh tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│  Developer working tree (.ts/.tsx/.py/.js)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ git commit / pull / checkout
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Husky hooks:                                               │
│    .husky/post-commit    → reindex-bg (sau commit)          │
│    .husky/post-merge     → reindex-bg (sau pull)            │
│    .husky/post-checkout  → reindex-bg (sau branch switch)   │
└────────────────────────┬────────────────────────────────────┘
                         │ background, non-blocking
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  scripts/gitnexus.sh reindex-bg                             │
│    docker run akonlabs/gitnexus:1.6.4-rc.63 analyze         │
│      → cập nhật .gitnexus/lbug + meta.json                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  .mcp.json → ./scripts/gitnexus.sh mcp                      │
│    Claude Code spawns container, talks via stdio MCP        │
│    Tools: impact, context, query, detect_changes, rename... │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Khi nào re-index tự động?

| Sự kiện                  | Hook                   | Điều kiện skip                                             |
| ------------------------ | ---------------------- | ---------------------------------------------------------- |
| `git commit` (success)   | `.husky/post-commit`   | Throttle: bỏ qua nếu vừa re-index < 60s trước              |
| `git pull` / `git merge` | `.husky/post-merge`    | Skip nếu không có file `.ts/.tsx/.py/.go/.rs/...` thay đổi |
| `git checkout <branch>`  | `.husky/post-checkout` | Skip nếu là file checkout (không phải branch switch)       |

Lý do dùng **post-commit** mà không pre-commit: pre-commit chậm → block dev. Post-commit chạy sau khi commit OK → background detached, không cản workflow.

Lý do **không** có `pre-push` re-index: push không thay đổi local code → graph đã được build từ commit. Re-index trước push là dư thừa.

### 4.3 Index lưu ở đâu?

```
plane.so/
├── .gitnexus/                  ← gitignored, local-only
│   ├── lbug                    ← LadybugDB (call graph)
│   ├── meta.json               ← stats, last commit, capabilities
│   └── .gitignore              ← chứa "*" → toàn bộ folder bỏ qua
└── ~/.gitnexus/registry.json   ← danh sách repos đã index trên máy bạn
```

**Quan trọng:**

- Index không bao giờ commit lên git.
- Mỗi dev có index riêng (build từ source local).
- Image Docker mount volume `gitnexus-data` cho cache shared (LadybugDB engine).

### 4.4 MCP integration

`.mcp.json` ở root project:

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "./scripts/gitnexus.sh",
      "args": ["mcp"]
    }
  }
}
```

Khi Claude Code khởi động, nó:

1. Đọc `.mcp.json`
2. Spawn `./scripts/gitnexus.sh mcp` → start Docker container chạy MCP server qua stdio
3. Container đọc `.gitnexus/lbug` từ host volume
4. Trả tools: `impact`, `context`, `query`, `cypher`, `detect_changes`, `rename`...

Container tồn tại trong suốt session Claude. Đóng Claude → container exit.

---

## 5. Workflow hàng ngày

### Trước khi sửa 1 function/class

```
Hỏi Claude: "What's the impact of changing X?"
→ Claude gọi gitnexus_impact → trả về callers, processes, risk level
→ Bạn xem trước rồi mới sửa
```

### Trước khi commit

```bash
# Verify scope thay đổi
# (Claude có thể tự gọi gitnexus_detect_changes khi review diff)
git add ...
git commit -m "feat(...): ..."
# post-commit hook → tự động re-index trong background
```

### Khi index báo stale

```bash
./scripts/gitnexus.sh analyze    # rebuild đồng bộ (block ~3 phút)
# Hoặc đợi auto re-index sau commit/pull tiếp theo
```

### Khi pull code mới từ team

```bash
git pull
# post-merge hook tự re-index nếu có code change → không cần làm gì
```

### Khi team bump version GitNexus (ví dụ rc.63 → rc.70)

Trigger: `scripts/gitnexus.sh` đổi tag image trong PR mới merge.

```bash
git pull                              # nhận tag mới trong scripts/gitnexus.sh
./scripts/gitnexus.sh pull            # tải image mới
./scripts/gitnexus.sh analyze         # rebuild index (schema có thể đổi giữa các RC)
# Restart Claude Code session để MCP container dùng image mới
```

> Vì sao phải re-analyze? RC mới có thể đổi DB schema (LadybugDB) hoặc capability flags → graph cũ có thể incompatible. Rebuild đảm bảo đồng bộ.

---

## 6. Cheat sheet lệnh

| Mục đích                      | Lệnh                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| Pull/update Docker image      | `./scripts/gitnexus.sh pull`                                       |
| Index đồng bộ (block)         | `./scripts/gitnexus.sh analyze`                                    |
| Index nền (non-block)         | `./scripts/gitnexus.sh reindex-bg`                                 |
| Status hiện tại               | `./scripts/gitnexus.sh status`                                     |
| Liệt kê tất cả repos đã index | `./scripts/gitnexus.sh list`                                       |
| Khởi động MCP server          | `./scripts/gitnexus.sh mcp` (Claude tự gọi)                        |
| Xem log re-index nền          | `tail -f /tmp/gitnexus-reindex-plane.so.log`                       |
| Xóa index để rebuild sạch     | `rm -rf .gitnexus/ && ./scripts/gitnexus.sh analyze`               |
| Override image tag            | `GITNEXUS_IMAGE=akonlabs/gitnexus:X.Y.Z ./scripts/gitnexus.sh ...` |

### Lệnh thường dùng từ Claude (qua MCP — không gõ tay)

| Tool MCP                  | Use case                              |
| ------------------------- | ------------------------------------- |
| `gitnexus_impact`         | "What breaks if I change X?"          |
| `gitnexus_context`        | "Show callers/callees of X"           |
| `gitnexus_query`          | "Find execution flows for concept Y"  |
| `gitnexus_detect_changes` | "Map my git diff to affected symbols" |
| `gitnexus_rename`         | "Rename X across call graph"          |
| `gitnexus_cypher`         | Truy vấn graph bằng Cypher (advanced) |

---

## 7. Troubleshooting

### `Cannot connect to the Docker daemon`

→ Docker Desktop chưa chạy. Mở Docker Desktop, đợi xanh icon, retry.

### `Status: ⚠️ stale`

→ Code thay đổi sau lần index cuối. Chạy `./scripts/gitnexus.sh analyze` hoặc trigger commit/pull để hook chạy.

### Re-index nền lock file `lbug`

```
Error: database is locked
```

→ Có process re-index khác đang chạy. Check:

```bash
ps aux | grep gitnexus | grep -v grep
```

Đợi xong hoặc kill process cũ, rồi retry.

### Claude không thấy GitNexus tools

1. Verify `.mcp.json` tồn tại ở root project.
2. Restart Claude Code session.
3. `/mcp` trong Claude → check `gitnexus` server status.
4. Nếu vẫn lỗi: `./scripts/gitnexus.sh mcp` chạy thủ công xem có lỗi stdio không.

### Image kéo về quá chậm

```bash
# Set Docker registry mirror (China/Vietnam):
# Docker Desktop → Settings → Docker Engine → thêm "registry-mirrors"
```

### Docker Hub rate limit (`toomanyrequests`)

```
Error response from daemon: toomanyrequests: You have reached your pull rate limit
```

→ Anonymous Docker Hub pull bị giới hạn 100/6h per IP. Login để nâng lên 200/6h:

```bash
docker login
# Sau đó retry: ./scripts/gitnexus.sh pull
```

### Index quá lớn (>500MB)

```bash
./scripts/gitnexus.sh analyze --max-file-size 256   # bỏ qua file >256KB
# Hoặc thêm vào .gitnexusignore:
echo "apps/space/dist/" >> .gitnexusignore
echo "*.min.js" >> .gitnexusignore
```

### Hooks không chạy

```bash
# Verify husky installed
ls -la .husky/_/
# Re-init nếu thiếu:
pnpm prepare
```

---

## 8. FAQ

### Có cần re-index khi chỉ sửa CSS/Markdown?

Không. `post-merge` hook chỉ trigger khi có file `.ts/.tsx/.js/.jsx/.mjs/.cjs/.py/.go/.rs/.java/.kt/.swift` thay đổi. CSS/MD/config bị skip.

### Re-index mỗi commit có chậm không?

Không block. Hook chạy `reindex-bg` → detached background. Throttle 60s tránh spam khi commit nhanh liên tiếp.

### Index có bao gồm code nhạy cảm không?

Có thể (full source được parse). **Không bao giờ commit `.gitnexus/` lên git** — đã có `.gitnexus/.gitignore` chứa `*`. Nếu cần exclude paths cụ thể, dùng `.gitnexusignore`.

### Có cần index trên CI không?

Không. CI không dùng MCP. Chỉ dev local cần GitNexus để Claude hỗ trợ.

### Khi nào graph có thể MISS một relationship?

- Django signals, Celery tasks → async edges thường không bắt được.
- React HOC sâu, MobX reactions, dynamic imports → indirect deps thiếu.
- Lookup theo string (registry pattern) → không thấy.
  → Quy tắc: với critical paths (auth, billing, permissions), **luôn cross-check** bằng `Read` + `grep`.

### Tôi có thể disable GitNexus tạm thời không?

```bash
# Skip hooks 1 lần:
git commit --no-verify

# Disable hoàn toàn: xóa hoặc rename .mcp.json
# Hoặc: rm -rf .gitnexus/ → tools sẽ báo "no index"
```

### Đồng nghiệp không cài GitNexus có ảnh hưởng tôi không?

Không. Index local-only, mỗi máy có riêng. Hooks tự skip nếu `.gitnexus/` không tồn tại.

---

## 9. Performance & Tuning

### Throttle re-index

`scripts/gitnexus.sh reindex-bg` skip nếu file `.gitnexus/meta.json` được sửa < 60s trước. Tránh chạy chồng khi commit/checkout liên tiếp.

### Loại trừ thêm paths

Tạo file `.gitnexusignore` ở root (file optional, không có sẵn trong repo). Cú pháp giống `.gitignore`:

```
apps/space/out/
apps/web/.next/
**/__pycache__/
*.bundle.js
```

Sau đó chạy `./scripts/gitnexus.sh analyze` để rebuild với exclusions mới.

### Tăng tốc analyze trên máy yếu

```bash
./scripts/gitnexus.sh analyze --max-file-size 256
GITNEXUS_NO_GITIGNORE=1 ./scripts/gitnexus.sh analyze   # bỏ qua .gitignore parsing
```

---

## 10. Phụ lục: Files liên quan

| File                                          | Vai trò                                    |
| --------------------------------------------- | ------------------------------------------ |
| `scripts/gitnexus.sh`                         | Wrapper Docker, các lệnh con               |
| `.husky/post-commit`                          | Auto re-index sau commit                   |
| `.husky/post-merge`                           | Auto re-index sau pull                     |
| `.husky/post-checkout`                        | Auto re-index sau branch switch            |
| `.mcp.json`                                   | Đăng ký MCP server với Claude Code         |
| `.gitnexus/`                                  | Local index (gitignored)                   |
| `.gitnexusignore`                             | Loại trừ paths khỏi index                  |
| `CLAUDE.md` (block `<!-- gitnexus:start -->`) | Auto-generated stats, hướng dẫn cho Claude |

---

## 11. Liên hệ & Tài liệu

- Skill files: `.claude/skills/gitnexus/*/SKILL.md`
- Upstream: https://github.com/abhigyanpatwari/GitNexus
- Báo bug team: ping Lead trong PR comment

> **Quy tắc vàng:** Trước khi sửa function/class lớn → hỏi Claude `"impact of X"` → đọc kết quả → sửa. Không skip bước này, đặc biệt với code chạm `core/` hoặc `apps/api/plane/db/`.
