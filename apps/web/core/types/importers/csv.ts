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

// plane web types
import type { TStepperBlock } from "@/types/importers";

// importer steps types
export enum E_CSV_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  UPLOAD_CSV = "upload-csv",
}

export type TCSVImporterStepKeys = E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT | E_CSV_IMPORTER_STEPS.UPLOAD_CSV;

export type TCSVImporterStep = TStepperBlock<TCSVImporterStepKeys>;

// Importer steps form-data types
export type TCSVImporterDataPayload = {
  [E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_CSV_IMPORTER_STEPS.UPLOAD_CSV]: {
    assetId: string | undefined;
    fileName: string | undefined;
  };
};
