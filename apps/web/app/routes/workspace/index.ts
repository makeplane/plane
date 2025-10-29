import { coreWorkspaceRoutes } from "./core";
import { extendedWorkspaceRoutes } from "./extended";

/**
 * WORKSPACE-LEVEL ROUTES
 * Routes that are scoped to a workspace but not specific to projects
 * Includes: workspace dashboard, active-cycles, analytics, browse, drafts,
 * notifications, profile, stickies, and workspace-views
 */
export const workspaceRoutes = [...coreWorkspaceRoutes, ...extendedWorkspaceRoutes];
