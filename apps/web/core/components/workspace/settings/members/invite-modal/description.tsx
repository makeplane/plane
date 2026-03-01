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
// plane imports
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import type { TMemberInviteCheck } from "@plane/types";
import { Loader } from "@plane/ui";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TInvitationDescriptionProps = {
  data: TMemberInviteCheck | undefined | null;
  isLoading: boolean;
};

export const InvitationDescription = observer(function InvitationDescription(props: TInvitationDescriptionProps) {
  const { data, isLoading } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, isSeatManagementEnabled } =
    useWorkspaceSubscription();
  // derived values
  const isOnEnterprisePlan = subscriptionDetail?.product === EProductSubscriptionEnum.ENTERPRISE;

  // Default description if seat management is disabled
  if (!isSeatManagementEnabled) {
    return (
      <p className="text-body-xs-regular text-secondary">
        {t("workspace_settings.settings.members.modal.description")}
      </p>
    );
  }

  if (isLoading) {
    return (
      <Loader className="w-full h-10">
        <Loader.Item height="100%" width="100%" />
      </Loader>
    );
  }

  if (!isOnEnterprisePlan) {
    return (
      <p className="text-body-xs-regular text-secondary">
        You can add <b>{data?.allowed_admin_members}</b> more users as{" "}
        <span className="text-primary font-medium">Admins or Members</span> and <b>{data?.allowed_guests}</b> more users
        as <span className="text-primary font-medium">Guests</span> to this workspace.
      </p>
    );
  }

  if (isOnEnterprisePlan && data?.allowed_total_users != null) {
    return (
      <p className="text-body-xs-regular text-secondary">
        You can add <b>{data?.allowed_total_users}</b> more users to this instance.
      </p>
    );
  }
});
