import { observer } from "mobx-react";
// ce components
import {
  WorkspaceLevelModals as BaseWorkspaceLevelModals,
  TWorkspaceLevelModalsProps,
} from "@/ce/components/command-palette/modals/workspace-level";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { CreateOrUpdateTeamModal } from "@/plane-web/components/teams/create-update";
import { CreateUpdateTeamViewModal } from "@/plane-web/components/teams/views/modals/create-update";
import { CreateUpdateInitiativeModal } from "../../initiatives/components/create-update-initiatives-modal";

export const WorkspaceLevelModals = observer((props: TWorkspaceLevelModalsProps) => {
  // router
  const { workspaceSlug } = props;
  // store hooks
  const {
    createUpdateTeamModal,
    toggleCreateTeamModal,
    createUpdateTeamViewModal,
    toggleCreateTeamViewModal,
    createUpdateInitiativeModal,
    toggleCreateInitiativeModal,
  } = useCommandPalette();

  return (
    <>
      <BaseWorkspaceLevelModals {...props} />
      <CreateOrUpdateTeamModal
        teamId={createUpdateTeamModal.teamId}
        isModalOpen={createUpdateTeamModal.isOpen}
        handleModalClose={() => toggleCreateTeamModal({ isOpen: false, teamId: undefined })}
      />
      {createUpdateTeamViewModal.teamId && (
        <CreateUpdateTeamViewModal
          isOpen={createUpdateTeamViewModal.isOpen}
          onClose={() => toggleCreateTeamViewModal({ isOpen: false, teamId: undefined })}
          workspaceSlug={workspaceSlug.toString()}
          teamId={createUpdateTeamViewModal.teamId}
        />
      )}
      <CreateUpdateInitiativeModal
        isOpen={createUpdateInitiativeModal.isOpen}
        handleClose={() => toggleCreateInitiativeModal({ isOpen: false, initiativeId: undefined })}
      />
    </>
  );
});
