import { coreProjectRoutes } from "./core";
import { extendedProjectRoutes } from "./extended";

/**
 * PROJECT ROUTES
 * All project-related routes including list view and detail views
 * Includes: project list, issues, cycles, modules, views, pages, intake, and archives
 */
export const projectRoutes = [...coreProjectRoutes, ...extendedProjectRoutes];
