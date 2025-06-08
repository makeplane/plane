"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { TTeamspaceView } from "@plane/types";
// ui
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// plan web hooks
import { useTeamspaceViews } from "@/plane-web/hooks/store";

type Props = {
  data: TTeamspaceView;
  teamspaceId: string;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteTeamspaceViewModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, onClose, teamspaceId } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { deleteView } = useTeamspaceViews();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeleteView = async () => {
    if (!workspaceSlug || !teamspaceId) return;

    setIsDeleteLoading(true);

    await deleteView(workspaceSlug.toString(), teamspaceId, data.id)
      .then(() => {
        handleClose();

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View deleted successfully.",
        });
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "View could not be deleted. Please try again.",
        })
      )
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeleteView}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete view"
      content={
        <>
          Are you sure you want to delete view-{" "}
          <span className="break-all font-medium text-custom-text-100">{data?.name}</span>? All of the data related to
          the view will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
