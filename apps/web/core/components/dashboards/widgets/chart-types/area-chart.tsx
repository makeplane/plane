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

import { lazy, Suspense, useMemo } from "react";
import { observer } from "mobx-react";
import { useTheme } from "@plane/react-theme";
// plane imports
import { CHART_COLOR_PALETTES, DEFAULT_WIDGET_COLOR, WIDGET_X_AXIS_PROPERTY_TO_FILTER_KEY } from "@plane/constants";
import type { TAreaChartWidgetConfig, TAreaItem } from "@plane/types";
import { EWidgetChartModels } from "@plane/types";
// local imports
import type { TWidgetComponentProps } from ".";
import { generateExtendedColors } from ".";

const AreaChart = lazy(function AreaChart() {
  return import("@plane/propel/charts/area-chart").then((mod) => ({
    default: mod.AreaChart,
  }));
});

export const DashboardAreaChartWidget = observer(function DashboardAreaChartWidget(props: TWidgetComponentProps) {
  const { parsedData, widget, onClick } = props;
  // derived values
  const { chart_model, group_by } = widget;
  const widgetConfig = widget?.config as TAreaChartWidgetConfig | undefined;
  const showLegends = !!widgetConfig?.show_legends;
  const isComparisonModel = chart_model === EWidgetChartModels.COMPARISON;
  // theme
  const { resolvedTheme } = useTheme();
  // Get current palette colors and extend if needed
  const baseColors = CHART_COLOR_PALETTES.find((p) => p.key === widgetConfig?.color_scheme)?.[
    resolvedTheme === "dark" ? "dark" : "light"
  ];

  const areas: TAreaItem<string>[] = useMemo(() => {
    let parsedAreas: TAreaItem<string>[];
    const schemaKeys = Object.keys(parsedData.schema);
    const extendedColors = generateExtendedColors(baseColors ?? [], schemaKeys.length);

    if (!!chart_model && [EWidgetChartModels.BASIC, EWidgetChartModels.COMPARISON].includes(chart_model)) {
      parsedAreas = [
        {
          key: "count",
          label: "Count",
          stackId: "area-one",
          fill: widgetConfig?.fill_color ?? DEFAULT_WIDGET_COLOR,
          fillOpacity: widgetConfig?.opacity ?? 0,
          showDot: !!widgetConfig?.show_markers,
          strokeOpacity: widgetConfig?.show_border ? 1 : 0,
          smoothCurves: !!widgetConfig?.smoothing,
          strokeColor: widgetConfig?.fill_color ?? DEFAULT_WIDGET_COLOR,
          onClick: () => onClick?.(),
        },
      ];
    } else if (chart_model === EWidgetChartModels.STACKED && parsedData.schema) {
      parsedAreas = schemaKeys.map((key, index) => ({
        key: key,
        label: parsedData.schema[key],
        stackId: "area",
        fill: extendedColors[index],
        fillOpacity: widgetConfig?.opacity ?? 0,
        strokeColor: extendedColors[index],
        strokeOpacity: widgetConfig?.show_border ? 1 : 0,
        smoothCurves: !!widgetConfig?.smoothing,
        showDot: !!widgetConfig?.show_markers,
        onClick: () => {
          if (!group_by) return;
          onClick?.({
            [`${WIDGET_X_AXIS_PROPERTY_TO_FILTER_KEY[group_by]}__in`]: key,
          });
        },
      }));
    } else {
      parsedAreas = [];
    }
    return parsedAreas;
  }, [baseColors, chart_model, group_by, onClick, parsedData.schema, widgetConfig]);

  return (
    <Suspense fallback={<></>}>
      <AreaChart
        className="size-full"
        data={parsedData.data}
        areas={areas}
        margin={{
          top: 20,
          right: 16,
          bottom: 20,
          left: -10,
        }}
        xAxis={{
          key: "name",
        }}
        yAxis={{
          key: "count",
        }}
        legend={
          showLegends
            ? {
                align: "center",
                verticalAlign: "bottom",
                layout: "horizontal",
              }
            : undefined
        }
        showTooltip={!!widgetConfig?.show_tooltip}
        comparisonLine={
          isComparisonModel
            ? {
                strokeColor: widgetConfig?.line_color ?? "",
                dashedLine: widgetConfig?.line_type === "dashed",
              }
            : undefined
        }
      />
    </Suspense>
  );
});
