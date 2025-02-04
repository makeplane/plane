import { observer } from "mobx-react";
// ce components
import {
  WorkspaceLevelModals as BaseWorkspaceLevelModals,
  TWorkspaceLevelModalsProps,
} from "@/ce/components/command-palette/modals/workspace-level";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { CreateUpdateWorkspaceDashboardModal } from "@/plane-web/components/dashboards/modals";
import { CreateUpdateInitiativeModal } from "@/plane-web/components/initiatives/components/create-update-initiatives-modal";
import { CreateOrUpdateTeamspaceModal } from "@/plane-web/components/teamspaces/create-update";
import { CreateUpdateTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/create-update";
// plane web hooks
import { useWorkspaceDashboards } from "@/plane-web/hooks/store";

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
  const {
    isCreateUpdateModalOpen: isWorkspaceDashboardModalOpen,
    createUpdateModalPayload: workspaceDashboardModalPayload,
    toggleCreateUpdateModal: toggleWorkspaceDashboardModal,
  } = useWorkspaceDashboards();

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
      <CreateUpdateWorkspaceDashboardModal
        data={workspaceDashboardModalPayload ?? undefined}
        isOpen={isWorkspaceDashboardModalOpen}
        onClose={() => toggleWorkspaceDashboardModal(false)}
      />
    </>
  );
});
