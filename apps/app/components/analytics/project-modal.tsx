import React, { Fragment, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Tab } from "@headlessui/react";
// services
import analyticsService from "services/analytics.service";
import projectService from "services/project.service";
import cyclesService from "services/cycles.service";
import modulesService from "services/modules.service";
import trackEventServices from "services/track-event.service";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// icons
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// types
import { IAnalyticsParams, IWorkspace } from "types";
// fetch-keys
import { ANALYTICS, CYCLE_DETAILS, MODULE_DETAILS, PROJECT_DETAILS } from "constants/fetch-keys";
import useUserAuth from "hooks/use-user-auth";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const tabsList = ["Scope and Demand", "Custom Analytics"];

export const AnalyticsProjectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [fullScreen, setFullScreen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { user } = useUserAuth();

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: projectId ? [projectId.toString()] : watch("project"),
    cycle: cycleId ? cycleId.toString() : null,
    module: moduleId ? moduleId.toString() : null,
  };

  const { data: analytics, error: analyticsError } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

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

  const trackAnalyticsEvent = (tab: string) => {
    const eventPayload: any = {
      workspaceSlug: workspaceSlug?.toString(),
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

    const eventType =
      tab === "Scope and Demand" ? "SCOPE_AND_DEMAND_ANALYTICS" : "CUSTOM_ANALYTICS";

    trackEventServices.trackAnalyticsEvent(
      eventPayload,
      cycleId ? `CYCLE_${eventType}` : moduleId ? `MODULE_${eventType}` : `PROJECT_${eventType}`,
      user
    );
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={`absolute top-0 z-30 h-full bg-custom-background-90 ${
        fullScreen ? "p-2 w-full" : "w-1/2"
      } ${isOpen ? "right-0" : "-right-full"} duration-300 transition-all`}
    >
      <div
        className={`flex h-full flex-col overflow-hidden border-custom-border-200 bg-custom-background-100 text-left ${
          fullScreen ? "rounded-lg border" : "border-l"
        }`}
      >
        <div className="flex items-center justify-between gap-4 bg-custom-background-100 px-5 py-4 text-sm">
          <h3 className="break-words">
            Analytics for{" "}
            {cycleId ? cycleDetails?.name : moduleId ? moduleDetails?.name : projectDetails?.name}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid place-items-center p-1 text-custom-text-200 hover:text-custom-text-100"
              onClick={() => setFullScreen((prevData) => !prevData)}
            >
              {fullScreen ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              className="grid place-items-center p-1 text-custom-text-200 hover:text-custom-text-100"
              onClick={handleClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Tab.Group as={Fragment}>
          <Tab.List as="div" className="space-x-2 border-b border-custom-border-200 p-5 pt-0">
            {tabsList.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `rounded-3xl border border-custom-border-200 px-4 py-2 text-xs hover:bg-custom-background-80 ${
                    selected ? "bg-custom-background-80" : ""
                  }`
                }
                onClick={() => trackAnalyticsEvent(tab)}
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          {/* <h4 className="p-5 pb-0">Analytics for</h4> */}
          <Tab.Panels as={Fragment}>
            <Tab.Panel as={Fragment}>
              <ScopeAndDemand fullScreen={fullScreen} />
            </Tab.Panel>
            <Tab.Panel as={Fragment}>
              <CustomAnalytics
                analytics={analytics}
                analyticsError={analyticsError}
                params={params}
                control={control}
                setValue={setValue}
                fullScreen={fullScreen}
                user={user}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
