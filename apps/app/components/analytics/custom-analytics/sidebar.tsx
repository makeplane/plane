import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import analyticsService from "services/analytics.service";
import projectService from "services/project.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
import trackEventServices from "services/track-event.service";
// hooks
import useProjects from "hooks/use-projects";
import useToast from "hooks/use-toast";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { ContrastIcon, LayerDiagonalIcon } from "components/icons";
// helpers
import { renderShortDate } from "helpers/date-time.helper";
import { renderEmoji } from "helpers/emoji.helper";
import { truncateText } from "helpers/string.helper";
// types
import {
  IAnalyticsParams,
  IAnalyticsResponse,
  ICurrentUserResponse,
  IExportAnalyticsFormData,
  IWorkspace,
} from "types";
// fetch-keys
import { ANALYTICS, CYCLE_DETAILS, MODULE_DETAILS, PROJECT_DETAILS } from "constants/fetch-keys";
// constants
import { NETWORK_CHOICES } from "constants/project";

type Props = {
  analytics: IAnalyticsResponse | undefined;
  params: IAnalyticsParams;
  fullScreen: boolean;
  isProjectLevel: boolean;
  user: ICurrentUserResponse | undefined;
};

export const AnalyticsSidebar: React.FC<Props> = ({
  analytics,
  params,
  fullScreen,
  isProjectLevel = false,
  user,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { projects } = useProjects();

  const { setToastAlert } = useToast();

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId && !(cycleId || moduleId)
      ? PROJECT_DETAILS(projectId.toString())
      : null,
    workspaceSlug && projectId && !(cycleId || moduleId)
      ? () => projectService.getProject(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const { data: cycleDetails } = useSWR(
    workspaceSlug && projectId && cycleId ? CYCLE_DETAILS(cycleId.toString()) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleDetails(
            workspaceSlug.toString(),
            projectId.toString(),
            cycleId.toString()
          )
      : null
  );

  const { data: moduleDetails } = useSWR(
    workspaceSlug && projectId && moduleId ? MODULE_DETAILS(moduleId.toString()) : null,
    workspaceSlug && projectId && moduleId
      ? () =>
          modulesService.getModuleDetails(
            workspaceSlug.toString(),
            projectId.toString(),
            moduleId.toString()
          )
      : null
  );

  const trackExportAnalytics = () => {
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

    trackEventServices.trackAnalyticsEvent(
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

  const selectedProjects =
    params.project && params.project.length > 0 ? params.project : projects?.map((p) => p.id);

  return (
    <div
      className={`px-5 py-2.5 flex items-center justify-between space-y-2 ${
        fullScreen
          ? "border-l border-custom-border-100 md:h-full md:border-l md:border-custom-border-100 md:space-y-4 overflow-hidden md:flex-col md:items-start md:py-5"
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
              <div className="hidden h-full overflow-hidden md:flex md:flex-col">
                <h4 className="font-medium">Selected Projects</h4>
                <div className="space-y-6 mt-4 h-full overflow-y-auto">
                  {selectedProjects.map((projectId) => {
                    const project = projects?.find((p) => p.id === projectId);

                    if (project)
                      return (
                        <div key={project.id} className="w-full">
                          <div className="text-sm flex items-center gap-1">
                            {project.emoji ? (
                              <span className="grid h-6 w-6 flex-shrink-0 place-items-center">
                                {renderEmoji(project.emoji)}
                              </span>
                            ) : project.icon_prop ? (
                              <div className="h-6 w-6 grid place-items-center flex-shrink-0">
                                <span
                                  style={{ color: project.icon_prop.color }}
                                  className="material-symbols-rounded text-lg"
                                >
                                  {project.icon_prop.name}
                                </span>
                              </div>
                            ) : (
                              <span className="grid h-6 w-6 mr-1 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                                {project?.name.charAt(0)}
                              </span>
                            )}
                            <h5 className="flex items-center gap-1">
                              <p className="break-words">{truncateText(project.name, 20)}</p>
                              <span className="text-custom-text-200 text-xs ml-1">
                                ({project.identifier})
                              </span>
                            </h5>
                          </div>
                          <div className="mt-4 space-y-3 pl-2 w-full">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <UserGroupIcon className="h-4 w-4 text-custom-text-200" />
                                <h6>Total members</h6>
                              </div>
                              <span className="text-custom-text-200">{project.total_members}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <ContrastIcon height={16} width={16} />
                                <h6>Total cycles</h6>
                              </div>
                              <span className="text-custom-text-200">{project.total_cycles}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <UserGroupIcon className="h-4 w-4 text-custom-text-200" />
                                <h6>Total modules</h6>
                              </div>
                              <span className="text-custom-text-200">{project.total_modules}</span>
                            </div>
                          </div>
                        </div>
                      );
                  })}
                </div>
              </div>
            )}
            {projectId ? (
              cycleId && cycleDetails ? (
                <div className="hidden md:block h-full overflow-y-auto">
                  <h4 className="font-medium break-words">Analytics for {cycleDetails.name}</h4>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 text-xs">
                      <h6 className="text-custom-text-200">Lead</h6>
                      <span>
                        {cycleDetails.owned_by?.first_name} {cycleDetails.owned_by?.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <h6 className="text-custom-text-200">Start Date</h6>
                      <span>
                        {cycleDetails.start_date && cycleDetails.start_date !== ""
                          ? renderShortDate(cycleDetails.start_date)
                          : "No start date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <h6 className="text-custom-text-200">Target Date</h6>
                      <span>
                        {cycleDetails.end_date && cycleDetails.end_date !== ""
                          ? renderShortDate(cycleDetails.end_date)
                          : "No end date"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : moduleId && moduleDetails ? (
                <div className="hidden md:block h-full overflow-y-auto">
                  <h4 className="font-medium break-words">Analytics for {moduleDetails.name}</h4>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 text-xs">
                      <h6 className="text-custom-text-200">Lead</h6>
                      <span>
                        {moduleDetails.lead_detail?.first_name}{" "}
                        {moduleDetails.lead_detail?.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <h6 className="text-custom-text-200">Start Date</h6>
                      <span>
                        {moduleDetails.start_date && moduleDetails.start_date !== ""
                          ? renderShortDate(moduleDetails.start_date)
                          : "No start date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <h6 className="text-custom-text-200">Target Date</h6>
                      <span>
                        {moduleDetails.target_date && moduleDetails.target_date !== ""
                          ? renderShortDate(moduleDetails.target_date)
                          : "No end date"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex md:flex-col h-full overflow-y-auto">
                  <div className="flex items-center gap-1">
                    {projectDetails?.emoji ? (
                      <div className="grid h-6 w-6 flex-shrink-0 place-items-center">
                        {renderEmoji(projectDetails.emoji)}
                      </div>
                    ) : projectDetails?.icon_prop ? (
                      <div className="h-6 w-6 grid place-items-center flex-shrink-0">
                        <span
                          style={{ color: projectDetails.icon_prop.color }}
                          className="material-symbols-rounded text-lg"
                        >
                          {projectDetails.icon_prop.name}
                        </span>
                      </div>
                    ) : (
                      <span className="grid h-6 w-6 mr-1 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                        {projectDetails?.name.charAt(0)}
                      </span>
                    )}
                    <h4 className="font-medium break-words">{projectDetails?.name}</h4>
                  </div>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 text-xs">
                      <h6 className="text-custom-text-200">Network</h6>
                      <span>
                        {
                          NETWORK_CHOICES[
                            `${projectDetails?.network}` as keyof typeof NETWORK_CHOICES
                          ]
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )
            ) : null}
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-self-end">
        <SecondaryButton
          onClick={() => {
            if (!workspaceSlug) return;

            mutate(ANALYTICS(workspaceSlug.toString(), params));
          }}
        >
          <div className="flex items-center gap-2 -my-1">
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Refresh
          </div>
        </SecondaryButton>
        <PrimaryButton onClick={exportAnalytics}>
          <div className="flex items-center gap-2 -my-1">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Export as CSV
          </div>
        </PrimaryButton>
      </div>
    </div>
  );
};
