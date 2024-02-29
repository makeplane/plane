import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useEventTracker, useModule, useProject } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ModuleForm } from "components/modules";
// types
import type { IModule } from "@plane/types";
// constants
import { MODULE_CREATED, MODULE_UPDATED } from "constants/event-tracker";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data?: IModule;
  workspaceSlug: string;
  projectId: string;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: "backlog",
  lead_id: null,
  member_ids: [],
};

export const CreateUpdateModuleModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data, workspaceSlug, projectId } = props;
  // states
  const [activeProject, setActiveProject] = useState<string | null>(null);
  // store hooks
  const { captureModuleEvent } = useEventTracker();
  const { workspaceProjectIds } = useProject();
  const { createModule, updateModuleDetails } = useModule();
  // toast alert
  const { setToastAlert } = useToast();

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const { reset } = useForm<IModule>({
    defaultValues,
  });

  const handleCreateModule = async (payload: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    const selectedProjectId = payload.project_id ?? projectId.toString();
    await createModule(workspaceSlug.toString(), selectedProjectId, payload)
      .then((res) => {
        handleClose();
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Module created successfully.",
        });
        captureModuleEvent({
          eventName: MODULE_CREATED,
          payload: { ...res, state: "SUCCESS" },
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Module could not be created. Please try again.",
        });
        captureModuleEvent({
          eventName: MODULE_CREATED,
          payload: { ...data, state: "FAILED" },
        });
      });
  };

  const handleUpdateModule = async (payload: Partial<IModule>, dirtyFields: any) => {
    if (!workspaceSlug || !projectId || !data) return;

    const selectedProjectId = payload.project_id ?? projectId.toString();
    await updateModuleDetails(workspaceSlug.toString(), selectedProjectId, data.id, payload)
      .then((res) => {
        handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Module updated successfully.",
        });
        captureModuleEvent({
          eventName: MODULE_UPDATED,
          payload: { ...res, changed_properties: Object.keys(dirtyFields), state: "SUCCESS" },
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Module could not be updated. Please try again.",
        });
        captureModuleEvent({
          eventName: MODULE_UPDATED,
          payload: { ...data, state: "FAILED" },
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IModule>, dirtyFields: any) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IModule> = {
      ...formData,
    };
    if (!data) await handleCreateModule(payload);
    else await handleUpdateModule(payload, dirtyFields);
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
    if (data && data.project_id) {
      setActiveProject(data.project_id);
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
                <ModuleForm
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
});
