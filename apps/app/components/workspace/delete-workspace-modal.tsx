import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { DangerButton, Input, SecondaryButton } from "components/ui";
// types
import type { IWorkspace } from "types";
// fetch-keys
import { USER_WORKSPACES } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  data: IWorkspace | null;
  onClose: () => void;
};

export const DeleteWorkspaceModal: React.FC<Props> = ({ isOpen, data, onClose }) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [confirmProjectName, setConfirmProjectName] = useState("");
  const [confirmDeleteMyProject, setConfirmDeleteMyProject] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace | null>(null);

  const router = useRouter();
  const { setToastAlert } = useToast();

  useEffect(() => {
    if (data) setSelectedWorkspace(data);
    else {
      const timer = setTimeout(() => {
        setSelectedWorkspace(null);
        clearTimeout(timer);
      }, 350);
    }
  }, [data]);

  const canDelete = confirmProjectName === data?.name && confirmDeleteMyProject;

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    if (!data || !canDelete) return;
    await workspaceService
      .deleteWorkspace(data.slug)
      .then(() => {
        handleClose();
        router.push("/");
        mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
          prevData?.filter((workspace) => workspace.id !== data.id)
        );
        setToastAlert({
          type: "success",
          message: "Workspace deleted successfully",
          title: "Success",
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-[40rem]">
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
                        Delete Workspace
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete workspace - {`"`}
                          <span className="italic">{data?.name}</span>
                          {`"`} ? All of the data related to the workspace will be permanently
                          removed. This action cannot be undone.
                        </p>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm">
                          Enter the workspace name{" "}
                          <span className="font-semibold">{selectedWorkspace?.name}</span> to
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
                          name="workspaceName"
                        />
                      </div>
                      <div className="mt-3">
                        <p className="text-sm">
                          To confirm, type{" "}
                          <span className="font-semibold">delete my workspace</span> below:
                        </p>
                        <Input
                          type="text"
                          placeholder="Enter 'delete my workspace'"
                          className="mt-2"
                          onChange={(e) => {
                            if (e.target.value === "delete my workspace") {
                              setConfirmDeleteMyProject(true);
                            } else {
                              setConfirmDeleteMyProject(false);
                            }
                          }}
                          name="typeDelete"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 bg-gray-50 p-4 sm:px-6">
                  <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                  <DangerButton onClick={handleDeletion} loading={isDeleteLoading || !canDelete}>
                    {isDeleteLoading ? "Deleting..." : "Delete"}
                  </DangerButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
