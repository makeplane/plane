import { coreUserManagementRoutes } from "./core";
import { extendedUserManagementRoutes } from "./extended";

/**
 * USER MANAGEMENT ROUTES
 * Routes for user management including sign-in, sign-up, and password management
 */
export const userManagementRoutes = [...coreUserManagementRoutes, ...extendedUserManagementRoutes];
