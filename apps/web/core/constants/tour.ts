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

export const NAVIGATION_TOUR_STEPS: TTourStep[] = [
  {
    id: "step-1",
    i18n_title: "product_tour.navigation.step_zero.title",
    i18n_description: "product_tour.navigation.step_zero.description",
    targetElement: '[data-tour="navigation-step-1"]',
    position: "bottom-right",
  },
  {
    id: "step-2",
    i18n_title: "product_tour.navigation.step_one.title",
    i18n_description: "product_tour.navigation.step_one.description",
    targetElement: '[data-tour="navigation-step-2"]',
    position: "bottom-right",
  },
  {
    id: "step-3",
    i18n_title: "product_tour.navigation.step_two.title",
    i18n_description: "product_tour.navigation.step_two.description",
    targetElement: '[data-tour="navigation-step-3"]',
    position: "bottom-right",
  },
];

export const WORKITEMS_TOUR_STEPS: TTourStep[] = [
  {
    id: "step-0",
    i18n_title: "product_tour.workitems.step_zero.title",
    i18n_description: "product_tour.workitems.step_zero.description",
    targetElement: undefined,
    position: "bottom-right",
    asset: "/tour/work-item/step-0",
  },
  {
    id: "step-1",
    i18n_title: "product_tour.workitems.step_one.title",
    i18n_description: "product_tour.workitems.step_one.description",
    targetElement: '[data-tour="work-item-step-1"]',
    position: "bottom-right",
    asset: "/tour/work-item/step-1",
  },
  {
    id: "step-2",
    i18n_title: "product_tour.workitems.step_two.title",
    i18n_description: "product_tour.workitems.step_two.description",
    targetElement: '[data-tour="work-item-step-2"]',
    position: "bottom-right",
    asset: "/tour/work-item/step-2",
  },
  {
    id: "step-3",
    i18n_title: "product_tour.workitems.step_three.title",
    i18n_description: "product_tour.workitems.step_three.description",
    targetElement: '[data-tour="work-item-step-3"]',
    position: "bottom-right",
    asset: "/tour/work-item/step-3",
  },
  {
    id: "step-4",
    i18n_title: "product_tour.workitems.step_four.title",
    i18n_description: "product_tour.workitems.step_four.description",
    targetElement: '[data-tour="work-item-step-4"]',
    position: "bottom-right",
    asset: "/tour/work-item/step-4",
  },
];

export const CYCLE_TOUR_STEPS: TTourStep[] = [
  {
    id: "step-0",
    i18n_title: "product_tour.cycle.step_zero.title",
    i18n_description: "product_tour.cycle.step_zero.description",
    targetElement: undefined,
    position: "bottom-right",
    asset: "/tour/cycle/step-0",
  },
  {
    id: "step-1",
    i18n_title: "product_tour.cycle.step_one.title",
    i18n_description: "product_tour.cycle.step_one.description",
    targetElement: '[data-tour="cycle-tour-step-1"]',
    position: "bottom-right",
    asset: "/tour/cycle/step-1",
  },
  {
    id: "step-2",
    i18n_title: "product_tour.cycle.step_two.title",
    i18n_description: "product_tour.cycle.step_two.description",
    targetElement: '[data-tour="cycle-tour-step-2"]',
    position: "bottom-right",
    asset: "/tour/cycle/step-2",
  },
  {
    id: "step-3",
    i18n_title: "product_tour.cycle.step_three.title",
    i18n_description: "product_tour.cycle.step_three.description",
    targetElement: '[data-tour="cycle-tour-step-3"]',
    position: "bottom-right",
    asset: "/tour/cycle/step-3",
  },
  {
    id: "step-4",
    i18n_title: "product_tour.cycle.step_four.title",
    i18n_description: "product_tour.cycle.step_four.description",
    targetElement: '[data-tour="cycle-tour-step-4"]',
    position: "bottom-right",
    asset: "/tour/cycle/step-4",
  },
];

