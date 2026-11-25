/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TFilterProperty, TSupportedOperators, TWorkItemKind } from "@plane/types";
import { EQUALITY_OPERATOR, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import type { TCreateFilterConfigParams, IFilterIconConfig, TCreateFilterConfig } from "../../../rich-filters";
import { createFilterConfig, getMultiSelectConfig, createOperatorConfigEntry } from "../../../rich-filters";

export type TKindOption = { key: TWorkItemKind; title: string };

export type TCreateKindFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<TWorkItemKind> & {
    label: string;
    kinds: TKindOption[];
  };

const getKindMultiSelectConfig = (params: TCreateKindFilterParams, singleValueOperator: TSupportedOperators) =>
  getMultiSelectConfig<TKindOption, TWorkItemKind, TWorkItemKind>(
    {
      items: params.kinds,
      getId: (kind) => kind.key,
      getLabel: (kind) => kind.title,
      getValue: (kind) => kind.key,
      getIconData: (kind) => kind.key,
    },
    { singleValueOperator, ...params },
    { getOptionIcon: params.getOptionIcon }
  );

/** Filter by the kind of a work item. The labels come translated. */
export const getKindFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateKindFilterParams> =>
  (params: TCreateKindFilterParams) =>
    createFilterConfig<P>({
      id: key,
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getKindMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
