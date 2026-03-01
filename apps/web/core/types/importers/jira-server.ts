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

import type { JiraPATAuthState } from "@plane/etl/jira";
// plane web types
import type { TStepperBlock } from "@/types/importers";

// authentication PAT form field types
export type TJiraPATFormFields = Omit<JiraPATAuthState, "workspaceId" | "userId" | "apiToken">;

// importer steps types
export enum E_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_JIRA = "configure-jira",
  MAP_STATES = "map-states",
  MAP_PRIORITY = "map-priority",
  SUMMARY = "summary",
}
export type TImporterStepKeys =
  | E_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_IMPORTER_STEPS.CONFIGURE_JIRA
  | E_IMPORTER_STEPS.MAP_STATES
  | E_IMPORTER_STEPS.MAP_PRIORITY
  | E_IMPORTER_STEPS.SUMMARY;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

// Importer steps form-data types
export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.CONFIGURE_JIRA]: {
    resourceId: string | undefined;
    projectId: string | undefined;
    useCustomJql?: boolean;
    jql?: string;
  };
  [E_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {
    [key: string]: string | undefined;
  };
};
