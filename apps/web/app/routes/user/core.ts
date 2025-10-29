import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const coreUserManagementRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // HOME - SIGN IN
  // ========================================================================
  layout("./(home)/layout.tsx", [index("./(home)/page.tsx")]),

  // ========================================================================
  // SIGN UP
  // ========================================================================
  layout("./(all)/sign-up/layout.tsx", [route("sign-up", "./(all)/sign-up/page.tsx")]),

  // ========================================================================
  // ACCOUNT ROUTES - Password Management
  // ========================================================================
  layout("./(all)/accounts/forgot-password/layout.tsx", [
    route("accounts/forgot-password", "./(all)/accounts/forgot-password/page.tsx"),
  ]),
  layout("./(all)/accounts/reset-password/layout.tsx", [
    route("accounts/reset-password", "./(all)/accounts/reset-password/page.tsx"),
  ]),
  layout("./(all)/accounts/set-password/layout.tsx", [
    route("accounts/set-password", "./(all)/accounts/set-password/page.tsx"),
  ]),

  // ========================================================================
  // CREATE WORKSPACE
  // ========================================================================
  layout("./(all)/create-workspace/layout.tsx", [route("create-workspace", "./(all)/create-workspace/page.tsx")]),

  // ========================================================================
  // ONBOARDING
  // ========================================================================
  layout("./(all)/onboarding/layout.tsx", [route("onboarding", "./(all)/onboarding/page.tsx")]),

  // ========================================================================
  // INVITATIONS
  // ========================================================================
  layout("./(all)/invitations/layout.tsx", [route("invitations", "./(all)/invitations/page.tsx")]),

  // ========================================================================
  // WORKSPACE INVITATIONS
  // ========================================================================
  layout("./(all)/workspace-invitations/layout.tsx", [
    route("workspace-invitations", "./(all)/workspace-invitations/page.tsx"),
  ]),
] as const;
