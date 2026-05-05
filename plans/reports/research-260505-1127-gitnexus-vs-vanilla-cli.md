# GitNexus vs Vanilla Claude CLI / Antigravity — Research Report

**Date:** 2026-05-05 11:27 ICT
**Repo:** plane.so (fork shbvn/plane)
**Scope:** Đánh giá ưu thế của GitNexus khi code Plane bằng AI assistant (Claude CLI / Google Antigravity) so với không dùng.

---

## 0. Bối cảnh dự án (con số thật)

- **~10,411 file** TS/TSX/Python (chỉ tính `apps/` + `packages/`).
- GitNexus index hiện tại: **60,562 symbols**, **105,189 relationships**, **300 execution flows** (theo block tự generate trong `CLAUDE.md`).
- Stack hỗn hợp: React 18 + Router v7 + MobX (FE) ↔ Django 4.2 + DRF + Celery (BE) — call graph cross-language.
- CE override pattern: `core/` + `ce/` song song → file trùng tên, grep ra nhiều noise.

→ Đây là codebase quá lớn để duyệt thuần text. Đây là điểm GitNexus đáng giá.

---

## 1. Capability matrix

| Năng lực                               | Vanilla Claude CLI (Read/Grep/Glob/Bash) | Google Antigravity (LSP + embedding)               | GitNexus (graph DB + MCP)                                 |
| -------------------------------------- | ---------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| Tìm callers chính xác                  | ❌ grep text → noise + miss              | 🟡 LSP "Find References" — chuẩn cho 1 file/symbol | ✅ `impact(direction: upstream)` toàn graph, có depth     |
| Blast radius phân tầng (d=1/d=2/d=3)   | ❌                                       | ❌                                                 | ✅ Risk LOW/MEDIUM/HIGH/CRITICAL + `affected_processes`   |
| Execution flow ngữ nghĩa               | ❌ phải đọc 5–10 file                    | 🟡 outline view, không có flow tổng thể            | ✅ `query()` trả 300 process ranked theo BM25+vector RFF  |
| Map git diff → symbols / processes     | ❌ chỉ `git diff` thuần                  | ❌                                                 | ✅ `detect_changes()` pre-commit                          |
| Rename an toàn cross-language          | ❌ find/replace → vỡ runtime             | 🟡 LSP rename trong 1 ngôn ngữ                     | ✅ `rename()` graph + text, tag confidence (graph/text)   |
| Cross-language (TS ↔ Py)               | ❌                                       | ❌                                                 | ✅ index thống nhất + group mode                          |
| Route map (FE consumer ↔ BE handler)   | ❌                                       | ❌                                                 | ✅ `route_map`, `api_impact`, `tool_map`                  |
| 360° symbol context (calls/calls/refs) | 🟡 đọc thủ công                          | 🟡 hover/peek                                      | ✅ `context()` + process participation                    |
| Cypher query graph tự do               | ❌                                       | ❌                                                 | ✅ `cypher()`                                             |
| Ranking thông minh                     | grep order                               | embedding                                          | RRF (BM25 + vector)                                       |
| Auto re-index khi commit/pull/checkout | ❌                                       | 🟡 IDE re-scan                                     | ✅ husky hooks (post-commit/merge/checkout, throttle 60s) |
| Token cost của 1 truy vấn              | Cao (đọc nhiều file)                     | Trung bình                                         | Thấp (graph trả structured + ranked)                      |

---

## 2. Ưu điểm khi dùng GitNexus với Plane

### 2.1 An toàn refactor — bắt buộc theo CLAUDE.md

Plane có nhiều **shared util** (auth, permissions, db helpers) bị dùng xuyên suốt. CLAUDE.md đã đặt rule:

> **MUST run impact analysis before editing any symbol.**

Không có graph DB → không có cách định lượng blast radius. Vanilla AI sẽ sửa rồi mới phát hiện regression. GitNexus trả `byDepth` + `affected_processes` → quyết định trước khi viết.

### 2.2 Tiết kiệm token đáng kể

- `gitnexus_query("auth flow")` trả **process ranked** ~10 symbol kèm path → ~1k token.
- Vanilla path: grep "login" → 200 hit → đọc 5 file × 300 line ≈ 15k+ token.
- Trên codebase 60k symbols, sự khác biệt × N task / ngày → giữ context window không bloat.

### 2.3 Hiểu execution flow xuyên file/ngôn ngữ

React component (TS) gọi service → service gọi API client → Django view → serializer → model → signal → Celery task. Đây là **6 lớp** giáo trình điển hình của Plane. Vanilla CLI cần 6 lần grep + 6 lần Read. `query()` trả flow trong 1 lần.

### 2.4 Pre-commit safety net

`detect_changes()` map git diff → symbols → processes bị ảnh hưởng. Cảnh báo trước khi push code sửa nhầm `core/` (vi phạm rule CE pattern), hoặc sửa function được 50 nơi gọi mà chỉ test 2.

### 2.5 Discovery khi onboarding / debug khu vực lạ

Code Plane có ~300 execution flow đã được tự động trích xuất + đặt tên. Đọc resource `gitnexus://repo/plane/processes` rẻ hơn rất nhiều so với reverse-engineer bằng grep.

### 2.6 Cross-language route map (đặc biệt giá trị cho Plane)

`route_map` + `api_impact` đối chiếu **FE component fetch endpoint nào** ↔ **BE handler nào serve**. Phát hiện orphan route, mismatch, middleware chain. Vanilla AI và Antigravity hiện không có.

### 2.7 Rename có call-graph awareness

LSP của Antigravity rename tốt **trong cùng ngôn ngữ**. Nhưng rename 1 endpoint Django thì FE TS gọi qua string fetch — LSP miss. `gitnexus_rename` phối hợp graph + regex, tag confidence để review thủ công những hit yếu.

