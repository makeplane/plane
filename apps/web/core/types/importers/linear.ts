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

import type { LinearPATAuthState } from "@plane/etl/linear";
// plane web types
import type { TStepperBlock } from "@/types/importers";

// authentication PAT form field types
export type TLinearPATFormFields = Omit<LinearPATAuthState, "workspaceId" | "workspaceSlug" | "userId" | "apiToken">;

// importer steps types
export enum E_LINEAR_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_LINEAR = "configure-linear",
  MAP_STATES = "map-states",
  SUMMARY = "summary",
}
export type TImporterLinearStepKeys =
  | E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR
  | E_LINEAR_IMPORTER_STEPS.MAP_STATES
  | E_LINEAR_IMPORTER_STEPS.SUMMARY;

export type TLinearImporterStep = TStepperBlock<TImporterLinearStepKeys>;

// Importer steps form-data types
export type TImporterLinearDataPayload = {
  [E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]: {
    teamId: string | undefined;
  };
  [E_LINEAR_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
};
