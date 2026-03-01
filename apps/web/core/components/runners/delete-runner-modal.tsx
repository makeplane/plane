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
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useRunners } from "@/hooks/store/runners/use-runners";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  scriptId: string | null;
  onClose: () => void;
};

export const DeleteRunnerModal = observer(function DeleteRunnerModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, scriptId } = props;
  // plane hooks
  const { deleteScript, getScriptById } = useRunners();
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // derived values
  const script = scriptId ? getScriptById(scriptId) : undefined;

  const handleDelete = async () => {
    if (!scriptId) return;
    setIsDeleting(true);
    try {
      await deleteScript(workspaceSlug, scriptId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Runner script deleted successfully",
      });
      onClose();
    } catch (error) {
      console.error("Failed to delete script:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to delete runner script",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!scriptId) return null;

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      title="Delete Runner Script"
      content={
        <>
          Are you sure you want to delete <span className="font-semibold">{script?.name}</span>? This action cannot be
          undone and all execution history will be lost.
        </>
      }
      primaryButtonText={{
        loading: "Deleting...",
        default: "Delete",
      }}
      secondaryButtonText="Cancel"
      variant="danger"
    />
  );
});
