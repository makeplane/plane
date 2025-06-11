import { useMemo } from "react";
import { ColumnDef, RowData, Table } from "@tanstack/react-table";
import { mkConfig } from "export-to-csv";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane package imports
import { Download } from "lucide-react";
import {
  ANALYTICS_X_AXIS_VALUES,
  ANALYTICS_Y_AXIS_VALUES,
  CHART_COLOR_PALETTES,
  ChartXAxisDateGrouping,
  ChartXAxisProperty,
  ChartYAxisMetric,
  EChartModels,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { ExportConfig } from "@plane/types";
import { TBarItem, TChart, TChartDatum } from "@plane/types/src/charts";
// plane web components
import { Button } from "@plane/ui";
import { generateExtendedColors, parseChartData } from "@/components/chart/utils";
// hooks
import { useProjectState } from "@/hooks/store";
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { AnalyticsService } from "@/services/analytics.service";
import AnalyticsEmptyState from "../empty-state";
import { exportCSV } from "../export";
import { DataTable } from "../insight-table/data-table";
import { ChartLoader } from "../loaders";
import { generateBarColor } from "./utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    export: ExportConfig<TData>;
  }
}

interface Props {
  x_axis: ChartXAxisProperty;
  y_axis: ChartYAxisMetric;
  group_by?: ChartXAxisProperty;
  x_axis_date_grouping?: ChartXAxisDateGrouping;
}

const analyticsService = new AnalyticsService();
const PriorityChart = observer((props: Props) => {
  const { x_axis, y_axis, group_by } = props;
  const { t } = useTranslation();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-chart-bar" });
  // store hooks
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView, isEpic } = useAnalytics();
  const { workspaceStates } = useProjectState();
  const { resolvedTheme } = useTheme();
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();

  const { data: priorityChartData, isLoading: priorityChartLoading } = useSWR(
    `customized-insights-chart-${workspaceSlug}-${selectedDuration}-
    ${selectedProjects}-${selectedCycle}-${selectedModule}-${props.x_axis}-${props.y_axis}-${props.group_by}-${isPeekView}-${isEpic}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<TChart>(
        workspaceSlug,
        "custom-work-items",
        {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
          ...(isEpic ? { epic: true } : {}),
          ...props,
        },
        isPeekView
      )
  );
  const parsedData = useMemo(
    () =>
      priorityChartData && parseChartData(priorityChartData, props.x_axis, props.group_by, props.x_axis_date_grouping),
    [priorityChartData, props.x_axis, props.group_by, props.x_axis_date_grouping]
  );
  const chart_model = props.group_by ? EChartModels.STACKED : EChartModels.BASIC;

  const bars: TBarItem<string>[] = useMemo(() => {
    if (!parsedData) return [];
    let parsedBars: TBarItem<string>[];
    const schemaKeys = Object.keys(parsedData.schema);
    const baseColors = CHART_COLOR_PALETTES[0]?.[resolvedTheme === "dark" ? "dark" : "light"];
    const extendedColors = generateExtendedColors(baseColors ?? [], schemaKeys.length);
    if (chart_model === EChartModels.BASIC) {
      parsedBars = [
        {
          key: "count",
          label: "Count",
          stackId: "bar-one",
          fill: (payload) => generateBarColor(payload.key, { x_axis, y_axis, group_by }, baseColors, workspaceStates),
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
  }, [chart_model, group_by, parsedData, resolvedTheme, workspaceStates, x_axis, y_axis]);

  const yAxisLabel = useMemo(
    () => ANALYTICS_Y_AXIS_VALUES.find((item) => item.value === props.y_axis)?.label ?? props.y_axis,
    [props.y_axis]
  );
  const xAxisLabel = useMemo(
    () => ANALYTICS_X_AXIS_VALUES.find((item) => item.value === props.x_axis)?.label ?? props.x_axis,
    [props.x_axis]
  );

  const defaultColumns: ColumnDef<TChartDatum>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => xAxisLabel,
        meta: {
          export: {
            key: xAxisLabel,
            value: (row) => row.original.name,
            label: xAxisLabel,
          },
        },
      },
      {
        accessorKey: "count",
        header: () => <div className="text-right">Count</div>,
        cell: ({ row }) => <div className="text-right">{row.original.count}</div>,
        meta: {
          export: {
            key: "Count",
            value: (row) => row.original.count,
            label: "Count",
          },
        },
      },
    ],
    [xAxisLabel]
  );

  const columns: ColumnDef<TChartDatum>[] = useMemo(
    () =>
      parsedData
        ? Object.keys(parsedData?.schema ?? {}).map((key) => ({
            accessorKey: key,
            header: () => <div className="text-right">{parsedData.schema[key]}</div>,
            cell: ({ row }) => <div className="text-right">{row.original[key]}</div>,
            meta: {
              export: {
                key,
                value: (row) => row.original[key],
                label: parsedData.schema[key],
              },
            },
          }))
        : [],
    [parsedData]
  );

  return (
    <div className="flex flex-col gap-12 ">
      {priorityChartLoading ? (
        <ChartLoader />
      ) : parsedData?.data && parsedData.data.length > 0 ? (
        <>
          <BarChart
            className="h-[370px] w-full"
            data={parsedData.data}
            bars={bars}
            margin={{
              bottom: 30,
            }}
            xAxis={{
              key: "name",
              label: xAxisLabel.replace("_", " "),
              dy: 30,
            }}
            yAxis={{
              key: "count",
              label: t("no_of", { entity: yAxisLabel.replace("_", " ") }),
              offset: -40,
              dx: -26,
            }}
          />
          <DataTable
            data={parsedData.data}
            columns={[...defaultColumns, ...columns]}
            searchPlaceholder={`${parsedData.data.length} ${xAxisLabel}`}
            actions={(table: Table<TChartDatum>) => (
              <Button
                variant="accent-primary"
                prependIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() => exportCSV(table.getRowModel().rows, [...defaultColumns, ...columns], workspaceSlug)}
              >
                <div>{t("exporter.csv.short_description")}</div>
              </Button>
            )}
          />
        </>
      ) : (
        <AnalyticsEmptyState
          title={t("workspace_analytics.empty_state.customized_insights.title")}
          description={t("workspace_analytics.empty_state.customized_insights.description")}
          className="h-[350px]"
          assetPath={resolvedPath}
        />
      )}
    </div>
  );
});

export default PriorityChart;
