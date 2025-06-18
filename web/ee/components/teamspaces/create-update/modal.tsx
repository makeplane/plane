import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { TTeamspace } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { getRandomEmoji  } from "@plane/utils";
// plane web components
import { CreateOrUpdateTeamForm } from "@/plane-web/components/teamspaces/create-update";
// plane web
import { useTeamspaces } from "@/plane-web/hooks/store";

type TCreateOrUpdateTeamspaceModalProps = {
  teamspaceId: string | undefined;
  isModalOpen: boolean;
  handleModalClose: () => void;
};

const defaultTeamData: Partial<TTeamspace> = {
  id: undefined,
  name: "",
  description_html: "",
  description_json: undefined,
  member_ids: [],
  project_ids: [],
};

export const CreateOrUpdateTeamspaceModal: FC<TCreateOrUpdateTeamspaceModalProps> = observer((props) => {
  const { teamspaceId, isModalOpen, handleModalClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [teamFormData, setTeamFormData] = useState<Partial<TTeamspace> | undefined>(undefined);
  // store hooks
  const { getTeamspaceById, createTeamspace, updateTeamspace } = useTeamspaces();
  // derived values
  const teamDetail = teamspaceId ? getTeamspaceById(teamspaceId) : undefined;

  useEffect(() => {
    if (isModalOpen) {
      if (teamspaceId && !teamDetail) return;
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
  }, [teamspaceId, teamDetail, isModalOpen]);

  // helpers
  const parseError: (
    error: Partial<Record<keyof TTeamspace, string[] | undefined>>,
    isUpdate?: boolean,
    teamName?: string
  ) => string = (error, isUpdate) => {
    const fallbackErrorMessage = `Failed to ${isUpdate ? "update" : "create"} teamspace. Please try again!`;
    // check if the error is empty
    if (!error || Object.keys(error).length === 0) return fallbackErrorMessage;
    // get the first error message in the format field: error message
    const [key, errors] = Object.entries(error)[0];
    return key && errors?.[0] ? `${key.charAt(0).toUpperCase() + key.slice(1)}: ${errors?.[0]}` : fallbackErrorMessage;
  };

  // handlers
  const handleFormDataChange = <T extends keyof TTeamspace>(key: T, value: TTeamspace[T] | undefined) =>
    setTeamFormData((prev) => ({ ...prev, [key]: value }));

  const handleModalClearAndClose = () => {
    setTeamFormData(undefined);
    handleModalClose();
  };

  const handleCreateTeam = async () => {
    if (!teamFormData) return;
    setIsSubmitting(true);
    await createTeamspace(workspaceSlug?.toString(), teamFormData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Teamspace created successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: parseError(error?.data ?? undefined),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleUpdateTeam = async () => {
    if (!teamspaceId || !teamFormData) return;

    setIsSubmitting(true);
    await updateTeamspace(workspaceSlug?.toString(), teamspaceId, teamFormData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Teamspace ${teamFormData?.name} updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: parseError(error?.data ?? undefined, true),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!isModalOpen) return null;

  return (
    <ModalCore isOpen={isModalOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <CreateOrUpdateTeamForm
        teamDetail={teamDetail}
        formData={teamFormData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleModalClose={handleModalClearAndClose}
        handleFormSubmit={teamspaceId ? handleUpdateTeam : handleCreateTeam}
      />
    </ModalCore>
  );
});
