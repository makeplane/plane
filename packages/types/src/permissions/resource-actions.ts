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

/**
 * Workspace-scoped resources and the actions they support.
 *
 * These keys are used as the left-hand side of a `resource:action` grant string.
 * Keep values literal (`as const`) so downstream unions stay fully type-safe.
 */
export const WORKSPACE_PERMISSION_RESOURCE_ACTIONS = {
  workspace: ["view", "edit", "delete", "manage", "invite", "transfer"],
  billing: ["view", "manage"],
  workspace_member: ["view", "invite", "edit", "remove", "change_role", "import"],
  wiki: ["view", "create", "edit", "delete", "share", "comment"],
  wiki_collection: ["view", "create", "edit", "delete"],
  workspace_workitem_view: ["view", "create", "edit", "delete", "share", "publish", "export"],
  initiative: ["view", "create", "edit", "delete", "manage", "react"],
  // initiative_label: ["view", "create", "edit", "delete"],
  initiative_comment: ["view", "create", "edit", "delete", "react"],
  initiative_attachment: ["view", "create", "edit", "delete"],
  initiative_link: ["view", "create", "edit", "delete"],
  teamspace: ["browse", "view", "create", "edit", "delete", "manage"],
  integration: ["view", "create", "edit", "delete", "manage", "connect"],
  webhook: ["view", "create", "edit", "delete"],
  api_token: ["view", "create", "delete"],
  custom_role: ["view", "create", "edit", "delete"],
  project: ["browse", "view", "create", "edit", "delete", "manage", "archive", "react", "publish"],
  dashboard: ["view", "create", "edit", "delete"],
  analytics: ["view", "export"],
  project_analytics: ["view", "export"],
  ai: ["use"],
  workspace_activity: ["view", "export"],
  workspace_user_activity: ["view", "export"],
  favorite: ["view", "create", "edit", "delete"],
  workspace_draft: ["view", "create", "edit", "delete", "manage"],
  customer: ["view", "create", "edit", "delete"],
  // customer_request: ["view", "create", "edit", "delete", "submit", "manage"],
  customer_attachment: ["create", "delete"],
  workspace_asset: ["view", "create", "edit", "delete", "manage"],
  workspace_project_state: ["view", "create", "edit", "delete"],
  workspace_feature: ["view", "edit"],
  workspace_worklog: ["view", "export"],
  workitem_relation: ["view", "create", "edit", "delete"],
  release: ["view", "create", "edit", "delete"],
  workspace_workitem_template: ["view", "create", "edit", "delete"],
  workspace_page_template: ["view", "create", "edit", "delete"],
  workspace_project_template: ["view", "create", "edit", "delete", "use", "publish"],
  workspace_workitem_type: ["view", "create", "edit", "delete"],
  workspace_custom_property: ["view", "create", "edit", "delete"],
  workspace_automation: ["view", "create", "edit", "delete"],
} as const;

/**
 * Teamspace-scoped resources and the actions they support.
 *
 * These resources always require a concrete teamspace context.
 */
export const TEAMSPACE_PERMISSION_RESOURCE_ACTIONS = {
  teamspace_workitem_view: ["view", "create", "edit", "delete", "share"],
  teamspace_comment: ["create", "edit", "delete", "react"],
  teamspace_page: ["view", "create", "edit", "delete", "archive"],
  teamspace_page_comment: ["create", "edit", "delete", "react", "resolve"],
} as const;

/**
 * Project-scoped resources and the actions they support.
 *
 * These resources can still be granted at workspace role-definition time, but are
 * evaluated against a project context at runtime.
 */
export const PROJECT_PERMISSION_RESOURCE_ACTIONS = {
  project_member: ["view", "invite", "edit", "remove", "change_role"],
  project_update: ["view", "create", "edit", "delete", "react"],
  project_update_comment: ["view", "create", "edit", "delete", "react"],
  comment: ["create", "edit", "delete", "react"],
  workitem: ["view", "create", "edit", "delete", "assign", "archive", "bulk_edit", "react", "export", "import"],
  epic: ["view", "create", "edit", "delete", "archive", "react", "export"],
  epic_update: ["view", "create", "edit", "delete", "react"],
  epic_update_comment: ["view", "create", "edit", "delete", "react"],
  module: ["view", "create", "edit", "delete", "manage", "archive"],
  cycle: ["view", "create", "edit", "delete", "manage", "archive"],
  cycle_update: ["view", "create", "edit", "delete", "react"],
  page: ["view", "create", "edit", "delete", "share"],
  workitem_view: ["view", "create", "edit", "delete", "share", "publish", "export"],
  intake: ["view", "create", "edit", "delete", "manage", "submit", "configure", "export", "react"],
  label: ["view", "create", "edit", "delete"],
  state: ["view", "create", "edit", "delete"],
  estimate: ["view", "create", "edit", "delete"],
  attachment: ["view", "create", "edit", "delete"],
  workitem_link: ["view", "create", "edit", "delete"],
  project_activity: ["view"],
  project_member_activity: ["view"],
  epic_link: ["view", "create", "edit", "delete"],
  epic_property: ["view", "create", "edit", "delete"],
  issue_property: ["view", "create", "edit", "delete"],
  project_automation: ["view", "create", "edit", "delete"],
  workflow: ["view", "create", "edit", "delete"],
  milestone: ["view", "create", "edit", "delete"],
  recurring_workitem: ["view", "create", "edit", "delete"],
  project_asset: ["view", "create", "edit", "delete"],
  project_link: ["view", "create", "edit", "delete"],
  project_workitem_template: ["view", "create", "edit", "delete"],
  project_page_template: ["view", "create", "edit", "delete"],
  project_workitem_type: ["view", "create", "edit", "delete"],
  project_custom_property: ["view", "create", "edit", "delete"],
} as const;

export type WorkspacePermissionResourceActionMap = typeof WORKSPACE_PERMISSION_RESOURCE_ACTIONS;
export type TeamspacePermissionResourceActionMap = typeof TEAMSPACE_PERMISSION_RESOURCE_ACTIONS;
export type ProjectPermissionResourceActionMap = typeof PROJECT_PERMISSION_RESOURCE_ACTIONS;

/**
 * Union of all workspace-only permission resources.
 */
export type WorkspacePermissionResource = keyof WorkspacePermissionResourceActionMap;
/**
 * Union of all teamspace-only permission resources.
 */
export type TeamspacePermissionResource = keyof TeamspacePermissionResourceActionMap;
/**
 * Union of all project-only permission resources.
 */
export type ProjectPermissionResource = keyof ProjectPermissionResourceActionMap;
/**
 * Union of every permission resource supported by Plane.
 */
export type PermissionResource = WorkspacePermissionResource | TeamspacePermissionResource | ProjectPermissionResource;

/**
 * Resolves valid action literals for a given resource.
 */
export type PermissionActionForResource<R extends PermissionResource> =
  R extends keyof WorkspacePermissionResourceActionMap
    ? WorkspacePermissionResourceActionMap[R][number]
    : R extends keyof TeamspacePermissionResourceActionMap
      ? TeamspacePermissionResourceActionMap[R][number]
      : R extends keyof ProjectPermissionResourceActionMap
        ? ProjectPermissionResourceActionMap[R][number]
        : never;
