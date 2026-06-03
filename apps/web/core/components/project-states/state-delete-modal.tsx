/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IState } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type TStateDeleteModal = {
  isOpen: boolean;
  onClose: () => void;
  data: IState | null;
};

export const StateDeleteModal = observer(function StateDeleteModal(props: TStateDeleteModal) {
  const { isOpen, onClose, data } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  const { deleteState } = useProjectState();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    try {
      await deleteState(workspaceSlug.toString(), data.project_id, data.id);
      handleClose();
    } catch (err) {
      const errorStatus = err as { status?: number };
      if (errorStatus.status === 400)
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message:
            "This status contains some work items within it, please move them to some other status to delete this status.",
        });
      else
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Status could not be deleted. Please try again.",
        });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => void handleDeletion()}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete Status"
      content={
        <>
          Are you sure you want to delete status- <span className="font-medium text-primary">{data?.name}</span>? All of
          the data related to the status will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
