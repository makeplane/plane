import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Control, UseFormSetValue, useForm } from "react-hook-form";
// hooks
import useProjects from "hooks/use-projects";
// components
import { AnalyticsGraph, AnalyticsSelectBar, AnalyticsSidebar, AnalyticsTable } from "components/analytics";
// ui
import { Button, Loader } from "@plane/ui";
// helpers
import { convertResponseToBarGraphData } from "helpers/analytics.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse, IUser } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";
// services
import analyticsService from "services/analytics.service";

type Props = {
  fullScreen: boolean;
  user?: IUser | undefined;
};

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

export const CustomAnalytics: React.FC<Props> = ({ fullScreen, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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

  const isProjectLevel = projectId ? true : false;

  const yAxisKey = params.y_axis === "issue_count" ? "count" : "estimate";
  const barGraphData = convertResponseToBarGraphData(analytics?.distribution, params);

  const { projects } = useProjects();

  return (
    <div className={`overflow-hidden flex flex-col-reverse ${fullScreen ? "md:grid md:grid-cols-4 md:h-full" : ""}`}>
      <div className="col-span-3 flex flex-col h-full overflow-hidden">
        <AnalyticsSelectBar
          control={control}
          setValue={setValue}
          projects={projects ?? []}
          params={params}
          fullScreen={fullScreen}
          isProjectLevel={isProjectLevel}
        />
        {!analyticsError ? (
          analytics ? (
            analytics.total > 0 ? (
              <div className="h-full overflow-y-auto">
                <AnalyticsGraph
                  analytics={analytics}
                  barGraphData={barGraphData}
                  params={params}
                  yAxisKey={yAxisKey}
                  fullScreen={fullScreen}
                />
                <AnalyticsTable analytics={analytics} barGraphData={barGraphData} params={params} yAxisKey={yAxisKey} />
              </div>
            ) : (
              <div className="grid h-full place-items-center p-5">
                <div className="space-y-4 text-custom-text-200">
                  <p className="text-sm">No matching issues found. Try changing the parameters.</p>
                </div>
              </div>
            )
          ) : (
            <Loader className="space-y-6 p-5">
              <Loader.Item height="300px" />
              <Loader className="space-y-4">
                <Loader.Item height="30px" />
                <Loader.Item height="30px" />
                <Loader.Item height="30px" />
                <Loader.Item height="30px" />
              </Loader>
            </Loader>
          )
        ) : (
          <div className="grid h-full place-items-center p-5">
            <div className="space-y-4 text-custom-text-200">
              <p className="text-sm">There was some error in fetching the data.</p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!workspaceSlug) return;

                    mutate(ANALYTICS(workspaceSlug.toString(), params));
                  }}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AnalyticsSidebar
        analytics={analytics}
        params={params}
        fullScreen={fullScreen}
        isProjectLevel={isProjectLevel}
        user={user}
      />
    </div>
  );
};
