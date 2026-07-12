/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TMilestone } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useMilestone } from "@/hooks/store/use-milestone";

type Props = {
  data: TMilestone;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
};

export const DeleteMilestoneModal = observer(function DeleteMilestoneModal(props: Props) {
  const { data, isOpen, onClose, workspaceSlug, projectId } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // store hooks
  const { deleteMilestone } = useMilestone();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    try {
      await deleteMilestone(workspaceSlug, projectId, data.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Milestone deleted successfully.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Milestone could not be deleted. Please try again.",
      });
    } finally {
      handleClose();
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete milestone"
      content={
        <>
          Are you sure you want to delete milestone{" "}
          <span className="font-medium break-all text-primary">{data?.name}</span>? The work items attached to it will
          not be deleted. This action cannot be undone.
        </>
      }
    />
  );
});
