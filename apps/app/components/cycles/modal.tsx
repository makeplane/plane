import { Fragment } from "react";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import cycleService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { CycleForm } from "components/cycles";
// types
import type { ICycle } from "types";
// fetch keys
import { CYCLE_LIST } from "constants/fetch-keys";

export interface CycleModalProps {
  isOpen: boolean;
  handleClose: () => void;
  projectId: string;
  workspaceSlug: string;
  initialData?: ICycle;
}

export const CycleModal: React.FC<CycleModalProps> = ({
  isOpen,
  handleClose,
  initialData,
  projectId,
  workspaceSlug,
}) => {
  const { setToastAlert } = useToast();

  const createCycle = (payload: Partial<ICycle>) => {
    cycleService
      .createCycle(workspaceSlug as string, projectId, payload)
      .then((res) => {
        mutate(CYCLE_LIST(projectId));
        handleClose();
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error",
          message: "Error in creating cycle. Please try again!",
        });
      });
  };

  const updateCycle = (cycleId: string, payload: Partial<ICycle>) => {
    cycleService
      .updateCycle(workspaceSlug, projectId, cycleId, payload)
      .then((res) => {
        mutate(CYCLE_LIST(projectId));
        handleClose();
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error",
          message: "Error in updating cycle. Please try again!",
        });
      });
  };

  const handleFormSubmit = (formValues: Partial<ICycle>) => {
    if (workspaceSlug && projectId) {
      const payload = {
        ...formValues,
      };

      if (initialData) {
        updateCycle(initialData.id, payload);
      } else {
        createCycle(payload);
      }
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  {initialData ? "Update" : "Create"} Cycle
                </Dialog.Title>
                <CycleForm handleFormSubmit={handleFormSubmit} handleFormCancel={handleClose} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
