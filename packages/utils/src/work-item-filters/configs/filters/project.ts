// plane imports
import { EQUALITY_OPERATOR, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import {
  createFilterConfig,
  createOperatorConfigEntry,
  getProjectMultiSelectConfig,
  TCreateFilterConfig,
  TCreateProjectFilterParams,
} from "../../../rich-filters";

// ------------ Project filter ------------

/**
 * Get the project filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the project filter config
 */
export const getProjectFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateProjectFilterParams> =>
  (params: TCreateProjectFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Projects",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getProjectMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
