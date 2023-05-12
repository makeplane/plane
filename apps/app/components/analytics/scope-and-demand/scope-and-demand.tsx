import { useRouter } from "next/router";

import useSWR from "swr";

// services
import analyticsService from "services/analytics.service";
// components
import {
  AnalyticsDemand,
  AnalyticsLeaderboard,
  AnalyticsScope,
  AnalyticsYearWiseIssues,
} from "components/analytics";
// ui
import { Loader, PrimaryButton } from "components/ui";
// fetch-keys
import { DEFAULT_ANALYTICS } from "constants/fetch-keys";

type Props = {
  fullScreen?: boolean;
  isProjectLevel?: boolean;
};

export const ScopeAndDemand: React.FC<Props> = ({ fullScreen = true, isProjectLevel = true }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const params = isProjectLevel
    ? {
        project: projectId ? projectId.toString() : null,
        cycle: cycleId ? cycleId.toString() : null,
        module: moduleId ? moduleId.toString() : null,
      }
    : undefined;

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
            <div className={`grid grid-cols-1 gap-5 ${fullScreen ? "md:grid-cols-2" : ""}`}>
              <AnalyticsDemand defaultAnalytics={defaultAnalytics} />
              <AnalyticsScope defaultAnalytics={defaultAnalytics} />
              <AnalyticsLeaderboard
                users={defaultAnalytics.most_issue_created_user.map((user) => ({
                  avatar: user.created_by__avatar,
                  email: user.created_by__email,
                  count: user.count,
                }))}
                title="Most issues created"
              />
              <AnalyticsLeaderboard
                users={defaultAnalytics.most_issue_closed_user.map((user) => ({
                  avatar: user.assignees__avatar,
                  email: user.assignees__email,
                  count: user.count,
                }))}
                title="Most issues closed"
              />
              <div className={fullScreen ? "md:col-span-2" : ""}>
                <AnalyticsYearWiseIssues defaultAnalytics={defaultAnalytics} />
              </div>
            </div>
          </div>
        ) : (
          <Loader className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
          </Loader>
        )
      ) : (
        <div className="grid h-full place-items-center p-5">
          <div className="space-y-4 text-brand-secondary">
            <p className="text-sm">There was some error in fetching the data.</p>
            <div className="flex items-center justify-center gap-2">
              <PrimaryButton onClick={() => mutateDefaultAnalytics()}>Refresh</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
