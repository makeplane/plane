import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { observer } from 'mobx-react'
import { useParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import useSWR from 'swr'
import { ANALYTICS_V2_Y_AXIS_VALUES, ChartXAxisDateGrouping, ChartXAxisProperty, ChartYAxisMetric, EChartModels } from '@plane/constants'
import { useTranslation } from '@plane/i18n'
import { BarChart } from '@plane/propel/charts/bar-chart'
import { IChartResponseV2 } from '@plane/types'
import { TBarItem, TChartDatum } from '@plane/types/src/charts'
import { CHART_COLOR_PALETTES, generateExtendedColors, parseChartData } from '@/components/chart/utils'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import AnalyticsV2EmptyState from '../empty-state'
import { DataTable } from '../insight-table/data-table'
import { ChartLoader } from '../loaders'
interface Props {
  x_axis: ChartXAxisProperty
  y_axis: ChartYAxisMetric
  group_by?: ChartXAxisProperty
  x_axis_date_grouping?: ChartXAxisDateGrouping
}

const analyticsV2Service = new AnalyticsV2Service()
const PriorityChart = observer((props: Props) => {
  const { selectedDuration, selectedProjects } = useAnalyticsV2()
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation()
  const workspaceSlug = params.workspaceSlug as string;
  const { data: priorityChartData, isLoading: priorityChartLoading } = useSWR(
    `customized-insights-chart-${workspaceSlug}-${selectedDuration}-${props.x_axis}-${props.y_axis}-${props.group_by}`,
    () => analyticsV2Service.getAdvanceAnalyticsCharts<IChartResponseV2>(workspaceSlug, 'custom-work-items', {
      date_filter: selectedDuration,
      project_ids: selectedProjects,
      ...props
    }),
  )
  const parsedData = useMemo(() => parseChartData(priorityChartData, props.x_axis, props.group_by, props.x_axis_date_grouping)
    , [priorityChartData, props.x_axis, props.group_by, props.x_axis_date_grouping])

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

  const defaultColumns: ColumnDef<TChartDatum>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: () => "Name",
    },
    {
      accessorKey: "count",
      header: () => <div className="text-right">Count</div>,
      cell: ({ row }) => <div className="text-right">{row.original.count}</div>
    },
  ], []);

  const columns: ColumnDef<TChartDatum>[] = useMemo(() => Object.keys(parsedData.schema).map((key) => ({
    accessorKey: key,
    header: () => <div className="text-right">{parsedData.schema[key]}</div>,
    cell: ({ row }) => <div className="text-right">{row.original[key]}</div>
  })), [parsedData.schema]);

  const yAxisLabel = useMemo(() => ANALYTICS_V2_Y_AXIS_VALUES.find((item) => item.value === props.y_axis)?.label ?? props.y_axis, [props.y_axis]);
  const xAxisLabel = useMemo(() => props.x_axis === ChartXAxisProperty.PRIORITY ? "Priority" : props.x_axis, [props.x_axis]);

  return (
    <div className='flex flex-col gap-12 '>
      {priorityChartLoading ? <ChartLoader /> :
        parsedData.data && parsedData.data.length > 0 ?
          <>
            <BarChart
              className="w-full h-[370px]"
              data={parsedData.data}
              bars={bars}
              margin={{
                bottom: 30
              }}
              xAxis={{
                key: "name",
                label: xAxisLabel.replace("_", " "),
                dy: 0,
              }}
              yAxis={{
                key: "count",
                label: yAxisLabel,
                offset: -40,
                dx: -26,
              }}
            />
            <DataTable
              data={parsedData.data}
              columns={[...defaultColumns, ...columns]}
              searchPlaceholder={`${parsedData.data.length} ${yAxisLabel}`}
            />
          </> :
          <AnalyticsV2EmptyState
            title={t('workspace_analytics.empty_state_v2.customized_insights.title')}
            description={t('workspace_analytics.empty_state_v2.customized_insights.description')}
            className='h-[350px]'
          />
      }
    </div>

  )
})

export default PriorityChart