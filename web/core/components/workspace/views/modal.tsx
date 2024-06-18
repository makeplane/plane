"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IWorkspaceView } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { WorkspaceViewForm } from "@/components/workspace";
// constants
import { GLOBAL_VIEW_CREATED, GLOBAL_VIEW_UPDATED } from "@/constants/event-tracker";
// store hooks
import { useEventTracker, useGlobalView } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  data?: IWorkspaceView;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<IWorkspaceView>;
};

export const CreateUpdateWorkspaceViewModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data, preLoadedData } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { createGlobalView, updateGlobalView } = useGlobalView();
  const { captureEvent } = useEventTracker();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: Partial<IWorkspaceView>) => {
    if (!workspaceSlug) return;

    const payloadData: Partial<IWorkspaceView> = {
      ...payload,
      filters: {
        ...payload?.filters,
      },
    };

    await createGlobalView(workspaceSlug.toString(), payloadData)
      .then((res) => {
        captureEvent(GLOBAL_VIEW_CREATED, {
          view_id: res.id,
          applied_filters: res.filters,
          state: "SUCCESS",
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View created successfully.",
        });

        router.push(`/${workspaceSlug}/workspace-views/${res.id}`);
        handleClose();
      })
      .catch(() => {
        captureEvent(GLOBAL_VIEW_CREATED, {
          applied_filters: payload?.filters,
          state: "FAILED",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "View could not be created. Please try again.",
        });
      });
  };

  const handleUpdateView = async (payload: Partial<IWorkspaceView>) => {
    if (!workspaceSlug || !data) return;

    const payloadData: Partial<IWorkspaceView> = {
      ...payload,
      query: {
        ...payload?.filters,
      },
    };

    await updateGlobalView(workspaceSlug.toString(), data.id, payloadData)
      .then((res) => {
        if (res) {
          captureEvent(GLOBAL_VIEW_UPDATED, {
            view_id: res.id,
            applied_filters: res.filters,
            state: "SUCCESS",
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "View updated successfully.",
          });
          handleClose();
        }
      })
      .catch(() => {
        captureEvent(GLOBAL_VIEW_UPDATED, {
          view_id: data.id,
          applied_filters: data.filters,
          state: "FAILED",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "View could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IWorkspaceView>) => {
    if (!workspaceSlug) return;

    if (!data) await handleCreateView(formData);
    else await handleUpdateView(formData);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <WorkspaceViewForm
        handleFormSubmit={handleFormSubmit}
        handleClose={handleClose}
        data={data}
        preLoadedData={preLoadedData}
      />
    </ModalCore>
  );
});
