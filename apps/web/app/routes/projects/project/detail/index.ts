import { layout } from "@react-router/dev/routes";
import { coreProjectDetailRoutes } from "./core";
import { extendedProjectDetailRoutes } from "./extended";

/**
 * PROJECT DETAIL ROUTES
 * All project detail-related routes including overview, epics, automations, etc.
 */
export const projectDetailRoutes = [
  // ========================================================================
  // PROJECT DETAIL ROUTES
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/layout.tsx", [
    ...coreProjectDetailRoutes,
    ...extendedProjectDetailRoutes,
  ]),
] as const;
