import { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IProjectView } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { ProjectViewForm } from "@/components/views";
// constants
import { VIEW_CREATED, VIEW_UPDATED } from "constants/event-tracker";
// hooks
import { useProjectView, useEventTracker } from "@/hooks/store";

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
  const router = useRouter();
  // store hooks
  const { createView, updateView } = useProjectView();
  const { captureEvent, trackElement } = useEventTracker();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: IProjectView) => {
    await createView(workspaceSlug, projectId, payload)
      .then((res) => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View created successfully.",
        });
        captureEvent(VIEW_CREATED, {
          view_id: res.id,
          filters: res.filters,
          // element_id: getElementFromPath(router.asPath),
          // element: trackElement ? trackElement : getElementIdFromPath(router.asPath),
          state: "SUCCESS",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
        captureEvent(VIEW_CREATED, {
          // element_id: getElementFromPath(router.asPath),
          // element: trackElement ? trackElement : getElementIdFromPath(router.asPath),
          state: "FAILED",
        });
      });
  };

  const handleUpdateView = async (payload: IProjectView) => {
    await updateView(workspaceSlug, projectId, data?.id as string, payload)
      .then((res) => {
        handleClose();
        captureEvent(VIEW_UPDATED, {
          view_id: res.id,
          filters: res.filters,
          // element: trackElement ? trackElement : getElementIdFromPath(router.asPath),
          state: "SUCCESS",
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Something went wrong. Please try again.",
        });
        captureEvent(VIEW_UPDATED, {
          view_id: payload.id,
          filters: payload.filters,
          // element: trackElement ? trackElement : getElementIdFromPath(router.asPath),
          state: "FAILED",
        });
      });
  };

  const handleFormSubmit = async (formData: IProjectView) => {
    if (!data) await handleCreateView(formData);
    else await handleUpdateView(formData);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <ProjectViewForm
        data={data}
        handleClose={handleClose}
        handleFormSubmit={handleFormSubmit}
        preLoadedData={preLoadedData}
      />
    </ModalCore>
  );
});
