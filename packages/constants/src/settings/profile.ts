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
import type { TProfileSettingsTabs } from "@plane/types";

export enum PROFILE_SETTINGS_CATEGORY {
  YOUR_PROFILE = "your profile",
  DEVELOPER = "developer",
}

export const PROFILE_SETTINGS_CATEGORIES: PROFILE_SETTINGS_CATEGORY[] = [
  PROFILE_SETTINGS_CATEGORY.YOUR_PROFILE,
  PROFILE_SETTINGS_CATEGORY.DEVELOPER,
];

export const PROFILE_SETTINGS: Record<
  TProfileSettingsTabs,
  {
    key: TProfileSettingsTabs;
    i18n_label: string;
  }
> = {
  general: {
    key: "general",
    i18n_label: "profile.actions.profile",
  },
  security: {
    key: "security",
    i18n_label: "profile.actions.security",
  },
  preferences: {
    key: "preferences",
    i18n_label: "profile.actions.preferences",
  },
  notifications: {
    key: "notifications",
    i18n_label: "profile.actions.notifications",
  },
  "api-tokens": {
    key: "api-tokens",
    i18n_label: "profile.actions.api-tokens",
  },
};

export const PROFILE_SETTINGS_TABS: TProfileSettingsTabs[] = Object.keys(PROFILE_SETTINGS) as TProfileSettingsTabs[];

export const GROUPED_PROFILE_SETTINGS: Record<
  PROFILE_SETTINGS_CATEGORY,
  { key: TProfileSettingsTabs; i18n_label: string }[]
> = {
  [PROFILE_SETTINGS_CATEGORY.YOUR_PROFILE]: [
    PROFILE_SETTINGS["general"],
    PROFILE_SETTINGS["preferences"],
    PROFILE_SETTINGS["notifications"],
    PROFILE_SETTINGS["security"],
  ],
  [PROFILE_SETTINGS_CATEGORY.DEVELOPER]: [PROFILE_SETTINGS["api-tokens"]],
};
