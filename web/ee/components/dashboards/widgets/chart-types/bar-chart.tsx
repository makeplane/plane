import { useMemo } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
// plane imports
import { CHART_COLOR_PALETTES, DEFAULT_WIDGET_COLOR, EWidgetChartModels } from "@plane/constants";
import { TBarChartWidgetConfig, TBarItem, TDashboardWidgetDatum } from "@plane/types";
// local imports
import { generateExtendedColors, TWidgetComponentProps } from ".";

const BarChart = dynamic(() =>
  import("@plane/propel/charts/bar-chart").then((mod) => ({
    default: mod.BarChart,
  }))
);

export const DashboardBarChartWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { parsedData, widget } = props;
  // derived values
  const { chart_model } = widget ?? {};
  const widgetConfig = widget?.config as TBarChartWidgetConfig | undefined;
  const showLegends = !!widgetConfig?.show_legends;
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
          showTopBorderRadius: () => true,
          showBottomBorderRadius: () => true,
        },
      ];
    } else if (chart_model === EWidgetChartModels.STACKED && parsedData.schema) {
      // get the extreme bars of a particular group, excluding the zero value bars
      const parsedExtremes: {
        [key: string]: {
          top: string | null;
          bottom: string | null;
        };
      } = {};
      parsedData.data.forEach((datum) => {
        let top = null;
        let bottom = null;
        for (let i = 0; i < schemaKeys.length; i++) {
          const key = schemaKeys[i];
          if (datum[key] === 0) continue;
          if (!bottom) bottom = key;
          top = key;
        }
        parsedExtremes[datum.key] = { top, bottom };
      });

      parsedBars = schemaKeys.map((key, index) => ({
        key: key,
        label: parsedData.schema[key],
        stackId: "bar-one",
        fill: extendedColors[index],
        textClassName: "",
        showPercentage: false,
        showTopBorderRadius: (value, payload: TDashboardWidgetDatum) => parsedExtremes[payload.key].top === value,
        showBottomBorderRadius: (value, payload: TDashboardWidgetDatum) => parsedExtremes[payload.key].bottom === value,
      }));
    } else if (chart_model === EWidgetChartModels.GROUPED && parsedData.schema) {
      parsedBars = schemaKeys.map((key, index) => ({
        key: key,
        label: parsedData.schema[key],
        stackId: `bar-${index}`,
        fill: extendedColors[index],
        textClassName: "",
        showPercentage: false,
        showTopBorderRadius: () => true,
        showBottomBorderRadius: () => true,
      }));
    } else {
      parsedBars = [];
    }
    return parsedBars;
  }, [baseColors, chart_model, parsedData, widgetConfig]);

  if (!widget) return null;

  return (
    <BarChart
      className="size-full"
      data={parsedData.data}
      bars={bars}
      barSize={20}
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
