"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { GLOBAL_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceView } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { WorkspaceViewForm } from "./form";

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
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  // store hooks
  const { createGlobalView, updateGlobalView } = useGlobalView();
  const { resetExpression } = useWorkItemFilters();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: Partial<IWorkspaceView>) => {
    if (!workspaceSlug) return;

    const payloadData: Partial<IWorkspaceView> = {
      ...payload,
      rich_filters: {
        ...payload?.rich_filters,
      },
    };

    await createGlobalView(workspaceSlug, payloadData)
      .then((res) => {
        captureSuccess({
          eventName: GLOBAL_VIEW_TRACKER_EVENTS.create,
          payload: {
            id: res.id,
          },
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
        captureError({
          eventName: GLOBAL_VIEW_TRACKER_EVENTS.create,
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
        ...payload?.rich_filters,
      },
    };

    await updateGlobalView(workspaceSlug, data.id, payloadData)
      .then((res) => {
        if (res) {
          resetExpression(EIssuesStoreType.GLOBAL, data.id, res.rich_filters);
          captureSuccess({
            eventName: GLOBAL_VIEW_TRACKER_EVENTS.update,
            payload: {
              id: res.id,
            },
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
        captureError({
          eventName: GLOBAL_VIEW_TRACKER_EVENTS.update,
          payload: {
            id: data.id,
          },
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

  if (!workspaceSlug) return null;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <WorkspaceViewForm
        handleFormSubmit={handleFormSubmit}
        handleClose={handleClose}
        data={data}
        preLoadedData={preLoadedData}
        workspaceSlug={workspaceSlug}
      />
    </ModalCore>
  );
});
