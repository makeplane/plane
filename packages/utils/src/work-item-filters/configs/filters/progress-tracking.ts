/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TFilterProperty, TSupportedOperators } from "@plane/types";
import {
  COLLECTION_OPERATOR,
  EQUALITY_OPERATOR,
  EXTENDED_COLLECTION_OPERATOR,
  EXTENDED_EQUALITY_OPERATOR,
} from "@plane/types";
// local imports
import type { IFilterIconConfig, TCreateFilterConfig, TCreateFilterConfigParams } from "../../../rich-filters";
import { createFilterConfig, createOperatorConfigEntry, getMultiSelectConfig } from "../../../rich-filters";

type TProgressTrackingStatus = "off_track" | "due_today" | "at_risk" | "on_track";

type TProgressTrackingOption = {
  key: TProgressTrackingStatus;
  label: string;
};

const PROGRESS_TRACKING_OPTIONS: TProgressTrackingOption[] = [
  { key: "off_track", label: "Off Track" },
  { key: "due_today", label: "Due Today" },
  { key: "at_risk", label: "At Risk" },
  { key: "on_track", label: "On Track" },
];

export type TCreateProgressTrackingFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<TProgressTrackingStatus>;

const getProgressTrackingMultiSelectConfig = (
  params: TCreateProgressTrackingFilterParams,
  singleValueOperator: TSupportedOperators
) =>
  getMultiSelectConfig<TProgressTrackingOption, TProgressTrackingStatus, TProgressTrackingStatus>(
    {
      items: PROGRESS_TRACKING_OPTIONS,
      getId: (status) => status.key,
      getLabel: (status) => status.label,
      getValue: (status) => status.key,
      getIconData: (status) => status.key,
    },
    {
      singleValueOperator,
      ...params,
    },
    {
      ...params,
    }
  );

export const getProgressTrackingFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateProgressTrackingFilterParams> =>
  (params: TCreateProgressTrackingFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Progress Tracking",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getProgressTrackingMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
        createOperatorConfigEntry(EXTENDED_COLLECTION_OPERATOR.NOT_IN, params, (updatedParams) =>
          getProgressTrackingMultiSelectConfig(updatedParams, EXTENDED_EQUALITY_OPERATOR.NOT_EXACT)
        ),
      ]),
    });
