/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC, ReactNode } from "react";
// plane imports
import type {
  ETeamspaceAnalyticsDataKeys,
  ETeamspaceAnalyticsValueKeys,
  EStatisticsLegend,
  EProgressXAxisKeys,
  EProgressDataKeys,
  ERelationType,
} from "@plane/constants";
import type { TChartData, TStateGroups, TTeamspaceActivity, TTeamspaceActivityKeys } from "@plane/types";

export type TTeamspaceActivityDetails = {
  icon: FC<{ className?: string }>;
  message: ReactNode;
  customUserName?: string;
};

export type TTeamspaceActivityDetailsHelperMap = {
  [key in TTeamspaceActivityKeys]: (activity: TTeamspaceActivity) => TTeamspaceActivityDetails;
};

export type TWorkloadFilter = {
  yAxisKey: ETeamspaceAnalyticsValueKeys;
  xAxisKey: EProgressXAxisKeys;
};

export type TTeamspaceProgressChart = {
  distribution: TChartData<EProgressXAxisKeys, EProgressDataKeys>[];
};

export type TStatisticsFilter = {
  data_key: ETeamspaceAnalyticsDataKeys;
  value_key: ETeamspaceAnalyticsValueKeys;
  issue_type: string[]; // issue type ids
  state_group: TStateGroups[]; // state group names
  dependency_type: ERelationType | undefined;
  target_date: string[];
  legend: EStatisticsLegend;
};

export type TStatisticsFilterProps<K extends keyof TStatisticsFilter> = {
  value: TStatisticsFilter[K];
  isLoading: boolean;
  buttonContainerClassName?: string;
  chevronClassName?: string;
  handleFilterChange: (value: TStatisticsFilter[K]) => Promise<void>;
};
