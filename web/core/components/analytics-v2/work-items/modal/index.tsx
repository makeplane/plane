import React, { useState } from "react";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
// plane package imports
import { ICycle, IModule, IProject } from "@plane/types";
// plane web components
import { WorkItemsModalMainContent } from "./content";
import { WorkItemsModalHeader } from "./header";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectDetails?: IProject | undefined;
  cycleDetails?: ICycle | undefined;
  moduleDetails?: IModule | undefined;
};

export const WorkItemsModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, projectDetails, moduleDetails, cycleDetails } = props;

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
                className={`fixed right-0 top-0 z-20 h-full bg-custom-background-100 shadow-custom-shadow-md ${
                  fullScreen ? "w-full p-2" : "w-full sm:w-full md:w-1/2"
                }`}
              >
                <div
                  className={`flex h-full flex-col overflow-hidden border-custom-border-200 bg-custom-background-100 text-left ${
                    fullScreen ? "rounded-lg border" : "border-l"
                  }`}
                >
                  <WorkItemsModalHeader
                    fullScreen={fullScreen}
                    handleClose={handleClose}
                    setFullScreen={setFullScreen}
                    title={projectDetails?.name ?? ""}
                    cycle={cycleDetails}
                    module={moduleDetails}
                  />
                  <WorkItemsModalMainContent
                    fullScreen={fullScreen}
                    projectDetails={projectDetails}
                    cycleDetails={cycleDetails}
                    moduleDetails={moduleDetails}
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
