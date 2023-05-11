import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import analyticsService from "services/analytics.service";
// components
import {
  AnalyticsGraph,
  AnalyticsSidebar,
  AnalyticsTable,
  CreateUpdateAnalyticsModal,
} from "components/analytics";
// ui
import { Loader, PrimaryButton } from "components/ui";
// types
import { convertResponseToBarGraphData } from "constants/analytics";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

type Props = {
  isProjectLevel?: boolean;
  fullScreen?: boolean;
};

export const CustomAnalytics: React.FC<Props> = ({ isProjectLevel = false, fullScreen = true }) => {
  const [saveAnalyticsModal, setSaveAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: isProjectLevel ? projectId?.toString() : watch("project"),
    cycle: isProjectLevel && cycleId ? cycleId.toString() : null,
    module: isProjectLevel && moduleId ? moduleId.toString() : null,
  };

  const {
    data: analytics,
    error: analyticsError,
    mutate: mutateAnalytics,
  } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const yAxisKey = params.y_axis === "issue_count" ? "count" : "effort";
  const barGraphData = convertResponseToBarGraphData(
    analytics?.distribution,
    watch("segment") ? true : false,
    watch("y_axis")
  );

  return (
    <>
      <CreateUpdateAnalyticsModal
        isOpen={saveAnalyticsModal}
        handleClose={() => setSaveAnalyticsModal(false)}
        params={params}
      />
      <div
        className={`overflow-y-auto ${
          fullScreen ? "grid grid-cols-4 h-full" : "flex flex-col-reverse"
        }`}
      >
        <div className="col-span-3">
          {!analyticsError ? (
            analytics ? (
              analytics.total > 0 ? (
                <>
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
                </>
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
              <div className="space-y-4 text-brand-secondary">
                <p className="text-sm">There was some error in fetching the data.</p>
                <div className="flex items-center justify-center gap-2">
                  <PrimaryButton onClick={mutateAnalytics}>Refresh</PrimaryButton>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={fullScreen ? "h-full" : ""}>
          <AnalyticsSidebar
            analytics={analytics}
            params={params}
            control={control}
            setValue={setValue}
            setSaveAnalyticsModal={setSaveAnalyticsModal}
            fullScreen={fullScreen}
            isProjectLevel={isProjectLevel}
          />
        </div>
      </div>
    </>
  );
};
