import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { observer } from 'mobx-react'
import { useParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import useSWR from 'swr'
// plane package imports
import { Download } from 'lucide-react'
import { ANALYTICS_V2_X_AXIS_VALUES, ANALYTICS_V2_Y_AXIS_VALUES, ChartXAxisDateGrouping, ChartXAxisProperty, ChartYAxisMetric, EChartModels } from '@plane/constants'
import { useTranslation } from '@plane/i18n'
import { BarChart } from '@plane/propel/charts/bar-chart'
import { IChartResponseV2 } from '@plane/types'
import { TBarItem, TChartDatum } from '@plane/types/src/charts'
// plane web components
import { Button, setToast, TOAST_TYPE } from '@plane/ui'
import { CHART_COLOR_PALETTES, generateExtendedColors, parseChartData } from '@/components/chart/utils'
// hooks
import { useProjectState } from '@/hooks/store'
import { useAnalyticsV2 } from '@/hooks/store/use-analytics-v2'
import { useWorkspaceIssueProperties } from '@/hooks/use-workspace-issue-properties'
import { AnalyticsV2Service } from '@/services/analytics-v2.service'
import AnalyticsV2EmptyState from '../empty-state'
import { DataTable } from '../insight-table/data-table'
import { ChartLoader } from '../loaders'
import { generateBarColor } from './utils'




interface Props {
  x_axis: ChartXAxisProperty
  y_axis: ChartYAxisMetric
  group_by?: ChartXAxisProperty
  x_axis_date_grouping?: ChartXAxisDateGrouping
}

const analyticsV2Service = new AnalyticsV2Service()
const PriorityChart = observer((props: Props) => {
  const { x_axis, y_axis, group_by } = props;
  const { t } = useTranslation()
  // store hooks
  const { selectedDuration, selectedProjects } = useAnalyticsV2()
  const { workspaceStates } = useProjectState()
  const { resolvedTheme } = useTheme();
  // router
  const params = useParams();

  const workspaceSlug = params.workspaceSlug as string;
  useWorkspaceIssueProperties(workspaceSlug);

  const { data: priorityChartData, isLoading: priorityChartLoading } = useSWR(
    `customized-insights-chart-${workspaceSlug}-${selectedDuration}-${props.x_axis}-${props.y_axis}-${props.group_by}`,
    () => analyticsV2Service.getAdvanceAnalyticsCharts<IChartResponseV2>(workspaceSlug, 'custom-work-items', {
      date_filter: selectedDuration,
      project_ids: selectedProjects?.join(','),
      ...props
    }),
  )
  const exportAnalytics = () => {
    analyticsV2Service
      .exportAnalytics(workspaceSlug, params)
      .then((res) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: res.message,
        });
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "There was some error in exporting the analytics. Please try again.",
        })
      );
  };
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
          fill: (payload) =>
            generateBarColor(
              payload.key,
              { x_axis, y_axis, group_by },
              baseColors,
              workspaceStates
            ),
          textClassName: "",
          showPercentage: false,
          showTopBorderRadius: () => true,
          showBottomBorderRadius: () => true,
        },
      ];
    } else if (chart_model === EChartModels.STACKED && parsedData.schema) {
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
  }, [chart_model, group_by, parsedData.data, parsedData.schema, resolvedTheme, workspaceStates, x_axis, y_axis]);

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
  const xAxisLabel = useMemo(() => ANALYTICS_V2_X_AXIS_VALUES.find((item) => item.value === props.x_axis)?.label ?? props.x_axis, [props.x_axis]);

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
              actions={<Button variant="accent-primary" prependIcon={<Download className="h-3.5 w-3.5" />} onClick={exportAnalytics}>
                <div>{t("exporter.csv.short_description")}</div>
              </Button>}
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