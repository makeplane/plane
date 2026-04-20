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

// plane imports
import type { TWorkspaceSettingsItem, TWorkspaceSettingsTabs } from "@plane/types";

export enum WORKSPACE_SETTINGS_CATEGORY {
  ADMINISTRATION = "administration",
  ROLES_AND_PERMISSIONS_SCHEMES = "roles_and_permissions_schemes",
  FEATURES = "features",
  DEVELOPER = "developer",
}

export const WORKSPACE_SETTINGS_CATEGORIES: WORKSPACE_SETTINGS_CATEGORY[] = [
  WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION,
  WORKSPACE_SETTINGS_CATEGORY.ROLES_AND_PERMISSIONS_SCHEMES,
  WORKSPACE_SETTINGS_CATEGORY.FEATURES,
  WORKSPACE_SETTINGS_CATEGORY.DEVELOPER,
];

export const WORKSPACE_SETTINGS: Record<TWorkspaceSettingsTabs, TWorkspaceSettingsItem> = {
  general: {
    key: "general",
    i18n_label: "workspace_settings.settings.general.title",
    href: `/settings`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/`,
  },
  members: {
    key: "members",
    i18n_label: "workspace_settings.settings.members.title",
    href: `/settings/members`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members/`,
  },
  "billing-and-plans": {
    key: "billing-and-plans",
    i18n_label: "workspace_settings.settings.billing_and_plans.title",
    href: `/settings/billing`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/billing/`,
  },
  export: {
    key: "export",
    i18n_label: "workspace_settings.settings.exports.title",
    href: `/settings/exports`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/exports/`,
  },
  webhooks: {
    key: "webhooks",
    i18n_label: "workspace_settings.settings.webhooks.title",
    href: `/settings/webhooks`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/webhooks/`,
  },
  integrations: {
    key: "integrations",
    i18n_label: "workspace_settings.settings.integrations.title",
    href: `/settings/integrations`,
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/integrations/`),
  },
  scripts: {
    key: "scripts",
    i18n_label: "workspace_settings.settings.runners.title",
    href: `/settings/runner`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/runner/`,
  },
  connections: {
    key: "connections",
    i18n_label: "profile.actions.connections",
    href: `/settings/connections`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/connections/`,
  },
  import: {
    key: "import",
    i18n_label: "workspace_settings.settings.imports.title",
    href: `/settings/imports`,
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/imports/`),
  },
  worklogs: {
    key: "worklogs",
    i18n_label: "workspace_settings.settings.worklogs.title",
    href: `/settings/worklogs`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/worklogs/`,
  },
  "group-syncing": {
    key: "group-syncing",
    i18n_label: "workspace_settings.settings.group_syncing.title",
    href: `/settings/group-syncing`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/group-syncing/`,
    beta: true,
  },
  identity: {
    key: "identity",
    i18n_label: "workspace_settings.settings.identity.title",
    href: `/settings/identity`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/identity/`,
  },
  project_states: {
    key: "project_states",
    i18n_label: "workspace_settings.settings.projects.title",
    href: `/settings/project-configuration`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/project-configuration/`,
  },
  teamspaces: {
    key: "teamspaces",
    i18n_label: "workspace_settings.settings.teamspaces.title",
    href: `/settings/teamspaces`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/teamspaces/`,
  },
  initiatives: {
    key: "initiatives",
    i18n_label: "workspace_settings.settings.initiatives.title",
    href: `/settings/initiatives`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/initiatives/`,
  },
  customers: {
    key: "customers",
    i18n_label: "workspace_settings.settings.customers.title",
    href: "/settings/customers",
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/customers/`,
  },
  releases: {
    key: "releases",
    i18n_label: "workspace_settings.settings.releases.title",
    href: "/settings/releases",
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/releases/`,
  },
  templates: {
    key: "templates",
    i18n_label: "common.templates",
    href: "/settings/templates",
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/templates/`),
  },
  relations: {
    key: "relations",
    i18n_label: "workspace_settings.settings.relations.title",
    href: `/settings/relations`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/relations/`,
  },
  "plane-intelligence": {
    key: "plane-intelligence",
    i18n_label: "workspace_settings.settings.plane-intelligence.title",
    href: `/settings/plane-intelligence`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/plane-intelligence/`,
  },
  "access-tokens": {
    key: "access-tokens",
    i18n_label: "workspace_settings.settings.api_tokens.title",
    href: `/settings/access-tokens`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/access-tokens/`,
  },
  project_roles_and_schemes: {
    key: "project_roles_and_schemes",
    i18n_label: "workspace_settings.settings.project_roles_and_schemes.sidebar_label",
    href: "/settings/project-roles-and-schemes",
    highlight: (pathname: string, baseUrl: string) =>
      pathname.startsWith(`${baseUrl}/settings/project-roles-and-schemes`),
  },
  workspace_roles_and_schemes: {
    key: "workspace_roles_and_schemes",
    i18n_label: "workspace_settings.settings.workspace_roles_and_schemes.sidebar_label",
    href: "/settings/workspace-roles-and-schemes",
    highlight: (pathname: string, baseUrl: string) =>
      pathname.startsWith(`${baseUrl}/settings/workspace-roles-and-schemes`),
  },
  work_item_types: {
    key: "work_item_types",
    i18n_label: "work_item_types.label",
    href: `/settings/work-item-types`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/work-item-types/`,
  },
  automations: {
    key: "automations",
    i18n_label: "automations.global_automations.settings.sidebar_label",
    href: `/settings/automations`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/automations/`,
  },
};

export const GROUPED_WORKSPACE_SETTINGS: Record<WORKSPACE_SETTINGS_CATEGORY, TWorkspaceSettingsItem[]> = {
  [WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION]: [
    WORKSPACE_SETTINGS["general"],
    WORKSPACE_SETTINGS["members"],
    WORKSPACE_SETTINGS["billing-and-plans"],
    WORKSPACE_SETTINGS["import"],
    WORKSPACE_SETTINGS["export"],
    WORKSPACE_SETTINGS["worklogs"],
    WORKSPACE_SETTINGS["group-syncing"],
    WORKSPACE_SETTINGS["identity"],
  ],
  [WORKSPACE_SETTINGS_CATEGORY.ROLES_AND_PERMISSIONS_SCHEMES]: [
    WORKSPACE_SETTINGS["workspace_roles_and_schemes"],
    WORKSPACE_SETTINGS["project_roles_and_schemes"],
  ],
  [WORKSPACE_SETTINGS_CATEGORY.FEATURES]: [
    WORKSPACE_SETTINGS["project_states"],
    WORKSPACE_SETTINGS["integrations"],
    WORKSPACE_SETTINGS["scripts"],
    WORKSPACE_SETTINGS["connections"],
    WORKSPACE_SETTINGS["teamspaces"],
    WORKSPACE_SETTINGS["initiatives"],
    WORKSPACE_SETTINGS["customers"],
    WORKSPACE_SETTINGS["releases"],
    WORKSPACE_SETTINGS["templates"],
    WORKSPACE_SETTINGS["relations"],
    WORKSPACE_SETTINGS["plane-intelligence"],
    WORKSPACE_SETTINGS["work_item_types"],
    WORKSPACE_SETTINGS["automations"],
  ],
  [WORKSPACE_SETTINGS_CATEGORY.DEVELOPER]: [WORKSPACE_SETTINGS["webhooks"], WORKSPACE_SETTINGS["access-tokens"]],
};
