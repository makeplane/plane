// plane imports
import {
  EQUALITY_OPERATOR,
  IIssueLabel,
  TFilterProperty,
  COLLECTION_OPERATOR,
  TSupportedOperators,
} from "@plane/types";
// local imports
import {
  createFilterConfig,
  TCreateFilterConfigParams,
  IFilterIconConfig,
  TCreateFilterConfig,
  getMultiSelectConfig,
  createOperatorConfigEntry,
} from "../../../rich-filters";

/**
 * Label filter specific params
 */
export type TCreateLabelFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<string> & {
    labels: IIssueLabel[];
  };

/**
 * Helper to get the label multi select config
 * @param params - The filter params
 * @returns The label multi select config
 */
export const getLabelMultiSelectConfig = (params: TCreateLabelFilterParams, singleValueOperator: TSupportedOperators) =>
  getMultiSelectConfig<IIssueLabel, string, string>(
    {
      items: params.labels,
      getId: (label) => label.id,
      getLabel: (label) => label.name,
      getValue: (label) => label.id,
      getIconData: (label) => label.color,
    },
    {
      singleValueOperator,
      ...params,
    },
    {
      getOptionIcon: params.getOptionIcon,
    }
  );

/**
 * Get the label filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the label filter config
 */
export const getLabelFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateLabelFilterParams> =>
  (params: TCreateLabelFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Label",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getLabelMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
