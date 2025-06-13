export const EUserPermissions = {
  ADMIN: 20,
  MEMBER: 15,
  GUEST: 5,
} as const;

export type EUserPermissions = typeof EUserPermissions[keyof typeof EUserPermissions];

export type TUserPermissions = EUserPermissions;

// project network
export const EProjectNetwork = {
  PRIVATE: 0,
  PUBLIC: 2,
} as const;

export type EProjectNetwork = typeof EProjectNetwork[keyof typeof EProjectNetwork];

// project pages
export const EPageAccess = {
  PUBLIC: 0,
  PRIVATE: 1,
} as const;

export type EPageAccess = typeof EPageAccess[keyof typeof EPageAccess];

export const EDurationFilters = {
  NONE: "none",
  TODAY: "today",
  THIS_WEEK: "this_week",
  THIS_MONTH: "this_month",
  THIS_YEAR: "this_year",
  CUSTOM: "custom",
} as const;

export type EDurationFilters = typeof EDurationFilters[keyof typeof EDurationFilters];

export const EIssueCommentAccessSpecifier = {
  EXTERNAL: "EXTERNAL",
  INTERNAL: "INTERNAL",
} as const;

export type EIssueCommentAccessSpecifier = typeof EIssueCommentAccessSpecifier[keyof typeof EIssueCommentAccessSpecifier];

// estimates
export const EEstimateSystem = {
  POINTS: "points",
  CATEGORIES: "categories",
  TIME: "time",
} as const;

export type EEstimateSystem = typeof EEstimateSystem[keyof typeof EEstimateSystem];

export const EEstimateUpdateStages = {
  CREATE: "create",
  EDIT: "edit",
  SWITCH: "switch",
} as const;

export type EEstimateUpdateStages = typeof EEstimateUpdateStages[keyof typeof EEstimateUpdateStages];

// workspace notifications
export const ENotificationFilterType = {
  CREATED: "created",
  ASSIGNED: "assigned",
  SUBSCRIBED: "subscribed",
} as const;

export type ENotificationFilterType = typeof ENotificationFilterType[keyof typeof ENotificationFilterType];

export const EFileAssetType = {
  COMMENT_DESCRIPTION: "COMMENT_DESCRIPTION",
  ISSUE_ATTACHMENT: "ISSUE_ATTACHMENT",
  ISSUE_DESCRIPTION: "ISSUE_DESCRIPTION",
  DRAFT_ISSUE_DESCRIPTION: "DRAFT_ISSUE_DESCRIPTION",
  PAGE_DESCRIPTION: "PAGE_DESCRIPTION",
  PROJECT_COVER: "PROJECT_COVER",
  USER_AVATAR: "USER_AVATAR",
  USER_COVER: "USER_COVER",
  WORKSPACE_LOGO: "WORKSPACE_LOGO",
  TEAM_SPACE_DESCRIPTION: "TEAM_SPACE_DESCRIPTION",
  INITIATIVE_DESCRIPTION: "INITIATIVE_DESCRIPTION",
  PROJECT_DESCRIPTION: "PROJECT_DESCRIPTION",
  TEAM_SPACE_COMMENT_DESCRIPTION: "TEAM_SPACE_COMMENT_DESCRIPTION",
} as const;

export type EFileAssetType = typeof EFileAssetType[keyof typeof EFileAssetType];

export const EUpdateStatus = {
  OFF_TRACK: "OFF-TRACK",
  ON_TRACK: "ON-TRACK",
  AT_RISK: "AT-RISK",
} as const;

export type EUpdateStatus = typeof EUpdateStatus[keyof typeof EUpdateStatus];