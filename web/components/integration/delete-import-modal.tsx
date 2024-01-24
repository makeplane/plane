import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { IntegrationService } from "services/integrations/integration.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// icons
import { AlertTriangle } from "lucide-react";
// types
import { IUser, IImporterService } from "@plane/types";
// fetch-keys
import { IMPORTER_SERVICES_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IImporterService | null;
  user: IUser | null;
};

// services
const integrationService = new IntegrationService();

export const DeleteImportModal: React.FC<Props> = ({ isOpen, handleClose, data }) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteImport, setConfirmDeleteImport] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const handleDeletion = () => {
    if (!workspaceSlug || !data) return;

    setDeleteLoading(true);

    mutate<IImporterService[]>(
      IMPORTER_SERVICES_LIST(workspaceSlug as string),
      (prevData) => (prevData ?? []).filter((i) => i.id !== data.id),
      false
    );

    integrationService
      .deleteImporterService(workspaceSlug as string, data.service, data.id)
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      )
      .finally(() => {
        setDeleteLoading(false);
        handleClose();
      });
  };

  if (!data) return <></>;

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Delete Project</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm leading-7 text-custom-text-200">
                      Are you sure you want to delete import from{" "}
                      <span className="break-words font-semibold capitalize text-custom-text-100">{data?.service}</span>
                      ? All of the data related to the import will be permanently removed. This action cannot be undone.
                    </p>
                  </span>
                  <div>
                    <p className="text-sm text-custom-text-200">
                      To confirm, type <span className="font-medium text-custom-text-100">delete import</span> below:
                    </p>
                    <Input
                      id="typeDelete"
                      type="text"
                      name="typeDelete"
                      onChange={(e) => {
                        if (e.target.value === "delete import") setConfirmDeleteImport(true);
                        else setConfirmDeleteImport(false);
                      }}
                      placeholder="Enter 'delete import'"
                      className="mt-2 w-full"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      tabIndex={1}
                      onClick={handleDeletion}
                      disabled={!confirmDeleteImport}
                      loading={deleteLoading}
                    >
                      {deleteLoading ? "Deleting..." : "Delete Project"}
                    </Button>
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
