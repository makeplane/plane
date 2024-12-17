"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// ui
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const EpicsUpgrade: FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { resolvedTheme } = useTheme();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();

  // derived values
  const isEpicsSettingsEnabled = useFlag(workspaceSlug.toString(), "EPICS_SETTINGS");
  const isSelfManagedUpgradeDisabled = subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== "FREE";

  return (
    <div className="pr-10 w-full">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-2xl font-semibold">Epics</div>
            <div className="text-sm">
              For larger bodies of work that span several cycles and can live across modules, create an epic. Link
              issues and sub-issues in a project to an epic and jump into an issue from the overview.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              {isEpicsSettingsEnabled ? (
                <a
                  className={getButtonStyling("primary", "md")}
                  href={`/${workspaceSlug}/projects/${projectId}/settings/epics`}
                >
                  Enable
                </a>
              ) : isSelfManagedUpgradeDisabled ? (
                <a href="https://prime.plane.so/" target="_blank" className={getButtonStyling("primary", "md")}>
                  Get Pro
                </a>
              ) : (
                <Button onClick={() => togglePaidPlanModal(true)}>Upgrade</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
