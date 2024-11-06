export enum EUserPermissions {
  ADMIN = 20,
  MEMBER = 15,
  GUEST = 5,
}

export type TUserPermissions =
  | EUserPermissions.ADMIN
  | EUserPermissions.MEMBER
  | EUserPermissions.GUEST;

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
}
