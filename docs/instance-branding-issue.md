### Is there an existing issue for this?

- [x] I have searched the existing issues

### Summary

Self-hosted operators need runtime instance branding (name, logo, favicon, support email, website) without rebuilding frontend images. Config should live on the instance (God Mode + optional Docker env seed), expose via `GET /api/instances/`, and drive login/sidebar/emails. Empty values keep Plane defaults. Prefer `HIDE_PLANE_MARKETING=0/1` over an inverted `isBranding` flag.

### Tracking

Opened as https://github.com/makeplane/plane/issues/9675

### Why should this be worked on?

Many self-hosters white-label Plane for internal teams. Today `instance_name` exists, but logos and support links are hardcoded (`PlaneLogo`, `plane.so`, email header assets). Build-time `VITE_*` is a poor fit for Docker operators who expect `.env` + restart. Runtime InstanceConfiguration (same pattern as `ENABLE_SIGNUP`) fixes chrome without rewriting LICENSE, package names, or test fixtures.

### Proposed approach

- Seed keys: `BRAND_LOGO_URL`, `BRAND_LOGO_DARK_URL`, `BRAND_FAVICON_URL`, `BRAND_SUPPORT_EMAIL`, `BRAND_WEBSITE_URL`, `HIDE_PLANE_MARKETING`
- Expose on public instance GET config
- God Mode general form editors
- Shared `BrandMark` (custom img or PlaneLogo)
- Email templates receive `brand_name` / `brand_logo_url`
- Optional hide of Plane marketing / powered-by / upsell CTAs
- i18n: `{brand}` placeholders (not wholesale locale rewrites)
