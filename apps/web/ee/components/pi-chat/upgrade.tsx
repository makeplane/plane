"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
// plane imports
import { PLANE_INTELLIGENCE_TRACKER_ELEMENTS } from "@plane/constants";
import { EProductSubscriptionEnum } from "@plane/types";
import { Button, getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PiUpgradeDark from "@/public/empty-state/pi/chat-dark.webp";
import PiUpgradeLight from "@/public/empty-state/pi/chat-light.webp";

export const PiChatUpgrade: FC = observer(() => {
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isPlaneOneInstance =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product === EProductSubscriptionEnum.ONE;

  const getUpgradeButton = () => {
    if (isPlaneOneInstance) {
      return (
        <a
          data-ph-element={PLANE_INTELLIGENCE_TRACKER_ELEMENTS.HIGHER_SUBSCRIPTION_BUTTON}
          href="https://prime.plane.so/"
          target="_blank"
          className={getButtonStyling("primary", "md")}
        >
          Upgrade to higher subscription
        </a>
      );
    }

    return (
      <Button
        data-ph-element={PLANE_INTELLIGENCE_TRACKER_ELEMENTS.UPGRADE_BUTTON}
        variant="primary"
        onClick={() => togglePaidPlanModal(true)}
      >
        Upgrade
      </Button>
    );
  };

  return (
    <div className="w-full">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-custom-border-400":
            !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-2xl font-semibold">Experience an AI-powered teammate </div>
            <div className="text-sm">
              Get answers faster, plan better, and ship sooner with AI that understands and lives inside your work.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {getUpgradeButton()}
              <Link
                target="_blank"
                href="https://plane.so/talk-to-sales"
                className={"bg-transparent underline text-sm text-custom-primary-200 my-auto font-medium"}
                onClick={() => {}}
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
        <Image
          src={resolvedTheme === "dark" ? PiUpgradeDark : PiUpgradeLight}
          alt=""
          className="max-h-[300px] w-auto self-end flex p-5 pb-0 xl:p-0 object-contain rounded-br-xl"
        />
      </div>
    </div>
  );
});
