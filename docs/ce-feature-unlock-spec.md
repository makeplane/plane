# Spec: Unlock tính năng Community Edition

> **Mục tiêu:** Mở khóa các tính năng premium có sẵn code trong bản CE mà vẫn giữ khả năng pull update từ upstream Plane.

## 1. Kiến trúc hiện tại

### Path alias

```
// apps/web/tsconfig.json
"@/plane-web/*": ["./ce/*"]
```

Toàn bộ code premium được import qua `@/plane-web/...` → resolve về `apps/web/ce/` → trả về stub `<></>` hoặc upgrade banner.

### Build toolchain

- **Vite** + `vite-tsconfig-paths` plugin đọc paths từ `tsconfig.json`
- **React Router** (không phải Next.js)
- TypeScript paths hỗ trợ mảng fallback: `["./path-1/*", "./path-2/*"]`

### Mô hình CE stub

```
apps/web/
├── ce/           ← Community Edition stubs (upstream)
├── core/         ← Shared core code (upstream)
├── app/          ← Route pages (upstream)
└── ee-local/     ← [MỚI] Local overrides
```

### Backend

Backend **KHÔNG** enforce bất kỳ edition check nào. Tất cả API endpoint hoạt động cho mọi edition. Kiểm tra đã xác nhận:

- `IssueRelationViewSet` — CRUD đầy đủ
- `CycleViewSet` — bao gồm transfer issues
- `EstimatePointEndpoint`, `BulkEstimatePointEndpoint`
- `PageViewSet`, `PageVersionEndpoint`
- `ProjectPublishEndpoint` (deploy boards)
- `KeycloakOauthInitiateEndpoint` + `KeycloakCallbackEndpoint`

---

## 2. Chiến lược kỹ thuật: Sparse overlay

### Nguyên tắc

1. **Không sửa file trong `ce/`** — giữ nguyên upstream, tránh merge conflict
2. **Tạo thư mục `ee-local/`** — chỉ chứa file override cho tính năng cần unlock
3. **Một thay đổi duy nhất trong upstream**: sửa tsconfig paths để thêm fallback
4. **Re-export từ CE** khi chỉ cần override một phần barrel export

### Thay đổi tsconfig

```diff
// apps/web/tsconfig.json
- "@/plane-web/*": ["./ce/*"]
+ "@/plane-web/*": ["./ee-local/*", "./ce/*"]
```

Khi `ee-local/components/active-cycles/index.ts` tồn tại → resolve về đó.
Khi không tồn tại → fallback về `ce/` như bình thường.

### Quy tắc overlay

| Quy tắc                                    | Mô tả                                                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| **Chỉ override file cần thiết**            | Không copy toàn bộ CE tree                                                   |
| **Giữ nguyên interface**                   | Export cùng tên, cùng props type với CE stub                                 |
| **Re-export CE cho phần không đổi**        | `export * from "../../ce/components/xxx"` rồi override symbol cụ thể         |
| **Không sửa app import sites**             | Giữ nguyên `@/plane-web/...` pattern                                         |
| **TypeScript là interface drift detector** | Sau mỗi upstream pull, chạy `pnpm check:types` để phát hiện breaking changes |

### Merge conflict profile

| File                     | Conflict risk                                               |
| ------------------------ | ----------------------------------------------------------- |
| `apps/web/tsconfig.json` | **Rất thấp** — 1 dòng thay đổi, hiếm khi upstream sửa paths |
| `apps/web/ee-local/**`   | **Không** — file mới, không tồn tại trong upstream          |
| `apps/web/ce/**`         | **Không** — không sửa                                       |
| `apps/web/core/**`       | **Không** — không sửa                                       |

### Rủi ro duy nhất

Upstream thay đổi **interface** của CE stub (đổi tên props, đổi tên export). Khi đó:

- `pnpm check:types` sẽ báo lỗi ngay
- Sửa file tương ứng trong `ee-local/` cho khớp interface mới

---

## 3. Phân loại tính năng

### Tier 0: Đã hoạt động — Chỉ cần config

