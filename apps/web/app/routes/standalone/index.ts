import { coreStandaloneRoutes } from "./core";
import { extendedStandaloneRoutes } from "./extended";

/**
 * STANDALONE ROUTES
 * Routes that are not scoped to a workspace
 * Includes: onboarding, workspace creation, sign-up, invitations, password management, and OAuth
 */
export const standaloneRoutes = [...coreStandaloneRoutes, ...extendedStandaloneRoutes];
