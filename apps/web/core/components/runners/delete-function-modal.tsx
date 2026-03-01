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
import { useFunctions } from "@/hooks/store/runners/use-functions";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  functionId: string | null;
  onClose: () => void;
};

export const DeleteFunctionModal = observer(function DeleteFunctionModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, functionId } = props;
  // plane hooks
  const { deleteFunction, getFunctionById } = useFunctions();
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // derived values
  const fn = functionId ? getFunctionById(functionId) : undefined;

  const handleDelete = async () => {
    if (!functionId) return;
    setIsDeleting(true);
    try {
      await deleteFunction(workspaceSlug, functionId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Function deleted successfully",
      });
      onClose();
    } catch (error) {
      console.error("Failed to delete function:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to delete function",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!functionId) return null;

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      title="Delete Function"
      content={
        <>
          Are you sure you want to delete <span className="font-semibold">{fn?.name}</span>? This action cannot be
          undone. Any scripts using this function will need to be updated.
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
