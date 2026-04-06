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

import { isNil } from "lodash-es";
import { observer } from "mobx-react";
// plane-i18n
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// UI
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/propel/utils";
import { EIssueServiceType } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks

import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useIssueSubscription } from "@/hooks/use-issue-subscription";
import { useFlag } from "@/plane-web/hooks/store";
// services

export type TIssueSubscription = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  serviceType?: EIssueServiceType;
};

export const IssueSubscription = observer(function IssueSubscription(props: TIssueSubscription) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();
  // permissions
  const flagEnabled = useFlag(workspaceSlug, "MANAGE_WORK_ITEM_SUBSCRIBERS");
  const hasPermission = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  // fetching subscribers
  const { loading, isSubscribed, subscribers, subscribersCount, handleSubscription, handleSubscribers } =
    useIssueSubscription({ workspaceSlug, projectId, issueId });

  // derived values
  const isEditable = flagEnabled && hasPermission;

  const handleSubscribersChange = async (subscriberIds: string[]) => {
    try {
      await handleSubscribers(subscriberIds);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.error.message"),
      });
    }
  };

  const handleSubscriptionButtonClick = async () => {
    try {
      await handleSubscription();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: isSubscribed
          ? t("issue.subscription.actions.unsubscribed")
          : t("issue.subscription.actions.subscribed"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.error.message"),
      });
    }
  };

  if (isNil(isSubscribed))
    return (
      <Loader>
        <Loader.Item width="106px" height="28px" />
      </Loader>
    );

  return (
    <div className="flex items-center">
      {isEditable && (
        <MemberDropdown
          projectId={projectId}
          value={subscribers}
          onChange={handleSubscribersChange}
          multiple
          buttonVariant={subscribersCount > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={cn(getButtonStyling("secondary", "lg"), "rounded-r-none border-r-0")}
          showTooltip={true}
          placeholder={""}
          tooltipContent={t("subscriber", { count: subscribersCount })}
          renderByDefault={isMobile}
          iconSize="sm"
        />
      )}
      <Button
        variant="secondary"
        className={cn("hover:bg-layer-transparent-hover!", isEditable && "rounded-l-none")}
        onClick={handleSubscriptionButtonClick}
        disabled={!hasPermission || loading}
        size="lg"
      >
        {isSubscribed ? (
          <div className="hidden sm:block">{t("common.actions.unsubscribe")}</div>
        ) : (
          <div className="hidden sm:block">{t("common.actions.subscribe")}</div>
        )}
      </Button>
    </div>
  );
});
