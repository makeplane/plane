/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
// plane imports
import type { IProject, IUserLite, TOperatorConfigMap, TSupportedOperators } from "@plane/types";
import { COMPARISON_OPERATOR, EQUALITY_OPERATOR, FILTER_FIELD_TYPE } from "@plane/types";
// local imports
import { getDatePickerConfig, getDateRangePickerConfig, getMultiSelectConfig } from "../core";
import type { IFilterIconConfig, TCreateDateFilterParams, TCreateFilterConfigParams, TFilterIconType } from "../shared";
import { createFilterFieldConfig, createOperatorConfigEntry } from "../shared";
import { UNASSIGNED_VALUE } from "../../../validators/core";

// ------------ Base User Filter Types ------------

/**
 * User filter specific params
 */
export type TCreateUserFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IUserLite> & {
    members: IUserLite[];
  };

/**
 * Helper to get the member multi select config
 * @param params - The filter params
 * @returns The member multi select config
 */
export const getMemberMultiSelectConfig = (params: TCreateUserFilterParams, singleValueOperator: TSupportedOperators) =>
  getMultiSelectConfig<IUserLite, string, IUserLite>(
    {
      items: params.members,
      getId: (member) => member.id,
      getLabel: (member) => member.display_name,
      getValue: (member) => member.id,
      getIconData: (member) => member,
    },
    {
      singleValueOperator,
      ...params,
    },
    {
      ...params,
    }
  );

/**
 * Assignee filter specific params (includes unassigned option)
 */
export type TCreateAssigneeFilterParams = TCreateUserFilterParams & {
  unassignedIcon?: React.ReactNode;
};

/**
 * Helper to get the assignee multi select config with "Unassigned" option
 * @param params - The filter params
 * @returns The assignee multi select config with unassigned option
 */
export const getAssigneeMultiSelectConfig = (
  params: TCreateAssigneeFilterParams,
  singleValueOperator: TSupportedOperators
) => {
  // Create member options
  const memberOptions = params.members.map((member) => ({
    id: member.id,
    label: member.display_name,
    value: member.id,
    icon: params.getOptionIcon?.(member),
  }));

  // Add "Unassigned" option at the end
  const unassignedOption = {
    id: UNASSIGNED_VALUE,
    label: "Unassigned",
    value: UNASSIGNED_VALUE,
    icon: params.unassignedIcon,
  };

  return createFilterFieldConfig<typeof FILTER_FIELD_TYPE.MULTI_SELECT, string>({
    type: FILTER_FIELD_TYPE.MULTI_SELECT,
    singleValueOperator,
    operatorLabel: params.operatorLabel,
    getOptions: () => [...memberOptions, unassignedOption],
  });
};

// ------------ Date Operators ------------

export const getSupportedDateOperators = (params: TCreateDateFilterParams): TOperatorConfigMap =>
  new Map([
    createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, params, (updatedParams) => getDatePickerConfig(updatedParams)),
    createOperatorConfigEntry(COMPARISON_OPERATOR.RANGE, params, (updatedParams) =>
      getDateRangePickerConfig(updatedParams)
    ),
  ]);

// ------------ Project filter ------------

/**
 * Project filter specific params
 */
export type TCreateProjectFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IProject> & {
    projects: IProject[];
  };

/**
 * Helper to get the project multi select config
 * @param params - The filter params
 * @returns The member multi select config
 */
export const getProjectMultiSelectConfig = (
  params: TCreateProjectFilterParams,
  singleValueOperator: TSupportedOperators
) =>
  getMultiSelectConfig<IProject, string, IProject>(
    {
      items: params.projects,
      getId: (project) => project.id,
      getLabel: (project) => project.name,
      getValue: (project) => project.id,
      getIconData: (project) => project,
    },
    {
      singleValueOperator,
      ...params,
    },
    {
      ...params,
    }
  );

/**
 * Custom property filter specific params
 */
export type TCustomPropertyFilterParams<T extends TFilterIconType> = TCreateFilterConfigParams &
  IFilterIconConfig<T> & {
    propertyDisplayName: string;
  };
