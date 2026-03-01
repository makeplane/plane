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
import { PlaneOneIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionName } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { SubscriptionButton } from "@/components/common/subscription/subscription-button";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const PlaneOneEditionBadge = observer(function PlaneOneEditionBadge() {
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const { instance } = useInstance();
  // plane web hooks
  const { handleSuccessModalToggle } = useWorkspaceSubscription();
  return (
    <>
      <Tooltip tooltipContent={`Version: ${instance?.current_version}`} isMobile={isMobile}>
        <SubscriptionButton
          subscriptionType={EProductSubscriptionEnum.ONE}
          handleClick={() => handleSuccessModalToggle(true)}
        >
          <PlaneOneIcon className="w-6" />
          {getSubscriptionName(EProductSubscriptionEnum.ONE)}
        </SubscriptionButton>
      </Tooltip>
    </>
  );
});
