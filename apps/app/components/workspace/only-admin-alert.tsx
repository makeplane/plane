import React from "react";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useWorkspaceDetails from "hooks/use-workspace-details";
// icons
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string | null;
};

const OnlyAdminDeleteAlert: React.FC<Props> = (props) => {
  const { isOpen, onClose, memberName } = props;

  const { workspaceDetails } = useWorkspaceDetails();

  const handleClose = () => {
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#131313] bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-80 text-left shadow-xl transition-all sm:my-8 sm:w-[46rem]">
                <button type="button" className="absolute top-4 right-4 z-30" onClick={handleClose}>
                  <span className="sr-only">Close panel</span>
                  <XMarkIcon className="h-4 w-4 text-custom-text-300" aria-hidden="true" />
                </button>
                <div className="bg-custom-background-80 px-8 pt-8 pb-12">
                  <div className="flex items-center">
                    <div className="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon
                        className="h-7 w-7 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-medium leading-6 text-custom-text-100 ml-6"
                    >
                      Error in removing <span className="font-semibold">{memberName}</span>?
                    </Dialog.Title>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-normal text-custom-text-300">
                      A workspace on {workspaceDetails?.name} must have an admin. You cannot remove
                      yourself from the workspace because you are the sole admin here. To remove
                      yourself, kindly designate any of your co-workers as an admin for the
                      workspace.
                    </p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default OnlyAdminDeleteAlert;
