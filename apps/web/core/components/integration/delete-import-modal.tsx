import { useState } from "react";
import { useParams } from "next/navigation";
import { mutate } from "swr";
// icons
import { AlertTriangle } from "lucide-react";
// services
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IImporterService } from "@plane/types";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { IMPORTER_SERVICES_LIST } from "@/constants/fetch-keys";
import { IntegrationService } from "@/services/integrations/integration.service";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IImporterService | null;
  user: IUser | null;
};

// services
const integrationService = new IntegrationService();

export function DeleteImportModal({ isOpen, handleClose, data }: Props) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteImport, setConfirmDeleteImport] = useState(false);

  const { workspaceSlug } = useParams();

  const handleDeletion = () => {
    if (!workspaceSlug || !data) return;

    setDeleteLoading(true);

    mutate<IImporterService[]>(
      IMPORTER_SERVICES_LIST(workspaceSlug),
      (prevData) => (prevData ?? []).filter((i) => i.id !== data.id),
      false
    );

    integrationService
      .deleteImporterService(workspaceSlug, data.service, data.id)
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
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangle className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">Delete project</h3>
          </span>
        </div>
        <span>
          <p className="text-13 leading-7 text-secondary">
            Are you sure you want to delete import from{" "}
            <span className="break-words font-semibold capitalize text-primary">{data?.service}</span>? All of the data
            related to the import will be permanently removed. This action cannot be undone.
          </p>
        </span>
        <div>
          <p className="text-13 text-secondary">
            To confirm, type <span className="font-medium text-primary">delete import</span> below:
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
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="error-fill"
            size="lg"
            tabIndex={1}
            onClick={handleDeletion}
            disabled={!confirmDeleteImport}
            loading={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete Project"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
