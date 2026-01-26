import { route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const coreRedirectRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // WORKSPACE & PROJECT REDIRECTS
  // ========================================================================

  // Project settings redirect: /:workspaceSlug/projects/:projectId/settings/:path*
  // → /:workspaceSlug/settings/projects/:projectId/:path*
  route(":workspaceSlug/projects/:projectId/settings/*", "routes/redirects/core/project-settings.tsx"),

  // Analytics redirect: /:workspaceSlug/analytics → /:workspaceSlug/analytics/overview
  route(":workspaceSlug/analytics", "routes/redirects/core/analytics.tsx"),

  // API tokens redirect: /:workspaceSlug/settings/api-tokens
  // → /settings/profile/api-tokens
  route(":workspaceSlug/settings/api-tokens", "routes/redirects/core/api-tokens.tsx"),

  // Inbox redirect: /:workspaceSlug/projects/:projectId/inbox
  // → /:workspaceSlug/projects/:projectId/intake
  route(":workspaceSlug/projects/:projectId/inbox", "routes/redirects/core/inbox.tsx"),

  // ========================================================================
  // AUTHENTICATION REDIRECTS
  // ========================================================================

  // Sign-up redirects
  route("accounts/sign-up", "routes/redirects/core/accounts-signup.tsx"),

  // Sign-in redirects (all redirect to home page)
  route("sign-in", "routes/redirects/core/sign-in.tsx"),
  route("signin", "routes/redirects/core/signin.tsx"),
  route("login", "routes/redirects/core/login.tsx"),

  // Register redirect
  route("register", "routes/redirects/core/register.tsx"),
];
