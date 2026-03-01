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

import type { TPowerKCommandGroup } from "../../core/types";

export const POWER_K_GROUP_PRIORITY: Record<TPowerKCommandGroup, number> = {
  contextual: 1,
  create: 2,
  navigation: 3,
  actions: 4,
  general: 7,
  settings: 8,
  account: 9,
  miscellaneous: 10,
  preferences: 11,
  help: 12,
};

export const POWER_K_GROUP_I18N_TITLES: Record<TPowerKCommandGroup, string> = {
  contextual: "power_k.group_titles.contextual",
  navigation: "power_k.group_titles.navigation",
  create: "power_k.group_titles.create",
  actions: "power_k.group_titles.actions",
  general: "power_k.group_titles.general",
  settings: "power_k.group_titles.settings",
  help: "power_k.group_titles.help",
  account: "power_k.group_titles.account",
  miscellaneous: "power_k.group_titles.miscellaneous",
  preferences: "power_k.group_titles.preferences",
};
