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

import type { IWorkflow, TFilterProperty } from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
import type { IFilterIconConfig, TCreateFilterConfig, TCreateFilterConfigParams } from "../../../rich-filters";
import { createFilterConfig, createOperatorConfigEntry, getMultiSelectConfig } from "../../../rich-filters";

export type TCreateWorkflowFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IWorkflow> & {
    workflows: IWorkflow[];
  };

export const getWorkflowMultiSelectConfig = (params: TCreateWorkflowFilterParams) =>
  getMultiSelectConfig<IWorkflow, string, IWorkflow>(
    {
      items: params.workflows.filter(Boolean).filter((workflow) => workflow.id && workflow.name),
      getId: (workflow) => workflow.id,
      getLabel: (workflow) => workflow.name,
      getValue: (workflow) => workflow.id,
      getIconData: (workflow) => workflow,
    },
    {
      singleValueOperator: EQUALITY_OPERATOR.EXACT,
      ...params,
    },
    {
      ...params,
    }
  );

export const getWorkflowFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateWorkflowFilterParams> =>
  (params: TCreateWorkflowFilterParams) =>
    createFilterConfig({
      id: key,
      label: "Workflow",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getWorkflowMultiSelectConfig(updatedParams)
        ),
      ]),
    });
