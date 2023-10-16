import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
// services
import { AnalyticsService } from "services/analytics.service";
import { TrackEventService } from "services/track_event.service";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CustomAnalyticsSidebarHeader, CustomAnalyticsSidebarProjectsList } from "components/analytics";
// ui
import { Button } from "@plane/ui";
// icons
import { ArrowDownTrayIcon, ArrowPathIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// helpers
import { renderShortDate } from "helpers/date-time.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse, IExportAnalyticsFormData, IWorkspace } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";

type Props = {
  analytics: IAnalyticsResponse | undefined;
  params: IAnalyticsParams;
  fullScreen: boolean;
  isProjectLevel: boolean;
};

const analyticsService = new AnalyticsService();
const trackEventService = new TrackEventService();

export const CustomAnalyticsSidebar: React.FC<Props> = observer(
  ({ analytics, params, fullScreen, isProjectLevel = false }) => {
    const router = useRouter();
    const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

    const { setToastAlert } = useToast();

    const { user: userStore, project: projectStore, cycle: cycleStore, module: moduleStore } = useMobxStore();

    const user = userStore.currentUser;

    const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;
    const projectDetails =
      workspaceSlug && projectId
        ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString()) ?? undefined
        : undefined;

    const trackExportAnalytics = () => {
      if (!user) return;

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

      trackEventService.trackAnalyticsEvent(
        eventPayload,
        cycleId
          ? "CYCLE_ANALYTICS_EXPORT"
          : moduleId
          ? "MODULE_ANALYTICS_EXPORT"
          : projectId
          ? "PROJECT_ANALYTICS_EXPORT"
          : "WORKSPACE_ANALYTICS_EXPORT",
        user
      );
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

    const cycleDetails = cycleId ? cycleStore.getCycleById(cycleId.toString()) : undefined;
    const moduleDetails = moduleId ? moduleStore.getModuleById(moduleId.toString()) : undefined;

    // fetch cycle details
    useEffect(() => {
      if (!workspaceSlug || !projectId || !cycleId || cycleDetails) return;

      cycleStore.fetchCycleWithId(workspaceSlug.toString(), projectId.toString(), cycleId.toString());
    }, [cycleId, cycleDetails, cycleStore, projectId, workspaceSlug]);

    // fetch module details
    useEffect(() => {
      if (!workspaceSlug || !projectId || !moduleId || moduleDetails) return;

      moduleStore.fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
    }, [moduleId, moduleDetails, moduleStore, projectId, workspaceSlug]);

    const selectedProjects = params.project && params.project.length > 0 ? params.project : projects?.map((p) => p.id);

    return (
      <div
        className={`px-5 py-2.5 flex items-center justify-between space-y-2 ${
          fullScreen
            ? "border-l border-custom-border-200 md:h-full md:border-l md:border-custom-border-200 md:space-y-4 overflow-hidden md:flex-col md:items-start md:py-5"
            : ""
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-custom-background-80 rounded-md px-3 py-1 text-custom-text-200 text-xs">
            <LayerDiagonalIcon height={14} width={14} />
            {analytics ? analytics.total : "..."} Issues
          </div>
          {isProjectLevel && (
            <div className="flex items-center gap-1 bg-custom-background-80 rounded-md px-3 py-1 text-custom-text-200 text-xs">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              {renderShortDate(
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
                <CustomAnalyticsSidebarProjectsList
                  projects={projects?.filter((p) => selectedProjects.includes(p.id)) ?? []}
                />
              )}
              <CustomAnalyticsSidebarHeader />
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-self-end">
          <Button
            variant="neutral-primary"
            prependIcon={<ArrowPathIcon className="h-3.5 w-3.5" />}
            onClick={() => {
              if (!workspaceSlug) return;

              mutate(ANALYTICS(workspaceSlug.toString(), params));
            }}
          >
            Refresh
          </Button>
          <Button variant="primary" prependIcon={<ArrowDownTrayIcon />} onClick={exportAnalytics}>
            Export as CSV
          </Button>
        </div>
      </div>
    );
  }
);
