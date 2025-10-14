// plane imports
import { EQUALITY_OPERATOR, IUserLite, TFilterProperty } from "@plane/types";
// local imports
import { createFilterConfig, createOperatorConfigEntry, TCreateFilterConfig } from "../shared";
import { getMemberMultiSelectConfig, TCreateUserFilterParams, TCustomPropertyFilterParams } from "./shared";

/**
 * Member picker property filter specific params
 */
type TCreateMemberPickerPropertyFilterParams = TCustomPropertyFilterParams<IUserLite> & TCreateUserFilterParams;

/**
 * Get the member picker property filter config
 * @param params - The filter params
 * @returns The member picker property filter config
 */
export const getMemberPickerPropertyFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateMemberPickerPropertyFilterParams> =>
  (params: TCreateMemberPickerPropertyFilterParams) =>
    createFilterConfig({
      id: key,
      ...params,
      label: params.propertyDisplayName,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
