import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Tab } from "@headlessui/react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { TrackEventService } from "services/track_event.service";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// types
import { ICycle, IModule, IProject, IWorkspace } from "types";
// constants
import { ANALYTICS_TABS } from "constants/analytics";

type Props = {
  fullScreen: boolean;
  cycleDetails: ICycle | undefined;
  moduleDetails: IModule | undefined;
  projectDetails: IProject | undefined;
};

const trackEventService = new TrackEventService();

export const ProjectAnalyticsModalMainContent: React.FC<Props> = observer((props) => {
  const { fullScreen, cycleDetails, moduleDetails, projectDetails } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user: userStore } = useMobxStore();

  const user = userStore.currentUser;

  const trackAnalyticsEvent = (tab: string) => {
    if (!workspaceSlug || !user) return;

    const eventPayload: any = {
      workspaceSlug: workspaceSlug.toString(),
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

    const eventType = tab === "scope_and_demand" ? "SCOPE_AND_DEMAND_ANALYTICS" : "CUSTOM_ANALYTICS";

    trackEventService.trackAnalyticsEvent(
      eventPayload,
      cycleDetails ? `CYCLE_${eventType}` : moduleDetails ? `MODULE_${eventType}` : `PROJECT_${eventType}`,
      user
    );
  };

  return (
    <Tab.Group as={React.Fragment}>
      <Tab.List as="div" className="space-x-2 border-b border-custom-border-200 p-5 pt-0">
        {ANALYTICS_TABS.map((tab) => (
          <Tab
            key={tab.key}
            className={({ selected }) =>
              `rounded-3xl border border-custom-border-200 px-4 py-2 text-xs hover:bg-custom-background-80 ${
                selected ? "bg-custom-background-80" : ""
              }`
            }
            onClick={() => trackAnalyticsEvent(tab.key)}
          >
            {tab.title}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels as={React.Fragment}>
        <Tab.Panel as={React.Fragment}>
          <ScopeAndDemand fullScreen={fullScreen} />
        </Tab.Panel>
        <Tab.Panel as={React.Fragment}>
          <CustomAnalytics
            additionalParams={{
              cycle: cycleDetails?.id,
              module: moduleDetails?.id,
            }}
            fullScreen={fullScreen}
          />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
});
