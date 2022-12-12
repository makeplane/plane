import React, { useEffect, useRef, useState } from "react";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import projectService from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { Button, Input } from "ui";
// types
import type { IProject } from "types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: IProject | null;
};

const ConfirmProjectDeletion: React.FC<Props> = ({ isOpen, data, onClose }) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);

  const [confirmProjectName, setConfirmProjectName] = useState("");
  const [confirmDeleteMyProject, setConfirmDeleteMyProject] = useState(false);

  const canDelete = confirmProjectName === data?.name && confirmDeleteMyProject;

  const { activeWorkspace, mutateProjects } = useUser();

  const { setToastAlert } = useToast();

  const cancelButtonRef = useRef(null);

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
    if (!data || !activeWorkspace || !canDelete) return;
    await projectService
      .deleteProject(activeWorkspace.slug, data.id)
      .then(() => {
        handleClose();
        mutateProjects((prevData) => (prevData ?? []).filter((item) => item.id !== data.id), false);
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

  useEffect(() => {
    if (data) setSelectedProject(data);
    else {
      const timer = setTimeout(() => {
        setSelectedProject(null);
        clearTimeout(timer);
      }, 300);
    }
  }, [data]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={handleClose}
      >
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Delete Project
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete project - {`"`}
                          <span className="italic">{selectedProject?.name}</span>
                          {`"`} ? All of the data related to the project will be permanently
                          removed. This action cannot be undone.
                        </p>
                      </div>
                      <div className="h-0.5 bg-gray-200 my-3" />
                      <div className="mt-3">
                        <p className="text-sm">
                          Enter the project name{" "}
                          <span className="font-semibold">{selectedProject?.name}</span> to
                          continue:
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
                      <div className="mt-3">
                        <p className="text-sm">
                          To confirm, type <span className="font-semibold">delete my project</span>{" "}
                          below:
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
                          name="projectName"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <Button
                    type="button"
                    onClick={handleDeletion}
                    theme="danger"
                    disabled={isDeleteLoading || !canDelete}
                    className="inline-flex sm:ml-3"
                  >
                    {isDeleteLoading ? "Deleting..." : "Delete"}
                  </Button>
                  <Button
                    type="button"
                    theme="secondary"
                    className="inline-flex sm:ml-3"
                    onClick={handleClose}
                    ref={cancelButtonRef}
                  >
                    Cancel
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ConfirmProjectDeletion;
