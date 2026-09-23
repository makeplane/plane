/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  handleClose: () => void;
  isOpen: boolean;
  onSubmit?: () => Promise<void>;
};

export function ArchiveModuleModal(props: Props) {
  const { workspaceSlug, projectId, moduleId, isOpen, handleClose } = props;
  // router
  const router = useAppRouter();
  // states
  const [isArchiving, setIsArchiving] = useState(false);
  // store hooks
  const { getModuleNameById, archiveModule } = useModule();

  const moduleName = getModuleNameById(moduleId);

  const onClose = () => {
    setIsArchiving(false);
    handleClose();
  };

  const handleArchiveModule = async () => {
    setIsArchiving(true);
    try {
      await archiveModule(workspaceSlug, projectId, moduleId);
      setToast({
        type: "success",
        title: "Archive success",
        message: "Your archives can be found in project archives.",
      });
      onClose();
      router.push(`/${workspaceSlug}/projects/${projectId}/modules`);
    } catch {
      setToast({
        type: "error",
        title: "Error!",
        message: "Module could not be archived. Please try again.",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleArchiveModule}
      isSubmitting={isArchiving}
      variant="primary"
      title={`Archive module ${moduleName}`}
      content="Are you sure you want to archive the module? All your archives can be restored later."
      primaryButtonText={{ loading: "Archiving", default: "Archive" }}
      secondaryButtonText="Cancel"
    />
  );
}
