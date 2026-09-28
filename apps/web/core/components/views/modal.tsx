/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// types
import { setToast } from "@plane/blocks/toast";
import type { IProjectView } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// ui
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { ProjectViewForm } from "./form";

type Props = {
  data?: IProjectView | null;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<IProjectView> | null;
  workspaceSlug: string;
  projectId: string;
};

export const CreateUpdateProjectViewModal = observer(function CreateUpdateProjectViewModal(props: Props) {
  const { data, isOpen, onClose, preLoadedData, workspaceSlug, projectId } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { createView, updateView } = useProjectView();
  const {
    issuesFilter: { mutateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { resetExpression } = useWorkItemFilters();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: IProjectView) => {
    try {
      const res = await createView(workspaceSlug, projectId, payload);
      handleClose();
      router.push(`/${workspaceSlug}/projects/${projectId}/views/${res.id}`);
      setToast({
        type: "success",
        title: "Success!",
        message: "View created successfully.",
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Failed to create view. Please try again.",
      });
    }
  };

  const handleUpdateView = async (payload: IProjectView) => {
    try {
      const viewDetails = await updateView(workspaceSlug, projectId, data?.id as string, payload);
      mutateFilters(workspaceSlug, viewDetails.id, viewDetails);
      resetExpression(EIssuesStoreType.PROJECT_VIEW, viewDetails.id, viewDetails.rich_filters);
      handleClose();
    } catch (_error) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Failed to update view. Please try again.",
      });
    }
  };

  const handleFormSubmit = async (formData: IProjectView) => {
    if (!data) await handleCreateView(formData);
    else await handleUpdateView(formData);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      disablePointerDismissal
    >
      <DialogContent size="md">
        <ProjectViewForm
          data={data}
          handleClose={handleClose}
          handleFormSubmit={handleFormSubmit}
          preLoadedData={preLoadedData}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      </DialogContent>
    </Dialog>
  );
});
