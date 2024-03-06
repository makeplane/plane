import { useEffect } from "react";
<<<<<<< HEAD
=======
import { useRouter } from "next/router";
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { mutate } from "swr";
// services
// hooks
<<<<<<< HEAD
=======
import { useCycle, useModule, useProject, useUser, useWorkspace } from "hooks/store";
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
// components
// ui
<<<<<<< HEAD
=======
import { Button, LayersIcon, TOAST_TYPE, setToast } from "@plane/ui";
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
// icons
import { CalendarDays, Download, RefreshCw } from "lucide-react";
import { Button, LayersIcon } from "@plane/ui";
import { CustomAnalyticsSidebarHeader, CustomAnalyticsSidebarProjectsList } from "components/analytics";
// helpers
// types
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";
import { cn } from "helpers/common.helper";
import { renderFormattedDate } from "helpers/date-time.helper";
import { useCycle, useModule, useProject, useUser, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
import { AnalyticsService } from "services/analytics.service";
import { IAnalyticsParams, IAnalyticsResponse, IExportAnalyticsFormData, IWorkspace } from "@plane/types";

type Props = {
  analytics: IAnalyticsResponse | undefined;
  params: IAnalyticsParams;
  isProjectLevel: boolean;
};

const analyticsService = new AnalyticsService();

export const CustomAnalyticsSidebar: React.FC<Props> = observer((props) => {
  const { analytics, params, isProjectLevel = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;
  // store hooks
  const { currentUser } = useUser();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { getWorkspaceById } = useWorkspace();

  const { fetchCycleDetails, getCycleById } = useCycle();
  const { fetchModuleDetails, getModuleById } = useModule();

  const projectDetails = projectId ? getProjectById(projectId.toString()) ?? undefined : undefined;

  const trackExportAnalytics = () => {
    if (!currentUser) return;

    const eventPayload: any = {
      workspaceSlug: workspaceSlug?.toString(),
      params: {
        x_axis: params.x_axis,
        y_axis: params.y_axis,
        group: params.segment,
        project: params.project,
      },
    };

    if (projectDetails) {
      const workspaceDetails = projectDetails.workspace as IWorkspace;

      eventPayload.workspaceId = workspaceDetails.id;
      eventPayload.workspaceName = workspaceDetails.name;
      eventPayload.projectId = projectDetails.id;
      eventPayload.projectIdentifier = projectDetails.identifier;
      eventPayload.projectName = projectDetails.name;
    }

    if (cycleDetails || moduleDetails) {
      const details = cycleDetails || moduleDetails;

      const currentProjectDetails = getProjectById(details?.project_id || "");
      const currentWorkspaceDetails = getWorkspaceById(details?.workspace_id || "");

      eventPayload.workspaceId = details?.workspace_id;
      eventPayload.workspaceName = currentWorkspaceDetails?.name;
      eventPayload.projectId = details?.project_id;
      eventPayload.projectIdentifier = currentProjectDetails?.identifier;
      eventPayload.projectName = currentProjectDetails?.name;
    }

    if (cycleDetails) {
      eventPayload.cycleId = cycleDetails.id;
      eventPayload.cycleName = cycleDetails.name;
    }

    if (moduleDetails) {
      eventPayload.moduleId = moduleDetails.id;
      eventPayload.moduleName = moduleDetails.name;
    }
  };

  const exportAnalytics = () => {
    if (!workspaceSlug) return;

    const data: IExportAnalyticsFormData = {
      x_axis: params.x_axis,
      y_axis: params.y_axis,
    };

    if (params.segment) data.segment = params.segment;
    if (params.project) data.project = params.project;

    analyticsService
      .exportAnalytics(workspaceSlug.toString(), data)
      .then((res) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: res.message,
        });

        trackExportAnalytics();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "There was some error in exporting the analytics. Please try again.",
        })
      );
  };

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;

  // fetch cycle details
  useEffect(() => {
    if (!workspaceSlug || !projectId || !cycleId || cycleDetails) return;

    fetchCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleId.toString());
  }, [cycleId, cycleDetails, fetchCycleDetails, projectId, workspaceSlug]);

  // fetch module details
  useEffect(() => {
    if (!workspaceSlug || !projectId || !moduleId || moduleDetails) return;

    fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
  }, [moduleId, moduleDetails, fetchModuleDetails, projectId, workspaceSlug]);

  const selectedProjects = params.project && params.project.length > 0 ? params.project : workspaceProjectIds;

  return (
    <div
      className={cn(
        "relative h-full flex w-full gap-2 justify-between items-start px-5 py-4 bg-custom-sidebar-background-100",
        !isProjectLevel ? "flex-col" : ""
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-custom-background-80 px-3 py-1 text-xs text-custom-text-200">
          <LayersIcon height={14} width={14} />
          {analytics ? analytics.total : "..."}
          <div className={cn(isProjectLevel ? "hidden md:block" : "")}>Issues</div>
        </div>
        {isProjectLevel && (
          <div className="flex items-center gap-1 rounded-md bg-custom-background-80 px-3 py-1 text-xs text-custom-text-200">
            <CalendarDays className="h-3.5 w-3.5" />
            {renderFormattedDate(
              (cycleId
                ? cycleDetails?.created_at
                : moduleId
                  ? moduleDetails?.created_at
                  : projectDetails?.created_at) ?? ""
            )}
          </div>
        )}
      </div>

      <div className={cn("h-full w-full overflow-hidden", isProjectLevel ? "hidden" : "block")}>
        <>
          {!isProjectLevel && selectedProjects && selectedProjects.length > 0 && (
            <CustomAnalyticsSidebarProjectsList projectIds={selectedProjects} />
          )}
          <CustomAnalyticsSidebarHeader />
        </>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Button
          variant="neutral-primary"
          prependIcon={<RefreshCw className="h-3 md:h-3.5 w-3 md:w-3.5" />}
          onClick={() => {
            if (!workspaceSlug) return;

            mutate(ANALYTICS(workspaceSlug.toString(), params));
          }}
        >
          <div className={cn(isProjectLevel ? "hidden md:block" : "")}>Refresh</div>
        </Button>
        <Button variant="primary" prependIcon={<Download className="h-3.5 w-3.5" />} onClick={exportAnalytics}>
          <div className={cn(isProjectLevel ? "hidden md:block" : "")}>Export as CSV</div>
        </Button>
      </div>
    </div>
  );
});
