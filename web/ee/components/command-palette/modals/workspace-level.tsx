import { observer } from "mobx-react";
// plane imports
import { SUBSCRIPTION_WITH_SEATS_MANAGEMENT } from "@plane/constants";
// ce components
import {
  WorkspaceLevelModals as BaseWorkspaceLevelModals,
  TWorkspaceLevelModalsProps,
} from "@/ce/components/command-palette/modals/workspace-level";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { CreateUpdateCustomerModal } from "@/plane-web/components/customers/customer-modal";
import { CreateUpdateWorkspaceDashboardModal } from "@/plane-web/components/dashboards/modals";
import { CreateUpdateInitiativeModal } from "@/plane-web/components/initiatives/components/create-update-initiatives-modal";
import { CreateOrUpdateTeamspaceModal } from "@/plane-web/components/teamspaces/create-update";
import { CreateUpdateTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/create-update";
import { AddSeatsModal, RemoveUnusedSeatsModal } from "@/plane-web/components/workspace/billing/manage-seats";
import { useDashboards, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const WorkspaceLevelModals = observer((props: TWorkspaceLevelModalsProps) => {
  // router
  const { workspaceSlug } = props;
  // store hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    addWorkspaceSeatsModal,
    removeUnusedSeatsConfirmationModal,
    toggleAddWorkspaceSeatsModal,
    toggleRemoveUnusedSeatsConfirmationModal,
  } = useWorkspaceSubscription();
  const {
    createUpdateTeamspaceModal,
    toggleCreateTeamspaceModal,
    createUpdateTeamspaceViewModal,
    toggleCreateTeamspaceViewModal,
    createUpdateInitiativeModal,
    toggleCreateInitiativeModal,
    createUpdateCustomerModal,
    toggleCreateCustomerModal,
  } = useCommandPalette();
  const {
    workspaceDashboards: {
      isCreateUpdateModalOpen: isWorkspaceDashboardModalOpen,
      createUpdateModalPayload: workspaceDashboardModalPayload,
      toggleCreateUpdateModal: toggleWorkspaceDashboardModal,
      updateCreateUpdateModalPayload: updateWorkspaceDashboardModalPayload,
    },
  } = useDashboards();
  // derived values
  const isOfflineSubscription = subscriptionDetail?.is_offline_payment;
  const isSeatsManagementEnabled =
    subscriptionDetail &&
    !isOfflineSubscription &&
    SUBSCRIPTION_WITH_SEATS_MANAGEMENT.includes(subscriptionDetail?.product);

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
        onClose={() => {
          toggleWorkspaceDashboardModal(false);
          setTimeout(() => {
            updateWorkspaceDashboardModalPayload(null);
          }, 300);
        }}
      />
      <CreateUpdateCustomerModal
        isOpen={createUpdateCustomerModal.isOpen}
        customerId={createUpdateCustomerModal.customerId}
        onClose={() => toggleCreateCustomerModal({ isOpen: false, customerId: undefined })}
      />
      {isSeatsManagementEnabled && (
        <AddSeatsModal
          data={addWorkspaceSeatsModal}
          onClose={() => {
            toggleAddWorkspaceSeatsModal({ isOpen: false });
          }}
        />
      )}
      {isSeatsManagementEnabled && (
        <RemoveUnusedSeatsModal
          isOpen={removeUnusedSeatsConfirmationModal}
          handleClose={() => toggleRemoveUnusedSeatsConfirmationModal()}
        />
      )}
    </>
  );
});
