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

import type { TClickUpAuthState } from "@plane/etl/clickup";
// plane web types
import type { TStepperBlock } from "@/types/importers";

// authentication PAT form field types
export type TClickUpPATFormFields = Omit<
  TClickUpAuthState,
  "workspaceId" | "workspaceSlug" | "userId" | "appInstallationId"
>;

// importer steps types
export enum E_CLICKUP_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_CLICKUP = "configure-clickup",
  MAP_STATES = "map-states",
  MAP_PRIORITIES = "map-priorities",
  SUMMARY = "summary",
}
export type TClickUpImporterStepKeys =
  | E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP
  | E_CLICKUP_IMPORTER_STEPS.MAP_STATES
  | E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES
  | E_CLICKUP_IMPORTER_STEPS.SUMMARY;

export type TClickUpImporterStep = TStepperBlock<TClickUpImporterStepKeys>;

// Importer steps form-data types
export type TImporterClickUpDataPayload = {
  [E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]: {
    teamId: string | undefined;
    spaceId: string | undefined;
    folderIds: string[];
    skipAdditionalDataImport: boolean;
  };
  [E_CLICKUP_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
  [E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES]: {
    [key: string]: string | undefined;
  };
  [E_CLICKUP_IMPORTER_STEPS.SUMMARY]: {
    skipUserImport: boolean;
  };
};