| Tính năng                   | Cách bật                                                                             | Effort         |
| --------------------------- | ------------------------------------------------------------------------------------ | -------------- |
| **OIDC/Keycloak SSO**       | Set env vars hoặc config qua God Mode (`/admin/authentication/keycloak`)             | Không cần code |
| **Pages / Wiki**            | Đã hoạt động sẵn                                                                     | Không cần code |
| **Real-time Collaboration** | Đã hoạt động sẵn (apps/live)                                                         | Không cần code |
| **Page Versions**           | Đã hoạt động sẵn — `PageVersionEndpoint` + UI trong `core/components/pages/version/` | Không cần code |

**Env vars cho OIDC:**

```env
IS_KEYCLOAK_ENABLED=1
KEYCLOAK_HOST=https://your-keycloak.example.com
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=plane
KEYCLOAK_CLIENT_SECRET=your-secret
```

### Tier 1: Unlock bằng overlay — Backend + Frontend core có sẵn

#### 1.1 Active Cycles (Workspace-level)

**Hiện trạng:**

- CE stub: `ce/components/active-cycles/root.tsx` → hiện trang upgrade
- Core có sẵn: `core/components/cycles/active-cycle/` gồm `cycle-stats.tsx`, `productivity.tsx`, `progress.tsx`
- CE đã có: `ce/components/cycles/active-cycle/root.tsx` — component `ActiveCycleRoot` cho **project-level** đầy đủ
- Backend: Cycle API đầy đủ, store `activeCycleIds` có sẵn
- Thiếu: Component wrapper cho workspace-level (aggregate nhiều project)

**Overlay cần tạo:**

```
ee-local/
  components/
    active-cycles/
      index.ts          → export { WorkspaceActiveCyclesRoot }
      root.tsx           → Fetch all projects, render ActiveCycleRoot per project
```

**Effort:** Trung bình — cần viết component aggregate cycle từ nhiều project. `ActiveCycleRoot` đã sẵn sàng cho từng project, chỉ cần wrapper loop qua projects.

**Risk:** Thấp — interface đơn giản (`WorkspaceActiveCyclesRoot` không nhận props).

---

#### 1.2 Project Publish (Deploy Boards)

**Hiện trạng:**

- Core có sẵn: `core/components/project/publish-project/modal.tsx` — modal đầy đủ
- Store: `core/store/project/project-publish.store.ts` — `IProjectPublishStore` đầy đủ
- Service: `ProjectPublishService` có sẵn
- Backend: API `project-deploy-boards` có sẵn
- Space app: `apps/space/` render published projects

**Overlay cần tạo:** Không cần — tính năng này đã được wire trực tiếp trong `core/`, không đi qua CE stub. Cần xác nhận lại nếu có menu item nào bị ẩn.

**Effort:** Thấp — kiểm tra và verify.

**Risk:** Rất thấp.

---

#### 1.3 Estimates (Nút Edit/Delete)

**Hiện trạng:**

- Core: `core/components/estimates/` có đầy đủ list, create modal, radio select
- CE stubs:
  - `ce/components/estimates/estimate-list-item-buttons.tsx` — **có code thật** (nút delete), chỉ ẩn nút edit
  - `ce/components/estimates/update/modal.tsx` → `<></>`
  - `ce/components/estimates/inputs/time-input.tsx` → `<></>`
  - `ce/components/estimates/points/delete.tsx` → `<></>`

**Overlay cần tạo:**

```
ee-local/
  components/
    estimates/
      index.ts
      update/
        index.ts
        modal.tsx          → Implement update estimate modal
      inputs/
        index.ts
        time-input.tsx     → Implement time-based estimate input
      points/
        index.ts
        delete.tsx         → Implement delete estimate point confirm
```

**Effort:** Trung bình — cần implement 3 component UI nhỏ. Có thể tham khảo create modal cho pattern.

**Risk:** Trung bình — nhiều file overlay, interface có thể drift.

---

#### 1.4 Issue Relations (CRUD đầy đủ)

**Hiện trạng:**

