import { coreSettingsRoutes } from "./core";
import { extendedSettingsRoutes } from "./extended";

/**
 * SETTINGS ROUTES
 * All settings-related routes including workspace, account, and project settings
 */
export const settingsRoutes = [...coreSettingsRoutes, ...extendedSettingsRoutes];
