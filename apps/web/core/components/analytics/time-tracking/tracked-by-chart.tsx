/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TBarItem } from "@plane/types";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";

type Props = {
  title: string;
  data: { name: string; total_minutes: number }[];
  isLoading: boolean;
};

export const TrackedByChart = ({ title, data, isLoading }: Props) => {
  const { t } = useTranslation();

  const bars: TBarItem<string>[] = useMemo(
    () => [
      {
        key: "total_minutes",
        label: t("time_tracking_minutes"),
        stackId: "bar-one",
        fill: "#1192E8",
        textClassName: "",
        showPercentage: false,
        showTopBorderRadius: () => true,
        showBottomBorderRadius: () => true,
      },
    ],
    [t]
  );

  return (
    <AnalyticsSectionWrapper title={title} className="col-span-1">
      {isLoading ? (
        <ChartLoader />
      ) : data && data.length > 0 ? (
        <BarChart
          className="h-[300px] w-full"
          data={data}
          bars={bars}
          margin={{
            bottom: 30,
          }}
          xAxis={{
            key: "name",
            dy: 30,
          }}
          yAxis={{
            key: "total_minutes",
            label: t("time_tracking_minutes"),
            offset: -60,
            dx: -26,
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
