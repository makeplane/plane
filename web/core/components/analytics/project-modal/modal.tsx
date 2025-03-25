import React, { useState } from "react";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
import { ICycle, IModule, IProject } from "@plane/types";

// components
import { ProjectAnalyticsModalHeader, ProjectAnalyticsModalMainContent } from "@/components/analytics";
// types

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

  const handleClose = () => {
    onClose();
  };

  return (
    <Transition.Root appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="transition-transform duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition-transform duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="fixed inset-0 z-20 h-full w-full overflow-y-auto">
            <Dialog.Panel>
              <div
                className={`fixed left-0 top-0 z-20 h-full bg-custom-background-100 shadow-custom-shadow-md ${
                  fullScreen ? "w-full p-2" : "w-full sm:w-full md:w-1/2"
                }`}
              >
                <div
                  className={`flex h-full flex-col overflow-hidden border-custom-border-200 bg-custom-background-100 text-left ${
                    fullScreen ? "rounded-lg border" : "border-r"
                  }`}
                >
                  <ProjectAnalyticsModalHeader
                    fullScreen={fullScreen}
                    handleClose={handleClose}
                    setFullScreen={setFullScreen}
                    title={cycleDetails?.name ?? moduleDetails?.name ?? projectDetails?.name ?? ""}
                  />
                  <ProjectAnalyticsModalMainContent
                    fullScreen={fullScreen}
                    cycleDetails={cycleDetails}
                    moduleDetails={moduleDetails}
                    projectDetails={projectDetails}
                  />
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
});
