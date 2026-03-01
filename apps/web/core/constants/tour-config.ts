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

import type { TTourStep } from "@plane/propel/tour";
import type { TProductTour } from "@plane/types";
import {
  NAVIGATION_TOUR_STEPS,
  WORKITEMS_TOUR_STEPS,
  CYCLE_TOUR_STEPS,
  MODULE_TOUR_STEPS,
  PAGE_TOUR_STEPS,
  INTAKE_TOUR_STEPS,
} from "./tour";

export const TOUR_TYPES = {
  NAVIGATION: "navigation",
  WORK_ITEMS: "work_items",
  CYCLES: "cycles",
  MODULES: "modules",
  PAGES: "pages",
  INTAKE: "intake",
} as const;

export type TTourType = (typeof TOUR_TYPES)[keyof typeof TOUR_TYPES];

type TTourConfig = {
  tourId: string;
  steps: TTourStep[];
  storageType: "user_profile" | "workspace_properties";
  propertyKey?: keyof TProductTour; // Only for workspace_properties
};

export const TOUR_CONFIG_MAP: Record<TTourType, TTourConfig> = {
  [TOUR_TYPES.NAVIGATION]: {
    tourId: "navigation",
    steps: NAVIGATION_TOUR_STEPS,
    storageType: "user_profile",
  },
  [TOUR_TYPES.WORK_ITEMS]: {
    tourId: "work_items",
    steps: WORKITEMS_TOUR_STEPS,
    storageType: "workspace_properties",
    propertyKey: "work_items",
  },
  [TOUR_TYPES.CYCLES]: {
    tourId: "cycles",
    steps: CYCLE_TOUR_STEPS,
    storageType: "workspace_properties",
    propertyKey: "cycles",
  },
  [TOUR_TYPES.MODULES]: {
    tourId: "modules",
    steps: MODULE_TOUR_STEPS,
    storageType: "workspace_properties",
    propertyKey: "modules",
  },
  [TOUR_TYPES.PAGES]: {
    tourId: "pages",
    steps: PAGE_TOUR_STEPS,
    storageType: "workspace_properties",
    propertyKey: "pages",
  },
  [TOUR_TYPES.INTAKE]: {
    tourId: "intake",
    steps: INTAKE_TOUR_STEPS,
    storageType: "workspace_properties",
    propertyKey: "intake",
  },
};
