import React, { Fragment, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Dialog, Tab, Transition } from "@headlessui/react";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import trackEventServices from "services/track_event.service";
// components
import { CustomAnalytics, ProjectAnalyticsModalHeader, ScopeAndDemand } from "components/analytics";
// types
import { ICycle, IModule, IProject, IWorkspace } from "types";
// constants
import { ANALYTICS_TABS } from "constants/analytics";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cycleDetails?: ICycle | undefined;
  moduleDetails?: IModule | undefined;
  projectDetails?: IProject | undefined;
};

export const ProjectAnalyticsModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, cycleDetails, moduleDetails, projectDetails } = props;

  const [fullScreen, setFullScreen] = useState(false);

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

    trackEventServices.trackAnalyticsEvent(
      eventPayload,
      cycleDetails ? `CYCLE_${eventType}` : moduleDetails ? `MODULE_${eventType}` : `PROJECT_${eventType}`,
      user
    );
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Transition.Root appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <div className="fixed inset-0 z-20 h-full w-full overflow-y-auto">
          <Transition.Child
            as={React.Fragment}
            enter="transition-transform duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            {/* TODO: fix full screen mode */}
            <Dialog.Panel
              className={`fixed z-20 bg-custom-background-100 top-0 right-0 h-full shadow-custom-shadow-md ${
                fullScreen ? "w-full p-2" : "w-1/2"
              }`}
            >
              <div
                className={`flex h-full flex-col overflow-hidden border-custom-border-200 bg-custom-background-100 text-left ${
                  fullScreen ? "rounded-lg border" : "border-l"
                }`}
              >
                <ProjectAnalyticsModalHeader
                  fullScreen={fullScreen}
                  handleClose={handleClose}
                  setFullScreen={setFullScreen}
                  title={cycleDetails?.name ?? moduleDetails?.name ?? projectDetails?.name ?? ""}
                />
                <Tab.Group as={Fragment}>
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
                  <Tab.Panels as={Fragment}>
                    <Tab.Panel as={Fragment}>
                      <ScopeAndDemand fullScreen={fullScreen} />
                    </Tab.Panel>
                    <Tab.Panel as={Fragment}>
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
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
