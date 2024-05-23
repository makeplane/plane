import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IEstimate } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { AlertModalCore } from "@/components/core";
// hooks
import { useEstimate } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  data: IEstimate | null;
  handleClose: () => void;
};

export const DeleteEstimateModal: React.FC<Props> = observer((props) => {
  const { isOpen, handleClose, data } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { deleteEstimate } = useEstimate();

  const handleEstimateDelete = async () => {
    if (!workspaceSlug || !projectId) return;

    setIsDeleteLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const estimateId = data?.id!;

    await deleteEstimate(workspaceSlug.toString(), projectId.toString(), estimateId)
      .then(() => {
        handleClose();
      })
      .catch((err) => {
        const error = err?.error;
        const errorString = Array.isArray(error) ? error[0] : error;

        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: errorString ?? "Estimate could not be deleted. Please try again",
        });
      })
      .finally(() => setIsDeleteLoading(false));
  };

  useEffect(() => {
    setIsDeleteLoading(false);
  }, [isOpen]);

  const onClose = () => {
    setIsDeleteLoading(false);
    handleClose();
  };

  return (
    <AlertModalCore
      handleClose={onClose}
      handleSubmit={handleEstimateDelete}
      isDeleting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete Estimate"
      content={
        <>
          Are you sure you want to delete estimate-{" "}
          <span className="break-words font-medium text-custom-text-100">{data?.name}</span>
          {""}? All of the data related to the estiamte will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
