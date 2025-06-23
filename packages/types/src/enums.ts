export enum EUserPermissions {
  ADMIN = 20,
  MEMBER = 15,
  GUEST = 5,
}

export type TUserPermissions = EUserPermissions.ADMIN | EUserPermissions.MEMBER | EUserPermissions.GUEST;

// project network
export enum EProjectNetwork {
  PRIVATE = 0,
  PUBLIC = 2,
}

// project pages
export enum EPageAccess {
  PUBLIC = 0,
  PRIVATE = 1,
}

export enum EDurationFilters {
  NONE = "none",
  TODAY = "today",
  THIS_WEEK = "this_week",
  THIS_MONTH = "this_month",
  THIS_YEAR = "this_year",
  CUSTOM = "custom",
}

export enum EIssueCommentAccessSpecifier {
  EXTERNAL = "EXTERNAL",
  INTERNAL = "INTERNAL",
}

// estimates
export enum EEstimateSystem {
  POINTS = "points",
  CATEGORIES = "categories",
  TIME = "time",
}

export enum EEstimateUpdateStages {
  CREATE = "create",
  EDIT = "edit",
  SWITCH = "switch",
}

// workspace notifications
export enum ENotificationFilterType {
  CREATED = "created",
  ASSIGNED = "assigned",
  SUBSCRIBED = "subscribed",
}

export enum EFileAssetType {
  COMMENT_DESCRIPTION = "COMMENT_DESCRIPTION",
  ISSUE_ATTACHMENT = "ISSUE_ATTACHMENT",
  ISSUE_DESCRIPTION = "ISSUE_DESCRIPTION",
  DRAFT_ISSUE_DESCRIPTION = "DRAFT_ISSUE_DESCRIPTION",
  PAGE_DESCRIPTION = "PAGE_DESCRIPTION",
  PROJECT_COVER = "PROJECT_COVER",
  USER_AVATAR = "USER_AVATAR",
  USER_COVER = "USER_COVER",
  WORKSPACE_LOGO = "WORKSPACE_LOGO",
  TEAM_SPACE_DESCRIPTION = "TEAM_SPACE_DESCRIPTION",
  INITIATIVE_DESCRIPTION = "INITIATIVE_DESCRIPTION",
  PROJECT_DESCRIPTION = "PROJECT_DESCRIPTION",
  TEAM_SPACE_COMMENT_DESCRIPTION = "TEAM_SPACE_COMMENT_DESCRIPTION",
}

export type TEditorAssetType =
  | EFileAssetType.COMMENT_DESCRIPTION
  | EFileAssetType.ISSUE_DESCRIPTION
  | EFileAssetType.DRAFT_ISSUE_DESCRIPTION
  | EFileAssetType.PAGE_DESCRIPTION
  | EFileAssetType.TEAM_SPACE_DESCRIPTION
  | EFileAssetType.INITIATIVE_DESCRIPTION
  | EFileAssetType.PROJECT_DESCRIPTION
  | EFileAssetType.TEAM_SPACE_COMMENT_DESCRIPTION;

export enum EUpdateStatus {
  OFF_TRACK = "OFF-TRACK",
  ON_TRACK = "ON-TRACK",
  AT_RISK = "AT-RISK",
}
