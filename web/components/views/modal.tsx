import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { IProjectView } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { ProjectViewForm } from "@/components/views";
// constants
import { E_VIEWS, VIEW_CREATED, VIEW_UPDATED, elementFromPath } from "@/constants/event-tracker";
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
  const { captureEvent, getTrackElement } = useEventTracker();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: IProjectView) => {
    await createView(workspaceSlug, projectId, payload)
      .then((res) => {
        handleClose();
        const element = elementFromPath(router.asPath);
        captureEvent(VIEW_CREATED, {
          view_id: res.id,
          filters: res.filters,
          element: getTrackElement ?? element?.element,
          element_id: element?.element_id,
          state: "SUCCESS",
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View created successfully.",
        });
      })
      .catch(() => {
        captureEvent(VIEW_CREATED, {
          state: "FAILED",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      });
  };

  const handleUpdateView = async (payload: IProjectView) => {
    await updateView(workspaceSlug, projectId, data?.id as string, payload)
      .then((res) => {
        captureEvent(VIEW_UPDATED, {
          view_id: res.id,
          filters: res.filters,
          element: E_VIEWS,
          state: "SUCCESS",
        });
        handleClose();
      })
      .catch((err) => {
        captureEvent(VIEW_UPDATED, {
          view_id: data?.id,
          element: E_VIEWS,
          state: "FAILED",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Something went wrong. Please try again.",
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
