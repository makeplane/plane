import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// services
import { CycleService } from "services/cycle.service";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CycleForm } from "components/cycles";
// types
import type { CycleDateCheckData, ICycle } from "types";

type CycleModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  data?: ICycle | null;
  workspaceSlug: string;
  projectId: string;
};

// services
const cycleService = new CycleService();

export const CycleCreateUpdateModal: React.FC<CycleModalProps> = (props) => {
  const { isOpen, handleClose, data, workspaceSlug, projectId } = props;
  // store
  const { cycle: cycleStore } = useMobxStore();
  // states
  const [activeProject, setActiveProject] = useState<string>(projectId);
  // toast
  const { setToastAlert } = useToast();

  const createCycle = async (payload: Partial<ICycle>) =>
    cycleStore
      .createCycle(workspaceSlug, projectId, payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error in creating cycle. Please try again.",
        });
      });

  const updateCycle = async (cycleId: string, payload: Partial<ICycle>) =>
    cycleStore
      .updateCycle(workspaceSlug, projectId, cycleId, payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error in updating cycle. Please try again.",
        });
      });

  const dateChecker = async (payload: CycleDateCheckData) => {
    let status = false;

    await cycleService.cycleDateCheck(workspaceSlug as string, projectId as string, payload).then((res) => {
      status = res.status;
    });

    return status;
  };

  const handleFormSubmit = async (formData: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<ICycle> = {
      ...formData,
    };

    let isDateValid: boolean = true;

    if (payload.start_date && payload.end_date) {
      if (data?.start_date && data?.end_date)
        isDateValid = await dateChecker({
          start_date: payload.start_date,
          end_date: payload.end_date,
          cycle_id: data.id,
        });
      else
        isDateValid = await dateChecker({
          start_date: payload.start_date,
          end_date: payload.end_date,
        });
    }

    if (isDateValid) {
      if (data) await updateCycle(data.id, payload);
      else await createCycle(payload);
      handleClose();
    } else
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "You already have a cycle on the given dates, if you want to create a draft cycle, remove the dates.",
      });
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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <CycleForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  projectId={activeProject}
                  setActiveProject={setActiveProject}
                  data={data}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
