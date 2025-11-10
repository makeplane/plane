"use client";

import type { FC } from "react";
import { observer } from "mobx-react";
// types
import { PROJECT_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectView } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { useAppRouter } from "@/hooks/use-app-router";
import useKeypress from "@/hooks/use-keypress";
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

export const CreateUpdateProjectViewModal: FC<Props> = observer((props) => {
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
    await createView(workspaceSlug, projectId, payload)
      .then((res) => {
        handleClose();
        router.push(`/${workspaceSlug}/projects/${projectId}/views/${res.id}`);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View created successfully.",
        });
        captureSuccess({
          eventName: PROJECT_VIEW_TRACKER_EVENTS.create,
          payload: {
            view_id: res.id,
          },
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
        captureError({
          eventName: PROJECT_VIEW_TRACKER_EVENTS.create,
        });
      });
  };

  const handleUpdateView = async (payload: IProjectView) => {
    await updateView(workspaceSlug, projectId, data?.id as string, payload)
      .then((viewDetails) => {
        mutateFilters(workspaceSlug, viewDetails.id, viewDetails);
        resetExpression(EIssuesStoreType.PROJECT_VIEW, viewDetails.id, viewDetails.rich_filters);
        handleClose();
        captureSuccess({
          eventName: PROJECT_VIEW_TRACKER_EVENTS.update,
          payload: {
            view_id: data?.id,
          },
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Something went wrong. Please try again.",
        });
        captureError({
          eventName: PROJECT_VIEW_TRACKER_EVENTS.update,
          payload: {
            view_id: data?.id,
          },
        });
      });
  };

  const handleFormSubmit = async (formData: IProjectView) => {
    if (!data) await handleCreateView(formData);
    else await handleUpdateView(formData);
  };

  useKeypress("Escape", () => {
    if (isOpen) handleClose();
  });

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <ProjectViewForm
        data={data}
        handleClose={handleClose}
        handleFormSubmit={handleFormSubmit}
        preLoadedData={preLoadedData}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      />
    </ModalCore>
  );
});
