// plane imports
import {
  COMPARISON_OPERATOR,
  EQUALITY_OPERATOR,
  IProject,
  TOperatorConfigMap,
  TSupportedOperators,
} from "@plane/types";
// local imports
import {
  createOperatorConfigEntry,
  getDatePickerConfig,
  getDateRangePickerConfig,
  getMultiSelectConfig,
  IFilterIconConfig,
  TCreateDateFilterParams,
  TCreateFilterConfigParams,
} from "../../../rich-filters";

// ------------ Date filter ------------

export const getSupportedDateOperators = (params: TCreateDateFilterParams): TOperatorConfigMap<Date> =>
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
