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

export type TProfileSettingsTabs = "general" | "preferences" | "notifications" | "security" | "api-tokens";

export type TWorkspaceSettingsTabs =
  | "general"
  | "members"
  | "permissions"
  | "billing-and-plans"
  | "export"
  | "webhooks"
  | "integrations"
  | "import"
  | "worklogs"
  | "group-syncing"
  | "identity"
  | "project_states"
  | "teamspaces"
  | "initiatives"
  | "customers"
  | "releases"
  | "templates"
  | "plane-intelligence"
  | "connections"
  | "scripts"
  | "access-tokens"
  | "project_roles_and_schemes"
  | "workspace_roles_and_schemes"
  | "work_item_types"
  | "relations"
  | "automations";

export type TWorkspaceSettingsItem = {
  key: TWorkspaceSettingsTabs;
  i18n_label: string;
  href: string;
  highlight: (pathname: string, baseUrl: string) => boolean;
  beta?: boolean;
};

export type TProjectSettingsTabs =
  | "general"
  | "members"
  | "worklogs"
  | "features_cycles"
  | "features_modules"
  | "features_views"
  | "features_pages"
  | "features_intake"
  | "features_time_tracking"
  | "features_milestones"
  | "states"
  | "labels"
  | "estimates"
  | "automations"
  | "work-item-types"
  | "workflows"
  | "epics"
  | "project_updates"
  | "templates"
  | "recurring_work_items";
export type TProjectSettingsItem = {
  key: TProjectSettingsTabs;
  i18n_label: string;
  href: string;
  highlight: (pathname: string, baseUrl: string) => boolean;
};
