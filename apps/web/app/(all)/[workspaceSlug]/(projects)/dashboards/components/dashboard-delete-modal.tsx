/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  dashboardName: string;
  workspaceSlug: string;
};

export const DashboardDeleteModal = observer(function DashboardDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  dashboardName,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      handleClose();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={() => void handleSubmit()}
      isSubmitting={isDeleting}
      title="Delete Dashboard"
      content={
        <>
          Are you sure you want to delete{" "}
          <span className="font-medium text-color-primary">&quot;{dashboardName}&quot;</span>? This action cannot be
          undone and all widgets will be permanently removed.
        </>
      }
    />
  );
});
