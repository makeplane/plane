/**
 * Legacy Theme System
 *
 * This file contains the old 5-color theme system for backward compatibility.
 *
 * @deprecated Most functions in this file are deprecated
 * New code should use the OKLCH-based theme system from ./theme/ instead
 *
 * Functions:
 * - applyTheme: OLD 5-color theme system (background, text, primary, sidebarBg, sidebarText)
 * - unsetCustomCssVariables: Clears both old AND new theme variables (updated for OKLCH)
 * - resolveGeneralTheme: Utility to resolve theme mode (still useful)
 * - migrateLegacyTheme: Converts old 5-color theme to new 2-color system
 *
 * For new implementations:
 * - Use: import { applyCustomTheme, clearCustomTheme } from '@plane/utils/theme'
 * - See: packages/utils/src/theme/theme-application.ts
 */

export const resolveGeneralTheme = (resolvedTheme: string | undefined) =>
  resolvedTheme?.includes("light") ? "light" : resolvedTheme?.includes("dark") ? "dark" : "system";
