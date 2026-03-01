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

import type { AsanaPATAuthState } from "@plane/etl/asana";

// authentication PAT form field types
export type TAsanaPATFormFields = Omit<AsanaPATAuthState, "workspaceId" | "userId" | "apiToken">;

export enum E_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_ASANA = "configure-asana",
  MAP_STATES = "map-states",
  MAP_PRIORITY = "map-priority",
  SUMMARY = "summary",
}

export type TImporterStepKeys =
  | E_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_IMPORTER_STEPS.CONFIGURE_ASANA
  | E_IMPORTER_STEPS.MAP_STATES
  | E_IMPORTER_STEPS.MAP_PRIORITY
  | E_IMPORTER_STEPS.SUMMARY;

export type TStepperBlock<T> = {
  key: T;
  icon?: () => React.ReactNode;
  i18n_title: string;
  i18n_description: string;
  component?: () => React.ReactNode;
  prevStep: T | undefined;
  nextStep: T | undefined;
};

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.CONFIGURE_ASANA]: {
    workspaceGid: string | undefined;
    projectGid: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {
    customFieldGid: string | undefined;
    priorityMap: {
      [key: string]: string | undefined;
    };
  };
};
