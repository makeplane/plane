import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { ExternalLink, RefreshCw } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";
// services
import { InstanceService } from "@/services/instance.service";

const instanceService = new InstanceService();

export const ProductUpdatesHeader = observer(() => {
  // states
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  // store hooks
  const { isUpdateAvailable, updateInstanceInfo } = useInstance();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true);
    instanceService
      .checkForUpdates()
      .then((response) => {
        updateInstanceInfo({
          current_version: response.current_version,
          latest_version: response.latest_version,
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to check for updates",
        });
      })
      .finally(() => {
        setIsCheckingForUpdates(false);
      });
  };

  return (
    <div className="flex gap-2 mx-6 my-4 items-center justify-between flex-shrink-0">
      <div className="flex w-full items-center">
        <div className="flex gap-2 text-xl font-medium">What&apos;s new</div>
        {isUpdateAvailable ? (
          <a
            tabIndex={-1}
            href="https://docs.plane.so/plane-one/self-host/manage/prime-cli"
            className={cn(
              "flex gap-1 items-center px-2 mx-2 py-0.5 text-center text-xs font-medium rounded-full bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-600"
            )}
            target="_blank"
            rel="noreferrer noopener"
          >
            Update available
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </a>
        ) : (
          <div
            className={cn(
              "px-2 mx-2 py-0.5 text-center text-xs font-medium rounded-full bg-custom-primary-100/20 text-custom-primary-100"
            )}
          >
            Latest
          </div>
        )}
        {isSelfManaged && !isUpdateAvailable && (
          <Button
            variant="link-neutral"
            size="sm"
            className="font-medium outline-none px-1"
            onClick={handleCheckForUpdates}
          >
            Check for updates
            <RefreshCw size={10} className={cn("animate-spin", { "opacity-0": !isCheckingForUpdates })} />
          </Button>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-8">
        {isSelfManaged && subscriptionDetail?.product === EProductSubscriptionEnum.ONE && (
          <div className="cursor-default rounded-md bg-green-500/10 px-2 py-0.5 text-center text-xs font-medium text-green-500 outline-none leading-6">
            Perpetual license
          </div>
        )}
        <Image src={PlaneLogo} alt="Plane" width={24} height={24} />
      </div>
    </div>
  );
});
