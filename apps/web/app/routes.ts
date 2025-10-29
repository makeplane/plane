import { layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";
// local imports
import { projectRoutes } from "./routes/project";
import { settingsRoutes } from "./routes/settings";
import { standaloneRoutes } from "./routes/standalone";
import { teamspaceRoutes } from "./routes/teamspace";
import { userManagementRoutes } from "./routes/user";
import { workspaceRoutes } from "./routes/workspace";

/**
 * Main Routes Configuration
 *
 * This file serves as the entry point for the route configuration.
 * All routes are organized in the ./core/routes/ directory by feature area.
 * For route customization or additional routes, see ./core/routes/index.ts
 */
function createRoutes(): RouteConfig {
  return [
    // ========================================================================
    // USER MANAGEMENT ROUTES
    // ========================================================================
    ...userManagementRoutes,

    // ========================================================================
    // ALL APP ROUTES
    // ========================================================================
    layout("./(all)/layout.tsx", [
      // ======================================================================
      // WORKSPACE-SCOPED ROUTES
      // ======================================================================
      layout("./(all)/[workspaceSlug]/layout.tsx", [
        // ====================================================================
        // PROJECTS SECTION
        // ====================================================================
        layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
          // Workspace-level routes
          ...workspaceRoutes,

          // Teamspace-level routes
          ...teamspaceRoutes,

          // Project routes
          ...projectRoutes,
        ]),

        // ====================================================================
        // SETTINGS SECTION
        // ====================================================================
        layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
          // Settings routes (workspace, account, project settings)
          ...settingsRoutes,
        ]),
      ]),

      // ======================================================================
      // STANDALONE ROUTES (outside workspace context)
      // ======================================================================
      // Onboarding, sign-up, invitations, password management, OAuth
      ...standaloneRoutes,
    ]),

    // ========================================================================
    // ERROR HANDLING - 404 Catch-all (must be last)
    // ========================================================================
    route("*", "./not-found.tsx"),
  ] satisfies RouteConfig;
}

const routes = createRoutes();

export default routes;
