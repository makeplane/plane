import { layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";
// local imports
import { piRoutes } from "./routes/pi";
import { projectsAppRoutes } from "./routes/projects";
import { redirectRoutes } from "./routes/redirects";
import { settingsRoutes } from "./routes/settings";
import { standaloneRoutes } from "./routes/standalone";
import { userManagementRoutes } from "./routes/user";
import { wikiRoutes } from "./routes/wiki";

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
        // PROJECTS APP SECTION
        // ====================================================================
        ...projectsAppRoutes,

        // ====================================================================
        // WIKI APP SECTION
        // ====================================================================
        ...wikiRoutes,

        // ====================================================================
        // PI APP SECTION
        // ====================================================================
        ...piRoutes,

        // ====================================================================
        // SETTINGS SECTION
        // ====================================================================
        ...settingsRoutes,
      ]),
      // ======================================================================
      // STANDALONE ROUTES (outside workspace context)
      // ======================================================================
      // Onboarding, sign-up, invitations, password management, OAuth
      ...standaloneRoutes,
    ]),

    // ========================================================================
    // REDIRECT ROUTES
    // ========================================================================
    // Legacy URL redirects for backward compatibility
    ...redirectRoutes,

    // ========================================================================
    // ERROR HANDLING - 404 Catch-all (must be last)
    // ========================================================================
    route("*", "./not-found.tsx"),
  ] satisfies RouteConfig;
}

const routes = createRoutes();

export default routes;
