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

import { FileUp, Layers3 } from "lucide-react";
// plane web types
import type { TCSVImporterStep } from "@/types/importers/csv";
import { E_CSV_IMPORTER_STEPS } from "@/types/importers/csv";

export const CSV_IMPORTER_STEPS: TCSVImporterStep[] = [
  {
    key: E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "csv_importer.steps.title_select_project",
    i18n_description: "csv_importer.steps.description_select_project",
    prevStep: undefined,
    nextStep: E_CSV_IMPORTER_STEPS.UPLOAD_CSV,
  },
  {
    key: E_CSV_IMPORTER_STEPS.UPLOAD_CSV,
    icon: () => <FileUp size={14} />,
    i18n_title: "csv_importer.steps.title_upload_csv",
    i18n_description: "csv_importer.steps.description_upload_csv",
    prevStep: E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: undefined,
  },
];
