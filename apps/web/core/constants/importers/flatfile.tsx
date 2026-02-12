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

import { Layers3 } from "lucide-react";
// plane web types
import type { TImporterStep } from "@/types/importers/flatfile";
import { E_IMPORTER_STEPS } from "@/types/importers/flatfile";

export const IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "flatfile_importer.steps.title_configure_plane",
    i18n_description: "flatfile_importer.steps.description_configure_plane",
    prevStep: undefined,
    nextStep: E_IMPORTER_STEPS.CONFIGURE_FLATFILE,
  },
  {
    key: E_IMPORTER_STEPS.CONFIGURE_FLATFILE,
    icon: () => <Layers3 size={14} />,
    i18n_title: "flatfile_importer.steps.title_configure_csv",
    i18n_description: "flatfile_importer.steps.description_configure_csv",
    prevStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: undefined,
  },
];
