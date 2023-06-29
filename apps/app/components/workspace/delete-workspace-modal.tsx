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
import type { ICurrentUserResponse, IWorkspace } from "types";
// fetch-keys
import { USER_WORKSPACES } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  data: IWorkspace | null;
  onClose: () => void;
  user: ICurrentUserResponse | undefined;
};

export const DeleteWorkspaceModal: React.FC<Props> = ({ isOpen, data, onClose, user }) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [confirmWorkspaceName, setConfirmWorkspaceName] = useState("");
  const [confirmDeleteMyWorkspace, setConfirmDeleteMyWorkspace] = useState(false);

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

  const canDelete = confirmWorkspaceName === data?.name && confirmDeleteMyWorkspace;

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    if (!data || !canDelete) return;
    await workspaceService
      .deleteWorkspace(data.slug, user)
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
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Workspace</h3>
                    </span>
                  </div>

                  <span>
                    <p className="text-sm leading-7 text-brand-secondary">
                      Are you sure you want to delete workspace{" "}
                      <span className="break-words font-semibold">{data?.name}</span>? All of the
                      data related to the workspace will be permanently removed. This action cannot
                      be undone.
                    </p>
                  </span>

                  <div className="text-brand-secondary">
                    <p className="break-words text-sm ">
                      Enter the workspace name{" "}
                      <span className="font-medium text-brand-base">{selectedWorkspace?.name}</span>{" "}
                      to continue:
                    </p>
                    <Input
                      type="text"
                      placeholder="Workspace name"
                      className="mt-2"
                      value={confirmWorkspaceName}
                      onChange={(e) => {
                        setConfirmWorkspaceName(e.target.value);
                      }}
                      name="workspaceName"
                    />
                  </div>

                  <div className="text-brand-secondary">
                    <p className="text-sm">
                      To confirm, type{" "}
                      <span className="font-medium text-brand-base">delete my workspace</span>{" "}
                      below:
                    </p>
                    <Input
                      type="text"
                      placeholder="Enter 'delete my workspace'"
                      className="mt-2"
                      onChange={(e) => {
                        if (e.target.value === "delete my workspace") {
                          setConfirmDeleteMyWorkspace(true);
                        } else {
                          setConfirmDeleteMyWorkspace(false);
                        }
                      }}
                      name="typeDelete"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <DangerButton onClick={handleDeletion} loading={isDeleteLoading || !canDelete}>
                      {isDeleteLoading ? "Deleting..." : "Delete Workspace"}
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