- Backend: `IssueRelationViewSet` — full CRUD cho `blocked_by`, `blocking`, `relates_to`, `duplicate`
- Core: Issue detail đã wire relation section, nút add relation có sẵn
- CE stubs liên quan: Một số stub trong `ce/components/issues/issue-details/` nhưng relation CRUD cơ bản đã hoạt động

**Overlay cần tạo:** Không cần — Issue Relations CRUD đã hoạt động trong CE. Chỉ cần verify.

**Effort:** Không cần code.

**Risk:** Không có.

---

### Tier 2: Unlock cần viết thêm code — Backend có sẵn, frontend cần bổ sung

#### 2.1 Gantt Dependency Paths (Visual)

**Hiện trạng:**

- Backend: `IssueRelation` hỗ trợ `start_before`, `finish_before` relation types
- CE stubs:
  - `ce/components/gantt-chart/dependency/dependency-paths.tsx` → `<></>`
  - `ce/components/gantt-chart/dependency/draggable-dependency-path.tsx` → `<></>`
  - `ce/components/gantt-chart/dependency/blockDraggables/left-draggable.tsx` → `<></>`
  - `ce/components/gantt-chart/dependency/blockDraggables/right-draggable.tsx` → `<></>`

**Cần implement:**

- SVG path rendering giữa các block trên Gantt chart
- Drag handles cho dependency creation
- Tính toán tọa độ dựa trên Gantt layout context

**Effort:** Lớn — cần hiểu sâu Gantt chart rendering, SVG coordinate math, drag & drop.

**Risk:** Cao — phụ thuộc vào internal API của Gantt chart component, dễ break khi upstream refactor.

**Khuyến nghị:** Trì hoãn trừ khi thực sự cần.

---

#### 2.2 Bulk Operations UI

**Hiện trạng:**

- Backend: API hỗ trợ bulk update một số field
- CE stub: `IssueBulkOperationsRoot` → upgrade banner
- Core: Có `BulkOperationsUpgradeBanner` nhưng **không có** bulk edit panel thật

**Cần implement:**

- UI panel cho bulk edit (state, priority, assignee, labels, cycle, module)
- Logic xử lý multi-select và batch API call

**Effort:** Lớn.

**Khuyến nghị:** Trì hoãn.

---

#### 2.3 View Publish

**Hiện trạng:**

- CE stub: `ce/components/views/publish/modal.tsx` → `<></>`
- CE hook stub: `ce/components/views/publish/use-view-publish.tsx` → trả về dummy values
- Không có core implementation cho view publish (khác với project publish)

**Cần implement:**

- Modal publish view
- Backend endpoint cho view anchors (nếu chưa có)
- Hook `useViewPublish`

**Effort:** Trung bình–Lớn.

**Khuyến nghị:** Trì hoãn.

---

### Tier 3: Không có code — Cần build từ đầu

Các tính năng sau **không tồn tại** trong repo CE. Unlock chúng đồng nghĩa với việc tự phát triển tính năng mới, không còn là "unlock" nữa.

| Tính năng                           | Backend                  | Frontend        | Ghi chú                          |
| ----------------------------------- | ------------------------ | --------------- | -------------------------------- |
| Time Tracking / Worklogs            | ❌ Không có model        | ❌ Stub `<></>` | Cần model, API, UI hoàn toàn mới |
| Epics                               | ⚠️ Chỉ có `is_epic` flag | ❌ Stub `<></>` | Cần epic management UI           |
| Work Item Types / Custom Properties | ❌ Không có model        | ❌ Stub         | Cần schema system                |
| Automations engine                  | ❌ Chỉ có auto-archive   | ❌ Stub         | Cần workflow engine              |
| Custom Dashboards & Widgets         | ⚠️ Basic home widgets    | ❌              | Cần dashboard builder            |
| RBAC / GAC                          | ❌ 4 role cố định        | ❌              | Cần permission system            |
| SAML                                | ❌                       | ❌              | Cần SAML provider                |
| LDAP                                | ❌                       | ❌              | Cần LDAP integration             |
| PQL                                 | ❌                       | ❌              | Cần query parser                 |
| Cycle Reports                       | ❌                       | ❌              | Cần report generator             |
| Project Templates                   | ❌                       | ❌              | Cần template system              |
| SLA                                 | ❌                       | ❌              | Cần SLA engine                   |
| Intake Forms                        | ❌                       | ❌              | Cần form builder                 |

