"use client";

import { observer } from "mobx-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { PlaneOneIcon, Tooltip } from "@plane/ui";
import { getSubscriptionName } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { SubscriptionButton } from "@/plane-web/components/common/subscription/subscription-button";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const PlaneOneEditionBadge = observer(() => {
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
