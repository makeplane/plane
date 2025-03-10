"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import WorkflowsUpgradeDark from "@/public/empty-state/workflows/upgrade-dark.webp";
import WorkflowsUpgradeLight from "@/public/empty-state/workflows/upgrade-light.webp";

export const WorkflowUpgrade: FC = observer(() => {
  // router
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isPlaneOneInstance = subscriptionDetail?.is_self_managed && subscriptionDetail?.product === "ONE";

  const getUpgradeButton = () => {
    if (isPlaneOneInstance) {
      return (
        <a href="https://prime.plane.so/" target="_blank" className={getButtonStyling("primary", "md")}>
          {t("common.upgrade_cta.higher_subscription")}
        </a>
      );
    }

    return (
      <Button variant="primary" disabled>
        <Crown className="h-3.5 w-3.5" />
        {t("common.coming_soon")}
      </Button>
    );

    // return (
    //   <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
    //     <Crown className="h-3.5 w-3.5" />
    //     {t("common.upgrade")}
    //   </Button>
    // );
  };

  return (
    <div className="pr-10">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="flex flex-col w-full xl:max-w-[360px] gap-y-4">
            <div className="text-xl font-semibold">{t("workflows.empty_state.upgrade.title")}</div>
            <div className="font-medium text-custom-text-300">{t("workflows.empty_state.upgrade.description")}</div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {getUpgradeButton()}
              <Link
                target="_blank"
                href="https://plane.so/contact"
                className={"bg-transparent underline text-sm text-custom-primary-200 my-auto font-medium"}
                onClick={() => {}}
              >
                {t("common.upgrade_cta.talk_to_sales")}
              </Link>
            </div>
          </div>
        </div>
        <Image
          src={resolvedTheme === "dark" ? WorkflowsUpgradeDark : WorkflowsUpgradeLight}
          alt=""
          className="max-h-[300px] self-end flex p-5 pb-0 xl:p-0"
        />
      </div>
    </div>
  );
});
