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

export * from "./root";

// components
import type { TPowerKContextType } from "@/components/power-k/core/types";
// plane web imports
import { CONTEXT_ENTITY_MAP_EXTENDED } from "@/components/command-palette/power-k/pages/context-based";

export type TContextEntityMap = {
  i18n_title: string;
  i18n_indicator: string;
};

export const CONTEXT_ENTITY_MAP: Record<TPowerKContextType, TContextEntityMap> = {
  "work-item": {
    i18n_title: "power_k.contextual_actions.work_item.title",
    i18n_indicator: "power_k.contextual_actions.work_item.indicator",
  },
  page: {
    i18n_title: "power_k.contextual_actions.page.title",
    i18n_indicator: "power_k.contextual_actions.page.indicator",
  },
  cycle: {
    i18n_title: "power_k.contextual_actions.cycle.title",
    i18n_indicator: "power_k.contextual_actions.cycle.indicator",
  },
  module: {
    i18n_title: "power_k.contextual_actions.module.title",
    i18n_indicator: "power_k.contextual_actions.module.indicator",
  },
  ...CONTEXT_ENTITY_MAP_EXTENDED,
};
