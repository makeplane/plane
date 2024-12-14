import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { TTeam } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { getRandomEmoji } from "@/helpers/emoji.helper";
// plane web components
import { CreateOrUpdateTeamForm } from "@/plane-web/components/teams/create-update/";
// plane web
import { useTeams } from "@/plane-web/hooks/store";

type TCreateOrUpdateTeamModalProps = {
  teamId: string | undefined;
  isModalOpen: boolean;
  handleModalClose: () => void;
};

const defaultTeamData: Partial<TTeam> = {
  id: undefined,
  name: "",
  description_html: "",
  description_json: undefined,
  member_ids: [],
  project_ids: [],
};


export const CreateOrUpdateTeamModal: FC<TCreateOrUpdateTeamModalProps> = observer((props) => {
  const { teamId, isModalOpen, handleModalClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [teamFormData, setTeamFormData] = useState<Partial<TTeam> | undefined>(undefined);
  // store hooks
  const { getTeamById, createTeam, updateTeam } = useTeams();
  // derived values
  const teamDetail = teamId ? getTeamById(teamId) : undefined;

  useEffect(() => {
    if (isModalOpen) {
      if (teamId && !teamDetail) return;
      if (teamDetail) {
        setTeamFormData(teamDetail);
      } else {
        setTeamFormData({
          ...defaultTeamData,
          logo_props: {
            in_use: "emoji",
            emoji: {
              value: getRandomEmoji(),
            },
          },
        });
      }
    }
  }, [teamId, teamDetail, isModalOpen]);

  // handlers
  const handleFormDataChange = <T extends keyof TTeam>(key: T, value: TTeam[T] | undefined) =>
    setTeamFormData((prev) => ({ ...prev, [key]: value }));

  const handleModalClearAndClose = () => {
    setTeamFormData(undefined);
    handleModalClose();
  };

  const handleCreateTeam = async () => {
    if (!teamFormData) return;
    setIsSubmitting(true);
    await createTeam(workspaceSlug?.toString(), teamFormData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Team created successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to create team. Please try again!`,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleUpdateTeam = async () => {
    if (!teamId || !teamFormData) return;

    setIsSubmitting(true);
    await updateTeam(workspaceSlug?.toString(), teamId, teamFormData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Team ${teamFormData?.name} updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update team. Please try again!`,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!isModalOpen) return null;

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClearAndClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
    >
      <CreateOrUpdateTeamForm
        teamDetail={teamDetail}
        formData={teamFormData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleModalClose={handleModalClearAndClose}
        handleFormSubmit={teamId ? handleUpdateTeam : handleCreateTeam}
      />
    </ModalCore>
  );
});
