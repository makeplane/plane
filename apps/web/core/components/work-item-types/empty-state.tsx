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
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// assets
import issueTypeDark from "@/app/assets/empty-state/issue-types/issue-type-dark.png?url";
import issueTypeLight from "@/app/assets/empty-state/issue-types/issue-type-light.png?url";
// helpers
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// plane web imports
import { useFlag, useIssueTypes, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TIssueTypeEmptyState = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueTypeEmptyState = observer(function IssueTypeEmptyState(props: TIssueTypeEmptyState) {
  // props
  const { workspaceSlug, projectId } = props;
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { enableIssueTypes } = useIssueTypes();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [enableIssueTypeConfirmation, setEnableIssueTypeConfirmation] = useState<boolean>(false);
  const isSelfManagedUpgradeDisabled =
    subscriptionDetail?.is_self_managed && subscriptionDetail?.product !== EProductSubscriptionEnum.FREE;
  // derived values
  const isIssueTypeSettingsEnabled = useFlag(workspaceSlug, "ISSUE_TYPES");
  const resolvedPath = resolvedTheme === "light" ? issueTypeLight : issueTypeDark;

  // handlers
  const handleEnableIssueTypes = async () => {
    setIsLoading(true);
    await enableIssueTypes(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work item types and custom properties are now enabled for this project",
        });
        return true;
      })
      .catch((_error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to enable work item types",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getEmptyStateContent = () => {
    if (isIssueTypeSettingsEnabled) {
      return (
        <EmptyStateCompact
          assetKey="work-item"
          title={t("settings_empty_state.work_item_types.title")}
          description={t("settings_empty_state.work_item_types.description")}
          actions={[
            {
              label: t("settings_empty_state.work_item_types.cta_primary"),
              onClick: () => {
                setEnableIssueTypeConfirmation(true);
              },
              variant: "primary",
            },
          ]}
          align="start"
          rootClassName="py-20"
        />
      );
    }

    if (isSelfManagedUpgradeDisabled) {
      return (
        <DetailedEmptyState
          className="p-0 w-full"
          title=""
          description=""
          assetPath={resolvedPath}
          primaryButton={{
            text: t("work_item_types.empty_state.get_pro.primary_button.text"),
            onClick: () => window.open("https://prime.plane.so/", "_blank"),
          }}
          size="base"
        />
      );
    }

    return (
      <DetailedEmptyState
        className="p-0 w-full"
        title=""
        description=""
        assetPath={resolvedPath}
        primaryButton={{
          text: t("work_item_types.empty_state.upgrade.primary_button.text"),
          onClick: () => togglePaidPlanModal(true),
        }}
        size="base"
      />
    );
  };

  return (
    <div className="w-full">
      <AlertModalCore
        variant="primary"
        isOpen={enableIssueTypeConfirmation}
        handleClose={() => setEnableIssueTypeConfirmation(false)}
        handleSubmit={() => handleEnableIssueTypes()}
        isSubmitting={isLoading}
        title={t("work_item_types.empty_state.enable.confirmation.title")}
        content={
          <>
            {t("work_item_types.empty_state.enable.confirmation.description")}
            <a
              href="https://docs.plane.so/core-concepts/issues/issue-types"
              target="_blank"
              className="font-medium hover:underline"
              rel="noreferrer"
            >
              {` ${t("common.read_the_docs")}`}
            </a>
            .
          </>
        }
        primaryButtonText={{
          loading: t("work_item_types.empty_state.enable.confirmation.button.loading"),
          default: t("work_item_types.empty_state.enable.confirmation.button.default"),
        }}
        secondaryButtonText={t("common.cancel")}
      />
      {getEmptyStateContent()}
    </div>
  );
});
