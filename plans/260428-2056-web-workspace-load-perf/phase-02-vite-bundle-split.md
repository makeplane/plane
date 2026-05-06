# Phase 02: Vite manualChunks + bundle splitting

**Priority:** P0 (impact CAO) | **Status:** TODO

## Context Links

- Report §2: heavy deps đi chung 1-2 chunk lớn
- File: `apps/web/vite.config.ts`

## Overview

Vite mặc định gộp toàn bộ vendor vào `index-<hash>.js` (vài MB). Cần tách theo nhóm để cache tốt hơn + load song song.

## Key Insights

- React Router v7 build mode `react-router build` dùng Rollup bên trong → có thể truyền `build.rollupOptions.output.manualChunks`
- Tách chunk theo "nhóm dùng cùng nhau" (mobx core, dnd, charts, editor, pdf/xlsx) → khi 1 nhóm update, các nhóm khác vẫn cache
- Tránh tách quá nhỏ (waterfall HTTP request)

## Requirements

- Tách thành các chunk:
  - `react-vendor` (react, react-dom, react-router)
  - `mobx-vendor` (mobx, mobx-react, mobx-utils)
  - `dnd-vendor` (3 @atlaskit/pragmatic-drag-and-drop packages)
  - `charts-vendor` (recharts)
  - `editor-vendor` (@plane/editor)
  - `pdf-vendor` (@react-pdf/renderer, react-pdf-html)
  - `xlsx-vendor` (xlsx)
  - `utils-vendor` (lodash-es, date-fns, axios, swr)
- Verify bundle size bằng `vite-bundle-visualizer`

## Related Code Files

**Modify:**
- `apps/web/vite.config.ts`

**Add (devDependency):**
- `vite-bundle-visualizer` (root dev dep, optional)

## Implementation Steps

### Step 1 — Update `apps/web/vite.config.ts`

```ts
import path from "node:path";
import * as dotenv from "@dotenvx/dotenvx";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

export default defineConfig(() => ({
  define: { "process.env": JSON.stringify(viteEnv) },
  build: {
    assetsInlineLimit: 4096,
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (/[\\/]node_modules[\\/](react|react-dom|react-router|@react-router)[\\/]/.test(id)) return "react-vendor";
          if (/[\\/]node_modules[\\/](mobx|mobx-react|mobx-utils)[\\/]/.test(id)) return "mobx-vendor";
          if (/[\\/]node_modules[\\/]@atlaskit[\\/]pragmatic-drag-and-drop/.test(id)) return "dnd-vendor";
          if (/[\\/]node_modules[\\/](recharts|d3-)/.test(id)) return "charts-vendor";
          if (/[\\/]node_modules[\\/](@react-pdf|react-pdf-html)[\\/]/.test(id)) return "pdf-vendor";
          if (/[\\/]node_modules[\\/]xlsx[\\/]/.test(id)) return "xlsx-vendor";
          if (/[\\/]node_modules[\\/]emoji-picker-react[\\/]/.test(id)) return "emoji-vendor";
          if (/[\\/]node_modules[\\/]react-grid-layout[\\/]/.test(id)) return "grid-vendor";
          if (/[\\/]node_modules[\\/](lodash-es|date-fns|axios|swr|uuid)[\\/]/.test(id)) return "utils-vendor";
          if (/[\\/]node_modules[\\/]@plane[\\/]editor/.test(id)) return "editor-vendor";

          return "vendor";
        },
      },
    },
  },
  plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
      "next/script": path.resolve(__dirname, "app/compat/next/script.tsx"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
  },
  server: { /* unchanged */ },
}));
```

### Step 2 — Visualize bundle

```bash
cd apps/web
npx vite-bundle-visualizer -t treemap
# kiểm tra chunk size, phát hiện chunk >500KB
```

### Step 3 — Tinh chỉnh

- Nếu thấy chunk vendor "default" vẫn lớn → identify thêm package, thêm rule
- Nếu thấy chunk nhỏ <30KB nhiều → gộp lại để giảm request

### Step 4 — Build + smoke test

```bash
pnpm --filter web build
# kiểm tra apps/web/build/client/assets/ size
# chạy preview rồi mở browser, kiểm tra Network tab
pnpm --filter web preview
```

## Todo List

- [ ] Update `vite.config.ts` với `manualChunks`
- [ ] Đổi `assetsInlineLimit: 0` → `4096` (inline asset nhỏ <4KB)
- [ ] Build + verify chunks (treemap)
- [ ] Test login flow → workspace, kiểm tra parallel chunk loading
- [ ] So sánh size trước/sau, ghi vào báo cáo

## Success Criteria

- Main entry chunk <300KB gzip
- Tổng initial JS download <1.2MB gzip
- Vendor chunk hash ổn định khi sửa app code (cache hit cao cho repeat visits)

## Risks

- Sai regex → chunk sai → tăng waterfall: mitigate bằng visualizer
- React Router v7 SSR/streaming mode có thể conflict: SPA mode không vấn đề, dự án này không SSR
- Tăng số request HTTP nhỏ → bù lại bằng HTTP/2 multiplexing (caddy hỗ trợ)

## Security

- Không thay đổi auth/permission/behavior

## Next

→ Phase 03 (lazy heavy deps)
