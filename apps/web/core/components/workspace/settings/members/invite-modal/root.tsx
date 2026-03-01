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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
import { EProductSubscriptionEnum } from "@plane/types";
import type { IWorkspaceBulkInviteFormData } from "@plane/types";
// components
import { InvitationModalActions } from "@/components/workspace/settings/members/invite-modal/actions";
import { InvitationFields } from "@/components/workspace/settings/members/invite-modal/fields";
import { InvitationForm } from "@/components/workspace/settings/members/invite-modal/form";
// hooks
import { useWorkspaceInvitationActions } from "@/hooks/use-workspace-invitation";
// plane web imports
import { AddSeatsForm } from "@/components/workspace/settings/billing/manage-seats";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/services/payment.service";
// local components
import { InvitationDescription } from "./description";
import { InvitationLimitReactInfo } from "./limit-reached-info";
import { calculateInviteCounts, checkInviteLimitReached } from "./helpers";

const paymentService = new PaymentService();

type TModalStep = "INVITE_MEMBERS" | "ADD_SEATS";

type TSendWorkspaceInvitationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IWorkspaceBulkInviteFormData) => Promise<void> | undefined;
};

export const SendWorkspaceInvitationModal = observer(function SendWorkspaceInvitationModal(
  props: TSendWorkspaceInvitationModalProps
) {
  const { isOpen, onClose, onSubmit } = props;
  // states
  const [currentStep, setCurrentStep] = useState<TModalStep>("INVITE_MEMBERS");
  // store hooks
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    getIsInTrialPeriod,
    isSeatManagementEnabled,
    updateSubscribedPlan,
  } = useWorkspaceSubscription();
  // derived values
  const isOnEnterprisePlan = subscriptionDetail?.product === EProductSubscriptionEnum.ENTERPRISE;
  const {
    control,
    fields,
    formState,
    watch,
    remove,
    onFormSubmit,
    handleClose: handleCloseAction,
    appendField,
  } = useWorkspaceInvitationActions({
    onSubmit,
    onClose,
  });
  // swr
  const {
    isLoading: isMemberInviteCheckLoading,
    data: memberInviteCheckData,
    mutate: mutateMemberInviteCheck,
  } = useSWR(workspaceSlug ? `MEMBER_INVITE_CHECK_${workspaceSlug}` : null, () =>
    workspaceSlug ? paymentService.memberInviteCheck(workspaceSlug?.toString()) : null
  );
  const memberDetails = watch("emails");
  const inviteCounts = calculateInviteCounts(memberDetails);
  const isInvitationLimitReached =
    isSeatManagementEnabled && checkInviteLimitReached(inviteCounts, memberInviteCheckData, isOnEnterprisePlan);
  const isInviteDisabled = isSeatManagementEnabled && (isMemberInviteCheckLoading || isInvitationLimitReached);

  useEffect(() => {
    if (isOpen) {
      void mutateMemberInviteCheck();
    }
  }, [isOpen, mutateMemberInviteCheck]);

  const handleClose = () => {
    handleCloseAction();
    setCurrentStep("INVITE_MEMBERS");
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {currentStep === "INVITE_MEMBERS" ? (
        <InvitationForm
          title={t("workspace_settings.settings.members.modal.title")}
          description={<InvitationDescription data={memberInviteCheckData} isLoading={isMemberInviteCheckLoading} />}
          onSubmit={onFormSubmit}
          actions={
            <InvitationModalActions
              isInviteDisabled={!!isInviteDisabled}
              isSubmitting={formState.isSubmitting}
              handleClose={handleClose}
              appendField={appendField}
            />
          }
          className="p-5"
        >
          <InvitationFields
            workspaceSlug={workspaceSlug.toString()}
            fields={fields}
            control={control}
            formState={formState}
            remove={remove}
          />
          {isInvitationLimitReached && (
            <InvitationLimitReactInfo handleAddMoreSeats={() => setCurrentStep("ADD_SEATS")} />
          )}
        </InvitationForm>
      ) : (
        subscriptionDetail && (
          <AddSeatsForm
            getIsInTrialPeriod={getIsInTrialPeriod}
            subscribedPlan={subscriptionDetail}
            updateSubscribedPlan={updateSubscribedPlan}
            workspaceSlug={workspaceSlug.toString()}
            onClose={handleClose}
            onSuccess={() => {
              void mutateMemberInviteCheck();
              setCurrentStep("INVITE_MEMBERS");
            }}
            onPreviousStep={() => setCurrentStep("INVITE_MEMBERS")}
          />
        )
      )}
    </ModalCore>
  );
});
