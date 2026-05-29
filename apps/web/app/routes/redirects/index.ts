import type { RouteConfigEntry } from "@react-router/dev/routes";
import { coreRedirectRoutes } from "./core";
import { extendedRedirectRoutes } from "./extended";

/**
 * REDIRECT ROUTES
 * Centralized configuration for all route redirects
 * Migrated from Next.js next.config.js redirects
 */
export const redirectRoutes: RouteConfigEntry[] = [...coreRedirectRoutes, ...extendedRedirectRoutes];
