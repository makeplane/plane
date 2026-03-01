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
import { EUserProjectRoles } from "@plane/types";
import type { TProjectSettingsItem, TProjectSettingsTabs } from "@plane/types";

export enum PROJECT_SETTINGS_CATEGORY {
  GENERAL = "general",
  FEATURES = "features",
  WORK_STRUCTURE = "work-structure",
  EXECUTION = "execution",
}

export const PROJECT_SETTINGS_CATEGORIES: PROJECT_SETTINGS_CATEGORY[] = [
  PROJECT_SETTINGS_CATEGORY.GENERAL,
  PROJECT_SETTINGS_CATEGORY.FEATURES,
  PROJECT_SETTINGS_CATEGORY.WORK_STRUCTURE,
  PROJECT_SETTINGS_CATEGORY.EXECUTION,
];

export const PROJECT_SETTINGS: Record<TProjectSettingsTabs, TProjectSettingsItem> = {
  general: {
    key: "general",
    i18n_label: "common.general",
    href: ``,
    access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER, EUserProjectRoles.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/`,
  },
  members: {
    key: "members",
    i18n_label: "common.members",
    href: `/members`,
    access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER, EUserProjectRoles.GUEST],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/members/`,
  },
  worklogs: {
    key: "worklogs",
    i18n_label: "common.worklogs",
    href: `/worklogs`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/worklogs/`,
  },
  features_cycles: {
    key: "features_cycles",
    i18n_label: "project_settings.features.cycles.short_title",
    href: `/features/cycles`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/cycles/`,
  },
  features_modules: {
    key: "features_modules",
    i18n_label: "project_settings.features.modules.short_title",
    href: `/features/modules`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/modules/`,
  },
  features_views: {
    key: "features_views",
    i18n_label: "project_settings.features.views.short_title",
    href: `/features/views`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/views/`,
  },
  features_pages: {
    key: "features_pages",
    i18n_label: "project_settings.features.pages.short_title",
    href: `/features/pages`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/pages/`,
  },
  features_intake: {
    key: "features_intake",
    i18n_label: "project_settings.features.intake.short_title",
    href: `/features/intake`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/intake/`,
  },
  states: {
    key: "states",
    i18n_label: "common.states",
    href: `/states`,
    access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/states/`,
  },
  labels: {
    key: "labels",
    i18n_label: "common.labels",
    href: `/labels`,
    access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/labels/`,
  },
  estimates: {
    key: "estimates",
    i18n_label: "common.estimates",
    href: `/estimates`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/estimates/`,
  },
  automations: {
    key: "automations",
    i18n_label: "project_settings.automations.label",
    href: `/automations`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/automations/`,
  },
  "work-item-types": {
    key: "work-item-types",
    i18n_label: "work_item_types.label",
    href: `/work-item-types`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/work-item-types/`,
  },
  workflows: {
    key: "workflows",
    i18n_label: "common.workflows",
    href: `/workflows`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/workflows/`,
  },
  epics: {
    key: "epics",
    i18n_label: "common.epics",
    href: `/epics`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/epics/`,
  },
  project_updates: {
    key: "project_updates",
    i18n_label: "common.project_updates",
    href: `/project-updates`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/project-updates/`,
  },
  templates: {
    key: "templates",
    i18n_label: "common.templates",
    href: `/templates`,
    access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname.startsWith(`${baseUrl}/templates/`),
  },
  recurring_work_items: {
    key: "recurring_work_items",
    i18n_label: "common.recurring_work_items",
    href: `/recurring-work-items`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname.startsWith(`${baseUrl}/recurring-work-items/`),
  },
  features_time_tracking: {
    key: "features_time_tracking",
    i18n_label: "project_settings.features.time_tracking.short_title",
    href: `/features/time-tracking`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/time-tracking/`,
  },
  features_milestones: {
    key: "features_milestones",
    i18n_label: "project_settings.features.milestones.short_title",
    href: `/features/milestones`,
    access: [EUserProjectRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/features/milestones/`,
  },
};

export const PROJECT_SETTINGS_FLAT_MAP: TProjectSettingsItem[] = Object.values(PROJECT_SETTINGS);

export const GROUPED_PROJECT_SETTINGS: Record<PROJECT_SETTINGS_CATEGORY, TProjectSettingsItem[]> = {
  [PROJECT_SETTINGS_CATEGORY.GENERAL]: [
    PROJECT_SETTINGS["general"],
    PROJECT_SETTINGS["members"],
    PROJECT_SETTINGS["worklogs"],
  ],
  [PROJECT_SETTINGS_CATEGORY.FEATURES]: [
    PROJECT_SETTINGS["features_cycles"],
    PROJECT_SETTINGS["features_modules"],
    PROJECT_SETTINGS["features_views"],
    PROJECT_SETTINGS["features_pages"],
    PROJECT_SETTINGS["features_intake"],
    PROJECT_SETTINGS["features_time_tracking"],
    PROJECT_SETTINGS["features_milestones"],
    PROJECT_SETTINGS["project_updates"],
  ],
  [PROJECT_SETTINGS_CATEGORY.WORK_STRUCTURE]: [
    PROJECT_SETTINGS["states"],
    PROJECT_SETTINGS["labels"],
    PROJECT_SETTINGS["estimates"],
    PROJECT_SETTINGS["epics"],
    PROJECT_SETTINGS["work-item-types"],
    PROJECT_SETTINGS["templates"],
  ],
  [PROJECT_SETTINGS_CATEGORY.EXECUTION]: [
    PROJECT_SETTINGS["workflows"],
    PROJECT_SETTINGS["automations"],
    PROJECT_SETTINGS["recurring_work_items"],
  ],
};
