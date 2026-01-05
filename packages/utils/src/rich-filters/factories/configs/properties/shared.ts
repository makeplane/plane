// plane imports
import type { IProject, IUserLite, TOperatorConfigMap, TSupportedOperators } from "@plane/types";
import { COMPARISON_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
// local imports
import { getDatePickerConfig, getDateRangePickerConfig, getMultiSelectConfig } from "../core";
import type { IFilterIconConfig, TCreateDateFilterParams, TCreateFilterConfigParams, TFilterIconType } from "../shared";
import { createOperatorConfigEntry } from "../shared";

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
