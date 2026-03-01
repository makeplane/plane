/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { lazy, Suspense } from "react";
import { observer } from "mobx-react";
// plane web hooks
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

// Lazy load modal components
const PaidPlanSuccessModal = lazy(() =>
  import("@/components/workspace/license").then((module) => ({ default: module.PaidPlanSuccessModal }))
);
const PaidPlanUpgradeModal = lazy(() =>
  import("@/components/workspace/license").then((module) => ({ default: module.PaidPlanUpgradeModal }))
);
const SubscriptionActivationModal = lazy(() =>
  import("@/components/workspace/license/activation/modal").then((module) => ({
    default: module.SubscriptionActivationModal,
  }))
);
const AddSeatsModal = lazy(() =>
  import("@/components/workspace/settings/billing/manage-seats").then((module) => ({ default: module.AddSeatsModal }))
);
const RemoveUnusedSeatsModal = lazy(() =>
  import("@/components/workspace/settings/billing/manage-seats").then((module) => ({
    default: module.RemoveUnusedSeatsModal,
  }))
);
const ProfileSettingsModal = lazy(() =>
  import("@/components/settings/profile/modal").then((module) => ({
    default: module.ProfileSettingsModal,
  }))
);

type TGlobalModalsProps = {
  workspaceSlug: string;
};

/**
 * GlobalModals component manages all workspace-level modals across Plane applications.
 *
 * This includes:
 * - Subscription and license management modals (upgrade, activation, success)
 * - Workspace seat management modals (add seats, remove unused seats)
 *
 * These modals are available across all Plane applications (Project, Wiki, AI, and Settings).
 */
export const GlobalModals = observer(function GlobalModals(props: TGlobalModalsProps) {
  const { workspaceSlug } = props;
  // store hooks
  const {
    addWorkspaceSeatsModal,
    getIsInTrialPeriod,
    handleSuccessModalToggle,
    isSeatManagementEnabled,
    isSuccessPlanModalOpen,
    removeUnusedSeatsConfirmationModal,
    toggleAddWorkspaceSeatsModal,
    toggleRemoveUnusedSeatsConfirmationModal,
    updateSubscribedPlan,
  } = useWorkspaceSubscription();
  const { subscribedPlan, isPaidPlanModalOpen, togglePaidPlanModal } = useWorkspaceSubscription();
  const { isActivationModalOpen, toggleLicenseActivationModal } = useSelfHostedSubscription();
  // derived values
  const currentWorkspaceSubscriptionDetail = subscribedPlan[workspaceSlug];

  return (
    <Suspense fallback={null}>
      {currentWorkspaceSubscriptionDetail?.product && (
        <PaidPlanSuccessModal
          variant={currentWorkspaceSubscriptionDetail?.product}
          isOpen={isSuccessPlanModalOpen}
          handleClose={() => handleSuccessModalToggle(false)}
        />
      )}
      <SubscriptionActivationModal
        isOpen={isActivationModalOpen}
        handleClose={() => toggleLicenseActivationModal(false)}
      />
      <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
      {isSeatManagementEnabled && currentWorkspaceSubscriptionDetail && (
        <AddSeatsModal
          data={addWorkspaceSeatsModal}
          getIsInTrialPeriod={getIsInTrialPeriod}
          subscribedPlan={currentWorkspaceSubscriptionDetail}
          updateSubscribedPlan={updateSubscribedPlan}
          workspaceSlug={workspaceSlug}
          onClose={() => {
            toggleAddWorkspaceSeatsModal({ isOpen: false });
          }}
        />
      )}
      {isSeatManagementEnabled && (
        <RemoveUnusedSeatsModal
          isOpen={removeUnusedSeatsConfirmationModal}
          handleClose={() => toggleRemoveUnusedSeatsConfirmationModal()}
          updateSubscribedPlan={updateSubscribedPlan}
          workspaceSlug={workspaceSlug}
        />
      )}
      <ProfileSettingsModal />
    </Suspense>
  );
});
