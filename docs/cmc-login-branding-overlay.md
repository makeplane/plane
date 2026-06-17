# CMC Login Branding Overlay

Tài liệu này mô tả cách giữ các tùy biến branding đăng nhập CMC Telecom trong sparse overlay `cmc-local`, thay vì sửa trực tiếp file upstream của Plane.

## Mục tiêu

- Giữ diff với upstream nhỏ, dễ rebase/merge.
- Gom branding CMC login vào thư mục app-local: `apps/web/cmc-local/**` và `apps/space/cmc-local/**`.
- Không sửa trực tiếp các file upstream/core/UI để đổi logo, text hoặc icon đăng nhập.

## Cơ chế overlay

TypeScript path alias được cấu hình để ưu tiên file trong `cmc-local` trước, sau đó fallback về source gốc.

```jsonc
// apps/web/tsconfig.json
"@/*": ["./cmc-local/*", "./core/*"]

// apps/space/tsconfig.json
"@/*": ["./cmc-local/*", "./*"]
```

Khi import `@/components/account/auth-forms`, TypeScript resolve theo thứ tự:

1. Tìm file tương ứng trong `cmc-local`.
2. Nếu không có, fallback về source gốc (`core` với Web, app root với Space).

Các alias cụ thể hơn như `@/app/*`, `@/helpers/*`, `@/styles/*` của Web không bị overlay bởi rule `@/*`.

## File overlay hiện tại

### Web

| File                                                                     | Vai trò                                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `apps/web/cmc-local/constants/cmc-auth.ts`                               | Branding constants: logo, title, subtitle, SSO button text, Keycloak provider id.    |
| `apps/web/cmc-local/components/account/auth-forms/index.ts`              | Entry point overlay cho barrel import `@/components/account/auth-forms`.             |
| `apps/web/cmc-local/components/account/auth-forms/auth-root.tsx`         | Giữ flow auth gốc, thay OAuth renderer bằng `CmcOAuthOptions`.                       |
| `apps/web/cmc-local/components/account/auth-forms/auth-header.tsx`       | Render CMC logo/title/subtitle cho login header; vẫn giữ workspace invitation logic. |
| `apps/web/cmc-local/components/account/auth-forms/cmc-oauth-options.tsx` | Render OAuth buttons local; riêng provider `keycloak` đổi text và bỏ icon.           |

### Space

| File                                                                       | Vai trò                                                                    |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `apps/space/cmc-local/constants/cmc-auth.ts`                               | Branding constants dùng cho Space overlay.                                 |
| `apps/space/cmc-local/components/account/auth-forms/index.ts`              | Entry point overlay cho barrel import `@/components/account/auth-forms`.   |
| `apps/space/cmc-local/components/account/auth-forms/auth-root.tsx`         | Giữ flow auth gốc, thay OAuth renderer bằng `CmcOAuthOptions`.             |
| `apps/space/cmc-local/components/account/auth-forms/cmc-oauth-options.tsx` | Render OAuth buttons local; riêng provider `keycloak` đổi text và bỏ icon. |

Space chưa overlay `auth-header.tsx`; file này vẫn fallback về `apps/space/components/account/auth-forms/auth-header.tsx`.

## Branding values

Giá trị branding được đặt trong cả hai file constants:

- `apps/web/cmc-local/constants/cmc-auth.ts`
- `apps/space/cmc-local/constants/cmc-auth.ts`

```ts
export const CMC_AUTH_BRANDING = {
  logoUrl: "https://auth.cmctelecom.vn/resources/izwga/login/cmc-hub/img/cmc_logo.png",
  title: "CMC Telecom Work Platform",
  subtitle: "Project management for all teams",
  ssoButtonText: "Đăng nhập bằng CMC SSO",
  logoClassName: "h-16 w-fit object-contain",
} as const;

export const CMC_AUTH_KEYCLOAK_PROVIDER_ID = "keycloak";
```

Khi đổi wording/logo, cập nhật đồng bộ hai file constants để Web và Space không lệch nhau.

## Quy tắc bảo trì

- Không sửa các file sau chỉ để thay branding:
  - `apps/web/core/components/account/auth-forms/auth-header.tsx`
  - `apps/web/core/hooks/oauth/core.tsx`
  - `apps/space/hooks/oauth/core.tsx`
  - `packages/ui/src/oauth/oauth-button.tsx`
- Chỉ copy file upstream vào `cmc-local` khi cần override behavior thực sự.
- Overlay phải giữ cùng export name và props contract với file gốc để import sites không đổi.
- Nếu chỉ cần override một phần barrel export, re-export phần cần thiết thay vì copy cả thư mục.
- Sau mỗi lần pull upstream, so sánh các overlay copy với file gốc tương ứng để bắt interface drift.

## Khi upstream thay đổi

Các overlay copy có thể drift nếu upstream đổi props, hooks, auth flow hoặc export name. Cách xử lý:

1. Chạy typecheck để phát hiện lỗi compile.
2. Diff overlay với file upstream tương ứng.
3. Port phần thay đổi upstream cần thiết vào overlay.
4. Giữ CMC-specific logic nhỏ nhất có thể: constants + `CmcOAuthOptions` + header branding.

## Verification

Chạy các lệnh sau sau khi sửa overlay:

```bash
pnpm exec oxfmt --check docs/cmc-login-branding-overlay.md apps/web/cmc-local apps/space/cmc-local apps/web/tsconfig.json apps/space/tsconfig.json
git diff --check
pnpm --filter=web check:types
pnpm --filter=space check:types
pnpm --filter=web check:lint
pnpm --filter=space check:lint
```

`check:lint` hiện có thể báo warnings sẵn từ upstream; yêu cầu tối thiểu là không phát sinh errors và không thêm warnings trong `cmc-local`.

## Liên quan

- [Keycloak OIDC Local Development Guide](./keycloak-local-dev.md)
- [CE Feature Unlock Spec](./ce-feature-unlock-spec.md) — mô tả sparse overlay pattern tương tự cho `ee-local`.
