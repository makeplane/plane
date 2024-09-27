"use client";

import { observer } from "mobx-react";
import Image from "next/image";
// ui
import { Button, Tooltip } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";

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
        <Button
          variant="accent-primary"
          tabIndex={-1}
          className="w-fit cursor-pointer rounded-2xl px-4 py-1 text-center text-sm font-medium outline-none text-custom-primary-300"
          onClick={() => handleSuccessModalToggle(true)}
        >
          <Image src={PlaneOneLogo} alt="Plane One" width={24} height={24} />
          {"Plane One"}
        </Button>
      </Tooltip>
    </>
  );
});
