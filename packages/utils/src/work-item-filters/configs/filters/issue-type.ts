// plane imports
import {
  COLLECTION_OPERATOR,
  EQUALITY_OPERATOR,
  TFilterProperty,
  TSupportedOperators,
} from "@plane/types";
// local imports
import {
  createFilterConfig,
  getMultiSelectConfig,
  IFilterIconConfig,
  TCreateFilterConfig,
  TCreateFilterConfigParams,
  createOperatorConfigEntry,
} from "../../../rich-filters";

// Issue type interface
export interface IIssueType {
  id: string;
  name: string;
  logo_props?: {
    icon?: {
      name: string;
      color?: string;
      background_color?: string;
    };
  };
}

// ------------ Issue type filter ------------

/**
 * Issue type filter specific params
 */
export type TCreateIssueTypeFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IIssueType> & {
    issueTypes: IIssueType[];
  };

/**
 * Helper to get the issue type multi select config
 * @param params - The filter params
 * @returns The issue type multi select config
 */
export const getIssueTypeMultiSelectConfig = (params: TCreateIssueTypeFilterParams) =>
  getMultiSelectConfig<IIssueType, string, IIssueType>(
    {
      items: params.issueTypes,
      getId: (issueType) => issueType.id,
      getLabel: (issueType) => issueType.name,
      getValue: (issueType) => issueType.id,
      getIconData: (issueType) => issueType,
    },
    {
      singleValueOperator: EQUALITY_OPERATOR.EXACT,
      ...params,
    },
    {
      ...params,
    }
  );

/**
 * Get the issue type filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the issue type filter config
 */
export const getIssueTypeFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateIssueTypeFilterParams> =>
  (params: TCreateIssueTypeFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Type",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getIssueTypeMultiSelectConfig(updatedParams)
        ),
      ]),
    });