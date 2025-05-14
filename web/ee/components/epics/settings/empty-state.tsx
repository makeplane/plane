"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { Button, getButtonStyling, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useFlag, useIssueTypes, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TIssueTypeEmptyState = {
  workspaceSlug: string;
  projectId: string;
  redirect?: boolean;
  className?: string;
};

export const EpicsEmptyState: FC<TIssueTypeEmptyState> = observer((props) => {
  // props
  const { workspaceSlug, projectId, redirect = false, className = "" } = props;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  const { enableEpics } = useIssueTypes();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isSelfManagedUpgradeDisabled =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== EProductSubscriptionEnum.FREE;
  // derived values
  const isEpicsSettingsEnabled = useFlag(workspaceSlug, "EPICS");
  const resolvedEmptyStatePath = `/empty-state/epics/epics-${resolvedTheme === "light" ? "light" : "dark"}.webp`;
  // handlers
  const handleEnableEpic = async () => {
    setIsLoading(true);
    await enableEpics(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Epics is enabled for this project",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to enable epics",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      <div className={cn("flex justify-center min-h-full overflow-y-auto py-10 px-5", className)}>
        <div className={cn("flex flex-col gap-5 md:min-w-[24rem] max-w-[45rem]")}>
          <div className="flex flex-col gap-1.5 flex-shrink">
            <h3 className="text-xl font-semibold">
              {isEpicsSettingsEnabled
                ? "Enable Epics"
                : isSelfManagedUpgradeDisabled
                  ? "Get Pro to enable Epics."
                  : "Upgrade to enable Epics."}
            </h3>
            <p className="text-sm text-custom-text-200">
              For larger bodies of work that span several cycles and can live across modules, create an epic. Link work
              items and sub-work items in a project to an epic and jump into a work item from the overview.
            </p>
          </div>
          <Image
            src={resolvedEmptyStatePath}
            alt="epics empty state"
            width={384}
            height={250}
            layout="responsive"
            lazyBoundary="100%"
          />
          <div className="relative flex items-center justify-center gap-2 flex-shrink-0 w-full">
            {isEpicsSettingsEnabled ? (
              redirect ? (
                <a
                  href={`/${workspaceSlug}/projects/${projectId}/settings/epics/`}
                  className={getButtonStyling("primary", "md")}
                >
                  Enable
                </a>
              ) : (
                <Button disabled={isLoading} onClick={() => handleEnableEpic()}>
                  Enable
                </Button>
              )
            ) : isSelfManagedUpgradeDisabled ? (
              <a href="https://prime.plane.so/" target="_blank" className={getButtonStyling("primary", "md")}>
                Get Pro
              </a>
            ) : (
              <Button disabled={isLoading} onClick={() => togglePaidPlanModal(true)}>
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
