/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TWorkspaceSettingsItem, TWorkspaceSettingsTabs } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";

export enum WORKSPACE_SETTINGS_CATEGORY {
  ADMINISTRATION = "administration",
  FEATURES = "features",
  CUSTOM_FIELDS = "custom_fields",
  INTEGRATIONS = "integrations",
  DEVELOPER = "developer",
}

export const WORKSPACE_SETTINGS_CATEGORIES: WORKSPACE_SETTINGS_CATEGORY[] = [
  WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION,
  WORKSPACE_SETTINGS_CATEGORY.FEATURES,
  WORKSPACE_SETTINGS_CATEGORY.CUSTOM_FIELDS,
  WORKSPACE_SETTINGS_CATEGORY.INTEGRATIONS,
  WORKSPACE_SETTINGS_CATEGORY.DEVELOPER,
];

export const WORKSPACE_SETTINGS_CATEGORY_LABELS: Record<WORKSPACE_SETTINGS_CATEGORY, string> = {
  [WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION]: "common.administration",
  [WORKSPACE_SETTINGS_CATEGORY.FEATURES]: "common.features",
  [WORKSPACE_SETTINGS_CATEGORY.CUSTOM_FIELDS]: "common.custom_fields",
  [WORKSPACE_SETTINGS_CATEGORY.INTEGRATIONS]: "common.integrations",
  [WORKSPACE_SETTINGS_CATEGORY.DEVELOPER]: "common.developer",
};

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
  "custom-fields-projects": {
    key: "custom-fields-projects",
    i18n_label: "workspace_settings.settings.custom_fields.projects.title",
    href: `/settings/custom-fields/projects`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/custom-fields/projects/`,
  },
  "custom-fields-work-items": {
    key: "custom-fields-work-items",
    i18n_label: "workspace_settings.settings.custom_fields.work_items.title",
    href: `/settings/custom-fields/work-items`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/custom-fields/work-items/`,
  },
  "crm-sync": {
    key: "crm-sync",
    i18n_label: "workspace_settings.settings.crm_sync.title",
    href: `/settings/crm-sync`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/crm-sync/`,
  },
};

export const WORKSPACE_SETTINGS_ACCESS: Record<string, EUserWorkspaceRoles[]> = {
  ...Object.fromEntries(Object.entries(WORKSPACE_SETTINGS).map(([_, { href, access }]) => [href, access])),
  // Custom fields use a nested route (/settings/custom-fields/<entity>). The settings
  // layout derives the access key from only the first two path segments, so register
  // the category prefix too — every custom-fields sub-page is workspace-admin only.
  "/settings/custom-fields": WORKSPACE_SETTINGS["custom-fields-projects"].access,
};

export const GROUPED_WORKSPACE_SETTINGS: Record<WORKSPACE_SETTINGS_CATEGORY, TWorkspaceSettingsItem[]> = {
  [WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION]: [
    WORKSPACE_SETTINGS["general"],
    WORKSPACE_SETTINGS["members"],
    WORKSPACE_SETTINGS["billing-and-plans"],
    WORKSPACE_SETTINGS["export"],
  ],
  [WORKSPACE_SETTINGS_CATEGORY.FEATURES]: [],
  [WORKSPACE_SETTINGS_CATEGORY.CUSTOM_FIELDS]: [
    WORKSPACE_SETTINGS["custom-fields-projects"],
    WORKSPACE_SETTINGS["custom-fields-work-items"],
  ],
  [WORKSPACE_SETTINGS_CATEGORY.INTEGRATIONS]: [WORKSPACE_SETTINGS["crm-sync"]],
  [WORKSPACE_SETTINGS_CATEGORY.DEVELOPER]: [WORKSPACE_SETTINGS["webhooks"]],
};
