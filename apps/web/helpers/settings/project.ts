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

import { store } from "@/lib/store-context";

/**
 * @description Get the i18n key for the project settings page label
 * @param settingsKey - The key of the project settings page
 * @param defaultLabelKey - The default i18n key for the project settings page label
 * @returns The i18n key for the project settings page label
 */
export const getProjectSettingsPageLabelI18nKey = (settingsKey: string, defaultLabelKey: string) => {
  if (settingsKey === "members" && store.teamspaceRoot.teamspaces.isTeamspacesFeatureEnabled) {
    return "common.members_and_teamspaces";
  }
  return defaultLabelKey;
};
