/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

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
  PAGE_COMMENT_DESCRIPTION = "PAGE_COMMENT_DESCRIPTION",
  ISSUE_ATTACHMENT = "ISSUE_ATTACHMENT",
  ISSUE_DESCRIPTION = "ISSUE_DESCRIPTION",
  DRAFT_ISSUE_DESCRIPTION = "DRAFT_ISSUE_DESCRIPTION",
  PAGE_DESCRIPTION = "PAGE_DESCRIPTION",
  PROJECT_COVER = "PROJECT_COVER",
  USER_AVATAR = "USER_AVATAR",
  USER_COVER = "USER_COVER",
  WORKSPACE_LOGO = "WORKSPACE_LOGO",
  WORKSPACE_MEMBERS_IMPORT = "WORKSPACE_MEMBERS_IMPORT",
  WORK_ITEM_IMPORT = "WORK_ITEM_IMPORT",
  TEAM_SPACE_DESCRIPTION = "TEAM_SPACE_DESCRIPTION",
  INITIATIVE_DESCRIPTION = "INITIATIVE_DESCRIPTION",
  INITIATIVE_COMMENT_DESCRIPTION = "INITIATIVE_COMMENT_DESCRIPTION",
  PROJECT_DESCRIPTION = "PROJECT_DESCRIPTION",
  TEAM_SPACE_COMMENT_DESCRIPTION = "TEAM_SPACE_COMMENT_DESCRIPTION",
  OAUTH_APP_LOGO = "OAUTH_APP_LOGO",
  OAUTH_APP_DESCRIPTION = "OAUTH_APP_DESCRIPTION",
  OAUTH_APP_ATTACHMENT = "OAUTH_APP_ATTACHMENT",
  CUSTOMER_LOGO = "CUSTOMER_LOGO",
  CUSTOMER_DESCRIPTION = "CUSTOMER_DESCRIPTION",
  CUSTOMER_REQUEST_DESCRIPTION = "CUSTOMER_REQUEST_DESCRIPTION",
  PAGE_TEMPLATE_DESCRIPTION = "PAGE_TEMPLATE_DESCRIPTION",
  TEMPLATE_ATTACHMENT = "TEMPLATE_ATTACHMENT",
  MILESTONE_DESCRIPTION = "MILESTONE_DESCRIPTION",
  INTAKE_FORM_ATTACHMENT = "INTAKE_FORM_ATTACHMENT",
}

export type TEditorAssetType =
  | EFileAssetType.COMMENT_DESCRIPTION
  | EFileAssetType.ISSUE_DESCRIPTION
  | EFileAssetType.DRAFT_ISSUE_DESCRIPTION
  | EFileAssetType.PAGE_DESCRIPTION
  | EFileAssetType.TEAM_SPACE_DESCRIPTION
  | EFileAssetType.INITIATIVE_DESCRIPTION
  | EFileAssetType.PROJECT_DESCRIPTION
  | EFileAssetType.TEAM_SPACE_COMMENT_DESCRIPTION
  | EFileAssetType.INITIATIVE_COMMENT_DESCRIPTION
  | EFileAssetType.OAUTH_APP_DESCRIPTION
  | EFileAssetType.CUSTOMER_DESCRIPTION
  | EFileAssetType.CUSTOMER_REQUEST_DESCRIPTION
  | EFileAssetType.PAGE_TEMPLATE_DESCRIPTION
  | EFileAssetType.TEMPLATE_ATTACHMENT
  | EFileAssetType.MILESTONE_DESCRIPTION;

export enum EUpdateStatus {
  OFF_TRACK = "OFF-TRACK",
  ON_TRACK = "ON-TRACK",
  AT_RISK = "AT-RISK",
}

export enum EUpdateEntityType {
  PROJECT = "PROJECT",
  EPIC = "EPIC",
  INITIATIVE = "INITIATIVE",
}
