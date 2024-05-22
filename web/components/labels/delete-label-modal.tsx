import React, { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import type { IIssueLabel } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AlertModalCore } from "@/components/core";
// constants
import { E_LABELS, LABEL_DELETED, LABEL_GROUP_DELETED } from "@/constants/event-tracker";
// hooks
import { useLabel, useEventTracker } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: IIssueLabel | null;
};

export const DeleteLabelModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { deleteLabel, projectLabelsTree } = useLabel();
  const { captureEvent } = useEventTracker();
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !projectId || !data) return;

    setIsDeleteLoading(true);

    await deleteLabel(workspaceSlug.toString(), projectId.toString(), data.id)
      .then(() => {
        const labelChildCount = projectLabelsTree?.find((label) => label.id === data.id)?.children?.length || 0;
        if (labelChildCount > 0) {
          captureEvent(LABEL_GROUP_DELETED, {
            group_id: data.id,
            children_count: labelChildCount,
            element: E_LABELS,
            state: "SUCCESS",
          });
        } else {
          captureEvent(LABEL_DELETED, {
            label_id: data.id,
            element: E_LABELS,
            state: "SUCCESS",
          });
        }
        handleClose();
      })
      .catch((err) => {
        setIsDeleteLoading(false);

        const error = err?.error || "Label could not be deleted. Please try again.";
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error,
        });
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isDeleting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete Label"
      content={
        <>
          Are you sure you want to delete <span className="font-medium text-custom-text-100">{data?.name}</span>? This
          will remove the label from all the issue and from any views where the label is being filtered upon.
        </>
      }
    />
  );
});
