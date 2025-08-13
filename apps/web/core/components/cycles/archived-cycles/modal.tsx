"use client";

import { useState } from "react";
// ui
import { CYCLE_TRACKER_EVENTS } from "@plane/constants";
import { Button, TOAST_TYPE, setToast, Dialog, EModalWidth } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useCycle } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export const ArchiveCycleModal: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, cycleId, isOpen, handleClose } = props;
  // router
  const router = useAppRouter();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getCycleNameById, archiveCycle } = useCycle();

  const cycleName = getCycleNameById(cycleId);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveCycle = async () => {
    setIsArchiving(true);
    await archiveCycle(workspaceSlug, projectId, cycleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Archive success",
          message: "Your archives can be found in project archives.",
        });
        captureSuccess({
          eventName: CYCLE_TRACKER_EVENTS.archive,
          payload: {
            id: cycleId,
          },
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/${projectId}/cycles`);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Cycle could not be archived. Please try again.",
        });
        captureError({
          eventName: CYCLE_TRACKER_EVENTS.archive,
          payload: {
            id: cycleId,
          },
        });
      })
      .finally(() => setIsArchiving(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Panel width={EModalWidth.LG}>
        <div className="px-5 py-4">
          <h3 className="text-xl font-medium 2xl:text-2xl">Archive cycle {cycleName}</h3>
          <p className="mt-3 text-sm text-custom-text-200">
            Are you sure you want to archive the cycle? All your archives can be restored later.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" tabIndex={1} onClick={handleArchiveCycle} loading={isArchiving}>
              {isArchiving ? "Archiving" : "Archive"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
