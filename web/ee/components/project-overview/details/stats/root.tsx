import useSWR from "swr";
import { TStateAnalytics } from "@plane/types";
import { Loader } from "@plane/ui";
import { ProgressSection } from "@/plane-web/components/common/layout/main/sections/progress-root";
import projectService from "@/plane-web/services/project/project.service";
import { TProject } from "@/plane-web/types";

type TStatsTodayProps = {
  workspaceSlug: string;
  project: TProject;
};

export const StatsToday = (props: TStatsTodayProps) => {
  const { workspaceSlug, project } = props;

  const { data: analytics, isLoading } = useSWR(
    project && workspaceSlug ? `PROJECT_ANALYTICS_${project?.id}` : null,
    project && workspaceSlug ? () => projectService.fetchProjectAnalytics(workspaceSlug, project?.id) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return isLoading ? (
    <Loader className="flex flex-col gap-4 py-4">
      <Loader.Item height="125px" width="100%" />
    </Loader>
  ) : (
    <div className="mt-4 mx-2 border-y border-custom-border-200 py-4">
      <ProgressSection data={analytics as TStateAnalytics} title="Metrics as of today" />
    </div>
  );
};