export const MODULE_TOUR_STEPS: TTourStep[] = [
  {
    id: "step-0",
    i18n_title: "product_tour.module.step_zero.title",
    i18n_description: "product_tour.module.step_zero.description",
    targetElement: undefined,
    position: "bottom-right",
    asset: "/tour/module/step-0",
  },
  {
    id: "step-1",
    i18n_title: "product_tour.module.step_one.title",
    i18n_description: "product_tour.module.step_one.description",
    targetElement: '[data-tour="module-tour-step-1"]',
    position: "bottom-right",
    asset: "/tour/module/step-1",
  },
  {
    id: "step-2",
    i18n_title: "product_tour.module.step_two.title",
    i18n_description: "product_tour.module.step_two.description",
    targetElement: '[data-tour="module-tour-step-2"]',
    position: "bottom-right",
    asset: "/tour/module/step-2",
  },
  {
    id: "step-3",
    i18n_title: "product_tour.module.step_three.title",
    i18n_description: "product_tour.module.step_three.description",
    targetElement: '[data-tour="module-tour-step-3"]',
    position: "bottom-right",
    asset: "/tour/module/step-3",
  },
  {
    id: "step-4",
    i18n_title: "product_tour.module.step_four.title",
    i18n_description: "product_tour.module.step_four.description",
    targetElement: '[data-tour="module-tour-step-4"]',
    position: "bottom-right",
    asset: "/tour/module/step-4",
  },
];

export const PAGE_TOUR_STEPS: TTourStep[] = [
  {
    id: "step-0",
    i18n_title: "product_tour.page.step_zero.title",
    i18n_description: "product_tour.page.step_zero.description",
    targetElement: undefined,
    position: "bottom-right",
    asset: "/tour/page/step-0",
  },
  {
    id: "step-1",
    i18n_title: "product_tour.page.step_one.title",
    i18n_description: "product_tour.page.step_one.description",
    targetElement: '[data-tour="page-tour-step-1"]',
    position: "bottom-right",
    asset: "/tour/page/step-1",
  },
  {
    id: "step-2",
    i18n_title: "product_tour.page.step_two.title",
    i18n_description: "product_tour.page.step_two.description",
    targetElement: '[data-tour="page-tour-step-2"]',
    position: "bottom-right",
    asset: "/tour/page/step-2",
  },
  {
    id: "step-3",
    i18n_title: "product_tour.page.step_three.title",
    i18n_description: "product_tour.page.step_three.description",
    targetElement: '[data-tour="page-tour-step-3"]',
    position: "bottom-right",
    asset: "/tour/page/step-3",
  },
  {
    id: "step-4",
    i18n_title: "product_tour.page.step_four.title",
    i18n_description: "product_tour.page.step_four.description",
    targetElement: '[data-tour="page-tour-step-4"]',
    position: "bottom-right",
    asset: "/tour/page/step-4",
  },
  {
    id: "step-5",
    i18n_title: "product_tour.page.step_five.title",
    i18n_description: "product_tour.page.step_five.description",
    targetElement: '[data-tour="page-tour-step-5"]',
    position: "bottom-right",
    asset: "/tour/page/step-5",
  },
];

export const INTAKE_TOUR_STEPS: TTourStep[] = [
  {
    id: "step-0",
    i18n_title: "product_tour.intake.step_zero.title",
    i18n_description: "product_tour.intake.step_zero.description",
    targetElement: '[data-tour="intake-tour-step-0"]',
    position: "bottom-right",
    asset: "/tour/intake/step-0",
  },
  {
    id: "step-1",
    i18n_title: "product_tour.intake.step_one.title",
    i18n_description: "product_tour.intake.step_one.description",
    targetElement: '[data-tour="intake-tour-step-1"]',
    position: "bottom-right",
    asset: "/tour/intake/step-1",
  },
  {
    id: "step-2",
    i18n_title: "product_tour.intake.step_two.title",
    i18n_description: "product_tour.intake.step_two.description",
    targetElement: '[data-tour="intake-tour-step-2"]',
    position: "bottom-right",
    asset: "/tour/intake/step-2",
  },
  {
    id: "step-3",
    i18n_title: "product_tour.intake.step_three.title",
    i18n_description: "product_tour.intake.step_three.description",
    targetElement: '[data-tour="intake-tour-step-3"]',
    position: "bottom-right",
    asset: "/tour/intake/step-3",
  },
];