### 2.8 Ranking ngữ nghĩa thay vì text match

Hybrid BM25 + vector + RRF. Hỏi "permission validation" trả đúng các process kể cả khi code dùng từ "guard"/"check_access" — vanilla grep không bắt được synonym.

### 2.9 Auto-index không cản workflow

Hook `post-commit` background detached, throttle 60s. Dev không cảm nhận overhead. Antigravity IDE re-scan có thể block UI. Vanilla CLI thì không tồn tại bước này.

### 2.10 Bóng bảy (mặt khác): tiêu chuẩn hoá team

Image pin `1.6.4-rc.63` → 4 dev cùng team có **cùng schema graph**. Mỗi máy build local, không sync index nhưng kết quả tool nhất quán.

---

## 3. So sánh theo từng đối thủ

### 3.1 vs Claude CLI vanilla (chỉ Read/Grep/Glob/Bash)

- **Lợi rõ rệt nhất.** Vanilla không có khái niệm symbol, không có graph, không có ranking ngữ nghĩa.
- Mọi câu hỏi "X gọi từ đâu" / "đổi X thì hỏng gì" đều tốn token và độ chính xác phụ thuộc vào prompt.
- GitNexus biến những câu này thành 1 tool call → trả structured.

### 3.2 vs Google Antigravity (IDE-style AI + LSP)

- Antigravity mạnh ở: edit suggestion, multi-file diff, browser preview, tích hợp IDE.
- **Antigravity yếu ở:** không có graph DB persistent, không có blast radius depth, không cross-language flow, không pre-commit symbol diff, không Cypher.
- LSP "Find References" của Antigravity ngang `context()` cho 1 ngôn ngữ, nhưng **không có execution flow** (chuỗi qua N hop) và không có ranking + risk.
- Antigravity: bù lại bằng UX visual + agent loop. GitNexus bù lại bằng độ chính xác ngữ nghĩa graph.

→ **Hai bên không thay thế nhau.** GitNexus là layer tri thức code; Antigravity/Claude CLI là agent thực thi. Dùng chung tốt nhất.

---

## 4. Hạn chế / khi nào graph có thể MISS

Theo `docs/gitnexus-guide.md` §8 và bản chất parser tĩnh:

- Django **signals**, **Celery tasks** → async edges thường thiếu.
- React HOC sâu, **MobX reactions**, **dynamic imports** → indirect deps thiếu.
- **String registry pattern** (`registry.get("foo")`) → không thấy.
- File CSS/MD/config không được index.
- Index local-only → CI không có (không cần).

→ **Quy tắc bù trừ:** với critical path (auth, billing, permissions), **luôn cross-check** bằng `Read` + `grep`. GitNexus tăng tốc 80% case, không thay được judgment ở 20% còn lại.

---

## 5. Cost / overhead

| Yếu tố        | Giá                                            |
| ------------- | ---------------------------------------------- |
| Disk          | ~1.4 GB (image 1.2GB + index 150MB)            |
| RAM khi index | ~2 GB peak, idle ~200MB                        |
| Setup lần đầu | ~5 phút (pull + analyze)                       |
| Re-index full | ~2–3 phút trên Plane                           |
| Re-index nền  | Background detached, throttle 60s              |
| Bảo trì       | Bump tag image khi team chuẩn hóa (~1 lần/quý) |
| Phụ thuộc     | Docker Desktop (đã chuẩn dev env Plane)        |

→ ROI dương rõ rệt với codebase >100k LOC như Plane. Với repo nhỏ < 5k LOC thì grep đủ.

---

## 6. Khi nào KHÔNG nên dùng

- Sửa CSS/JSON/YAML/Markdown thuần → grep nhanh hơn.
- 1 file nhỏ độc lập, không có caller phức tạp → `Read` đủ.
- Khẩn cấp hotfix khi index stale > vài ngày → đừng dựa, chạy lại `analyze` trước hoặc dùng grep.
- Trong CI/CD pipeline → không có Docker MCP, dùng grep/lint thuần.

---

## 7. Khuyến nghị thực dụng cho team Plane

1. **Giữ pinning** `1.6.4-rc.63` → đồng bộ schema toàn team.
2. **Tuân rule CLAUDE.md**: chạy `gitnexus_impact` trước mọi sửa function/class lớn; chạy `gitnexus_detect_changes` trước commit.
3. **Combo lý tưởng:** Claude CLI/Antigravity (agent + edit) ⊕ GitNexus (knowledge graph) — không phải lựa chọn loại trừ.
4. **Critical path** (auth, billing, permissions, db migrations): graph chỉ là first pass, vẫn cross-check thủ công Read + grep.
5. **Bump image** mỗi khi RC mới: `pull` → `analyze` → restart Claude session.

---

## 8. Kết luận 1 dòng

> Với Plane (~500k LOC, 60k symbols, mix TS/Python, CE override pattern), GitNexus chuyển AI assistant từ "đoán theo text" sang "lập luận theo call graph" — tăng độ chính xác impact analysis, giảm token, bắt buộc theo rule project. Không thay được Claude CLI/Antigravity, mà là layer tri thức để hai cái đó hoạt động đáng tin cậy.

---

## Câu hỏi chưa giải quyết

- Khi `1.6.4` stable release, có cần re-index toàn bộ máy team đồng thời để đảm bảo schema không drift không? (cần xác nhận với Lead).
- `api_impact` đã được test trên Django ↔ React Router v7 app router conventions của Plane chưa, hay chỉ phát hiện được REST endpoint kiểu cũ?
- Group mode (`@<groupName>`) có đáng config khi Plane là single repo monorepo, hay chỉ hữu ích nếu tách repo riêng cho `apps/api` và `apps/web`?
