/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TPersonalNavigationItemKey = "stickies" | "your_work" | "drafts";

export interface TPersonalNavigationItem {
  key: TPersonalNavigationItemKey;
  labelTranslationKey: string;
  enabled: boolean;
}

export interface TPersonalNavigationItemState {
  enabled: boolean;
  sort_order: number;
}

export type TProjectNavigationMode = "ACCORDION" | "TABBED";
export type TSprintNavigationMode = "ACCORDION" | "TABBED";

export interface TProjectDisplaySettings {
  navigationMode: TProjectNavigationMode;
  showLimitedProjects: boolean;
  limitedProjectsCount: number;
}

export interface TPersonalNavigationPreferences {
  items: Record<TPersonalNavigationItemKey, TPersonalNavigationItemState>;
}

export interface TProjectNavigationPreferences {
  navigationMode: TProjectNavigationMode;
  showLimitedProjects: boolean;
  limitedProjectsCount: number;
}

export interface TSprintNavigationPreferences {
  navigationMode: TSprintNavigationMode;
  showLimitedSquads: boolean;
  limitedSquadsCount: number;
}

export interface TWorkspaceNavigationItemState {
  is_pinned: boolean;
  sort_order: number;
}

export interface TWorkspaceNavigationPreferences {
  items: Record<string, TWorkspaceNavigationItemState>;
}

export interface TNavigationPreferences {
  personal: TPersonalNavigationPreferences;
  workspace: TWorkspaceNavigationPreferences;
  projects: TProjectNavigationPreferences;
  sprints: TSprintNavigationPreferences;
}

export const DEFAULT_PERSONAL_PREFERENCES: TPersonalNavigationPreferences = {
  items: {
    stickies: { enabled: false, sort_order: 0 },
    your_work: { enabled: true, sort_order: 1 },
    drafts: { enabled: true, sort_order: 2 },
  },
};

export const DEFAULT_PROJECT_PREFERENCES: TProjectNavigationPreferences = {
  navigationMode: "ACCORDION",
  showLimitedProjects: false,
  limitedProjectsCount: 10,
};

export const DEFAULT_SPRINT_PREFERENCES: TSprintNavigationPreferences = {
  navigationMode: "ACCORDION",
  showLimitedSquads: false,
  limitedSquadsCount: 10,
};

export const DEFAULT_WORKSPACE_PREFERENCES: TWorkspaceNavigationPreferences = {
  items: {
    squads: { is_pinned: true, sort_order: 3 },
  },
};

export type TAppRailDisplayMode = "icon_only" | "icon_with_label";

export interface TAppRailPreferences {
  displayMode: TAppRailDisplayMode;
}

export const DEFAULT_APP_RAIL_PREFERENCES: TAppRailPreferences = {
  displayMode: "icon_with_label",
};
