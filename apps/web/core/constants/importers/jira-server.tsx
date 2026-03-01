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

import { Layers2, Layers3, SignalHigh, ReceiptText } from "lucide-react";
// types
import type { TImporterStep } from "@/types/importers/jira-server";
import { E_IMPORTER_STEPS } from "@/types/importers/jira-server";

export const IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "jira_server_importer.steps.title_configure_plane",
    i18n_description: "jira_server_importer.steps.description_configure_plane",
    prevStep: undefined,
    nextStep: E_IMPORTER_STEPS.CONFIGURE_JIRA,
  },
  {
    key: E_IMPORTER_STEPS.CONFIGURE_JIRA,
    icon: () => <Layers2 size={14} />,
    i18n_title: "jira_server_importer.steps.title_configure_jira",
    i18n_description: "jira_server_importer.steps.description_configure_jira",
    prevStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "jira_server_importer.steps.title_map_states",
    i18n_description: "jira_server_importer.steps.description_map_states",
    prevStep: E_IMPORTER_STEPS.CONFIGURE_JIRA,
    nextStep: E_IMPORTER_STEPS.MAP_PRIORITY,
  },
  {
    key: E_IMPORTER_STEPS.MAP_PRIORITY,
    icon: () => <SignalHigh size={14} />,
    i18n_title: "jira_server_importer.steps.title_map_priorities",
    i18n_description: "jira_server_importer.steps.description_map_priorities",
    prevStep: E_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "jira_server_importer.steps.title_summary",
    i18n_description: "jira_server_importer.steps.description_summary",
    prevStep: E_IMPORTER_STEPS.MAP_PRIORITY,
    nextStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];
