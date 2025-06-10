import { observer } from "mobx-react";
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
import { PaidPlanSuccessModal, PaidPlanUpgradeModal } from "@/plane-web/components/license";
import { CreateOrUpdateTeamspaceModal } from "@/plane-web/components/teamspaces/create-update";
import { CreateUpdateTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/create-update";
import { SubscriptionActivationModal } from "@/plane-web/components/workspace";
import { AddSeatsModal, RemoveUnusedSeatsModal } from "@/plane-web/components/workspace/billing/manage-seats";
import { useDashboards, useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const WorkspaceLevelModals = observer((props: TWorkspaceLevelModalsProps) => {
  // router
  const { workspaceSlug } = props;
  // store hooks
  const {
    isSeatManagementEnabled,
    addWorkspaceSeatsModal,
    removeUnusedSeatsConfirmationModal,
    toggleAddWorkspaceSeatsModal,
    toggleRemoveUnusedSeatsConfirmationModal,
    isSuccessPlanModalOpen,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  const { isPaidPlanModalOpen, togglePaidPlanModal } = useWorkspaceSubscription();
  const { isActivationModalOpen, toggleLicenseActivationModal } = useSelfHostedSubscription();

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

  return (
    <>
      <BaseWorkspaceLevelModals {...props} />
      {subscriptionDetail?.product && (
        <PaidPlanSuccessModal
          variant={subscriptionDetail?.product}
          isOpen={isSuccessPlanModalOpen}
          handleClose={() => handleSuccessModalToggle(false)}
        />
      )}
      <SubscriptionActivationModal
        isOpen={isActivationModalOpen}
        handleClose={() => toggleLicenseActivationModal(false)}
      />
      <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
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
      {isSeatManagementEnabled && (
        <AddSeatsModal
          data={addWorkspaceSeatsModal}
          onClose={() => {
            toggleAddWorkspaceSeatsModal({ isOpen: false });
          }}
        />
      )}
      {isSeatManagementEnabled && (
        <RemoveUnusedSeatsModal
          isOpen={removeUnusedSeatsConfirmationModal}
          handleClose={() => toggleRemoveUnusedSeatsConfirmationModal()}
        />
      )}
    </>
  );
});
