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
export enum E_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_FLATFILE = "configure-flatfile",
}
export type TImporterStepKeys = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT | E_IMPORTER_STEPS.CONFIGURE_FLATFILE;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

// Importer steps form-data types
export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.CONFIGURE_FLATFILE]: {
    workbookId: string | undefined;
    environmentId: string | undefined;
    spaceId: string | undefined;
    appId: string | undefined;
    jobId: string | undefined;
    actorId: string | undefined;
  };
};
