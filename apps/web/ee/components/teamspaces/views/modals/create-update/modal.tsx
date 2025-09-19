"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { TEAMSPACE_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { EIssuesStoreType, IProjectView, TTeamspaceView } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { joinUrlPath } from "@plane/utils";
import { captureSuccess, captureError } from "@/helpers/event-tracker.helper";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// plan web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { useTeamspaceViews } from "@/plane-web/hooks/store";
// local imports
import { TeamspaceViewForm } from "./form";

type Props = {
  data?: TTeamspaceView | null;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<TTeamspaceView> | null;
  workspaceSlug: string;
  teamspaceId: string;
};

export const CreateUpdateTeamspaceViewModal: FC<Props> = observer((props) => {
  const { data, isOpen, onClose, preLoadedData, workspaceSlug, teamspaceId } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { createView, updateView } = useTeamspaceViews();
  const {
    issuesFilter: { mutateFilters },
  } = useIssues(EIssuesStoreType.TEAM_VIEW);
  const { resetExpression } = useWorkItemFilters();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: TTeamspaceView) => {
    await createView(workspaceSlug, teamspaceId, payload)
      .then((view) => {
        router.push(joinUrlPath(workspaceSlug, "teamspaces", teamspaceId, "views", view.id));
        captureSuccess({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_CREATE,
          payload: { id: view.id },
        });
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View created successfully.",
        });
      })
      .catch((error) => {
        captureError({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_CREATE,
          error: error,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      });
  };

  const handleUpdateView = async (payload: TTeamspaceView) => {
    await updateView(workspaceSlug, teamspaceId, data?.id as string, payload)
      .then((viewDetails) => {
        mutateFilters(workspaceSlug, viewDetails.id, viewDetails);
        resetExpression(EIssuesStoreType.TEAM_VIEW, viewDetails.id, viewDetails.rich_filters);
        captureSuccess({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_UPDATE,
          payload: { id: data?.id },
        });
        handleClose();
      })
      .catch((err) => {
        captureError({
          eventName: TEAMSPACE_VIEW_TRACKER_EVENTS.VIEW_UPDATE,
          error: err,
          payload: { id: data?.id },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Something went wrong. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: IProjectView | TTeamspaceView) => {
    if (!data) await handleCreateView(formData as TTeamspaceView);
    else await handleUpdateView(formData as TTeamspaceView);
  };

  if (!isOpen) return null;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <TeamspaceViewForm
        data={data}
        handleClose={handleClose}
        handleFormSubmit={handleFormSubmit}
        preLoadedData={preLoadedData}
        teamspaceId={teamspaceId}
        workspaceSlug={workspaceSlug}
      />
    </ModalCore>
  );
});
