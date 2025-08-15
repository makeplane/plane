"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import { Button, getButtonStyling, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// plane web hooks
import { SettingsHeading } from "@/components/settings/heading";
import { useFlag, useIssueTypes, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { epicsTrackers } from "../trackers";

type TIssueTypeEmptyState = {
  workspaceSlug: string;
  projectId: string;
  redirect?: boolean;
};

export const EpicsEmptyState: FC<TIssueTypeEmptyState> = observer((props) => {
  // props
  const { workspaceSlug, projectId, redirect = false } = props;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  const { enableEpics } = useIssueTypes();
  const { t } = useTranslation();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isSelfManagedUpgradeDisabled =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== EProductSubscriptionEnum.FREE;
  // derived values
  const isEpicsSettingsEnabled = useFlag(workspaceSlug, "EPICS");
  const resolvedEmptyStatePath = `/empty-state/epics/epics-${resolvedTheme === "light" ? "light" : "dark"}.webp`;

  // trackers
  const trackers = epicsTrackers({ workspaceSlug, projectId });

  // handlers
  const handleEnableEpic = async () => {
    trackers.toggleEpicsClicked();
    setIsLoading(true);
    await enableEpics(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Epics is enabled for this project",
        });
        trackers.toggleEpicsSuccess("enable");
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to enable epics",
        });
        trackers.toggleEpicsError("enable");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const cta = (
    <div className="relative flex items-center justify-center gap-2 flex-shrink-0">
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
  );
  return (
    <>
      <SettingsHeading
        title={t("project_settings.epics.heading")}
        description={t("project_settings.epics.description")}
        appendToRight={cta}
      />
      <div className="w-full py-2">
        <div className="flex items-center justify-center h-full w-full">
          <DetailedEmptyState
            size="md"
            title={""}
            assetPath={resolvedEmptyStatePath}
            className="w-full !px-0 !py-0"
            customPrimaryButton={cta}
          />
        </div>
      </div>
    </>
  );
});