**Khuyến nghị:** Không nên thực hiện. Đây là các tính năng thương mại của Plane, effort quá lớn và không bền vững.

---

## 4. Kế hoạch thực hiện

### Phase 1: Foundation (1 ngày)

- [ ] Tạo thư mục `apps/web/ee-local/`
- [ ] Sửa `apps/web/tsconfig.json`: thêm fallback path
- [ ] Thêm `apps/web/ee-local/` vào `.gitignore` upstream (hoặc maintain trên branch riêng)
- [ ] Verify build hoạt động bình thường khi `ee-local/` trống
- [ ] Config OIDC/Keycloak env vars (Tier 0)

### Phase 2: Low-risk unlocks (2–3 ngày)

- [ ] **Verify** Project Publish — xác nhận modal đã wire đúng
- [ ] **Verify** Issue Relations — xác nhận CRUD hoạt động
- [ ] **Verify** Page Versions — xác nhận UI hiển thị
- [ ] **Implement** Active Cycles workspace overlay

### Phase 3: Medium-risk unlocks (3–5 ngày)

- [ ] **Implement** Estimates overlay (update modal, time input, delete)
- [ ] Viết test cho các overlay components

### Deferred

- Gantt Dependency Paths — chỉ làm khi có nhu cầu thực tế
- Bulk Operations — chỉ làm khi có nhu cầu thực tế
- View Publish — chờ upstream bổ sung

---

## 5. Quy trình pull upstream

```bash
# 1. Fetch upstream
git fetch upstream main

# 2. Rebase/merge
git rebase upstream/main
# Conflict chỉ có thể xảy ra ở tsconfig.json (1 dòng)

# 3. Verify
pnpm check:types   # Phát hiện interface drift
pnpm build          # Verify build
pnpm dev            # Smoke test

# 4. Fix nếu cần
# Nếu TypeScript báo lỗi ở ee-local/ → sửa cho khớp interface mới
```

### Checklist sau mỗi upstream pull

- [ ] `pnpm check:types` pass
- [ ] `pnpm build` pass
- [ ] Các trang unlock vẫn render đúng
- [ ] Login OIDC vẫn hoạt động

---

## 6. Cấu trúc thư mục overlay dự kiến

```
apps/web/ee-local/
├── README.md                              ← Giải thích overlay pattern
├── components/
│   ├── active-cycles/
│   │   ├── index.ts                       ← export { WorkspaceActiveCyclesRoot }
│   │   └── root.tsx                       ← Workspace aggregate component
│   └── estimates/
│       ├── index.ts                       ← Re-export CE + override
│       ├── update/
│       │   ├── index.ts
│       │   └── modal.tsx
│       ├── inputs/
│       │   ├── index.ts
│       │   └── time-input.tsx
│       └── points/
│           ├── index.ts
│           └── delete.tsx
```

---

## 7. Tổng kết

| Metric                            | Giá trị                                                  |
| --------------------------------- | -------------------------------------------------------- |
| **Tổng tính năng premium**        | ~30+                                                     |
| **Đã hoạt động sẵn (Tier 0)**     | 4 (OIDC, Wiki, Collab, Page Versions)                    |
| **Unlock được an toàn (Tier 1)**  | 4 (Active Cycles, Project Publish, Estimates, Relations) |
| **Unlock cần viết code (Tier 2)** | 3 (Gantt Deps, Bulk Ops, View Publish)                   |
| **Không có code (Tier 3)**        | ~15+                                                     |
| **Upstream conflict risk**        | 1 dòng trong tsconfig.json                               |
| **Effort tổng Phase 1+2+3**       | ~6–9 ngày                                                |
