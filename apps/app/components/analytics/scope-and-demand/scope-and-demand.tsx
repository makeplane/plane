import { useRouter } from "next/router";

import useSWR from "swr";

// services
import analyticsService from "services/analytics.service";
// components
import { AnalyticsDemand, AnalyticsScope } from "components/analytics";
// ui
import { Loader, PrimaryButton } from "components/ui";
// fetch-keys
import { DEFAULT_ANALYTICS } from "constants/fetch-keys";

type Props = {
  fullScreen?: boolean;
};

export const ScopeAndDemand: React.FC<Props> = ({ fullScreen = true }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const params = {
    project: projectId ? projectId.toString() : null,
    cycle: cycleId ? cycleId.toString() : null,
    module: moduleId ? moduleId.toString() : null,
  };

  const {
    data: defaultAnalytics,
    error: defaultAnalyticsError,
    mutate: mutateDefaultAnalytics,
  } = useSWR(
    workspaceSlug ? DEFAULT_ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug
      ? () => analyticsService.getDefaultAnalytics(workspaceSlug.toString(), params)
      : null
  );

  return (
    <>
      {!defaultAnalyticsError ? (
        defaultAnalytics ? (
          <div className="h-full overflow-y-auto p-5 text-sm">
            <div className={`grid grid-cols-1 gap-5 ${fullScreen ? "lg:grid-cols-2" : ""}`}>
              <AnalyticsDemand defaultAnalytics={defaultAnalytics} />
              <AnalyticsScope defaultAnalytics={defaultAnalytics} />
            </div>
          </div>
        ) : (
          <Loader className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            <Loader.Item height="300px" />
            <Loader.Item height="300px" />
          </Loader>
        )
      ) : (
        <div className="grid h-full place-items-center p-5">
          <div className="space-y-4 text-brand-secondary">
            <p className="text-sm">There was some error in fetching the data.</p>
            <div className="flex items-center justify-center gap-2">
              <PrimaryButton onClick={mutateDefaultAnalytics}>Refresh</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
