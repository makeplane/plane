import type { RouteConfigEntry } from "@react-router/dev/routes";
import { coreProjectRoutes } from "./core";
import { projectDetailRoutes } from "./detail";
import { extendedProjectRoutes } from "./extended";

/**
 * PROJECT ROUTES
 * All project-related routes including list view and detail views
 * Includes: project list, issues, cycles, modules, views, pages, intake, and archives
 */
export const projectRoutes: RouteConfigEntry[] = [
  ...coreProjectRoutes,
  ...extendedProjectRoutes,
  ...projectDetailRoutes,
] as const;
