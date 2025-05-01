import { useMemo } from 'react'
import { observer } from 'mobx-react'
import { useParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import useSWR from 'swr'
import { ChartXAxisDateGrouping, ChartXAxisProperty, ChartYAxisMetric, EChartModels } from '@plane/constants'
import { BarChart } from '@plane/propel/charts/bar-chart'
import { IChartResponseV2 } from '@plane/types'
import { TBarItem, TChartDatum } from '@plane/types/src/charts'
import { CHART_COLOR_PALETTES, generateExtendedColors, parseChartData } from '@/components/chart/utils'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
interface Props {
  x_axis: ChartXAxisProperty
  y_axis: ChartYAxisMetric
  group_by?: ChartXAxisProperty
  x_axis_date_grouping?: ChartXAxisDateGrouping
}

const analyticsV2Service = new AnalyticsV2Service()
const PriorityChart = observer((props: Props) => {
  const { selectedDuration, selectedProject } = useAnalyticsV2()
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const workspaceSlug = params.workspaceSlug as string;
  const { data: customizedInsightsChartData } = useSWR(
    `customized-insights-chart-${workspaceSlug}-${selectedDuration}-${props.x_axis}-${props.y_axis}-${props.group_by}`,
    () => analyticsV2Service.getAdvanceAnalyticsCharts<IChartResponseV2>(workspaceSlug, 'custom-work-items', {
      date_filter: selectedDuration,
      project_ids: selectedProject,
      ...props
    }),
  )
  const parsedData = useMemo(() => parseChartData(customizedInsightsChartData, props.x_axis, props.group_by, props.x_axis_date_grouping)
    , [customizedInsightsChartData, props.x_axis, props.group_by, props.x_axis_date_grouping])

  const chart_model = props.group_by ? EChartModels.STACKED : EChartModels.BASIC;

  const bars: TBarItem<string>[] = useMemo(() => {
    let parsedBars: TBarItem<string>[];
    const schemaKeys = Object.keys(parsedData.schema);
    const baseColors = CHART_COLOR_PALETTES[0]?.[
      resolvedTheme === "dark" ? "dark" : "light"
    ];
    const extendedColors = generateExtendedColors(baseColors ?? [], schemaKeys.length);


    if (chart_model === EChartModels.BASIC) {
      parsedBars = [
        {
          key: "count",
          label: "Count",
          stackId: "bar-one",
          fill: "#049bdc",
          textClassName: "",
          showPercentage: false,
          showTopBorderRadius: () => true,
          showBottomBorderRadius: () => true,
        },
      ];
    } else if (chart_model === EChartModels.STACKED && parsedData.schema) {
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
        showTopBorderRadius: (value, payload: TChartDatum) => parsedExtremes[payload.key].top === value,
        showBottomBorderRadius: (value, payload: TChartDatum) => parsedExtremes[payload.key].bottom === value,
      }));
    } else {
      parsedBars = [];
    }
    return parsedBars;
  }, [chart_model, parsedData.data, parsedData.schema, resolvedTheme]);

  return (
    <BarChart
      className="w-full h-[370px]"
      data={parsedData.data}
      bars={bars}
      xAxis={{
        key: "name",
      }}
      yAxis={{
        key: "count",
        label: "No of Work Items",
        offset: -40,
        dx: -26,
      }}
    />
  )
})

export default PriorityChart