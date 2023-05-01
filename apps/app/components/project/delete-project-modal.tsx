import React, { useEffect, useRef, useState } from "react";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import projectService from "services/project.service";
// hooks
import useToast from "hooks/use-toast";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { DangerButton, Input, SecondaryButton } from "components/ui";
// types
import type { IProject, IWorkspace } from "types";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

type TConfirmProjectDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  data: IProject | null;
};

export const DeleteProjectModal: React.FC<TConfirmProjectDeletionProps> = ({
  isOpen,
  data,
  onClose,
  onSuccess,
}) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [confirmProjectName, setConfirmProjectName] = useState("");
  const [confirmDeleteMyProject, setConfirmDeleteMyProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);

  const workspaceSlug = (data?.workspace as IWorkspace)?.slug;

  const { setToastAlert } = useToast();

  const canDelete = confirmProjectName === data?.name && confirmDeleteMyProject;

  useEffect(() => {
    if (data) setSelectedProject(data);
    else {
      const timer = setTimeout(() => {
        setSelectedProject(null);
        clearTimeout(timer);
      }, 300);
    }
  }, [data]);

  const handleClose = () => {
    setIsDeleteLoading(false);
    const timer = setTimeout(() => {
      setConfirmProjectName("");
      setConfirmDeleteMyProject(false);
      clearTimeout(timer);
    }, 350);
    onClose();
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    if (!data || !workspaceSlug || !canDelete) return;
    await projectService
      .deleteProject(workspaceSlug, data.id)
      .then(() => {
        handleClose();
        mutate<IProject[]>(PROJECTS_LIST(workspaceSlug), (prevData) =>
          prevData?.filter((project: IProject) => project.id !== data.id)
        );
        if (onSuccess) onSuccess();
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Project deleted successfully",
        });
      })
      .catch((error) => {
        console.log(error);
        setIsDeleteLoading(false);
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
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-brand-base bg-brand-base text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Project</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm leading-7 text-brand-secondary">
                      Are you sure you want to delete project{" "}
                      <span className="break-all font-semibold">{selectedProject?.name}</span>? All
                      of the data related to the project will be permanently removed. This action
                      cannot be undone
                    </p>
                  </span>
                  <div className="text-brand-secondary">
                    <p className="break-all text-sm ">
                      Enter the project name{" "}
                      <span className="font-medium text-brand-base">{selectedProject?.name}</span>{" "}
                      to continue:
                    </p>
                    <Input
                      type="text"
                      placeholder="Project name"
                      className="mt-2"
                      value={confirmProjectName}
                      onChange={(e) => {
                        setConfirmProjectName(e.target.value);
                      }}
                      name="projectName"
                    />
                  </div>
                  <div className="text-brand-secondary">
                    <p className="text-sm">
                      To confirm, type{" "}
                      <span className="font-medium text-brand-base">delete my project</span> below:
                    </p>
                    <Input
                      type="text"
                      placeholder="Enter 'delete my project'"
                      className="mt-2"
                      onChange={(e) => {
                        if (e.target.value === "delete my project") {
                          setConfirmDeleteMyProject(true);
                        } else {
                          setConfirmDeleteMyProject(false);
                        }
                      }}
                      name="typeDelete"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <DangerButton onClick={handleDeletion} loading={isDeleteLoading || !canDelete}>
                      {isDeleteLoading ? "Deleting..." : "Delete Project"}
                    </DangerButton>
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
