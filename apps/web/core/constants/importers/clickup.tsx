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

import { Layers2, Layers3, ReceiptText } from "lucide-react";
// types
import type { TClickUpImporterStep } from "@/types/importers/clickup";
import { E_CLICKUP_IMPORTER_STEPS } from "@/types/importers/clickup";

export const IMPORTER_CLICKUP_STEPS_V1: TClickUpImporterStep[] = [
  {
    key: E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_configure_plane",
    i18n_description: "clickup_importer.steps.description_configure_plane",
    prevStep: undefined,
    nextStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    icon: () => <Layers2 size={14} />,
    i18n_title: "clickup_importer.steps.title_configure_clickup",
    i18n_description: "clickup_importer.steps.description_configure_clickup",
    prevStep: E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_CLICKUP_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_map_states",
    i18n_description: "clickup_importer.steps.description_map_states",
    prevStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    nextStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_map_priorities",
    i18n_description: "clickup_importer.steps.description_map_priorities",
    prevStep: E_CLICKUP_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "clickup_importer.steps.title_summary",
    i18n_description: "clickup_importer.steps.description_summary",
    prevStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    nextStep: E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];

export const IMPORTER_CLICKUP_STEPS: TClickUpImporterStep[] = [
  {
    key: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    icon: () => <Layers2 size={14} />,
    i18n_title: "clickup_importer.steps.title_configure_clickup",
    i18n_description: "clickup_importer.steps.description_configure_clickup",
    prevStep: undefined,
    nextStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "clickup_importer.steps.title_map_priorities",
    i18n_description: "clickup_importer.steps.description_map_priorities",
    prevStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
    nextStep: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_CLICKUP_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "clickup_importer.steps.title_summary",
    i18n_description: "clickup_importer.steps.description_summary",
    prevStep: E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES,
    nextStep: E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP,
  },
];
