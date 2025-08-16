"use client";

import React, { useState } from "react";

import { useParams } from "next/navigation";

import { mutate } from "swr";

// headless ui
import { AlertTriangle } from "lucide-react";
// services
import { IUser, IImporterService } from "@plane/types";
import { Button, Dialog, EModalWidth, Input, TOAST_TYPE, setToast } from "@plane/ui";
import { IMPORTER_SERVICES_LIST } from "@/constants/fetch-keys";
import { IntegrationService } from "@/services/integrations/integration.service";
// ui
// icons
// types
// fetch-keys

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

  const { workspaceSlug } = useParams();

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
        setToast({
          type: TOAST_TYPE.ERROR,
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex w-full items-center justify-start gap-6">
            <span className="place-items-center rounded-full bg-red-500/20 p-4">
              <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
            </span>
            <span className="flex items-center justify-start">
              <h3 className="text-xl font-medium 2xl:text-2xl">Delete project</h3>
            </span>
          </div>
          <span>
            <p className="text-sm leading-7 text-custom-text-200">
              Are you sure you want to delete import from{" "}
              <span className="break-words font-semibold capitalize text-custom-text-100">{data?.service}</span>? All of
              the data related to the import will be permanently removed. This action cannot be undone.
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
    </Dialog>
  );
};
