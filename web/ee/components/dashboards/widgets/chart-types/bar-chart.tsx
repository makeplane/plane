import { useMemo, useRef } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
// plane imports
import { CHART_COLOR_PALETTES, DEFAULT_WIDGET_COLOR, EWidgetChartModels, EWidgetChartTypes } from "@plane/constants";
import { TBarChartWidgetConfig, TBarItem } from "@plane/types";
// local components
import { DashboardWidgetHeader } from "../header";
import { DashboardWidgetContent } from "./content";
import { commonWidgetClassName, generateExtendedColors, parseWidgetData, TWidgetComponentProps } from ".";

const BarChart = dynamic(() =>
  import("@plane/propel/charts/bar-chart").then((mod) => ({
    default: mod.BarChart,
  }))
);

export const DashboardBarChartWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { dashboardId, isSelected, widget } = props;
  // refs
  const widgetRef = useRef<HTMLDivElement>(null);
  // derived values
  const { chart_model, data } = widget ?? {};
  const widgetConfig = widget?.config as TBarChartWidgetConfig | undefined;
  const showLegends = !!widgetConfig?.show_legends;
  const parsedData = parseWidgetData(data);
  // next-themes
  const { resolvedTheme } = useTheme();
  // Get current palette colors and extend if needed
  const baseColors = CHART_COLOR_PALETTES.find((p) => p.key === widgetConfig?.color_scheme)?.[
    resolvedTheme === "dark" ? "dark" : "light"
  ];

  const bars: TBarItem<string>[] = useMemo(() => {
    let parsedBars: TBarItem<string>[];
    const schemaKeys = Object.keys(parsedData.schema);
    const extendedColors = generateExtendedColors(baseColors ?? [], schemaKeys.length);

    if (chart_model === EWidgetChartModels.BASIC) {
      parsedBars = [
        {
          key: "count",
          label: "Count",
          stackId: "bar-one",
          fill: widgetConfig?.bar_color ?? DEFAULT_WIDGET_COLOR,
          textClassName: "",
          showPercentage: false,
        },
      ];
    } else if (chart_model === EWidgetChartModels.STACKED && parsedData.schema) {
      parsedBars = schemaKeys.map((key, index) => ({
        key: key,
        label: parsedData.schema[key],
        stackId: "bar-one",
        fill: extendedColors[index],
        textClassName: "",
        showPercentage: false,
      }));
    } else if (chart_model === EWidgetChartModels.GROUPED && parsedData.schema) {
      parsedBars = schemaKeys.map((key, index) => ({
        key: key,
        label: parsedData.schema[key],
        stackId: `bar-${index}`,
        fill: extendedColors[index],
        textClassName: "",
        showPercentage: false,
      }));
    } else {
      parsedBars = [];
    }
    return parsedBars;
  }, [baseColors, chart_model, parsedData.schema, widgetConfig]);

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
        chartType={EWidgetChartTypes.BAR_CHART}
        dashboardId={dashboardId}
        isDataAvailable={!!data}
        isDataEmpty={parsedData.data.length === 0}
        widget={widget}
      >
        <BarChart
          className="size-full"
          data={parsedData.data}
          bars={bars}
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
                  iconSize: 8,
                }
              : undefined
          }
          showTooltip={!!widgetConfig?.show_tooltip}
        />
      </DashboardWidgetContent>
    </div>
  );
});
