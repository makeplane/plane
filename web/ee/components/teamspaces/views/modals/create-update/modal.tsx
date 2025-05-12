"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// types
import { IProjectView, TTeamspaceView } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ProjectViewForm } from "@/components/views";
// plan web hooks
import { useTeamspaceViews } from "@/plane-web/hooks/store";
// local components
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
  // store hooks
  const { createView, updateView } = useTeamspaceViews();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: TTeamspaceView) => {
    await createView(workspaceSlug, teamspaceId, payload)
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View created successfully.",
        });
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  const handleUpdateView = async (payload: TTeamspaceView) => {
    await updateView(workspaceSlug, teamspaceId, data?.id as string, payload)
      .then(() => handleClose())
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Something went wrong. Please try again.",
        })
      );
  };

  const handleFormSubmit = async (formData: IProjectView | TTeamspaceView) => {
    if (!data) await handleCreateView(formData as TTeamspaceView);
    else await handleUpdateView(formData as TTeamspaceView);
  };

  if (!isOpen) return null;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {data && data.id && !data.is_team_view ? (
        <ProjectViewForm
          data={data}
          handleClose={handleClose}
          handleFormSubmit={handleFormSubmit}
          preLoadedData={preLoadedData}
        />
      ) : (
        <TeamspaceViewForm
          data={data}
          handleClose={handleClose}
          handleFormSubmit={handleFormSubmit}
          preLoadedData={preLoadedData}
        />
      )}
    </ModalCore>
  );
});
