/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Tab preferences type
export type TTabPreferences = {
  defaultTab: string;
  hiddenTabs: string[];
};

// Constants
export const TAB_PREFS_KEY = "plane_tab_prefs";

// Two different questions that both used to be answered by one loosely-named
// constant, which made it easy to reach for the wrong one: what tab does a user
// with no saved preference land on ("no-preference"), versus what tab is it safe
// to fall back to when a stored or initial preference points at something the
// current user cannot actually see ("validation-fallback", used by
// getValidatedDefaultTab and TabNavigationRoot's redirect effect). The second
// must always be GUEST-visible; the first does not have to be, since callers
// re-validate it against the current user's available tabs before trusting it.
export type TDefaultTabContext = "no-preference" | "validation-fallback";

const DEFAULT_TAB_BY_CONTEXT: Record<TDefaultTabContext, string> = {
  "no-preference": "project_info",
  "validation-fallback": "work_items",
};

export const getDefaultTabKey = (context: TDefaultTabContext): string => DEFAULT_TAB_BY_CONTEXT[context];

/**
 * Get tab preferences for a specific project from localStorage
 * @param projectId - The project ID
 * @returns Tab preferences object with defaultTab and hiddenTabs
 */
export const getTabPreferences = (projectId: string): TTabPreferences => {
  try {
    const stored = localStorage.getItem(TAB_PREFS_KEY);
    if (stored) {
      const allPrefs = JSON.parse(stored);
      return (
        allPrefs[projectId] || {
          defaultTab: getDefaultTabKey("no-preference"),
          hiddenTabs: [],
        }
      );
    }
  } catch (error) {
    console.error("Error reading tab preferences:", error);
  }
  return {
    defaultTab: getDefaultTabKey("no-preference"),
    hiddenTabs: [],
  };
};

/**
 * Save tab preferences for a specific project to localStorage
 * @param projectId - The project ID
 * @param preferences - Tab preferences to save
 */
export const saveTabPreferences = (projectId: string, preferences: TTabPreferences): void => {
  try {
    const stored = localStorage.getItem(TAB_PREFS_KEY);
    const allPrefs = stored ? JSON.parse(stored) : {};
    allPrefs[projectId] = preferences;
    localStorage.setItem(TAB_PREFS_KEY, JSON.stringify(allPrefs));
  } catch (error) {
    console.error("Error saving tab preferences:", error);
  }
};

/**
 * Map tab keys to their corresponding URLs
 * @param workspaceSlug - The workspace slug
 * @param projectId - The project ID
 * @param tabKey - The tab key to map
 * @returns Full URL path for the tab
 */
export const getTabUrl = (workspaceSlug: string, projectId: string, tabKey: string): string => {
  const baseUrl = `/${workspaceSlug}/projects/${projectId}`;
  const tabUrlMap: Record<string, string> = {
    project_info: `${baseUrl}/project-info`,
    work_items: `${baseUrl}/issues`,
    cycles: `${baseUrl}/cycles`,
    modules: `${baseUrl}/modules`,
    views: `${baseUrl}/views`,
    pages: `${baseUrl}/pages`,
    intake: `${baseUrl}/intake`,
    overview: `${baseUrl}/overview`,
    epics: `${baseUrl}/epics`,
  };
  return tabUrlMap[tabKey] || `${baseUrl}/issues`; // fallback to issues
};

/**
 * Get the default tab URL for a project
 * @param workspaceSlug - The workspace slug
 * @param projectId - The project ID
 * @param availableTabKeys - Optional array of available tab keys for validation
 * @returns Full URL path for the default tab (validated if availableTabKeys provided)
 */
export const getDefaultTabUrl = (workspaceSlug: string, projectId: string, availableTabKeys?: string[]): string => {
  const preferences = getTabPreferences(projectId);
  let tabKey = preferences.defaultTab;

  // Validate against available tabs if provided
  if (availableTabKeys && availableTabKeys.length > 0) {
    tabKey = getValidatedDefaultTab(projectId, availableTabKeys);
  }

  return getTabUrl(workspaceSlug, projectId, tabKey);
};

/**
 * Get the default tab key, with validation that it exists in available tabs
 * @param projectId - The project ID
 * @param availableTabKeys - Array of available tab keys
 * @returns The default tab key if valid, otherwise the validation-fallback tab
 */
export const getValidatedDefaultTab = (projectId: string, availableTabKeys: string[]): string => {
  const preferences = getTabPreferences(projectId);
  const defaultTab = preferences.defaultTab;

  // Check if the default tab is in the available tabs
  if (availableTabKeys.includes(defaultTab)) {
    return defaultTab;
  }

  return getDefaultTabKey("validation-fallback");
};
