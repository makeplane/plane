# Phase 01: Nén + cache-control nginx/caddy

**Priority:** P0 (impact CAO, effort XS) | **Status:** TODO

## Context Links

- Report: [`../reports/researcher-260428-2056-web-load-analysis.md`](../reports/researcher-260428-2056-web-load-analysis.md) §1
- Files: `apps/web/nginx/nginx.conf`, `apps/proxy/Caddyfile.ce`, `apps/proxy/Caddyfile.dev`, `apps/proxy/Caddyfile.aio.ce`

## Overview

Nginx hiện tại không bật gzip, không có `Cache-Control` cho assets hashed → mỗi reload tải lại bundle MB raw. Caddy proxy cũng chưa bật `encode`. Đây là quick-win lớn nhất.

## Key Insights

- Vite output `build/client/assets/*.js` đều có hash → có thể set `immutable` 1 năm an toàn
- `index.html` phải `no-cache` để bắt update
- nginx alpine 1.27 chưa có brotli built-in → dùng gzip; brotli (nếu có) đẩy lên caddy
- Caddy có sẵn `encode zstd gzip` directive

## Requirements

### Functional
- Bật gzip ở nginx cho `text/*`, `application/javascript`, `application/json`, `image/svg+xml`
- Set `Cache-Control: public, max-age=31536000, immutable` cho `/assets/`
- Set `Cache-Control: no-cache` cho `index.html`
- Bật `encode zstd gzip` trong Caddyfile

### Non-functional
- Không thay đổi runtime behavior, không downtime
- Không thay đổi cấu trúc file

## Architecture

```
browser → caddy (encode zstd gzip) → nginx (gzip + cache-control) → static files
```

## Related Code Files

**Modify:**
- `apps/web/nginx/nginx.conf` (35 lines hiện tại)
- `apps/proxy/Caddyfile.ce`
- `apps/proxy/Caddyfile.dev`
- `apps/proxy/Caddyfile.aio.ce`

**Reference (no change):**
- `apps/web/Dockerfile.web` (nginx:1.27-alpine)

## Implementation Steps

### Step 1 — Update `apps/web/nginx/nginx.conf`

```nginx
worker_processes 4;

events {
  worker_connections 1024;
}

http {
  include mime.types;
  default_type application/octet-stream;

  # Gzip
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_comp_level 6;
  gzip_types
    text/plain text/css text/javascript text/xml
    application/javascript application/json application/xml
    application/xml+rss application/wasm
    image/svg+xml font/woff font/woff2;

  set_real_ip_from        0.0.0.0/0;
  real_ip_recursive       on;
  real_ip_header          X-Forwarded-For;
  limit_req_zone          $binary_remote_addr zone=mylimit:10m rate=10r/s;

  access_log /dev/stdout;
  error_log /dev/stderr;

  server {
    listen 3000;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Hashed assets — long cache
    location /assets/ {
      root /usr/share/nginx/html;
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
      access_log off;
      try_files $uri =404;
    }

    # Fonts
    location ~* \.(woff2?|ttf|otf|eot)$ {
      root /usr/share/nginx/html;
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
      access_log off;
    }

    # SPA fallback
    location / {
      root /usr/share/nginx/html;
      index index.html;
      try_files $uri $uri/ /index.html;

      # index.html no-cache
      location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
      }
    }
  }
}
```

### Step 2 — Update `apps/proxy/Caddyfile.ce` (and dev/aio variants)

Thêm `encode` directive ở mỗi site block hoặc snippet `plane_proxy`:

```caddyfile
(plane_proxy) {
  encode zstd gzip

  request_body {
    max_size {$FILE_SIZE_LIMIT}
  }

  # Header cho static asset paths đi qua proxy (nếu có)
  @static path /assets/* /fonts/*
  header @static Cache-Control "public, max-age=31536000, immutable"

  # ... existing reverse_proxy directives ...
}
```

### Step 3 — Rebuild + restart

```bash
docker compose -f docker-compose-local.yml build web proxy
docker compose -f docker-compose-local.yml up -d web proxy
```

### Step 4 — Verify

```bash
# Verify gzip
curl -H 'Accept-Encoding: gzip' -I http://localhost/assets/<hashed-bundle>.js
# expect: Content-Encoding: gzip, Cache-Control: ...immutable

# Verify zstd via caddy (browser)
# DevTools → Network → Response Headers: Content-Encoding: zstd
```

## Todo List

- [ ] Update `apps/web/nginx/nginx.conf` (gzip + cache headers)
- [ ] Update `apps/proxy/Caddyfile.ce` (encode + static cache header)
- [ ] Update `apps/proxy/Caddyfile.dev`
- [ ] Update `apps/proxy/Caddyfile.aio.ce`
- [ ] Rebuild docker images web + proxy
- [ ] Verify response headers via curl
- [ ] Lighthouse before/after

## Success Criteria

- Bundle JS chính transfer giảm ≥60% (gzip ratio ~3:1, brotli/zstd ~4:1)
- Reload thứ 2 trở đi: `Cache-Control: immutable` → 0 byte transfer cho assets/

## Risks

- nginx config sai cú pháp → service không start → mitigate bằng `nginx -t` trước khi deploy (đã có healthcheck Dockerfile)
- Caddy `encode` có thể conflict với `reverse_proxy` body modifications → kiểm tra log

## Security

- Không thay đổi auth/permission
- Cache headers không ảnh hưởng tài nguyên động (`/api/*` đi qua reverse_proxy)

## Next

→ Phase 02 (Vite manualChunks)
