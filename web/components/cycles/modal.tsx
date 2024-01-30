import React, { useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// services
import { CycleService } from "services/cycle.service";
// hooks
import { useApplication, useCycle, useProject } from "hooks/store";
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// components
import { CycleForm } from "components/cycles";
// types
import type { CycleDateCheckData, ICycle, TCycleView } from "@plane/types";

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
  // states
  const [activeProject, setActiveProject] = useState<string | null>(null);
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { workspaceProjectIds } = useProject();
  const { createCycle, updateCycleDetails } = useCycle();
  // toast alert
  const { setToastAlert } = useToast();

  const { setValue: setCycleTab } = useLocalStorage<TCycleView>("cycle_tab", "active");

  const handleCreateCycle = async (payload: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const selectedProjectId = payload.project ?? projectId.toString();
    await createCycle(workspaceSlug, selectedProjectId, payload)
      .then((res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle created successfully.",
        });
        postHogEventTracker("CYCLE_CREATE", {
          ...res,
          state: "SUCCESS",
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Error in creating cycle. Please try again.",
        });
        postHogEventTracker("CYCLE_CREATE", {
          state: "FAILED",
        });
      });
  };

  const handleUpdateCycle = async (cycleId: string, payload: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const selectedProjectId = payload.project ?? projectId.toString();
    await updateCycleDetails(workspaceSlug, selectedProjectId, cycleId, payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Error in updating cycle. Please try again.",
        });
      });
  };

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
      if (data) await handleUpdateCycle(data.id, payload);
      else {
        await handleCreateCycle(payload).then(() => {
          setCycleTab("all");
        });
      }
      handleClose();
    } else
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "You already have a cycle on the given dates, if you want to create a draft cycle, remove the dates.",
      });
  };

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project) {
      setActiveProject(data.project);
      return;
    }

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (workspaceProjectIds && workspaceProjectIds.length > 0 && !activeProject)
      setActiveProject(projectId ?? workspaceProjectIds?.[0] ?? null);
  }, [activeProject, data, projectId, workspaceProjectIds, isOpen]);

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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-2xl">
                <CycleForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  status={data ? true : false}
                  projectId={activeProject ?? ""}
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
