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
}

// Default preferences
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

export const DEFAULT_WORKSPACE_PREFERENCES: TWorkspaceNavigationPreferences = {
  items: {},
};

// App Rail preferences
export type TAppRailDisplayMode = "icon_only" | "icon_with_label";

export interface TAppRailPreferences {
  displayMode: TAppRailDisplayMode;
}

export const DEFAULT_APP_RAIL_PREFERENCES: TAppRailPreferences = {
  displayMode: "icon_with_label",
};
