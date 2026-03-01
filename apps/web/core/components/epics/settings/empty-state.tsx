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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
// plane web hooks
import { SettingsHeading } from "@/components/settings/heading";
import { useFlag, useIssueTypes, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TIssueTypeEmptyState = {
  workspaceSlug: string;
  projectId: string;
  redirect?: boolean;
};

export const EpicsEmptyState = observer(function EpicsEmptyState(props: TIssueTypeEmptyState) {
  // props
  const { workspaceSlug, projectId, redirect = false } = props;
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

  const cta = (
    <div className="relative flex items-center justify-center gap-2 flex-shrink-0">
      {isEpicsSettingsEnabled ? (
        redirect ? (
          <a
            href={`/${workspaceSlug}/projects/${projectId}/settings/epics/`}
            className={getButtonStyling("primary", "base")}
          >
            Enable
          </a>
        ) : (
          <Button disabled={isLoading} onClick={() => handleEnableEpic()}>
            Enable
          </Button>
        )
      ) : isSelfManagedUpgradeDisabled ? (
        <a
          href="https://prime.plane.so/"
          target="_blank"
          className={getButtonStyling("primary", "base")}
          rel="noreferrer"
        >
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
        control={cta}
      />
      <div className="w-full py-2">
        <div className="flex items-center justify-center h-full w-full">
          <EmptyStateCompact
            assetKey="epic"
            title={t("settings_empty_state.epic_setting.title")}
            description={t("settings_empty_state.epic_setting.description")}
            actions={[
              {
                label: t("settings_empty_state.epic_setting.cta_primary"),
                onClick: () => handleEnableEpic(),
                variant: "primary",
              },
            ]}
            align="start"
            rootClassName="py-20"
          />
        </div>
      </div>
    </>
  );
});
