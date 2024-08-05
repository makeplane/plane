"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
// plane web types
import { TIssueType } from "@/plane-web/types";

type Props = {
  data: TIssueType;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteIssueTypeModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, onClose } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // store hooks
  const { deleteType } = useIssueTypes();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeleteType = async () => {
    if (!data.id) return;

    setIsDeleteLoading(true);

    await deleteType(data.id)
      .then(() => {
        handleClose();

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issue type deleted successfully.",
        });
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Issue type could not be deleted. Please try again.",
        })
      )
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeleteType}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete issue type?"
      content={
        <>
          <p>No issue is yet linked to this type and can be deleted.</p>
          <p>If deleted this issue type and properties cannot be retrieved.</p>
        </>
      }
    />
  );
});
