import { useMemo } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
// plane imports
import { CHART_COLOR_PALETTES, DEFAULT_WIDGET_COLOR } from "@plane/constants";
import { EWidgetChartModels, TLineChartWidgetConfig, TLineItem } from "@plane/types";
// local imports
import { generateExtendedColors, TWidgetComponentProps } from ".";

const LineChart = dynamic(() =>
  import("@plane/propel/charts/line-chart").then((mod) => ({
    default: mod.LineChart,
  }))
);

export const DashboardLineChartWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { parsedData, widget } = props;
  // derived values
  const { chart_model } = widget ?? {};
  const widgetConfig = widget?.config as TLineChartWidgetConfig | undefined;
  const showLegends = !!widgetConfig?.show_legends;
  // next-themes
  const { resolvedTheme } = useTheme();
  // Get current palette colors and extend if needed
  const baseColors = CHART_COLOR_PALETTES.find((p) => p.key === widgetConfig?.color_scheme)?.[
    resolvedTheme === "dark" ? "dark" : "light"
  ];

  const lines: TLineItem<string>[] = useMemo(() => {
    let parsedLines: TLineItem<string>[];
    const schemaKeys = Object.keys(parsedData.schema);
    const extendedColors = generateExtendedColors(baseColors ?? [], schemaKeys.length);

    if (chart_model === EWidgetChartModels.BASIC) {
      parsedLines = [
        {
          key: "count",
          label: "Count",
          dashedLine: widgetConfig?.line_type === "dashed",
          fill: widgetConfig?.line_color ?? DEFAULT_WIDGET_COLOR,
          stroke: widgetConfig?.line_color ?? DEFAULT_WIDGET_COLOR,
          showDot: !!widgetConfig?.show_markers,
          smoothCurves: !!widgetConfig?.smoothing,
        },
      ];
    } else if (chart_model === EWidgetChartModels.MULTI_LINE && parsedData.schema) {
      parsedLines = schemaKeys.map((key, index) => ({
        key: key,
        label: parsedData.schema[key],
        dashedLine: widgetConfig?.line_type === "dashed",
        fill: extendedColors[index],
        stroke: extendedColors[index],
        showDot: !!widgetConfig?.show_markers,
        smoothCurves: !!widgetConfig?.smoothing,
      }));
    } else {
      parsedLines = [];
    }
    return parsedLines;
  }, [baseColors, chart_model, parsedData.schema, widgetConfig]);

  if (!widget) return null;

  return (
    <LineChart
      className="size-full"
      data={parsedData.data}
      lines={lines}
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
    />
  );
});
