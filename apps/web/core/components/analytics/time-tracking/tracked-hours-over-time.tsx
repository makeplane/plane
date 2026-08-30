/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { renderFormattedDate } from "@plane/utils";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";

type Props = {
  byDate: { logged_date: string; total_minutes: number }[];
  isLoading: boolean;
};

export const TrackedHoursOverTime = ({ byDate, isLoading }: Props) => {
  const { t } = useTranslation();

  const parsedData = useMemo(
    () =>
      byDate.map((datum) => ({
        name: renderFormattedDate(datum.logged_date) ?? datum.logged_date,
        total_minutes: datum.total_minutes,
      })),
    [byDate]
  );

  const areas = useMemo(
    () => [
      {
        key: "total_minutes",
        label: t("time_tracking_minutes"),
        fill: "#1192E833",
        fillOpacity: 1,
        stackId: "bar-one",
        showDot: false,
        smoothCurves: true,
        strokeColor: "#1192E8",
        strokeOpacity: 1,
      },
    ],
    [t]
  );

  return (
    <AnalyticsSectionWrapper title={t("time_tracking_over_time")} className="col-span-1">
      {isLoading ? (
        <ChartLoader />
      ) : parsedData && parsedData.length > 0 ? (
        <AreaChart
          className="h-[350px] w-full"
          data={parsedData}
          areas={areas}
          xAxis={{
            key: "name",
            label: t("date"),
          }}
          yAxis={{
            key: "total_minutes",
            label: t("time_tracking_minutes"),
            offset: -60,
            dx: -24,
          }}
          legend={{
            align: "left",
            verticalAlign: "bottom",
            layout: "horizontal",
            wrapperStyles: {
              justifyContent: "start",
              alignContent: "start",
              paddingLeft: "40px",
              paddingTop: "10px",
            },
          }}
        />
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("settings_empty_state.worklogs.title")}
        />
      )}
    </AnalyticsSectionWrapper>
  );
};
