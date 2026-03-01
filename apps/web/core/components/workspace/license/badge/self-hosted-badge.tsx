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
import { PlaneIcon } from "@plane/propel/icons";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionName } from "@plane/utils";
// plane web imports
import { SubscriptionButton } from "@/components/common/subscription/subscription-button";
import { PlaneOneEditionBadge } from "@/components/workspace/license";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const SelfHostedEditionBadge = observer(function SelfHostedEditionBadge() {
  // hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    togglePaidPlanModal,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  const { t } = useTranslation();

  if (!subscriptionDetail || subscriptionDetail.product === EProductSubscriptionEnum.FREE)
    return (
      <>
        <SubscriptionButton
          subscriptionType={subscriptionDetail?.product ?? EProductSubscriptionEnum.FREE}
          handleClick={() => togglePaidPlanModal(true)}
        >
          {t("sidebar.upgrade_plan")}
        </SubscriptionButton>
      </>
    );

  if (subscriptionDetail.product === EProductSubscriptionEnum.ONE) {
    return <PlaneOneEditionBadge />;
  }

  return (
    <SubscriptionButton
      subscriptionType={subscriptionDetail.product}
      handleClick={() => handleSuccessModalToggle(true)}
    >
      <PlaneIcon className="size-4 flex-shrink-0" />
      <span className="truncate">{getSubscriptionName(subscriptionDetail.product)}</span>
    </SubscriptionButton>
  );
});
