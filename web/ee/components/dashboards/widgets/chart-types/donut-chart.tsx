import { useMemo, useRef } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
// plane imports
import { CHART_COLOR_PALETTES, DEFAULT_WIDGET_COLOR, EWidgetChartModels, EWidgetChartTypes } from "@plane/constants";
import { TCellItem, TDashboardWidgetDatum, TDonutChartWidgetConfig } from "@plane/types";
// local components
import { DashboardWidgetHeader } from "../header";
import { DashboardWidgetContent } from "./content";
import { commonWidgetClassName, generateExtendedColors, TWidgetComponentProps } from ".";

const PieChart = dynamic(() =>
  import("@plane/propel/charts/pie-chart").then((mod) => ({
    default: mod.PieChart,
  }))
);

export const parseDonutChartData = (
  originalData: TDashboardWidgetDatum[] | undefined,
  chartModel: EWidgetChartModels | undefined
) => {
  const data = [...(originalData ?? [])];
  let updatedData: TDashboardWidgetDatum[] = data;
  if (chartModel === EWidgetChartModels.PROGRESS) {
    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);
    const completed = data.find((datum) => datum.key === "completed")?.count ?? 0;
    const pending = totalCount - completed;
    updatedData = [
      {
        key: "completed",
        name: "Completed",
        count: completed,
      } as TDashboardWidgetDatum,
      {
        key: "pending",
        name: "Pending",
        count: pending,
      } as TDashboardWidgetDatum,
    ];
  }
  return updatedData;
};

export const DashboardDonutChartWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { dashboardId, isSelected, widget } = props;
  // refs
  const widgetRef = useRef<HTMLDivElement>(null);
  // derived values
  const { chart_model, data, height, width } = widget ?? {};
  const widgetConfig = widget?.config as TDonutChartWidgetConfig | undefined;
  const isOfUnitHeight = height === 1;
  const showLabels = !isOfUnitHeight && chart_model !== EWidgetChartModels.PROGRESS;
  const showLegends = !!widgetConfig?.show_legends && !isOfUnitHeight;
  const legendPosition = (width ?? 1) >= (height ?? 1) ? "right" : "bottom";
  const showCenterLabel = !!widgetConfig?.center_value;
  const parsedData = useMemo(() => parseDonutChartData(data?.data, chart_model), [chart_model, data?.data]);
  const totalCount = data?.data?.reduce((acc, curr) => acc + curr.count, 0);
  const totalCountDigits = totalCount?.toString().length ?? 1;
  // next-themes
  const { resolvedTheme } = useTheme();
  // Get current palette colors and extend if needed
  const baseColors = CHART_COLOR_PALETTES.find((p) => p.key === widgetConfig?.color_scheme)?.[
    resolvedTheme === "dark" ? "dark" : "light"
  ];

  const cells: TCellItem<string>[] = useMemo(() => {
    let parsedCells: TCellItem<string>[];
    const extendedColors = generateExtendedColors(baseColors ?? [], parsedData.length);

    if (chart_model === EWidgetChartModels.BASIC) {
      parsedCells = parsedData.map((datum, index) => ({
        key: datum.key,
        className: "stroke-transparent",
        fill: extendedColors[index],
      }));
    } else if (chart_model === EWidgetChartModels.PROGRESS) {
      parsedCells = [
        {
          key: "pending",
          className: "stroke-transparent",
          fill: widgetConfig?.completed_color ?? DEFAULT_WIDGET_COLOR,
        },
        {
          key: "completed",
          className: "stroke-transparent",
          fill: resolvedTheme === "dark" ? "#4e4e4e" : "#EDEEF3",
        },
      ];
    } else {
      parsedCells = [];
    }
    return parsedCells;
  }, [baseColors, chart_model, parsedData, resolvedTheme, widgetConfig]);

  if (!widget) return null;

  return (
    <div
      ref={widgetRef}
      className={commonWidgetClassName({
        isSelected,
      })}
    >
      <DashboardWidgetHeader dashboardId={dashboardId} widget={widget} widgetRef={widgetRef} />
      <DashboardWidgetContent
        chartType={EWidgetChartTypes.DONUT_CHART}
        dashboardId={dashboardId}
        isDataAvailable={!!data}
        isDataEmpty={parsedData.length === 0}
        widget={widget}
      >
        <PieChart
          className="size-full"
          margin={{
            top: isOfUnitHeight ? 0 : 20,
            right: 16,
            bottom: isOfUnitHeight ? 12 : 20,
            left: 16,
          }}
          data={parsedData}
          dataKey="count"
          cells={cells}
          innerRadius={isOfUnitHeight ? 10 : (height ?? 1) * 20}
          centerLabel={
            showCenterLabel
              ? {
                  text: totalCount,
                  fill: "rgba(var(--color-text-100))",
                  className: "text-2xl font-semibold",
                  style: {
                    fontSize: ((height ?? 1) * 1.5) / totalCountDigits + "rem",
                  },
                }
              : undefined
          }
          legend={
            showLegends
              ? {
                  align: legendPosition === "right" ? "right" : "center",
                  verticalAlign: legendPosition === "right" ? "middle" : "bottom",
                  layout: legendPosition === "right" ? "vertical" : "horizontal",
                  iconSize: 8,
                }
              : undefined
          }
          showTooltip={!!widgetConfig?.show_tooltip}
          showLabel={showLabels}
        />
      </DashboardWidgetContent>
    </div>
  );
});
