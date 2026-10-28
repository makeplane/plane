/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// Plane imports
import { TypeToConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import type { IProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type DeleteProjectModal = {
  isOpen: boolean;
  project: IProject;
  onClose: () => void;
};

export function DeleteProjectModal(props: DeleteProjectModal) {
  const { isOpen, project, onClose } = props;
  // store hooks
  const { deleteProject } = useProject();
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  const onSubmit = async () => {
    if (!workspaceSlug) return;

    try {
      await deleteProject(workspaceSlug.toString(), project.id);
      if (projectId && projectId.toString() === project.id) router.push(`/${workspaceSlug}/projects`);
      onClose();
      setToast({
        type: "success",
        title: "Success!",
        message: "Project deleted successfully.",
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Something went wrong. Please try again later.",
      });
    }
  };

  return (
    <TypeToConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onSubmit}
      title="Delete project"
      description={
        <>
          Are you sure you want to delete project <span className="font-semibold break-words">{project?.name}</span>?
          All of the data related to the project will be permanently removed. This action cannot be undone
        </>
      }
      fields={[
        { name: "projectName", label: "Enter the project name to continue:", expectedValue: project?.name ?? "" },
        {
          name: "confirmDelete",
          label: 'To confirm, type "delete my project" below:',
          expectedValue: "delete my project",
        },
      ]}
      confirmLabel="Delete project"
      loadingLabel="Deleting"
    />
  );
}
