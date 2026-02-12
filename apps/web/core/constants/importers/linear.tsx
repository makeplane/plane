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
import type { TLinearImporterStep } from "@/types/importers/linear";
import { E_LINEAR_IMPORTER_STEPS } from "@/types/importers/linear";

export const IMPORTER_LINEAR_STEPS: TLinearImporterStep[] = [
  {
    key: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "linear_importer.steps.title_configure_plane",
    i18n_description: "linear_importer.steps.description_configure_plane",
    prevStep: undefined,
    nextStep: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
    icon: () => <Layers2 size={14} />,
    i18n_title: "linear_importer.steps.title_configure_linear",
    i18n_description: "linear_importer.steps.description_configure_linear",
    prevStep: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "linear_importer.steps.title_map_states",
    i18n_description: "linear_importer.steps.description_map_states",
    prevStep: E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR,
    nextStep: E_LINEAR_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_LINEAR_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "linear_importer.steps.title_summary",
    i18n_description: "linear_importer.steps.description_summary",
    prevStep: E_LINEAR_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];
