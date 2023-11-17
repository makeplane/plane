import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ModuleForm } from "components/modules";
// hooks
import useToast from "hooks/use-toast";
// types
import type { IModule } from "types";

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
  lead: null,
  members: [],
};

export const CreateUpdateModuleModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data, workspaceSlug, projectId } = props;

  const [activeProject, setActiveProject] = useState<string | null>(null);

  const { project: projectStore, module: moduleStore } = useMobxStore();

  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const { setToastAlert } = useToast();

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const { reset } = useForm<IModule>({
    defaultValues,
  });

  const createModule = async (payload: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    await moduleStore
      .createModule(workspaceSlug.toString(), projectId.toString(), payload)
      .then(() => {
        handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Module created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Module could not be created. Please try again.",
        });
      });
  };

  const updateModule = async (payload: Partial<IModule>) => {
    if (!workspaceSlug || !projectId || !data) return;

    await moduleStore
      .updateModuleDetails(workspaceSlug.toString(), projectId.toString(), data.id, payload)
      .then(() => {
        handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Module updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Module could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IModule> = {
      ...formData,
    };

    if (!data) await createModule(payload);
    else await updateModule(payload);
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
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [activeProject, data, projectId, projects, isOpen]);

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
