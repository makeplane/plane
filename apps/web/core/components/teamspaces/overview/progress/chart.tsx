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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import type { EProgressXAxisKeys, ETeamspaceAnalyticsValueKeys } from "@plane/constants";
import { EProgressDataKeys } from "@plane/constants";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TBarItem, TChartData } from "@plane/types";
import { Dropdown, Loader } from "@plane/ui";
import { cn, renderFormattedDateWithoutYear } from "@plane/utils";
// plane web imports
import { TEAM_WORKLOAD_X_AXIS_LABEL_MAP, TEAM_WORKLOAD_Y_AXIS_LABEL_MAP } from "@/constants/teamspace";
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";

const bars: TBarItem<EProgressDataKeys>[] = [
  {
    key: EProgressDataKeys.COMPLETED,
    label: "Completed",
    fill: "#004EFF",
    textClassName: "text-xs-regular text-on-color",
    showPercentage: true,
    stackId: "bar-one",
  },
  {
    key: EProgressDataKeys.PENDING,
    label: "Pending",
    fill: "var(--background-color-layer-3)",
    textClassName: "text-secondary",
    stackId: "bar-one",
  },
];

const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "mx-1.5 px-1.5 bg-transparent hover:bg-layer-1 rounded-sm text-primary font-medium";
const COMMON_CHEVRON_CLASSNAME = "size-3 text-placeholder transition-all";

type TTeamspaceProgressChartProps = {
  teamspaceId: string;
  xAxisKey: EProgressXAxisKeys;
  yAxisKey: ETeamspaceAnalyticsValueKeys;
  data: TChartData<EProgressXAxisKeys, EProgressDataKeys>[];
  handleXAxisKeyChange: (key: EProgressXAxisKeys) => void;
};

const progressXAxisOptions = Object.entries(TEAM_WORKLOAD_X_AXIS_LABEL_MAP).map(([data, value]) => ({
  data,
  value,
}));

export const TeamspaceProgressChart = observer(function TeamspaceProgressChart(props: TTeamspaceProgressChartProps) {
  const { teamspaceId, data, xAxisKey, yAxisKey, handleXAxisKeyChange } = props;
  // store hooks
  const { getTeamspaceEntitiesLoaderById } = useTeamspaces();
  const { getTeamspaceProgressChartLoader } = useTeamspaceAnalytics();
  // derived values
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const loader = getTeamspaceProgressChartLoader(teamspaceId);
  const isUpdating = loader && ["init-loader", "mutation"].includes(loader);
  // Format data in case of date
  const modifiedData = useMemo(() => {
    if (["start_date", "target_date"].includes(xAxisKey)) {
      return data.map((item) => ({
        ...item,
        [xAxisKey]:
          item[xAxisKey] && typeof item[xAxisKey] === "string"
            ? renderFormattedDateWithoutYear(item[xAxisKey])
            : item[xAxisKey],
      }));
    }
    return data;
  }, [xAxisKey, data]);

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex items-center text-body-xs-medium text-secondary">
        Progress on <b className="px-1">{TEAM_WORKLOAD_Y_AXIS_LABEL_MAP[yAxisKey]}</b> view by
        <Dropdown
          value={xAxisKey}
          options={progressXAxisOptions}
          onChange={(value) => {
            handleXAxisKeyChange(value as EProgressXAxisKeys);
          }}
          keyExtractor={(option) => option.data}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          buttonContent={(isOpen, value) => (
            <span className="flex items-center gap-1">
              {value && typeof value === "string"
                ? TEAM_WORKLOAD_X_AXIS_LABEL_MAP[value as EProgressXAxisKeys]
                : TEAM_WORKLOAD_X_AXIS_LABEL_MAP[xAxisKey]}
              <ChevronDownIcon className={cn(COMMON_CHEVRON_CLASSNAME, isOpen ? "rotate-180" : "rotate-0")} />
            </span>
          )}
          disableSearch
          disabled={isUpdating}
        />
        {isUpdating && <Spinner size={14} className="animate-spin flex-shrink-0 mx-1" />}
      </div>
      {teamspaceEntitiesLoader === "init-loader" || isUpdating ? (
        <Loader className="w-full h-96 flex items-center justify-center">
          <Loader.Item width="96%" height="100%" />
        </Loader>
      ) : (
        <BarChart
          className="w-full h-96"
          data={modifiedData}
          bars={bars}
          xAxis={{
            key: xAxisKey,
            label: TEAM_WORKLOAD_X_AXIS_LABEL_MAP[xAxisKey],
          }}
          yAxis={{
            key: "total",
            label: TEAM_WORKLOAD_Y_AXIS_LABEL_MAP[yAxisKey],
          }}
        />
      )}
    </div>
  );
});
