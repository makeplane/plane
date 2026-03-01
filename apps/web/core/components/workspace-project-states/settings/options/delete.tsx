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
import { Loader } from "lucide-react";
// plane imports
import { CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { AlertModalCore } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectState } from "@/types/workspace-project-states";

type TProjectStateDelete = {
  workspaceSlug: string;
  totalStates: number;
  state: TProjectState;
};

export const ProjectStateDelete = observer(function ProjectStateDelete(props: TProjectStateDelete) {
  const { workspaceSlug, totalStates, state } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { removeProjectState } = useWorkspaceProjectStates();
  // states
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isDelete, setIsDelete] = useState(false);

  // derived values
  const isDeleteDisabled = state.default ? true : totalStates === 1 ? true : false;

  const handleDeleteState = async () => {
    if (!workspaceSlug || isDeleteDisabled || !state.id) return;

    setIsDelete(true);
    try {
      await removeProjectState(workspaceSlug, state.id);
      setIsDelete(false);
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
      if (errorStatus.status === 400) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message:
            "This state contains some work items within it, please move them to some other state to delete this state.",
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "State could not be deleted. Please try again.",
        });
      }
      setIsDelete(false);
    }
  };

  return (
    <>
      <AlertModalCore
        handleClose={() => setIsDeleteModal(false)}
        handleSubmit={handleDeleteState}
        isSubmitting={isDelete}
        isOpen={isDeleteModal}
        title="Delete State"
        content={
          <>
            Are you sure you want to delete state- <span className="font-medium text-primary">{state?.name}</span>? All
            of the data related to the state will be permanently removed. This action cannot be undone.
          </>
        }
      />

      <button
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center overflow-hidden transition-colors cursor-pointer focus:outline-none",
          isDeleteDisabled ? "bg-layer-1 text-secondary" : "text-danger-primary hover:bg-layer-1"
        )}
        disabled={isDeleteDisabled}
        onClick={() => setIsDeleteModal(true)}
      >
        <Tooltip
          tooltipContent={
            state.default ? "Cannot delete the default state." : totalStates === 1 ? `Cannot have an empty group.` : ``
          }
          isMobile={isMobile}
          disabled={!isDeleteDisabled}
          className="focus:outline-none"
        >
          {isDelete ? <Loader className="w-3.5 h-3.5 text-secondary" /> : <CloseIcon className="w-3.5 h-3.5" />}
        </Tooltip>
      </button>
    </>
  );
});
