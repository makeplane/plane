import { observer } from "mobx-react";
// ce components
import {
  WorkspaceLevelModals as BaseWorkspaceLevelModals,
  TWorkspaceLevelModalsProps,
} from "@/ce/components/command-palette/modals/workspace-level";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { CreateOrUpdateTeamspaceModal } from "@/plane-web/components/teamspaces/create-update";
import { CreateUpdateTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/create-update";
import { CreateUpdateInitiativeModal } from "../../initiatives/components/create-update-initiatives-modal";

export const WorkspaceLevelModals = observer((props: TWorkspaceLevelModalsProps) => {
  // router
  const { workspaceSlug } = props;
  // store hooks
  const {
    createUpdateTeamspaceModal,
    toggleCreateTeamspaceModal,
    createUpdateTeamspaceViewModal,
    toggleCreateTeamspaceViewModal,
    createUpdateInitiativeModal,
    toggleCreateInitiativeModal,
  } = useCommandPalette();

  return (
    <>
      <BaseWorkspaceLevelModals {...props} />
      <CreateOrUpdateTeamspaceModal
        teamspaceId={createUpdateTeamspaceModal.teamspaceId}
        isModalOpen={createUpdateTeamspaceModal.isOpen}
        handleModalClose={() => toggleCreateTeamspaceModal({ isOpen: false, teamspaceId: undefined })}
      />
      {createUpdateTeamspaceViewModal.teamspaceId && (
        <CreateUpdateTeamspaceViewModal
          isOpen={createUpdateTeamspaceViewModal.isOpen}
          onClose={() => toggleCreateTeamspaceViewModal({ isOpen: false, teamspaceId: undefined })}
          workspaceSlug={workspaceSlug.toString()}
          teamspaceId={createUpdateTeamspaceViewModal.teamspaceId}
        />
      )}
      <CreateUpdateInitiativeModal
        isOpen={createUpdateInitiativeModal.isOpen}
        handleClose={() => toggleCreateInitiativeModal({ isOpen: false, initiativeId: undefined })}
      />
    </>
  );
});
