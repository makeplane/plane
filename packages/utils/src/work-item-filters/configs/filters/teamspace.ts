// plane imports
import { EQUALITY_OPERATOR, TFilterProperty, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import { createFilterConfig, TCreateFilterConfig, createOperatorConfigEntry } from "../../../rich-filters";
import { getProjectMultiSelectConfig, TCreateProjectFilterParams } from "./shared";

/**
 * Teamspace Project filter specific params
 */
export type TCreateTeamspaceProjectFilterParams = TCreateProjectFilterParams;

/**
 * Get the teamspace project filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the teamspace project filter config
 */
export const getTeamspaceProjectFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateTeamspaceProjectFilterParams> =>
  (params: TCreateTeamspaceProjectFilterParams) =>
    createFilterConfig<P, string>({
      id: key,
      label: "Teamspace Projects",
      icon: params.filterIcon,
      isEnabled: params.isEnabled,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getProjectMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
