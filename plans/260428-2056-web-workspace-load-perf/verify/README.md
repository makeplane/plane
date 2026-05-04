# Verify scripts

Bộ script tự động kiểm tra hiệu quả từng phase.

## Files

| File | Verify Phase | Tool |
|------|-------------|------|
| `check-headers.sh` | 01 (compression + cache) | `curl -I` |
| `check-bundle.sh` | 02 (manualChunks), 03 (lazy deps) | shell + gzip |
| `run-lighthouse.sh` | tổng thể (LCP/FCP/TTI/perf score) | Lighthouse CLI |
| `measure-login-flow.mjs` | flow thật login → workspace | Playwright + CDP |
| `verify-all.sh` | chạy hết 4 cái + tổng hợp | wrapper |

Output → `results/` (mỗi lần chạy 1 file timestamp riêng → so sánh trước/sau dễ).

## Quy trình

### 1. Baseline (TRƯỚC khi sửa)

```bash
chmod +x *.sh
PLANE_USER=leduong12c@gmail.com PLANE_PASS='Shinhan@1' \
  ./verify-all.sh http://localhost shinhan-bank-vn
```

→ Lưu các file trong `results/` lại làm baseline.

### 2. Sau Phase 01 (compression + cache)

```bash
./check-headers.sh http://localhost
```

Kỳ vọng:
- ✅ `Content-Encoding: gzip|br|zstd` trên `/assets/*.js`
- ✅ `Cache-Control: ...immutable` + `max-age=31536000`
- ✅ Compression ratio ≥ 2.5×

### 3. Sau Phase 02 (manualChunks)

```bash
./check-bundle.sh
```

Kỳ vọng:
- ✅ Tồn tại các chunks: `react-vendor`, `mobx-vendor`, `dnd-vendor`, `charts-vendor`, `pdf-vendor`, `xlsx-vendor`
- ✅ Tổng JS gzip giảm so với baseline

### 4. Sau Phase 03 (lazy heavy deps)

```bash
./check-bundle.sh
```

Kỳ vọng:
- ✅ Entry chunk KHÔNG chứa `XLSX`, `@react-pdf`, `recharts`, `EmojiPicker`
- ✅ Initial JS download (Network tab) <800KB gzip

### 5. Tổng cuối

```bash
PLANE_USER=... PLANE_PASS=... ./verify-all.sh
```

So sánh `summary-{TS}.md` với baseline → đo % cải thiện thực tế.

## Yêu cầu môi trường

- Node 22+ (đã có trong repo)
- `npx` (đi kèm node)
- macOS/Linux shell (zsh/bash)
- Chromium cho playwright (cài tự động lần đầu)
- Stack đang chạy ở `BASE_URL` (default `http://localhost`)

## Troubleshoot

- Lighthouse timeout → thử `--throttling-method=provided`
- Playwright không tìm thấy login form → form selector đã đổi, cần update `measure-login-flow.mjs`
- Headers check báo `Content-Encoding: ` rỗng → request thiếu `Accept-Encoding` hoặc nginx chưa nén
