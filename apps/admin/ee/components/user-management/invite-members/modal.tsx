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

import { observer } from "mobx-react";
import { useState } from "react";
import type { FC } from "react";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TInstanceAdminCreatePayload } from "@plane/types";
import { useInstanceUser } from "@/plane-admin/hooks/store/use-instance-user";
import { InviteLimitInfo } from "@/plane-admin/components/common/invite-limit-info";
import { useForm } from "react-hook-form";
import { InviteMemberFormRoot } from "./root";
import { InviteFormActions } from "./form-actions";
import { useInstanceManagement } from "@/plane-admin/hooks/store/use-instance-management";
import { AddSeatsForm } from "@/plane-admin/components/license/seats-management/add-seats";
import { instanceManagementService } from "@plane/services";
import { InstanceAdminForm } from "./instance-admin-form";

type TInviteMembersModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type TModalStep = "INVITE_ADMIN" | "ADD_SEATS";

export type TInstanceAdminCreateFormValues = TInstanceAdminCreatePayload & { generate_random_password: boolean };

const defaultValues: TInstanceAdminCreateFormValues = {
  email: "",
  password: "",
  generate_random_password: false,
  is_password_reset_required: false,
};

export const InviteMembersModal: FC<TInviteMembersModalProps> = observer(function InviteMembersModal(
  props: TInviteMembersModalProps
) {
  // props
  const { isOpen, onClose } = props;
  // states
  const [currentStep, setCurrentStep] = useState<TModalStep>("INVITE_ADMIN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // store
  const instanceUser = useInstanceUser();
  const { instanceLicense, updateInstanceSubscriptionDetail, isInstanceSubscriptionManagementEnabled } =
    useInstanceManagement();
  // hook form
  const methods = useForm<TInstanceAdminCreateFormValues>({
    defaultValues,
  });
  const { reset, handleSubmit } = methods;

  // Derived values
  const isSeatLimitReached = instanceLicense?.purchased_seats === instanceLicense?.occupied_seats;

  //  Handlers
  const handleClose = () => {
    reset({
      ...defaultValues,
    });
    setCurrentStep("INVITE_ADMIN");
    onClose();
  };

  const onSubmit = async (data: TInstanceAdminCreatePayload) => {
    setIsSubmitting(true);
    try {
      await instanceUser.createInstanceAdmin({
        email: data.email,
        password: data.password,
        is_password_reset_required: data.is_password_reset_required,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Instance admin created successfully",
      });
      handleClose();
    } catch (error: any) {
      const message =
        Object.values(error || {})
          .flat()
          .join(",") || "Unable to create instance admin";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {currentStep === "INVITE_ADMIN" ? (
        <InviteMemberFormRoot
          actions={
            <InviteFormActions
              handleClose={handleClose}
              onSubmit={handleSubmit(onSubmit)}
              isSubmitting={isSubmitting}
            />
          }
          formMethods={methods}
        >
          {isSeatLimitReached ? (
            <InviteLimitInfo handleAddMoreSeats={() => setCurrentStep("ADD_SEATS")} />
          ) : (
            <InstanceAdminForm />
          )}
        </InviteMemberFormRoot>
      ) : (
        instanceLicense &&
        isInstanceSubscriptionManagementEnabled && (
          <AddSeatsForm
            fetchProrationPreviewService={(quantity) =>
              instanceManagementService.getEnterpriseLicenseProrationPreview(quantity)
            }
            getIsInTrialPeriod={() => false} // NOTE: Enterprise license doesn't have trail functionality
            subscriptionDetail={instanceLicense}
            subscriptionLevel="instance"
            updateSeatsService={(quantity) => instanceManagementService.modifyEnterpriseLicenseSeats(quantity)}
            updateSubscriptionDetail={updateInstanceSubscriptionDetail}
            onSuccess={() => {
              setCurrentStep("INVITE_ADMIN");
            }}
            onPreviousStep={() => setCurrentStep("INVITE_ADMIN")}
          />
        )
      )}
    </ModalCore>
  );
});
