/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBaseLabel } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useWorkspaceProjectLabels } from "@/hooks/store/use-workspace-project-labels";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  data: IBaseLabel | null;
};

export const DeleteWorkspaceLabelModal = observer(function DeleteWorkspaceLabelModal(props: Props) {
  const { workspaceSlug, isOpen, onClose, data } = props;
  // store hooks
  const { deleteLabel } = useWorkspaceProjectLabels();
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    await deleteLabel(workspaceSlug, data.id)
      .then(() => {
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
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete Label"
      content={
        <>
          Are you sure you want to delete <span className="font-medium text-primary">{data?.name}</span>? This will
          remove the label from workspace.
        </>
      }
    />
  );
});
