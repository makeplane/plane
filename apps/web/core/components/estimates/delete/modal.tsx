"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// ui
import { PROJECT_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { Button, EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useEstimate, useProject, useProjectEstimates } from "@/hooks/store";

type TDeleteEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const DeleteEstimateModal: FC<TDeleteEstimateModal> = observer((props) => {
  // props
  const { workspaceSlug, projectId, estimateId, isOpen, handleClose } = props;
  // hooks
  const { areEstimateEnabledByProjectId, deleteEstimate } = useProjectEstimates();
  const { asJson: estimate } = useEstimate(estimateId);
  const { updateProject } = useProject();
  // states
  const [buttonLoader, setButtonLoader] = useState(false);

  const handleDeleteEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId || !estimateId) return;
      setButtonLoader(true);

      await deleteEstimate(workspaceSlug, projectId, estimateId);
      if (areEstimateEnabledByProjectId(projectId)) {
        await updateProject(workspaceSlug, projectId, { estimate: null });
      }
      setButtonLoader(false);
      captureSuccess({
        eventName: PROJECT_SETTINGS_TRACKER_EVENTS.estimate_deleted,
        payload: {
          id: estimateId,
        },
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Estimate deleted",
        message: "Estimate has been removed from your project.",
      });
      handleClose();
    } catch (error) {
      setButtonLoader(false);
      captureError({
        eventName: PROJECT_SETTINGS_TRACKER_EVENTS.estimate_deleted,
        payload: {
          id: estimateId,
        },
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Estimate creation failed",
        message: "We were unable to delete the estimate, please try again.",
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-2 px-5">
          <div className="text-xl font-medium text-custom-text-100">Delete Estimate System</div>
        </div>

        {/* estimate steps */}
        <div className="px-5">
          <div className="text-base text-custom-text-200">
            Deleting the estimate <span className="font-bold text-custom-text-100">{estimate?.name}</span>
            &nbsp;system will remove it from all work items permanently. This action cannot be undone. If you add
            estimates again, you will need to update all the work items.
          </div>
        </div>

        <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={buttonLoader}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteEstimate} disabled={buttonLoader}>
            {buttonLoader ? "Deleting" : "Delete Estimate"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
