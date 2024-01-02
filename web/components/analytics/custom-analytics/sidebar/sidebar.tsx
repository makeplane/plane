import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
// services
import { AnalyticsService } from "services/analytics.service";
// hooks
import { useCycle, useModule, useProject, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CustomAnalyticsSidebarHeader, CustomAnalyticsSidebarProjectsList } from "components/analytics";
// ui
import { Button, LayersIcon } from "@plane/ui";
// icons
import { CalendarDays, Download, RefreshCw } from "lucide-react";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse, IExportAnalyticsFormData, IWorkspace } from "@plane/types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";

type Props = {
  analytics: IAnalyticsResponse | undefined;
  params: IAnalyticsParams;
  fullScreen: boolean;
  isProjectLevel: boolean;
};

const analyticsService = new AnalyticsService();

export const CustomAnalyticsSidebar: React.FC<Props> = observer((props) => {
  const { analytics, params, fullScreen, isProjectLevel = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // store hooks
  const { currentUser } = useUser();
  const { workspaceProjectIds, getProjectById } = useProject();
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

      eventPayload.workspaceId = details?.workspace_detail?.id;
      eventPayload.workspaceName = details?.workspace_detail?.name;
      eventPayload.projectId = details?.project_detail.id;
      eventPayload.projectIdentifier = details?.project_detail.identifier;
      eventPayload.projectName = details?.project_detail.name;
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
        setToastAlert({
          type: "success",
          title: "Success!",
          message: res.message,
        });

        trackExportAnalytics();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
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
      className={`flex items-center justify-between space-y-2 px-5 py-2.5 ${
        fullScreen
          ? "overflow-hidden border-l border-custom-border-200 md:h-full md:flex-col md:items-start md:space-y-4 md:border-l md:border-custom-border-200 md:py-5"
          : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-custom-background-80 px-3 py-1 text-xs text-custom-text-200">
          <LayersIcon height={14} width={14} />
          {analytics ? analytics.total : "..."} Issues
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
      <div className="h-full w-full overflow-hidden">
        {fullScreen ? (
          <>
            {!isProjectLevel && selectedProjects && selectedProjects.length > 0 && (
              <CustomAnalyticsSidebarProjectsList projectIds={selectedProjects} />
            )}
            <CustomAnalyticsSidebarHeader />
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 justify-self-end">
        <Button
          variant="neutral-primary"
          prependIcon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={() => {
            if (!workspaceSlug) return;

            mutate(ANALYTICS(workspaceSlug.toString(), params));
          }}
        >
          Refresh
        </Button>
        <Button variant="primary" prependIcon={<Download className="h-3.5 w-3.5" />} onClick={exportAnalytics}>
          Export as CSV
        </Button>
      </div>
    </div>
  );
});
