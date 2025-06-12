import { useMemo } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
// plane imports
import { CHART_COLOR_PALETTES, DEFAULT_WIDGET_COLOR, EWidgetChartModels } from "@plane/constants";
import { TAreaChartWidgetConfig, TAreaItem } from "@plane/types";
// local imports
import { generateExtendedColors, TWidgetComponentProps } from ".";

const AreaChart = dynamic(() =>
  import("@plane/propel/charts/area-chart").then((mod) => ({
    default: mod.AreaChart,
  }))
);

export const DashboardAreaChartWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { parsedData, widget } = props;
  // derived values
  const { chart_model } = widget ?? {};
  const widgetConfig = widget?.config as TAreaChartWidgetConfig | undefined;
  const showLegends = !!widgetConfig?.show_legends;
  const isComparisonModel = chart_model === EWidgetChartModels.COMPARISON;
  // next-themes
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
      }));
    } else {
      parsedAreas = [];
    }
    return parsedAreas;
  }, [baseColors, chart_model, parsedData.schema, widgetConfig]);

  if (!widget) return null;

  return (
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
  );
});
