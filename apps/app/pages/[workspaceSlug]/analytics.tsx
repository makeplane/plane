import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import analyticsService from "services/analytics.service";
// hooks
import useWorkspaces from "hooks/use-workspaces";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { AnalyticsSidebar, AnalyticsTable } from "components/workspace";
// ui
import { BarGraph, PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";
// constants
import { convertResponseToBarGraphData, generateBarColor } from "constants/analytics";
import { CHARTS_THEME, DEFAULT_MARGIN } from "constants/graph";

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const Analytics = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { activeWorkspace } = useWorkspaces();

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: watch("project"),
  };

  const { data: analytics, error: analyticsError } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const yAxisKey = params.y_axis === "issue_count" ? "count" : "effort";
  const barGraphData = convertResponseToBarGraphData(
    analytics?.distribution,
    watch("segment") === null ? false : true,
    watch("y_axis")
  );

  const generateYAxisTickValues = () => {
    if (!analytics) return [];

    let data: number[] = [];

    if (params.segment)
      // find the total no of issues in each segment
      data = Object.keys(analytics.distribution).map((segment) => {
        let totalSegmentIssues = 0;

        analytics.distribution[segment].map((s) => {
          totalSegmentIssues += s[yAxisKey] as number;
        });

        return totalSegmentIssues;
      });
    else data = barGraphData.data.map((d) => d[yAxisKey] as number);

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);

    const valueRange = maxValue - minValue;

    let tickInterval = 1;
    if (valueRange > 10) tickInterval = 2;
    if (valueRange > 50) tickInterval = 5;
    if (valueRange > 100) tickInterval = 10;

    const tickValues = [];
    let tickValue = minValue;
    while (tickValue <= maxValue) {
      tickValues.push(tickValue);
      tickValue += tickInterval;
    }

    return tickValues;
  };

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Analytics`} />
        </Breadcrumbs>
      }
      right={
        <PrimaryButton
          className="flex items-center gap-2"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "p" });
            document.dispatchEvent(e);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Add Project
        </PrimaryButton>
      }
    >
      <div className="h-full space-y-8">
        <div className="grid h-full grid-cols-4">
          <div className="col-span-3 h-full">
            {!analyticsError ? (
              analytics && analytics.total > 0 ? (
                <div>
                  <BarGraph
                    data={barGraphData.data}
                    indexBy="name"
                    keys={barGraphData.xAxisKeys}
                    axisLeft={{
                      tickValues: generateYAxisTickValues(),
                    }}
                    axisBottom={{
                      renderTick: (tick) => (
                        <g transform={`translate(${tick.x},${tick.y + 4})`}>
                          <text
                            x={0}
                            y={0}
                            dy={16}
                            textAnchor="middle"
                            fill="rgb(var(--color-text-base))"
                            fontSize={11}
                            className={params.x_axis === "priority" ? "capitalize" : ""}
                          >
                            {tick.value}
                          </text>
                        </g>
                      ),
                    }}
                    colors={(datum) =>
                      generateBarColor(
                        `${datum[params.segment ? "id" : "indexValue"]}`,
                        analytics,
                        params
                      )
                    }
                    padding={0.9}
                    margin={{ ...DEFAULT_MARGIN, right: 20 }}
                    theme={{ ...CHARTS_THEME, background: "rgb(var(--color-bg-surface-1))" }}
                  />
                  <div className="m-5 mt-0">
                    <AnalyticsTable
                      analytics={analytics}
                      barGraphData={barGraphData}
                      params={params}
                      yAxisKey={yAxisKey}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid h-full place-items-center p-5">
                  <div className="space-y-4 text-brand-secondary">
                    <p className="text-sm">
                      No matching issues found. Try changing the parameters.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="grid h-full place-items-center p-5">
                <div className="space-y-4 text-brand-secondary">
                  <p className="text-sm">
                    There was some error in fetching the data. Please refresh the page and try
                    again.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <PrimaryButton onClick={() => router.reload()}>Refresh page</PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>
          <AnalyticsSidebar
            analytics={analytics}
            params={params}
            control={control}
            setValue={setValue}
          />
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default Analytics;
