"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { SUBSCRIPTION_WITH_SEATS_MANAGEMENT } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
// ce imports
import { TSendWorkspaceInvitationModalProps } from "@/ce/components/workspace/members/invite-modal";
// components
import { InvitationFields, InvitationModalActions } from "@/components/workspace/invite-modal";
import { InvitationForm } from "@/components/workspace/invite-modal/form";
// hooks
import { useWorkspaceInvitationActions } from "@/hooks/use-workspace-invitation";
// plane web imports
import { AddSeatsForm } from "@/plane-web/components/workspace/billing/manage-seats";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/plane-web/services/payment.service";
// local components
import { InvitationDescription } from "./description";
import { InvitationLimitReactInfo } from "./limit-reached-info";

const paymentService = new PaymentService();

type TModalStep = "INVITE_MEMBERS" | "ADD_SEATS";

export const SendWorkspaceInvitationModal: React.FC<TSendWorkspaceInvitationModalProps> = observer((props) => {
  const { isOpen, onClose, onSubmit } = props;
  // states
  const [currentStep, setCurrentStep] = useState<TModalStep>("INVITE_MEMBERS");
  // store hooks
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
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
  const isSeatsManagementEnabled =
    subscriptionDetail && SUBSCRIPTION_WITH_SEATS_MANAGEMENT.includes(subscriptionDetail.product);
  // swr
  const {
    isLoading: isMemberInviteCheckLoading,
    data: memberInviteCheckData,
    mutate: mutateMemberInviteCheck,
  } = useSWR(workspaceSlug ? `MEMBER_INVITE_CHECK_${workspaceSlug}` : null, () =>
    workspaceSlug ? paymentService.memberInviteCheck(workspaceSlug?.toString()) : null
  );

  useEffect(() => {
    if (isOpen) {
      mutateMemberInviteCheck();
    }
  }, [isOpen, mutateMemberInviteCheck]);

  const handleClose = () => {
    handleCloseAction();
    setCurrentStep("INVITE_MEMBERS");
  };

  const memberDetails = watch("emails");
  // count total admins and members from the input fields
  const totalAdminAndMembers = memberDetails?.filter(
    (member) => !!member.email && (member.role === 15 || member.role === 20)
  ).length;
  // count total guests from the input fields
  const totalGuests = memberDetails?.filter((member) => !!member.email && member.role === 5).length;
  // check if the invite status is disabled from the backend
  const isInviteStatusDisabled =
    !memberInviteCheckData?.invite_allowed ||
    (memberInviteCheckData?.allowed_admin_members === 0 && memberInviteCheckData?.allowed_guests === 0);
  // check if the invitation limit is reached
  const isInvitationLimitReached =
    isSeatsManagementEnabled &&
    (isInviteStatusDisabled ||
      totalAdminAndMembers > (memberInviteCheckData?.allowed_admin_members ?? 0) ||
      totalGuests > (memberInviteCheckData?.allowed_guests ?? 0));
  // compute if the invite button is disabled
  const isInviteDisabled = isSeatsManagementEnabled ? isMemberInviteCheckLoading || isInvitationLimitReached : false;

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
        <AddSeatsForm onClose={handleClose} onPreviousStep={() => setCurrentStep("INVITE_MEMBERS")} />
      )}
    </ModalCore>
  );
});
