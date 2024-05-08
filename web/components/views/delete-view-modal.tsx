import React, { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IProjectView } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AlertModalCore } from "@/components/core";
// hooks
import { useProjectView } from "@/hooks/store";

type Props = {
  data: IProjectView;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteProjectViewModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, onClose } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { deleteView } = useProjectView();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeleteView = async () => {
    if (!workspaceSlug || !projectId) return;

    setIsDeleteLoading(true);

    await deleteView(workspaceSlug.toString(), projectId.toString(), data.id)
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
      isDeleting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete View"
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
