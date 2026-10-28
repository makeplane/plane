/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { TypeToConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import type { IProject } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

export interface ILeaveProjectModal {
  project: IProject;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveProjectModal = observer(function LeaveProjectModal(props: ILeaveProjectModal) {
  const { project, isOpen, onClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { leaveProject } = useUserPermissions();

  const onSubmit = async () => {
    if (!workspaceSlug) return;

    router.push(`/${workspaceSlug}/projects`);
    try {
      await leaveProject(workspaceSlug.toString(), project.id);
      onClose();
    } catch (_err) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Something went wrong please try again later.",
      });
    }
  };

  return (
    <TypeToConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onSubmit}
      title="Leave Project"
      description={
        <>
          Are you sure you want to leave the project -
          <span className="font-medium text-primary">{` "${project?.name}" `}</span>? All of the work items associated
          with you will become inaccessible.
        </>
      }
      fields={[
        { name: "projectName", label: "Enter the project name to continue:", expectedValue: project?.name ?? "" },
        { name: "confirmLeave", label: 'To confirm, type "Leave Project" below:', expectedValue: "Leave Project" },
      ]}
      confirmLabel="Leave Project"
      loadingLabel="Leaving..."
    />
  );
});
