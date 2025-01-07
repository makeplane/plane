"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// types
import { IProjectView, TTeamView } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ProjectViewForm } from "@/components/views";
// plan web hooks
import { useTeamViews } from "@/plane-web/hooks/store";
// local components
import { TeamViewForm } from "./form";

type Props = {
  data?: TTeamView | null;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<TTeamView> | null;
  workspaceSlug: string;
  teamId: string;
};

export const CreateUpdateTeamViewModal: FC<Props> = observer((props) => {
  const { data, isOpen, onClose, preLoadedData, workspaceSlug, teamId } = props;
  // store hooks
  const { createView, updateView } = useTeamViews();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: TTeamView) => {
    await createView(workspaceSlug, teamId, payload)
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

  const handleUpdateView = async (payload: TTeamView) => {
    await updateView(workspaceSlug, teamId, data?.id as string, payload)
      .then(() => handleClose())
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Something went wrong. Please try again.",
        })
      );
  };

  const handleFormSubmit = async (formData: IProjectView | TTeamView) => {
    if (!data) await handleCreateView(formData as TTeamView);
    else await handleUpdateView(formData as TTeamView);
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
        <TeamViewForm
          data={data}
          handleClose={handleClose}
          handleFormSubmit={handleFormSubmit}
          preLoadedData={preLoadedData}
        />
      )}
    </ModalCore>
  );
});
