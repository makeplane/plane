import { useMemo, useRef } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
// plane constants
import { CHART_COLOR_PALETTES, EWidgetChartTypes } from "@plane/constants";
import { TCellItem, TDashboardWidgetDatum, TPieChartWidgetConfig } from "@plane/types";
// local components
import { DashboardWidgetHeader } from "../header";
import { DashboardWidgetContent } from "./content";
import { commonWidgetClassName, generateExtendedColors, TWidgetComponentProps } from ".";

const PieChart = dynamic(() =>
  import("@plane/propel/charts/pie-chart").then((mod) => ({
    default: mod.PieChart,
  }))
);

const THIN_PIECES_GROUP_KEY = "pie-chart-group-thin-pieces";

const parsePieChartData = (
  originalData: TDashboardWidgetDatum[] | undefined,
  config: TPieChartWidgetConfig | undefined
) => {
  const data = [...(originalData ?? [])];
  let updatedData: TDashboardWidgetDatum[] = data;
  if (config?.value_type === "percentage") {
    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);
    updatedData = data.map((datum) => {
      datum.count = (datum.count / totalCount) * 100;
      datum.count = Number(datum.count.toFixed(1));
      return datum;
    });
  }

  if (config?.group_thin_pieces) {
    const threshold = config.minimum_threshold ?? 0;
    const groupName = config.group_name ?? "Others";
    let count: number = 0;
    for (let i = 0; i < updatedData.length; i++) {
      if (updatedData[i].count < threshold) {
        // add to count
        count += updatedData[i].count;
        // remove datum
        updatedData.splice(i, 1);
        i--;
      }
    }
    if (count > 0) {
      updatedData.push({
        key: THIN_PIECES_GROUP_KEY,
        name: groupName,
        count,
      } as TDashboardWidgetDatum);
    }
  }

  return updatedData;
};

export const DashboardPieChartWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { dashboardId, isSelected, widget } = props;
  // refs
  const widgetRef = useRef<HTMLDivElement>(null);
  // derived values
  const { data, height, width } = widget ?? {};
  const widgetConfig = widget?.config as TPieChartWidgetConfig | undefined;
  const showLabels = !!widgetConfig?.show_values && height !== 1;
  const showLegends = !!widgetConfig?.show_legends;
  const legendPosition = (width ?? 1) >= (height ?? 1) ? "right" : "bottom";
  const parsedData = useMemo(() => parsePieChartData(data?.data, widgetConfig), [data?.data, widgetConfig]);
  // next-themes
  const { resolvedTheme } = useTheme();
  // Get current palette colors and extend if needed
  const baseColors = CHART_COLOR_PALETTES.find((p) => p.key === widgetConfig?.color_scheme)?.[
    resolvedTheme === "dark" ? "dark" : "light"
  ];

  const cells: TCellItem<string>[] = useMemo(() => {
    const extendedColors = generateExtendedColors(baseColors ?? [], parsedData.length);
    const parsedCells = parsedData.map((datum, index) => ({
      key: datum.key,
      className: "stroke-transparent",
      fill: extendedColors[index],
    }));

    if (widgetConfig?.group_thin_pieces) {
      for (let i = 0; i < parsedCells.length; i++) {
        const cellKey = parsedCells[i].key;
        const doesKeyExist = parsedData.find((datum) => datum.key === cellKey);
        if (!doesKeyExist) {
          parsedCells.splice(i, 1);
        }
      }
      if (!parsedCells.find((cell) => cell.key === THIN_PIECES_GROUP_KEY)) {
        parsedCells.push({
          key: THIN_PIECES_GROUP_KEY,
          className: "stroke-transparent",
          fill: extendedColors[parsedCells.length],
        });
      }
    }
    return parsedCells;
  }, [baseColors, parsedData, widgetConfig]);

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
        chartType={EWidgetChartTypes.PIE_CHART}
        dashboardId={dashboardId}
        isDataAvailable={!!data}
        isDataEmpty={parsedData.length === 0}
        widget={widget}
      >
        <PieChart
          className="size-full"
          margin={{
            top: 20,
            right: 16,
            bottom: 20,
            left: 16,
          }}
          data={parsedData}
          dataKey="count"
          cells={cells}
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
