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
import { EUserWorkspaceRoles } from "@plane/types";

export enum WORKSPACE_SETTINGS_CATEGORY {
  ADMINISTRATION = "administration",
  FEATURES = "features",
  DEVELOPER = "developer",
}

export const WORKSPACE_SETTINGS_CATEGORIES: WORKSPACE_SETTINGS_CATEGORY[] = [
  WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION,
  WORKSPACE_SETTINGS_CATEGORY.FEATURES,
  WORKSPACE_SETTINGS_CATEGORY.DEVELOPER,
];

export const WORKSPACE_SETTINGS: Record<TWorkspaceSettingsTabs, TWorkspaceSettingsItem> = {
  general: {
    key: "general",
    i18n_label: "workspace_settings.settings.general.title",
    href: `/settings`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/`,
  },
  members: {
    key: "members",
    i18n_label: "workspace_settings.settings.members.title",
    href: `/settings/members`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members/`,
  },
  "billing-and-plans": {
    key: "billing-and-plans",
    i18n_label: "workspace_settings.settings.billing_and_plans.title",
    href: `/settings/billing`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/billing/`,
  },
  export: {
    key: "export",
    i18n_label: "workspace_settings.settings.exports.title",
    href: `/settings/exports`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/exports/`,
  },
  webhooks: {
    key: "webhooks",
    i18n_label: "workspace_settings.settings.webhooks.title",
    href: `/settings/webhooks`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/webhooks/`,
  },
  integrations: {
    key: "integrations",
    i18n_label: "workspace_settings.settings.integrations.title",
    href: `/settings/integrations`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/integrations/`),
  },
  scripts: {
    key: "scripts",
    i18n_label: "workspace_settings.settings.runners.title",
    href: `/settings/runner`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/runner/`,
  },
  connections: {
    key: "connections",
    i18n_label: "profile.actions.connections",
    href: `/settings/connections`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/connections/`,
  },
  import: {
    key: "import",
    i18n_label: "workspace_settings.settings.imports.title",
    href: `/settings/imports`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/imports/`),
  },
  worklogs: {
    key: "worklogs",
    i18n_label: "workspace_settings.settings.worklogs.title",
    href: `/settings/worklogs`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/worklogs/`,
  },
  "group-syncing": {
    key: "group-syncing",
    i18n_label: "workspace_settings.settings.group_syncing.title",
    href: `/settings/group-syncing`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/group-syncing/`,
  },
  identity: {
    key: "identity",
    i18n_label: "workspace_settings.settings.identity.title",
    href: `/settings/identity`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/identity/`,
  },
  project_states: {
    key: "project_states",
    i18n_label: "workspace_settings.settings.projects.title",
    href: `/settings/project-states`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/project-states/`,
  },
  teamspaces: {
    key: "teamspaces",
    i18n_label: "workspace_settings.settings.teamspaces.title",
    href: `/settings/teamspaces`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/teamspaces/`,
  },
  initiatives: {
    key: "initiatives",
    i18n_label: "workspace_settings.settings.initiatives.title",
    href: `/settings/initiatives`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/initiatives/`,
  },
  customers: {
    key: "customers",
    i18n_label: "workspace_settings.settings.customers.title",
    href: "/settings/customers",
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/customers/`,
  },
  releases: {
    key: "releases",
    i18n_label: "workspace_settings.settings.releases.title",
    href: "/settings/releases",
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/releases/`,
  },
  templates: {
    key: "templates",
    i18n_label: "common.templates",
    href: "/settings/templates",
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/settings/templates/`),
  },
  relations: {
    key: "relations",
    i18n_label: "workspace_settings.settings.relations.title",
    href: `/settings/relations`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/relations/`,
  },
  "plane-intelligence": {
    key: "plane-intelligence",
    i18n_label: "workspace_settings.settings.plane-intelligence.title",
    href: `/settings/plane-intelligence`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/plane-intelligence/`,
  },
  "access-tokens": {
    key: "access-tokens",
    i18n_label: "workspace_settings.settings.api_tokens.title",
    href: `/settings/access-tokens`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/access-tokens/`,
  },
  work_item_types: {
    key: "work_item_types",
    i18n_label: "work_item_types.label",
    href: `/settings/work-item-types`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/work-item-types/`,
  },
};

export const WORKSPACE_SETTINGS_ACCESS = Object.fromEntries(
  Object.entries(WORKSPACE_SETTINGS).map(([_, { href, access }]) => [href, access])
);

export const GROUPED_WORKSPACE_SETTINGS: Record<WORKSPACE_SETTINGS_CATEGORY, TWorkspaceSettingsItem[]> = {
  [WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION]: [
    WORKSPACE_SETTINGS["general"],
    WORKSPACE_SETTINGS["members"],
    WORKSPACE_SETTINGS["billing-and-plans"],
    WORKSPACE_SETTINGS["import"],
    WORKSPACE_SETTINGS["export"],
    WORKSPACE_SETTINGS["worklogs"],
    WORKSPACE_SETTINGS["group-syncing"],
    // WORKSPACE_SETTINGS["identity"], // TODO: Enable it back once production testing is complete
    WORKSPACE_SETTINGS["identity"],
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
  ],
  [WORKSPACE_SETTINGS_CATEGORY.DEVELOPER]: [WORKSPACE_SETTINGS["webhooks"], WORKSPACE_SETTINGS["access-tokens"]],
};
