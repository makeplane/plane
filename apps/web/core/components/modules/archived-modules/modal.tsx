"use client";

import { useState } from "react";
// ui
import { Button, TOAST_TYPE, setToast, Dialog, EModalWidth } from "@plane/ui";
// hooks
import { useModule } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export const ArchiveModuleModal: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, moduleId, isOpen, handleClose } = props;
  // router
  const router = useAppRouter();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getModuleNameById, archiveModule } = useModule();

  const moduleName = getModuleNameById(moduleId);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveModule = async () => {
    setIsArchiving(true);
    await archiveModule(workspaceSlug, projectId, moduleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Archive success",
          message: "Your archives can be found in project archives.",
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/${projectId}/modules`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Module could not be archived. Please try again.",
        })
      )
      .finally(() => setIsArchiving(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <div className="px-5 py-4">
          <h3 className="text-xl font-medium 2xl:text-2xl">Archive module {moduleName}</h3>
          <p className="mt-3 text-sm text-custom-text-200">
            Are you sure you want to archive the module? All your archives can be restored later.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" tabIndex={1} onClick={handleArchiveModule} loading={isArchiving}>
              {isArchiving ? "Archiving" : "Archive"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
