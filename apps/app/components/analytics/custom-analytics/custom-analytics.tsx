import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Control, UseFormSetValue } from "react-hook-form";
// hooks
import useProjects from "hooks/use-projects";
// components
import {
  AnalyticsGraph,
  AnalyticsSelectBar,
  AnalyticsSidebar,
  AnalyticsTable,
} from "components/analytics";
// ui
import { Loader, PrimaryButton } from "components/ui";
// helpers
import { convertResponseToBarGraphData } from "helpers/analytics.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse, ICurrentUserResponse } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";

type Props = {
  analytics: IAnalyticsResponse | undefined;
  analyticsError: any;
  params: IAnalyticsParams;
  control: Control<IAnalyticsParams, any>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  fullScreen: boolean;
  user: ICurrentUserResponse | undefined;
};

export const CustomAnalytics: React.FC<Props> = ({
  analytics,
  analyticsError,
  params,
  control,
  setValue,
  fullScreen,
  user,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const isProjectLevel = projectId ? true : false;

  const yAxisKey = params.y_axis === "issue_count" ? "count" : "estimate";
  const barGraphData = convertResponseToBarGraphData(analytics?.distribution, params);

  const { projects } = useProjects();

  return (
    <div
      className={`overflow-hidden flex flex-col-reverse ${
        fullScreen ? "md:grid md:grid-cols-4 md:h-full" : ""
      }`}
    >
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
                <AnalyticsTable
                  analytics={analytics}
                  barGraphData={barGraphData}
                  params={params}
                  yAxisKey={yAxisKey}
                />
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
                <PrimaryButton
                  onClick={() => {
                    if (!workspaceSlug) return;

                    mutate(ANALYTICS(workspaceSlug.toString(), params));
                  }}
                >
                  Refresh
                </PrimaryButton>
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
