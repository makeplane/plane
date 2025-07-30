"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// types
import { PROJECT_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { IProjectView } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ProjectViewForm } from "@/components/views";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProjectView } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import useKeypress from "@/hooks/use-keypress";

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
      .then(() => {
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
      />
    </ModalCore>
  );
});
